import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChapterProgressService {
    constructor(private prisma: PrismaService) {}

    async getProgressByUserAndChapter(userId: string, chapterKey: string) {
        return this.prisma.chapterProgress.findUnique({
            where: {
                userId_chapterKey: { userId, chapterKey },
            },
        });
    }

    async upsertProgress(userId: string, chapterKey: string, rawText: string, formatted: string) {
        return this.prisma.chapterProgress.upsert({
            where: {
                userId_chapterKey: { userId, chapterKey },
            },
            update: {
                rawText,
                formatted,
            },
            create: {
                userId,
                chapterKey,
                rawText,
                formatted,
            },
        });
    }
}
