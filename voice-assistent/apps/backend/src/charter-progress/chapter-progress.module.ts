import { Module } from '@nestjs/common';
import { ChapterProgressController } from './chapter-progress.controller';
import { ChapterProgressService } from './chapter-progress.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
    controllers: [ChapterProgressController],
    providers: [ChapterProgressService, PrismaService],
    exports: [ChapterProgressService],
})
export class ChapterProgressModule {
}
