import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserSession } from './entities/user-session.entity';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserSession)
    private sessionsRepository: Repository<UserSession>,
  ) {}

  async onModuleInit() {
    this.logger.log('Inizializzazione modulo Utenti e Registro Accessi PostgreSQL...');
    await this.seedDefaultUsers();
  }

  private async seedDefaultUsers() {
    const defaultUsers = [
      {
        name: 'Ettorino La Guardia',
        email: 'ettorino.laguardia@unidos.it',
        password: 'admin',
        role: 'developer' as const,
        status: 'APPROVED' as const,
        lastLoginAt: new Date(),
      },
      {
        name: 'Andrea Salvatore',
        email: 'andrea.salvatore@unidos.it',
        password: 'andrea2026',
        role: 'developer' as const,
        status: 'APPROVED' as const,
        lastLoginAt: new Date(),
      },
      {
        name: 'Flavio Mastrangelo',
        email: 'flavio.mastrangelo@unidos.it',
        password: 'flavio2026',
        role: 'developer' as const,
        status: 'APPROVED' as const,
        lastLoginAt: new Date(),
      },
      {
        name: 'Mario Rossi',
        email: 'mario.rossi@gmail.com',
        password: 'mario2026',
        role: 'client' as const,
        status: 'APPROVED' as const,
        lastLoginAt: new Date(),
      },
    ];

    for (const u of defaultUsers) {
      const existing = await this.usersRepository.findOne({ where: { email: u.email } });
      if (!existing) {
        const user = this.usersRepository.create(u);
        await this.usersRepository.save(user);
      }
    }
    this.logger.log('Account utenti predefiniti verificati/creati nel Database PostgreSQL.');
  }

  async findAllUsers(): Promise<User[]> {
    return await this.usersRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { email: email.toLowerCase() } });
  }

  async registerUser(dto: { name: string; email: string; role?: 'developer' | 'client' }): Promise<User> {
    const existing = await this.findUserByEmail(dto.email);
    if (existing) {
      existing.lastLoginAt = new Date();
      return await this.usersRepository.save(existing);
    }

    const newUser = this.usersRepository.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      role: dto.role || 'client',
      status: 'APPROVED',
      lastLoginAt: new Date(),
    });
    return await this.usersRepository.save(newUser);
  }

  async recordLogin(email: string, name?: string, role?: 'developer' | 'client'): Promise<User> {
    let user = await this.findUserByEmail(email);
    if (!user) {
      user = await this.registerUser({
        name: name || email.split('@')[0],
        email,
        role: role || 'client',
      });
    } else {
      user.lastLoginAt = new Date();
      await this.usersRepository.save(user);
    }
    return user;
  }

  async getActiveSessions(): Promise<UserSession[]> {
    return await this.sessionsRepository.find({ order: { updatedAt: 'DESC' } });
  }

  async registerSession(sessionDto: Partial<UserSession>): Promise<UserSession> {
    const email = sessionDto.email?.toLowerCase();
    
    // Se esiste già una sessione per questa email, la aggiorna invece di crearne una seconda
    let existing = email ? await this.sessionsRepository.findOne({ where: { email } }) : null;
    if (!existing && sessionDto.id) {
      existing = await this.sessionsRepository.findOne({ where: { id: sessionDto.id } });
    }

    if (existing) {
      Object.assign(existing, sessionDto, { updatedAt: new Date() });
      return await this.sessionsRepository.save(existing);
    }

    const id = sessionDto.id || 'sess-' + Date.now();
    const session = this.sessionsRepository.create({
      id,
      name: sessionDto.name || 'Utente Autenticato',
      email: sessionDto.email || '',
      role: sessionDto.role || 'Cliente',
      status: sessionDto.status || 'ONLINE',
      ip: sessionDto.ip || '127.0.0.1',
      location: sessionDto.location || 'Workstation Node',
      connectedSince: sessionDto.connectedSince || new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      ping: sessionDto.ping || Math.floor(Math.random() * 15) + 5,
      avatar: sessionDto.avatar || '👤',
    });

    return await this.sessionsRepository.save(session);
  }

  async removeSession(id: string): Promise<void> {
    await this.sessionsRepository.delete(id);
  }
}
