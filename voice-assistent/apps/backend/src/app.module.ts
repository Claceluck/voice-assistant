import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TranscribeModule } from './transcribe/transcribe.module';
import { NeuroModule } from './neuro/neuro.module';
import { ChapterProgressModule } from './charter-progress/chapter-progress.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TranscribeModule,
    NeuroModule,
    ChapterProgressModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
