import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { getModelToken } from '@nestjs/mongoose';
import { Order } from './schemas/order.schema';
import { Product } from '../product/schemas/product.schema'; 
import { User } from '../user/schemas/user.schema';

describe('OrderService', () => {
  let service: OrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: getModelToken(Order.name), useValue: {} },
        { provide: getModelToken(Product.name), useValue: {} },
        { provide: getModelToken(User.name), useValue: {} },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});