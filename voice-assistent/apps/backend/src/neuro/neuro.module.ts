import { Module } from '@nestjs/common';
import { NeuroService } from './neuro.service';

@Module({
    providers: [NeuroService],
    exports: [NeuroService],
})
export class NeuroModule {}
