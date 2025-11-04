/*
//


import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderStatus, IOrderItem } from './schemas/order.schema';
import { Product } from '../product/schemas/product.schema';
import { User } from '../user/schemas/user.schema';
import { type ValidatedUser } from '../user/schemas/user.schema';
import { CreateOrderDto } from './dto/order.dto';
import { Rol } from '../auth/enums/rol.enum';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async create(dto: CreateOrderDto, cliente: ValidatedUser): Promise<Order> {
    const itemsProcesados: IOrderItem[] = [];
    let totalPedido = 0;

    for (const item of dto.items) {
      const product = await this.productModel.findById(item.productId);
      if (!product) {
        throw new NotFoundException(
          `Producto con ID "${item.productId}" no encontrado.`,
        );
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Stock insuficiente para "${product.nombre}". Disponible: ${product.stock}.`,
        );
      }

      itemsProcesados.push({
        product: product._id,
        quantity: item.quantity,
        priceAtPurchase: product.precio,
      });

      totalPedido += item.quantity * product.precio;
      product.stock -= item.quantity;
      await product.save();
    }

    const nuevoPedido = new this.orderModel({
      cliente: new Types.ObjectId(cliente._id),
      items: itemsProcesados,
      total: totalPedido,
      status: OrderStatus.PENDIENTE,
    });

    return nuevoPedido.save();
  }

  async findOneForCustomer(id: string, clienteId: string): Promise<Order> {
    const order = await this.orderModel
      .findOne({ _id: id, cliente: new Types.ObjectId(clienteId) })
      .populate('items.product', 'nombre descripcion')
      .exec();

    if (!order) {
      throw new NotFoundException('Pedido no encontrado o no te pertenece.');
    }
    return order;
  }

  async findOneForVendedor(id: string, vendedorId: string): Promise<Order> {
      const order = await this.orderModel
        .findOne({ _id: id, vendedor: new Types.ObjectId(vendedorId) })
        .populate('items.product', 'nombre descripcion')
        .populate('cliente', 'nombre email telefono')
        .exec();
      if (!order) {
        throw new NotFoundException('Pedido no encontrado o no te pertenece.');
      }
      return order;
  }

  async findAssignedToVendedor(vendedorId: string): Promise<Order[]> {
    return this.orderModel
      .find({
        vendedor: new Types.ObjectId(vendedorId),
        status: OrderStatus.ASIGNADO,
      })
      .populate('cliente', 'nombre email telefono')
      .populate('items.product', 'nombre')
      .exec();
  }

  async assignToVendedor(id: string, vendedorId: string): Promise<Order> {
    const vendedor = await this.userModel.findById(vendedorId);
    if (!vendedor || vendedor.rol !== Rol.VENDEDOR) {
      throw new NotFoundException(
        `Usuario con ID "${vendedorId}" no es un vendedor válido.`,
      );
    }

    const updatedOrder = await this.orderModel.findByIdAndUpdate(
      id,
      { vendedor: vendedor._id, status: OrderStatus.ASIGNADO },
      { new: true },
    );

    if (!updatedOrder) {
      throw new NotFoundException(`Pedido con ID "${id}" no encontrado.`);
    }
    return updatedOrder;
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
    user: ValidatedUser,
  ): Promise<Order> {
    this.logger.log(
      `Intentando actualizar estado del pedido ${id} a ${status} por usuario ${user.email} (Rol: ${user.rol})`,
    );

    const order = await this.orderModel.findById(id);
    if (!order) {
      this.logger.warn(`Pedido ${id} no encontrado.`);
      throw new NotFoundException(`Pedido con ID "${id}" no encontrado.`);
    }

    this.logger.debug(
      `Pedido ${id} encontrado. Estado actual: ${order.status}. Asignado a vendedor: ${order.vendedor}`,
    );

    if (user.rol === Rol.VENDEDOR) {
      this.logger.debug(`Usuario es VENDEDOR. Verificando permisos...`);
      const vendedorIdPedido = order.vendedor?.toString();
      const vendedorIdUsuario = user._id.toString();

      this.logger.debug(
        `ID Vendedor Pedido: ${vendedorIdPedido}, ID Usuario Actual: ${vendedorIdUsuario}`,
      );

      if (!vendedorIdPedido || vendedorIdPedido !== vendedorIdUsuario) {
        this.logger.warn(
          `Acceso denegado: Vendedor ${user.email} intentó modificar pedido ${id} asignado a ${vendedorIdPedido}`,
        );
        throw new ForbiddenException(
          'No tienes permiso para modificar este pedido.',
        );
      }

      this.logger.debug(`Permiso de asignación OK.`);

      const transicionesPermitidas: { [key in OrderStatus]?: OrderStatus[] } = {
        [OrderStatus.ASIGNADO]: [OrderStatus.POR_ENTREGAR],
        [OrderStatus.POR_ENTREGAR]: [OrderStatus.ENTREGADO],
      };

      const estadoActual = order.status;
      const estadosSiguientesPermitidos = transicionesPermitidas[estadoActual];

      this.logger.debug(
        `Transiciones permitidas desde ${estadoActual}: ${
          estadosSiguientesPermitidos?.join(', ') ?? 'Ninguna'
        }. Estado solicitado: ${status}`,
      );

      if (
        !estadosSiguientesPermitidos ||
        !estadosSiguientesPermitidos.includes(status)
      ) {
        this.logger.warn(
          `Transición inválida: ${estadoActual} → ${status} por ${user.email}`,
        );
        throw new BadRequestException(
          `No puedes cambiar el estado de "${estadoActual}" a "${status}".`,
        );
      }

      this.logger.debug(`Transición de estado OK.`);
    } else {
      this.logger.debug(
        `Usuario es ${user.rol}. Se permiten todos los cambios de estado.`,
      );
    }

    order.status = status;
    await order.save();

    this.logger.log(
      `Pedido ${id} actualizado a estado ${status} exitosamente.`,
    );
    return order;
  }

  async findMostRecentOrderForCustomer(
    clienteId: string,
  ): Promise<Order | null> {
    return this.orderModel
      .findOne({ cliente: new Types.ObjectId(clienteId) })
      .sort({ createdAt: -1 })
      .limit(1)
      .exec();
  }

  async cancelOrderAsCustomer(id: string, clienteId: string): Promise<Order> {
    const order = await this.orderModel.findOne({
      _id: id,
      cliente: new Types.ObjectId(clienteId),
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado o no te pertenece.');
    }

    if (order.status !== OrderStatus.PENDIENTE) {
      throw new BadRequestException(
        `No puedes cancelar un pedido en estado "${order.status}".`,
      );
    }

    for (const item of order.items) {
      await this.productModel.updateOne(
        { _id: item.product },
        { $inc: { stock: item.quantity } },
      );
    }

    order.status = OrderStatus.CANCELADO;
    await order.save();
    return order;
  }

  async findMyOrders(clienteId: string): Promise<Order[]> {
    return this.orderModel
      .find({ cliente: new Types.ObjectId(clienteId) })
      .sort({ createdAt: -1 })
      .populate('items.product', 'nombre')
      .exec();
  }

  async findAssignableOrders(): Promise<Order[]> {
    return this.orderModel
      .find({
        status: { $in: [OrderStatus.PENDIENTE, OrderStatus.CONFIRMADO] },
        vendedor: null,
      })
      .sort({ createdAt: 1 })
      .populate('cliente', 'nombre email')
      .exec();
  }
}

*/
//