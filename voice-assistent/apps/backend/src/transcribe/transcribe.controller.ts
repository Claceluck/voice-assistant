import { Controller, Post, UploadedFile, UseInterceptors, Body, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TranscribeService } from './transcribe.service';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { PrismaService }  from '../prisma/prisma.service';

@Controller('transcribe')
export class TranscribeController {
    constructor(private readonly transcribeService: TranscribeService, private readonly prisma: PrismaService,) {}

    @Post()
    @UseInterceptors(
        FileInterceptor('audio', {
            storage: diskStorage({
                destination: './uploads',
                filename: (req, file, cb) => {
                    const filename = `${uuidv4()}${path.extname(file.originalname)}`;
                    cb(null, filename);
                },
            }),
        }),
    )
    async handleAudio(
        @UploadedFile() file: Express.Multer.File,
        @Body('topic') topic: string,
        @Body('userId') userId: string,
    ): Promise<{
        raw: string;
        formatted: string;
        followUpQuestions?: string[];
    }> {
        if (!userId) {
            throw new BadRequestException('User ID is required');
        }

        const chapterKey = 'prologue';

        const { raw, formatted, followUpQuestions } =
            await this.transcribeService.processAudio(file.path, topic || 'моя история');

        await this.prisma.chapterProgress.upsert({
            where: {
                userId_chapterKey: {
                    userId,
                    chapterKey,
                },
            },
            update: {
                rawText: raw,
                formatted: formatted,
            },
            create: {
                userId,
                chapterKey,
                rawText: raw,
                formatted: formatted,
            },
        });

        return {
            raw,
            formatted,
            followUpQuestions,
        };
    }
}
