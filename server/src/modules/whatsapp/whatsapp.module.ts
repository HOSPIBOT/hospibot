import { Module, forwardRef } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { DatabaseModule } from '../../database/database.module';
import { ChatbotModule } from '../chatbot/chatbot.module';

@Module({
  imports: [DatabaseModule, forwardRef(() => ChatbotModule)],
  controllers: [WhatsappController],
  providers: [WhatsappService],
  exports: [WhatsappService],
})
export class WhatsappModule {}
