/*
//

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../user/schemas/user.schema';
import { Product } from '../../product/schemas/product.schema';

export enum OrderStatus {
  PENDIENTE = 'PENDIENTE',
  CONFIRMADO = 'CONFIRMADO',
  ASIGNADO = 'ASIGNADO',
  POR_ENTREGAR = 'POR_ENTREGAR',
  ENTREGADO = 'ENTREGADO',
  CANCELADO = 'CANCELADO',
}

export interface IOrderItem {
  product: Types.ObjectId;
  quantity: number;
  priceAtPurchase: number;
}

@Schema({ _id: false })
class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product: Product;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true })
  priceAtPurchase: number;
}

const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ timestamps: true })
export class Order extends Document {
  declare _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  cliente: User;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true, default: null })
  vendedor: User;

  @Prop({ type: String, enum: OrderStatus, default: OrderStatus.PENDIENTE })
  status: OrderStatus;

  @Prop({ type: [OrderItemSchema], required: true })
  items: IOrderItem[];

  @Prop({ required: true })
  total: number;

  createdAt: Date;
  updatedAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

*/
//