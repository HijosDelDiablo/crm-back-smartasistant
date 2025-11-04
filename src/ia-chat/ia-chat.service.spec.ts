import { Test, TestingModule } from '@nestjs/testing';
import { IaChatService } from './ia-chat.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ProductService } from '../product/product.service';
import { OrderService } from '../order/order.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { UserService } from '../user/user.service';

describe('IaChatService', () => {
  let service: IaChatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IaChatService,
        { provide: HttpService, useValue: {} },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('http://mock-url-para-el-test.com'),
          },
        },
        { provide: ProductService, useValue: {} },
        { provide: OrderService, useValue: {} },
        { provide: DashboardService, useValue: {} },
        { provide: UserService, useValue: {} },
      ],
    }).compile();

    service = module.get<IaChatService>(IaChatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});