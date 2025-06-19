import { Module } from '@nestjs/common';
import { TranscribeController } from './transcribe.controller';
import { TranscribeService } from './transcribe.service';
import { NeuroModule } from '../neuro/neuro.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [NeuroModule, PrismaModule],
  controllers: [TranscribeController],
  providers: [TranscribeService]
})
export class TranscribeModule {}
