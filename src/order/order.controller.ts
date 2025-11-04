/*
//

import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto, AssignOrderDto, UpdateStatusDto } from './dto/order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '../auth/enums/rol.enum';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { type ValidatedUser } from '../user/schemas/user.schema';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Rol.CLIENTE)
  create(@Body() createOrderDto: CreateOrderDto, @GetUser() user: ValidatedUser) {
    return this.orderService.create(createOrderDto, user);
  }

  @Get('mis-entregas')
  @UseGuards(RolesGuard)
  @Roles(Rol.VENDEDOR)
  findAssigned(@GetUser() user: ValidatedUser) {
    return this.orderService.findAssignedToVendedor(user._id);
  }

  @Get('mi-pedido/:id')
  @UseGuards(RolesGuard)
  @Roles(Rol.CLIENTE)
  findOneForCustomer(@Param('id') id: string, @GetUser() user: ValidatedUser) {
    return this.orderService.findOneForCustomer(id, user._id);
  }

  @Patch(':id/assign')
  @UseGuards(RolesGuard)
  @Roles(Rol.ADMIN)
  assign(@Param('id') id: string, @Body() assignOrderDto: AssignOrderDto) {
    return this.orderService.assignToVendedor(id, assignOrderDto.vendedorId);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Rol.ADMIN, Rol.VENDEDOR)
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
    @GetUser() user: ValidatedUser,
  ) {
    return this.orderService.updateStatus(id, updateStatusDto.status, user);
  }

  @Get('mis-pedidos')
  @UseGuards(RolesGuard)
  @Roles(Rol.CLIENTE)
  findMyOrders(@GetUser() user: ValidatedUser) {
    return this.orderService.findMyOrders(user._id);
  }

  @Patch('mi-pedido/:id/cancel')
  @UseGuards(RolesGuard)
  @Roles(Rol.CLIENTE)
  cancelOrder(@Param('id') id: string, @GetUser() user: ValidatedUser) {
    return this.orderService.cancelOrderAsCustomer(id, user._id);
  }

  @Get('assignable')
  @UseGuards(RolesGuard)
  @Roles(Rol.ADMIN)
  findAssignableOrders() {
    return this.orderService.findAssignableOrders();
  }

  @Get('mi-entrega/:id')
  @UseGuards(RolesGuard)
  @Roles(Rol.VENDEDOR)
  findOneForVendedor(@Param('id') id: string, @GetUser() user: ValidatedUser) {
    return this.orderService.findOneForVendedor(id, user._id);
  }
}

*/
//