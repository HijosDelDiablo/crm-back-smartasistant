import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { IaChatService } from './ia-chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { type ValidatedUser } from '../user/schemas/user.schema';

class ChatPromptDto {
  prompt: string;
}

@Controller('ia-chat')
@UseGuards(JwtAuthGuard)
export class IaChatController {
  constructor(private readonly iaChatService: IaChatService) {}

  @Post()
  async handleChat(
    @Body() dto: ChatPromptDto,
    @GetUser() user: ValidatedUser,
  ) {
    const respuesta = await this.iaChatService.handleChat(dto.prompt, user);
    return {
      role: 'assistant',
      content: respuesta,
    };
  }
}