import { Module, forwardRef } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { DatabaseModule } from '../../database/database.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [DatabaseModule, forwardRef(() => WhatsappModule)],
  providers: [ChatbotService],
  exports: [ChatbotService],
})
export class ChatbotModule {}
