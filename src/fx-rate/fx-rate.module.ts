import { Module } from '@nestjs/common';
import { FxRateService } from './fx-rate.service';
import { FxRateController } from './fx-rate.controller';

@Module({
  providers: [FxRateService],
  controllers: [FxRateController]
})
export class FxRateModule {}
