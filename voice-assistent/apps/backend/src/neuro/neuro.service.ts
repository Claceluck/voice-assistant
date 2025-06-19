import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class NeuroService {
    private openai: OpenAI;

    private readonly openAIConfig = {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_completion_tokens: 1024,
        frequency_penalty: 0.1,
        presence_penalty: 0.1,
    };

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    async processTextWithFollowUps(rawText: string, topic: string): Promise<{
        formattedText: string;
        followUpQuestions: string[];
    }> {
        const prompt = `
            Ты литературный редактор и биограф. Преобразуй устный рассказ в красивый литературный стиль для автобиографии.
            
            Важно:
            - Ни при каких условиях не добавляй никаких фактов, которых нет в исходном тексте.
            - Если в тексте нет информации про имя, возраст, город или причину написания — не упоминай их и не фантазируй.
            - Можно обогатить стиль, добавить плавные переходы, метафоры, ритм, если это улучшает звучание.
            - Сохраняй суть и индивидуальность рассказа.
            
            Также проверь, отвечает ли рассказ на следующие вопросы:
            1. Как вас зовут?
            2. Сколько вам лет?
            3. Из какого вы города?
            4. Почему вы решили написать автобиографию?
            
            Если какой-то ответ отсутствует в тексте — не добавляй его, а включи соответствующий уточняющий вопрос в массив followUpQuestions.
            ВНИМАНИЕ! Внимательно проверь что в тексте есть имя, возраст и если чего то нет верни в массиве вопросов, это очень важно! 
            
            Верни ответ в JSON-формате строго следующей структуры:
            
            {
              "formattedText": "литературная версия рассказа без выдумок",
              "followUpQuestions": ["вопрос 1", "вопрос 2"]
            }
            
            Текст:
            """${rawText}"""
        `;

        const chat = await this.openai.chat.completions.create({
            model: this.openAIConfig.model,
            messages: [
                {
                    role: 'system',
                    content: 'Ты литературный помощник и биограф.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: this.openAIConfig.temperature,
            max_completion_tokens: this.openAIConfig.max_completion_tokens,
            frequency_penalty: this.openAIConfig.frequency_penalty,
            presence_penalty: this.openAIConfig.presence_penalty,
        });

        try {
            const parsed = JSON.parse(chat.choices[0].message.content || '{}');
            return {
                formattedText: parsed.formattedText || '',
                followUpQuestions: parsed.followUpQuestions || [],
            };
        } catch (err) {
            console.error('Ошибка парсинга JSON от GPT:', err);
            return {
                formattedText: '',
                followUpQuestions: ['Произошла ошибка при обработке текста. Попробуйте снова.'],
            };
        }
    }
}
