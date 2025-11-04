import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '../auth/enums/rol.enum';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Rol.ADMIN)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('reporte-ventas')
  getReporteVentas() {
    return this.dashboardService.getReporteVentas();
  }

  @Get('top-productos')
  getProductosMasVendidos() {
    return this.dashboardService.getProductosMasVendidos();
  }

  @Get('top-vendedores')
  getDesempenoVendedores() {
    return this.dashboardService.getDesempenoVendedores();
  }
}