import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as vosk from 'vosk';
import * as wav from 'wav';
import * as ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import * as ffmpeg from 'fluent-ffmpeg';
import { NeuroService } from '../neuro/neuro.service';

@Injectable()
export class TranscribeService {
    private model: vosk.Model;

    constructor(private readonly neuroService: NeuroService) {
        const modelPath = './models/vosk-model-ru-0.42';
        if (!fs.existsSync(modelPath)) {
            throw new Error('Модель не найдена по пути: ' + modelPath);
        }

        vosk.setLogLevel(0);
        this.model = new vosk.Model(modelPath);

        ffmpeg.setFfmpegPath(ffmpegInstaller.path);
    }

    async transcribe(filePath: string): Promise<string> {
        const ext = path.extname(filePath).toLowerCase();
        const wavPath =
            ext === '.wav'
                ? filePath.replace('.wav', '-converted.wav') // предотвращаем in-place overwrite
                : filePath.replace(ext, '.wav');

        try {
            await this.convertToWav(filePath, wavPath);
        } catch (err) {
            throw new Error('Ошибка конвертации в WAV: ' + err.message);
        }

        return new Promise((resolve, reject) => {
            const reader = new wav.Reader();
            const fileStream = fs.createReadStream(wavPath);

            fileStream.pipe(reader);

            reader.on('format', (format) => {
                const rec = new vosk.Recognizer({ model: this.model, sampleRate: format.sampleRate });

                reader.on('data', (data) => rec.acceptWaveform(data));
                reader.on('end', () => {
                    const result = rec.finalResult();
                    rec.free();
                    fs.unlinkSync(filePath); // удаляем исходный
                    fs.unlinkSync(wavPath);  // удаляем сконвертированный
                    resolve(result.text);
                });
            });

            reader.on('error', (err) => reject(err));
        });
    }

    async processAudio(filePath: string, topic: string): Promise<{
        raw: string;
        formatted: string;
        followUpQuestions: string[];
    }> {
        const rawText = await this.transcribe(filePath); // VOSK транскрипция

        const { formattedText, followUpQuestions } =
            await this.neuroService.processTextWithFollowUps(rawText, topic); // GPT

        return {
            raw: rawText,
            formatted: formattedText,
            followUpQuestions,
        };
    }

    private convertToWav(inputPath: string, outputPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .audioChannels(1)
                .audioFrequency(16000)
                .format('wav')
                .on('end', () => resolve())
                .on('error', (err) => reject(err))
                .save(outputPath);
        });
    }
}
