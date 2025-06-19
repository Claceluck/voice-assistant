import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ChapterProgressService } from './chapter-progress.service';

@Controller('chapter-progress')
export class ChapterProgressController {
    constructor(private readonly chapterProgressService: ChapterProgressService) {}

    // Теперь chapterKey тоже параметр
    @Get(':userId/:chapterKey')
    async getProgress(@Param('userId') userId: string, @Param('chapterKey') chapterKey: string) {
        return this.chapterProgressService.getProgressByUserAndChapter(userId, chapterKey);
    }

    @Post(':userId/:chapterKey')
    async saveProgress(
        @Param('userId') userId: string,
        @Param('chapterKey') chapterKey: string,
        @Body() body: { rawText: string; formatted: string },
    ) {
        return this.chapterProgressService.upsertProgress(userId, chapterKey, body.rawText, body.formatted);
    }
}
