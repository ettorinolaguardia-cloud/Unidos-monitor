import { Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Monitor, MonitorStatus } from './entities/monitor.entity';
import { MonitorCheck } from './entities/monitor-check.entity';
import { Incident } from './entities/incident.entity';
import { CreateMonitorDto } from './dto/create-monitor.dto';
import { UpdateMonitorDto } from './dto/update-monitor.dto';
import { NotificationsService } from '../notifications/notifications.service';
import * as net from 'net';

@Injectable()
export class MonitorsService implements OnModuleInit {
  private readonly logger = new Logger(MonitorsService.name);

  constructor(
    @InjectRepository(Monitor)
    private monitorsRepository: Repository<Monitor>,
    @InjectRepository(MonitorCheck)
    private checksRepository: Repository<MonitorCheck>,
    @InjectRepository(Incident)
    private incidentsRepository: Repository<Incident>,
    private notificationsService: NotificationsService,
  ) {}

  onModuleInit() {
    this.logger.log('Avvio del Motore di Monitoraggio in background...');
    // Esegue il controllo automatico ogni 30 secondi
    setInterval(() => {
      this.checkAllActiveMonitors();
    }, 30000);
  }

  private async checkAllActiveMonitors() {
    try {
      const activeMonitors = await this.monitorsRepository.find({
        where: { isActive: true },
      });

      const now = Date.now();
      for (const monitor of activeMonitors) {
        if (monitor.status === 'PAUSED' || monitor.status === 'MAINTENANCE') continue;

        const intervalMs = (monitor.interval || 2) * 60 * 1000;
        const lastCheck = monitor.lastCheckAt ? new Date(monitor.lastCheckAt).getTime() : 0;

        if (now - lastCheck >= intervalMs) {
          this.logger.log(`Esecuzione controllo schedulato per monitor #${monitor.id} (${monitor.name})`);
          await this.runCheck(monitor.id).catch((err) => {
            this.logger.error(`Errore nel controllo del monitor #${monitor.id}: ${err.message}`);
          });
        }
      }
    } catch (err: any) {
      this.logger.error(`Errore durante il ciclo di monitoraggio: ${err.message}`);
    }
  }

  async create(createMonitorDto: CreateMonitorDto): Promise<Monitor> {
    const monitor = this.monitorsRepository.create({
      ...createMonitorDto,
      status: 'PENDING',
      consecutiveFailures: 0,
      isActive: true,
    });
    return await this.monitorsRepository.save(monitor);
  }

