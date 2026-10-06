import { Injectable, Logger } from '@nestjs/common';

export class SendWhatsAppDto {
  toPhone: string;
  message: string;
  recipientName?: string;
}

export class SendTelegramDto {
  chatId?: string;
  message: string;
}

export class SentMessageLog {
  id: string;
  toPhone: string;
  recipientName: string;
  message: string;
  status: 'DELIVERED' | 'SENT' | 'FAILED';
  sentAt: string;
  twilioSid?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private sentMessagesLog: SentMessageLog[] = [];

  // Invia una notifica in un Gruppo o Canale Telegram
  async sendTelegramMessage(payload: SendTelegramDto): Promise<boolean> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = payload.chatId || process.env.TELEGRAM_CHAT_ID;

    if (!token) {
      this.logger.error('❌ TELEGRAM_BOT_TOKEN non configurato.');
      return false;
    }

    if (!chatId) {
      this.logger.warn('⚠️ TELEGRAM_CHAT_ID non ancora impostato. Messaggio registrato solo in log.');
      this.logger.log(`[TELEGRAM NOTIFICATION] ${payload.message}`);
      return false;
    }

    try {
      this.logger.log(`🚀 Invio notifica Telegram al gruppo/canale (${chatId})...`);
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: payload.message,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      });

      const data: any = await response.json();
      if (response.ok && data.ok) {
        this.logger.log(`✅ Notifica Telegram inviata con successo al gruppo/canale (${chatId})!`);
        return true;
      } else {
        this.logger.error(`❌ Errore API Telegram: ${data.description || JSON.stringify(data)}`);
        return false;
      }
    } catch (err: any) {
      this.logger.error(`❌ Errore connessione Telegram API: ${err.message}`);
      return false;
    }
  }

  // Invia un messaggio WhatsApp tramite API Twilio / Webhook
  async sendWhatsAppMessage(payload: SendWhatsAppDto): Promise<SentMessageLog> {
    const { toPhone, message, recipientName } = payload;
    const cleanPhone = toPhone.replace(/\s+/g, '');
    const targetName = recipientName || 'Capo / Manager';

    this.logger.log(`🚀 Invio messaggio WhatsApp a ${targetName} (${cleanPhone}): "${message}"`);

    let twilioSid: string | undefined = undefined;
    let deliveryStatus: 'DELIVERED' | 'SENT' | 'FAILED' = 'DELIVERED';

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const apiKeySid = process.env.TWILIO_API_KEY_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN || process.env.TWILIO_API_SECRET;
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886';

    // Se sono configurate le credenziali reali di Twilio, esegue la chiamata all'API REST di Twilio
    if (accountSid && authToken) {
      try {
        const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        const formattedFrom = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;
        const formattedTo = cleanPhone.startsWith('whatsapp:') ? cleanPhone : `whatsapp:${cleanPhone.startsWith('+') ? cleanPhone : '+' + cleanPhone}`;

        const bodyParams = new URLSearchParams();
        bodyParams.append('From', formattedFrom);
        bodyParams.append('To', formattedTo);
        bodyParams.append('Body', message);

        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: bodyParams.toString(),
        });

        const data: any = await response.json();
        if (response.ok) {
          twilioSid = data.sid;
          deliveryStatus = 'SENT';
          this.logger.log(`✅ Messaggio WhatsApp REALE inviato via Twilio! SID: ${data.sid}`);
        } else {
          this.logger.error(`❌ Errore API Twilio: ${data.message || JSON.stringify(data)}`);
          deliveryStatus = 'FAILED';
        }
      } catch (err: any) {
        this.logger.error(`❌ Errore durante l'invio via Twilio: ${err.message}`);
      }
    }

    const logEntry: SentMessageLog = {
      id: twilioSid || ('wa-msg-' + Date.now()),
      toPhone: cleanPhone,
      recipientName: targetName,
      message,
      status: deliveryStatus,
      sentAt: new Date().toISOString(),
      twilioSid,
    };

    this.sentMessagesLog.unshift(logEntry);
    return logEntry;
  }

  // Gestisce la risposta Webhook ricevuta da WhatsApp / Meta API
  handleWhatsAppWebhook(body: any) {
    this.logger.log('📩 Webhook WhatsApp Ricevuto dal server Meta / Twilio:');
    this.logger.log(JSON.stringify(body, null, 2));

    return {
      status: 'success',
      receivedAt: new Date().toISOString(),
    };
  }

  // Restituisce lo storico dei messaggi WhatsApp inviati
  getSentLogs(): SentMessageLog[] {
    return this.sentMessagesLog;
  }
}

