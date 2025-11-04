import { IsArray, IsNotEmpty, ValidateNested, IsString, IsInt, Min, IsMongoId, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '../schemas/order.schema';

class OrderItemDto {
  @IsMongoId({ message: 'El ID del producto no es válido.' })
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(1, { message: 'La cantidad debe ser al menos 1.' })
  quantity: number;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}

export class AssignOrderDto {
  @IsMongoId({ message: 'El ID del vendedor no es válido.' })
  @IsNotEmpty()
  vendedorId: string;
}

export class UpdateStatusDto {
  @IsEnum(OrderStatus, { message: 'El estado no es válido.' })
  @IsNotEmpty()
  status: OrderStatus;
}