  async findAll(): Promise<Monitor[]> {
    return await this.monitorsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Monitor> {
    const monitor = await this.monitorsRepository.findOne({ where: { id } });
    if (!monitor) {
      throw new NotFoundException(`Monitor #${id} non trovato`);
    }
    return monitor;
  }

  async update(id: number, updateMonitorDto: UpdateMonitorDto): Promise<Monitor> {
    await this.monitorsRepository.update(id, updateMonitorDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.monitorsRepository.delete(id);
  }

  async getChecks(monitorId: number, limit = 50): Promise<MonitorCheck[]> {
    return await this.checksRepository.find({
      where: { monitorId },
      order: { checkedAt: 'DESC' },
      take: limit,
    });
  }

  async getIncidents(monitorId?: number): Promise<Incident[]> {
    if (monitorId) {
      return await this.incidentsRepository.find({
        where: { monitorId },
        order: { startedAt: 'DESC' },
        relations: { monitor: true },
      });
    }
    return await this.incidentsRepository.find({
      order: { startedAt: 'DESC' },
      relations: { monitor: true },
      take: 50,
    });
  }

  async getGlobalStats() {
    const monitors = await this.monitorsRepository.find();
    const total = monitors.length;
    const up = monitors.filter((m) => m.status === 'UP').length;
    const down = monitors.filter((m) => m.status === 'DOWN').length;
    const degraded = monitors.filter((m) => m.status === 'DEGRADED').length;
    const paused = monitors.filter((m) => m.status === 'PAUSED' || !m.isActive).length;
    const pending = monitors.filter((m) => m.status === 'PENDING').length;

    const activeMonitors = monitors.filter((m) => m.status === 'UP' || m.status === 'DOWN' || m.status === 'DEGRADED');
    const uptimePercentage = activeMonitors.length > 0
      ? Number(((up / (up + down)) * 100).toFixed(2))
      : 100;

    const validResponseTimes = monitors.map((m) => m.lastResponseTime).filter((t): t is number => typeof t === 'number');
    const avgResponseTime = validResponseTimes.length > 0
      ? Math.round(validResponseTimes.reduce((a, b) => a + b, 0) / validResponseTimes.length)
      : 0;

    const openIncidentsCount = await this.incidentsRepository.count({ where: { status: 'OPEN' } });

    return {
      total,
      up,
      down,
      degraded,
      paused,
      pending,
      uptimePercentage: isNaN(uptimePercentage) ? 100 : uptimePercentage,
      avgResponseTime,
      openIncidentsCount,
    };
  }

  async runCheck(monitorId: number): Promise<MonitorCheck> {
    const monitor = await this.findOne(monitorId);
    const startTime = Date.now();

    let checkStatus: MonitorStatus = 'UP';
    let statusCode: number | undefined = undefined;
    let errorMessage: string | undefined = undefined;
    let responseTime = 0;

    try {
      if (monitor.type === 'http' || monitor.type === 'https' || monitor.type === 'api') {
        const targetUrl = monitor.url || (monitor.hostname ? `${monitor.type}://${monitor.hostname}:${monitor.port || (monitor.type === 'https' ? 443 : 80)}` : '');
        if (!targetUrl) throw new Error('URL non specificato');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), (monitor.timeout || 10) * 1000);

        const response = await fetch(targetUrl, {
          method: 'GET',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        responseTime = Date.now() - startTime;
        statusCode = response.status;

        const expectedCode = monitor.expectedCode || 200;
        if (response.status !== expectedCode && !(expectedCode === 200 && response.ok)) {
          checkStatus = 'DOWN';
          errorMessage = `HTTP Status ${response.status} (atteso: ${expectedCode})`;
        } else if (monitor.expectedString) {
          const bodyText = await response.text();
          if (!bodyText.includes(monitor.expectedString)) {
            checkStatus = 'DOWN';
            errorMessage = `Stringa attesa "${monitor.expectedString}" non trovata`;
          }
        }

        if (checkStatus === 'UP' && responseTime > 3000) {
          checkStatus = 'DEGRADED';
        }
      } else if (monitor.type === 'tcp') {
        const host = monitor.hostname || (monitor.url ? new URL(monitor.url).hostname : 'localhost');
        const port = monitor.port || 80;

        await new Promise<void>((resolve, reject) => {
          const socket = new net.Socket();
          socket.setTimeout((monitor.timeout || 10) * 1000);

          socket.connect(port, host, () => {
            responseTime = Date.now() - startTime;
            socket.destroy();
            resolve();
          });

          socket.on('error', (err) => {
            socket.destroy();
            reject(err);
          });

          socket.on('timeout', () => {
            socket.destroy();
            reject(new Error('TCP Timeout'));
          });
        });
      } else {
        responseTime = Date.now() - startTime;
        checkStatus = 'UP';
      }
    } catch (err: any) {
      responseTime = Date.now() - startTime;
      checkStatus = 'DOWN';
      errorMessage = err.message || 'Errore durante il controllo';
    }

    // Gestione transizioni di stato e incidenti
    let newStatus = monitor.status;
    let consecutiveFailures = monitor.consecutiveFailures;

    if (checkStatus === 'DOWN') {
      consecutiveFailures += 1;
      if (consecutiveFailures >= (monitor.maxRetries || 1)) {
        newStatus = 'DOWN';

        // Apri incidente se non esiste già aperto
        const openIncident = await this.incidentsRepository.findOne({
          where: { monitorId: monitor.id, status: 'OPEN' },
        });

        if (!openIncident) {
          const incident = this.incidentsRepository.create({
            monitorId: monitor.id,
            status: 'OPEN',
            cause: errorMessage || 'Servizio non raggiungibile',
          });
          await this.incidentsRepository.save(incident);

          // 🚨 Invio automatico notifica WhatsApp & Telegram al primo disservizio
          const serverTarget = monitor.url || `${monitor.hostname || 'localhost'}:${monitor.port || 80}`;
          const serverPort = monitor.port || (monitor.url ? (monitor.url.includes(':') ? monitor.url.split(':').pop()?.split('/')[0] : '80/443') : '80');

          const alertPhone = process.env.WHATSAPP_ALERT_PHONE || '+393209269241';
          const alertMsg = `🚨 *ALLARME UNIDOS MONITORING*\nIl servizio *${monitor.name}* (${monitor.type.toUpperCase()}) è andato in stato *DOWN*!\nCausa: ${errorMessage || 'Connessione Rifiutata / Timeout'}`;
          await this.notificationsService.sendWhatsAppMessage({
            toPhone: alertPhone,
            recipientName: 'Guido (Capo)',
            message: alertMsg,
          }).catch(err => this.logger.error(`Errore invio avviso WhatsApp: ${err.message}`));

          // Notifica ricca per Gruppo/Canale Telegram con porta, anomalia e suggerimento log
          const telegramAlert = 
            `🚨 <b>ANOMALIA RILEVATA SUL SERVER</b> 🚨\n` +
            `━━━━━━━━━━━━━━━━━━━━━\n` +
            `🖥️ <b>Server:</b> ${monitor.name}\n` +
            `📍 <b>Target:</b> <code>${serverTarget}</code>\n` +
            `🔌 <b>Porta interessata:</b> <code>${serverPort}</code>\n` +
            `⚠️ <b>Tipo Anomalia:</b> SERVER DOWN / ERRORE\n` +
            `⏱️ <b>Tempo Risposta:</b> ${responseTime} ms\n` +
            `📝 <b>Dettaglio Errore:</b> ${errorMessage || 'Nessuna risposta dal server'}\n` +
            `📅 <b>Ora Rilevamento:</b> ${new Date().toLocaleString('it-IT')}\n\n` +
            `💡 <b>Azione Suggerita:</b> Loggati sul server per verificare i processi ed i servizi in ascolto sulla porta ${serverPort}.`;

          await this.notificationsService.sendTelegramMessage({
            message: telegramAlert,
          }).catch(err => this.logger.error(`Errore invio avviso Telegram: ${err.message}`));
        }
      }
    } else {
      consecutiveFailures = 0;
      newStatus = checkStatus; // UP o DEGRADED

      // Chiudi eventuale incidente aperto
      const openIncident = await this.incidentsRepository.findOne({
        where: { monitorId: monitor.id, status: 'OPEN' },
      });

      if (openIncident) {
        const now = new Date();
        const durationSeconds = Math.round((now.getTime() - new Date(openIncident.startedAt).getTime()) / 1000);
        openIncident.status = 'RESOLVED';
        openIncident.resolvedAt = now;
        openIncident.durationSeconds = durationSeconds;
        await this.incidentsRepository.save(openIncident);

        // ✅ Invio automatico notifica WhatsApp & Telegram di ripristino
        const resolvePhone = process.env.WHATSAPP_ALERT_PHONE || '+393209269241';
        const resolveMsg = `✅ *UNIDOS MONITORING - SERVIZIO RIPRISTINATO*\nIl servizio *${monitor.name}* è di nuovo *ONLINE* (UP).\nDurata disservizio: ${durationSeconds} secondi.`;
        await this.notificationsService.sendWhatsAppMessage({
          toPhone: resolvePhone,
          recipientName: 'Guido (Capo)',
          message: resolveMsg,
        }).catch(err => this.logger.error(`Errore invio avviso WhatsApp: ${err.message}`));

        const telegramResolve = 
          `✅ <b>SERVIZIO RIPRISTINATO - UNIDOS</b> ✅\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `🖥️ <b>Server:</b> ${monitor.name}\n` +
          `🟢 <b>Stato Attuale:</b> ONLINE (UP)\n` +
          `⏱️ <b>Durata Disservizio:</b> ${durationSeconds} secondi\n` +
          `📅 <b>Ora Ripristino:</b> ${now.toLocaleString('it-IT')}`;

        await this.notificationsService.sendTelegramMessage({
          message: telegramResolve,
        }).catch(err => this.logger.error(`Errore invio avviso Telegram: ${err.message}`));
      }
    }

    // Aggiorna monitor
    monitor.status = newStatus;
    monitor.consecutiveFailures = consecutiveFailures;
    monitor.lastCheckAt = new Date();
    monitor.lastResponseTime = responseTime;
    await this.monitorsRepository.save(monitor);

    // Salva record MonitorCheck
    const checkRecord = this.checksRepository.create({
      monitorId: monitor.id,
      status: checkStatus,
      responseTime,
      statusCode,
      errorMessage,
    });
    return await this.checksRepository.save(checkRecord);
  }
}