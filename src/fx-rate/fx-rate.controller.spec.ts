import { Test, TestingModule } from '@nestjs/testing';
import { FxRateController } from './fx-rate.controller';

describe('FxRateController', () => {
  let controller: FxRateController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FxRateController],
    }).compile();

    controller = module.get<FxRateController>(FxRateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
