import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Product extends Document {
  declare _id: Types.ObjectId;

  @Prop({ required: true, index: true, trim: true })
  nombre: string;

  @Prop({ required: true })
  descripcion: string;

  @Prop({ required: true, min: 0 })
  precio: number;

  @Prop({ required: true, min: 0, default: 0 })
  stock: number;

  @Prop({ required: false })
  imageUrl?: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);