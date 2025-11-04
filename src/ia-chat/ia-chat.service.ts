import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { type ValidatedUser } from '../user/schemas/user.schema';
import { ProductService } from '../product/product.service';
import { OrderService } from '../order/order.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { UserService } from '../user/user.service';
import { Rol } from '../auth/enums/rol.enum';
import axios from 'axios';

@Injectable()
export class IaChatService {
  private readonly ollamaUrl: string;
  private readonly logger = new Logger(IaChatService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly productService: ProductService,
    private readonly orderService: OrderService,
    private readonly dashboardService: DashboardService,
    private readonly userService: UserService,
  ) {
    const url = this.configService.get<string>('OLLAMA_URL');
    if (!url) {
      this.logger.error('La variable de entorno OLLAMA_URL no está definida.');
      throw new InternalServerErrorException(
        'Configuración de IA incompleta en el servidor.',
      );
    }
    this.ollamaUrl = url;
  }

  async handleChat(prompt: string, user: ValidatedUser) {
    const p = prompt.toLowerCase().trim();
    this.logger.log(`Usuario [${user.rol}] ${user.email} dijo: ${prompt}`);

    try {
      if (user.rol === Rol.CLIENTE) {
        if (p.includes('/estatus-pedido') || (p.includes('estatus') && p.includes('pedido'))) {
          return this._getEstatusPedido(user._id);
        }
        if (p.includes('/menu') || p.includes('/productos') || p.includes('menú') || p.includes('hamburguesas')) {
          return this._getListaProductos();
        }
      }

      if (user.rol === Rol.VENDEDOR) {
        if (p.includes('/mis-entregas') || (p.includes('mis') && p.includes('entregas'))) {
          return this._getMisEntregas(user._id);
        }
      }

      if (user.rol === Rol.ADMIN) {
        if (p.includes('/reporte-ventas') || (p.includes('reporte') && p.includes('ventas'))) {
          return this._getReporteAdmin();
        }
        if (p.includes('/top-productos') || (p.includes('top') && p.includes('productos'))) {
          return this._getTopProductosAdmin();
        }
        if (p.includes('/top-vendedores') || p.includes('desempeño') || (p.includes('mejores') && p.includes('vendedores'))) {
          return this._getTopVendedores();
        }
        if (p.includes('/clientes') || (p.includes('lista') && p.includes('clientes'))) {
          return this._getClientes();
        }
        if (p.includes('/pedidos-pendientes') || (p.includes('pedidos') && p.includes('asignar'))) {
          return this._getPedidosPendientes();
        }
      }

      this.logger.debug('No se detectó comando/intención. Pasando a Ollama.');
      return this._callOllama(prompt, user);
    } catch (error) {
      this.logger.error(`Error en handleChat: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        'Error procesando tu solicitud de chat.',
      );
    }
  }

  private async _getEstatusPedido(clienteId: string): Promise<string> {
    const pedido = await this.orderService.findMostRecentOrderForCustomer(clienteId);
    if (!pedido) {
      return 'No he encontrado ningún pedido reciente a tu nombre. ¿Te gustaría hacer uno?';
    }
    const fecha = new Date(pedido.createdAt).toLocaleDateString('es-MX');
    return `Tu pedido más reciente **(#${pedido._id.toString().slice(-6)})** del ${fecha} está en estado: **${pedido.status}**.`;
  }

  private async _getListaProductos(): Promise<string> {
    const productos = await this.productService.findAllAvailable();
    if (productos.length === 0) {
      return 'Lo siento, no hay productos disponibles en este momento.';
    }
    let tabla = '| Producto | Descripción | Precio |\n';
    tabla += '|---|---|---|\n';
    productos.forEach((p) => {
      tabla += `| **${p.nombre}** | ${p.descripcion} | \$${p.precio.toFixed(2)} |\n`;
    });
    return `¡Claro! Aquí tienes nuestro menú:\n\n${tabla}`;
  }

  private async _getReporteAdmin(): Promise<string> {
    const reporte = await this.dashboardService.getReporteVentas();
    return `**Resumen de ventas (solo pedidos entregados):**\n\n- **Total de Ventas:** \$${reporte.totalVentas.toFixed(2)} MXN\n- **Número de Pedidos:** ${reporte.numeroPedidos}`;
  }

  private async _getTopProductosAdmin(): Promise<string> {
    const productos = await this.dashboardService.getProductosMasVendidos();
    if (productos.length === 0) {
      return 'No hay datos de productos vendidos para generar un top.';
    }
    let tabla = '| # | Producto | Unidades Vendidas |\n';
    tabla += '|---|---|---|\n';
    productos.forEach((p, i) => {
      tabla += `| ${i + 1} | ${p.nombreProducto} | ${p.totalVendido} |\n`;
    });
    return `**Productos más vendidos:**\n\n${tabla}`;
  }

  private async _getTopVendedores(): Promise<string> {
    const vendedores = await this.dashboardService.getDesempenoVendedores();
    if (vendedores.length === 0) {
      return 'No hay datos de desempeño de vendedores (pedidos entregados).';
    }
    let tabla = '| # | Vendedor | Entregas | Total Vendido |\n';
    tabla += '|---|---|---|---|\n';
    vendedores.forEach((v, i) => {
      tabla += `| ${i + 1} | ${v.nombre} | ${v.totalEntregas} | \$${v.totalVendido.toFixed(2)} |\n`;
    });
    return `**Desempeño de vendedores:**\n\n${tabla}`;
  }

  private async _getClientes(): Promise<string> {
    const clientes = await this.userService.findAllClients();
    if (clientes.length === 0) {
      return 'No hay usuarios con el rol CLIENTE registrados.';
    }
    let tabla = '| Nombre | Email | Teléfono |\n';
    tabla += '|---|---|---|\n';
    clientes.forEach((c) => {
      tabla += `| ${c.nombre} | ${c.email} | ${c.telefono || 'N/A'} |\n`;
    });
    return `**Lista de clientes registrados:**\n\n${tabla}`;
  }

  private async _getMisEntregas(vendedorId: string): Promise<string> {
    const entregas = await this.orderService.findAssignedToVendedor(vendedorId);
    if (entregas.length === 0) {
      return 'No tienes entregas asignadas en este momento.';
    }
    let tabla = '| Pedido | Cliente | Teléfono | Total |\n';
    tabla += '|---|---|---|---|\n';
    entregas.forEach((o) => {
      tabla += `| #${o._id.toString().slice(-6)} | ${o.cliente.nombre} | ${o.cliente.telefono || 'N/A'} | \$${o.total.toFixed(2)} |\n`;
    });
    return `**Tus entregas asignadas:**\n\n${tabla}`;
  }

  private async _getPedidosPendientes(): Promise<string> {
    const pedidos = await this.orderService.findAssignableOrders();
    if (pedidos.length === 0) {
      return 'No hay pedidos pendientes de asignar.';
    }
    let tabla = '| Pedido | Cliente | Estado | Total |\n';
    tabla += '|---|---|---|---|\n';
    pedidos.forEach((o) => {
      tabla += `| #${o._id.toString().slice(-6)} | ${o.cliente.nombre} | ${o.status} | \$${o.total.toFixed(2)} |\n`;
    });
    return `**Pedidos pendientes de asignar:**\n\n${tabla}`;
  }

  private _getSystemPrompt(user: ValidatedUser): string {
    let prompt = `Eres "SmartAssistant", un asistente de IA para una hamburguesería llamada "SmartAssistant".
Tu objetivo es ayudar al usuario **${user.nombre}**, quien tiene el rol **${user.rol}**.

REGLAS:
1. No inventes datos ni productos.
2. Usa los comandos definidos antes de intentar responder libremente.
3. No muestres comandos de otros roles.
4. No respondas en formato JSON.
5. Si el usuario pregunta algo general, responde de forma breve y amable.

COMANDOS DISPONIBLES PARA ${user.rol}:\n`;

    switch (user.rol) {
      case Rol.CLIENTE:
        prompt += `
- /menu o /productos → Mostrar lista de productos.
- /estatus-pedido → Mostrar estado del pedido más reciente.`;
        break;
      case Rol.VENDEDOR:
        prompt += `
- /mis-entregas → Mostrar pedidos asignados al vendedor.`;
        break;
      case Rol.ADMIN:
        prompt += `
- /reporte-ventas → Total de ventas y pedidos entregados.
- /top-productos → Productos más vendidos.
- /top-vendedores → Desempeño de vendedores.
- /clientes → Lista de clientes registrados.
- /pedidos-pendientes → Pedidos por asignar.`;
        break;
    }
    return prompt;
  }

  private async _callOllama(prompt: string, user: ValidatedUser): Promise<string> {
    const systemPrompt = this._getSystemPrompt(user);
    const body = {
      model: 'phi3',
      stream: false,
      system: systemPrompt,
      prompt,
    };

    try {
      const response = await firstValueFrom(this.httpService.post(this.ollamaUrl, body));
      return response.data.response;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(`[Ollama] Error de Axios: ${error.message}`);
        if (error.response) {
          this.logger.error(
            `[Ollama] Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`,
          );
        }
      } else {
        this.logger.error(`[Ollama] Error inesperado: ${error}`);
      }
      return 'Lo siento, estoy teniendo problemas para conectarme con mi cerebro de IA en este momento.';
    }
  }
}
