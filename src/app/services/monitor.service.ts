import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Monitor {
  id: number;
  name: string;
  description?: string;
  type: 'http' | 'https' | 'tcp' | 'ping' | 'api';
  url?: string;
  hostname?: string;
  port?: number;
  interval: number;
  timeout: number;
  maxRetries: number;
  consecutiveFailures: number;
  expectedCode?: number;
  expectedString?: string;
  status: 'UP' | 'DOWN' | 'DEGRADED' | 'PENDING' | 'PAUSED' | 'MAINTENANCE';
  lastCheckAt?: string;
  lastResponseTime?: number;
  sslExpiryDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MonitorStats {
  total: number;
  up: number;
  down: number;
  degraded: number;
  paused: number;
  pending: number;
  uptimePercentage: number;
  avgResponseTime: number;
  openIncidentsCount: number;
}

export interface MonitorCheck {
  id: number;
  monitorId: number;
  status: string;
  responseTime: number;
  statusCode?: number;
  errorMessage?: string;
  checkedAt: string;
}

export interface Incident {
  id: number;
  monitorId: number;
  monitor?: Monitor;
  status: 'OPEN' | 'RESOLVED' | 'ACKNOWLEDGED';
  cause?: string;
  startedAt: string;
  resolvedAt?: string;
  durationSeconds?: number;
  acknowledgedBy?: string;
}

export interface ActiveSession {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'ONLINE' | 'IDLE' | 'BUSY';
  ip?: string;
  location?: string;
  connectedSince: string;
  ping: number;
  avatar: string;
}

@Injectable({
  providedIn: 'root'
})
export class MonitorService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/monitors`;
  private sessionsUrl = `${this.baseUrl}/sessions`;

  getStats(): Observable<MonitorStats> {
    return this.http.get<MonitorStats>(`${this.apiUrl}/stats`);
  }

  getMonitors(): Observable<Monitor[]> {
    return this.http.get<Monitor[]>(this.apiUrl);
  }

  getMonitor(id: number): Observable<Monitor> {
    return this.http.get<Monitor>(`${this.apiUrl}/${id}`);
  }

  createMonitor(dto: Partial<Monitor>): Observable<Monitor> {
    return this.http.post<Monitor>(this.apiUrl, dto);
  }

  updateMonitor(id: number, dto: Partial<Monitor>): Observable<Monitor> {
    return this.http.patch<Monitor>(`${this.apiUrl}/${id}`, dto);
  }

  deleteMonitor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getChecks(monitorId: number): Observable<MonitorCheck[]> {
    return this.http.get<MonitorCheck[]>(`${this.apiUrl}/${monitorId}/checks`);
  }

  runCheck(id: number): Observable<MonitorCheck> {
    return this.http.post<MonitorCheck>(`${this.apiUrl}/${id}/check`, {});
  }

  getIncidents(): Observable<Incident[]> {
    return this.http.get<Incident[]>(`${this.apiUrl}/incidents`);
  }

  getActiveSessions(): Observable<ActiveSession[]> {
    return this.http.get<ActiveSession[]>(this.sessionsUrl);
  }

  registerSession(session: Partial<ActiveSession>): Observable<ActiveSession> {
    return this.http.post<ActiveSession>(this.sessionsUrl, session);
  }

  private usersUrl = `${this.baseUrl}/users`;

  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(this.usersUrl);
  }

  recordLogin(email: string, name?: string, role?: 'developer' | 'client'): Observable<any> {
    return this.http.post<any>(`${this.usersUrl}/login`, { email, name, role });
  }

  registerUserInDb(name: string, email: string, role?: 'developer' | 'client'): Observable<any> {
    return this.http.post<any>(`${this.usersUrl}/register`, { name, email, role });
  }

  sendWhatsAppMessage(payload: { toPhone: string; recipientName?: string; message: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/notifications/whatsapp/send`, payload);
  }

  logoutSession(id: string): Observable<void> {
    return this.http.delete<void>(`${this.sessionsUrl}/${id}`);
  }
}

