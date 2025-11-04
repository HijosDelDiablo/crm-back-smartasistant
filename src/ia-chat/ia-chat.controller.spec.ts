import { Test, TestingModule } from '@nestjs/testing';
import { IaChatController } from './ia-chat.controller';
import { IaChatService } from './ia-chat.service';

describe('IaChatController', () => {
  let controller: IaChatController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IaChatController],
      providers: [
        {
          provide: IaChatService,
          useValue: {}, // Provee un mock vacío
        },
      ],
    }).compile();

    controller = module.get<IaChatController>(IaChatController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});