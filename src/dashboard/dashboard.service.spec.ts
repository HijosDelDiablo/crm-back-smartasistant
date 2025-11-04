import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { getModelToken } from '@nestjs/mongoose';
import { Order } from '../order/schemas/order.schema'; // Ajusta esta ruta si es necesario
import { Product } from '../product/schemas/product.schema'; // Ajusta esta ruta si es necesario
import { User } from '../user/schemas/user.schema'; // Ajusta esta ruta si es necesario

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getModelToken(Order.name), useValue: {} }, // Mock 1
        { provide: getModelToken(Product.name), useValue: {} }, // Mock 2
        { provide: getModelToken(User.name), useValue: {} }, // Mock 3
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});