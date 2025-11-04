import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderStatus } from '../order/schemas/order.schema';
import { Product } from '../product/schemas/product.schema';
import { User } from '../user/schemas/user.schema';
import { Rol } from '../auth/enums/rol.enum';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async getReporteVentas() {
    const reportes = await this.orderModel.aggregate([
      { $match: { status: OrderStatus.ENTREGADO } },
      {
        $group: {
          _id: null,
          totalVentas: { $sum: '$total' },
          numeroPedidos: { $sum: 1 },
        },
      },
    ]);

    return (
      reportes[0] || { totalVentas: 0, numeroPedidos: 0 }
    );
  }

  async getProductosMasVendidos() {
    return this.orderModel.aggregate([
      { $match: { status: OrderStatus.ENTREGADO } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalVendido: { $sum: '$items.quantity' },
        },
      },
      { $sort: { totalVendido: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: this.productModel.collection.name,
          localField: '_id',
          foreignField: '_id',
          as: 'productoInfo',
        },
      },
      { $unwind: '$productoInfo' },
      {
        $project: {
          _id: 0,
          nombreProducto: '$productoInfo.nombre',
          totalVendido: 1,
        },
      },
    ]);
  }

  async getDesempenoVendedores() {
    return this.orderModel.aggregate([
      {
        $match: {
          status: OrderStatus.ENTREGADO,
          vendedor: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$vendedor',
          totalEntregas: { $sum: 1 },
          totalVendido: { $sum: '$total' },
        },
      },
      { $sort: { totalVendido: -1 } },
      {
        $lookup: {
          from: this.userModel.collection.name,
          localField: '_id',
          foreignField: '_id',
          as: 'vendedorInfo',
        },
      },
      { $unwind: '$vendedorInfo' },
      {
        $project: {
          _id: 0,
          vendedorId: '$_id',
          nombre: '$vendedorInfo.nombre',
          email: '$vendedorInfo.email',
          totalEntregas: 1,
          totalVendido: 1,
        },
      },
    ]);
  }
}