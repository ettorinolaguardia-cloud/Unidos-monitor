import { Controller, Get, Post, Body, Query, Res, HttpStatus } from '@nestjs/common';
import { NotificationsService, SendWhatsAppDto, SendTelegramDto } from './notifications.service';
import type { Response } from 'express';

@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // 1. Endpoint per inviare un messaggio Telegram al Gruppo/Canale
  @Post('notifications/telegram/send')
  async sendTelegram(@Body() body: SendTelegramDto) {
    if (!body.message) {
      return {
        status: 'error',
        message: 'Il campo message è obbligatorio.',
      };
    }
    const success = await this.notificationsService.sendTelegramMessage(body);
    return {
      status: success ? 'success' : 'error',
      message: success ? 'Notifica Telegram inviata al gruppo!' : 'Impossibile inviare la notifica Telegram. Verifica TELEGRAM_CHAT_ID.',
    };
  }

  // 2. Endpoint per inviare un messaggio WhatsApp
  @Post('notifications/whatsapp/send')
  async sendWhatsApp(@Body() body: SendWhatsAppDto) {
    if (!body.toPhone || !body.message) {
      return {
        status: 'error',
        message: 'I campi toPhone e message sono obbligatori.',
      };
    }
    const result = await this.notificationsService.sendWhatsAppMessage(body);
    return {
      status: 'success',
      message: 'Messaggio WhatsApp inviato con successo!',
      data: result,
    };
  }

  // 2. Storico messaggi WhatsApp inviati
  @Get('notifications/whatsapp/logs')
  getLogs() {
    return {
      status: 'success',
      logs: this.notificationsService.getSentLogs(),
    };
  }

  // 3. Webhook HTTP POST per ricevere notifiche di risposta da WhatsApp / Meta / Twilio
  @Post('webhooks/whatsapp')
  receiveWebhook(@Body() body: any) {
    return this.notificationsService.handleWhatsAppWebhook(body);
  }

  // 4. Webhook HTTP GET per la verifica del Token (Meta WhatsApp Cloud API Challenge)
  @Get('webhooks/whatsapp')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const VERIFY_TOKEN = 'unidos_whatsapp_secret_token_2026';
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return res.status(HttpStatus.OK).send(challenge);
    }
    return res.status(HttpStatus.FORBIDDEN).send('Token di verifica errato');
  }
}
