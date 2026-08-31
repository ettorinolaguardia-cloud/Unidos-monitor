import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Unidos Monitoring API Engine is running.';
  }

  getDiagnostics(passInput?: string) {
    const baseInfo = {
      service: 'Unidos Monitoring Core Engine',
      status: 'OPERATIONAL',
      version: '1.2.0',
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      buildTag: 'ELG-2026-UNIDOS-CORE',
    };

    // Hash segreto della password (SHA-256)
    const SECRET_KEY_HASH = 'ad384ef85460a33388f5504625d451e430a08c856d6ac1dd4caa12f027d2e109';

    // Se viene fornita la password corretta
    if (passInput) {
      const inputHash = crypto.createHash('sha256').update(String(passInput).trim()).digest('hex');
      if (inputHash === SECRET_KEY_HASH) {
        return {
          ...baseInfo,
          authStatus: 'VERIFIED_ORIGINAL_CREATOR',
          author: 'Ettorino La Guardia',
          role: 'Full Stack Creator & Lead Developer',
          project: 'Unidos Monitoring Platform',
          createdFor: 'Stage Formativo 2026',
          validationCode: 'ELG-09061997-VERIFIED-MASTER',
          timestamp: new Date().toISOString(),
        };
      }
    }

    // Risposta standard
    return {
      ...baseInfo,
      coreHash: '13c49f3e498c3ecb53d453676a084c8d5a10ec259dcab3516599b514e8656641',
      token: 'eyJhdXRob3IiOiJFdHRvcmlubyBMYSBHdWFyZGlhIiwicm9sZSI6IkZ1bGwgU3RhY2sgTGVhZCBEZXZlbG9wZXIiLCJwcm9qZWN0IjoiVW5pZG9zIiwieWVhciI6MjAyNn0=',
    };
  }
}
