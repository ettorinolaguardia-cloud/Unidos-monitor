import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonitorService, Monitor, MonitorStats, MonitorCheck, Incident } from './services/monitor.service';

export type UserPersona = 'welcome' | 'login' | 'developer' | 'client';

export interface CompanyProfile {
  companyName: string;
  vatNumber: string;
  contactEmail: string;
  contactPhone: string;
  contactPerson: string;
  notes: string;
}

export interface SocialUser {
  name: string;
  email: string;
  avatar: string;
  provider: 'google' | 'facebook' | 'twitter' | 'github';
}

export interface DevSession {
  id: string;
  name: string;
  email?: string;
  role: string;
  status: 'ONLINE' | 'IDLE' | 'BUSY';
  ip?: string;
  location?: string;
  connectedSince: string;
  ping: number;
  avatar: string;
}



export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'developer' | 'client';
  status: 'APPROVED' | 'PENDING' | 'BLOCKED';
  registeredAt: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private monitorService = inject(MonitorService);

  // Persona / View Selector: 'welcome' | 'login' | 'developer' | 'client'
  public activeView = signal<UserPersona>('welcome');

  // Auth & Role State Signals
  public isLoggedIn = signal<boolean>(false);
  public userRole = signal<'developer' | 'client'>('developer');
  public isLoginOpen = signal<boolean>(false);
  public showLoginModal = signal<boolean>(false);
  public showRegisterModal = signal<boolean>(false);
  public socialUser = signal<SocialUser | null>(null);
  public showDevSessionsModal = signal<boolean>(false);

  // Navbar Links Modals & Navigation State
  public showShopModal = signal<boolean>(false);
  public showSolutionsModal = signal<boolean>(false);
  public selectedSolution = signal<'consulenza' | 'monitoraggio' | 'sicurezza' | 'sviluppo'>('consulenza');
  public showContactModal = signal<boolean>(false);
  public showBlogModal = signal<boolean>(false);

  public openShopModal(): void {
    this.showShopModal.set(true);
  }
  public closeShopModal(): void {
    this.showShopModal.set(false);
  }

  public openSolutionModal(type: 'consulenza' | 'monitoraggio' | 'sicurezza' | 'sviluppo'): void {
    this.selectedSolution.set(type);
    this.showSolutionsModal.set(true);
  }
  public closeSolutionModal(): void {
    this.showSolutionsModal.set(false);
  }

  public openContactModal(): void {
    this.showContactModal.set(true);
  }
  public closeContactModal(): void {
    this.showContactModal.set(false);
  }

  public openBlogModal(): void {
    this.showBlogModal.set(true);
  }
  public closeBlogModal(): void {
    this.showBlogModal.set(false);
  }




  // Registration Form Model
  public registerForm = {
    name: '',
    email: '',
    password: '',
    role: 'client' as 'developer' | 'client'
  };

  // Registered Users Account Store
  public registeredUsers = signal<UserAccount[]>([
    {
      id: 'usr-1',
      name: 'Ettorino La Guardia',
      email: 'ettorino.laguardia@unidos.it',
      password: 'admin',
      role: 'developer',
      status: 'APPROVED',
      registeredAt: '2026-01-15'
    },
    {
      id: 'usr-2',
      name: 'Andrea Salvatore',
      email: 'andrea.salvatore@unidos.it',
      password: 'andrea2026',
      role: 'developer',
      status: 'APPROVED',
      registeredAt: '2026-07-31'
    },
    {
      id: 'usr-3',
      name: 'Flavio Mastrangelo',
      email: 'flavio.mastrangelo@unidos.it',
      password: 'flavio2026',
      role: 'developer',
      status: 'APPROVED',
      registeredAt: '2026-07-31'
    }
  ]);

  public openRegisterModal(): void {
    this.closeLoginModal();
    this.showRegisterModal.set(true);
  }

  public closeRegisterModal(): void {
    this.showRegisterModal.set(false);
  }

  public registerUser(): void {
    if (!this.registerForm.name || !this.registerForm.email || !this.registerForm.password) {
      alert('Compila tutti i campi obbligatori per la registrazione!');
      return;
    }

    const newAcc: UserAccount = {
      id: 'usr-' + Date.now(),
      name: this.registerForm.name,
      email: this.registerForm.email.toLowerCase(),
      role: this.registerForm.role,
      status: this.registerForm.role === 'developer' ? 'PENDING' : 'APPROVED',
      registeredAt: new Date().toISOString().split('T')[0]
    };

    this.registeredUsers.update(list => [...list, newAcc]);

    // Autentica immediatamente l'utente registrato
    this.isLoggedIn.set(true);
    this.userRole.set(newAcc.role);
    this.activeView.set(newAcc.role);
    const profile: SocialUser = {
      name: newAcc.name,
      email: newAcc.email,
      avatar: newAcc.role === 'developer' ? '👨‍💻' : '👤',
      provider: 'github'
    };
    this.socialUser.set(profile);
    this.registerUserSession(newAcc.name, newAcc.email, newAcc.role === 'developer' ? 'Dev Team' : 'Cliente Registrato', profile.avatar);

    this.closeRegisterModal();
  }

  public updateUserStatus(userId: string, newStatus: 'APPROVED' | 'PENDING' | 'BLOCKED'): void {
    this.registeredUsers.update(list =>
      list.map(u => u.id === userId ? { ...u, status: newStatus } : u)
    );
  }

  public toggleUserRole(userId: string): void {
    this.registeredUsers.update(list =>
      list.map(u => u.id === userId ? { ...u, role: u.role === 'developer' ? 'client' : 'developer' } : u)
    );
  }

  public deleteUser(userId: string): void {
    if (confirm('Sei sicuro di voler eliminare questo account utente?')) {
      this.registeredUsers.update(list => list.filter(u => u.id !== userId));
    }
  }

  // Live Developers Online Sessions Store (Dynamic Database Sincronizzato)
  public activeDevSessions = signal<DevSession[]>([]);

  public onlineDevCount = computed(() => {
    return this.activeDevSessions().filter(s => s.status === 'ONLINE' || s.status === 'BUSY').length;
  });

  public toggleDevSessionsModal(): void {
    this.showDevSessionsModal.update(v => !v);
    if (this.showDevSessionsModal()) {
      this.refreshLiveSessions();
    }
  }

  public refreshLiveSessions(): void {
    this.monitorService.getActiveSessions().subscribe({
      next: (sessions) => {
        const normalizedSessions: DevSession[] = sessions.map(s => ({
          ...s,
          ip: s.ip || '127.0.0.1',
          location: s.location || 'Node Locale'
        }));
        this.activeDevSessions.set(normalizedSessions);
      },

      error: () => {
        // Fallback reattivo per le sessioni attive correnti
        if (this.isLoggedIn() && this.socialUser()) {
          const u = this.socialUser()!;
          const currentSessions = this.activeDevSessions();
          const exists = currentSessions.some(s => s.name === u.name);
          if (!exists) {
            const now = new Date();
            const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            this.activeDevSessions.set([
              {
                id: 'sess-' + Date.now(),
                name: u.name,
                role: this.userRole() === 'developer' ? 'Lead Full-Stack Dev & Admin' : 'Cliente Autenticato',
                status: 'ONLINE',
                ip: '127.0.0.1',
                location: 'Client Node',
                connectedSince: timeStr,
                ping: Math.floor(Math.random() * 15) + 5,
                avatar: u.avatar || '👨‍💻'
              }
            ]);
          }
        }
      }
    });
  }




  // WhatsApp Notification Form Model & Control
  public waRecipientPhone = '+393209269241';
  public waRecipientName = 'Guido (Capo)';
  public waMessageText = 'ciao guido prova messaggio test la tua app Unidos srl sta per essere completata siamo sul 70 % del download';
  public waSendingStatus = signal<string | null>(null);

  public sendWhatsAppFromUi(): void {
    if (!this.waRecipientPhone.trim() || !this.waMessageText.trim()) {
      alert('Inserisci il numero di telefono ed il testo del messaggio!');
      return;
    }
    this.waSendingStatus.set('⏳ Invio messaggio WhatsApp in corso...');
    this.monitorService.sendWhatsAppMessage({
      toPhone: this.waRecipientPhone,
      recipientName: this.waRecipientName,
      message: this.waMessageText
    }).subscribe({
      next: () => {
        this.waSendingStatus.set('✅ Messaggio WhatsApp inviato con successo a ' + this.waRecipientName + '!');
        setTimeout(() => this.waSendingStatus.set(null), 5000);
      },
      error: (err: any) => {
        this.waSendingStatus.set('❌ Errore durante l\'invio: ' + (err.message || 'Server API non raggiungibile'));
      }
    });
  }

  // Login Form Model & Error State
  public loginEmail = '';
  public loginPassword = '';
  public loginErrorMessage = signal<string | null>(null);

  public openLoginModal(): void {
    this.loginErrorMessage.set(null);
    this.isLoginOpen.set(false);
    this.showLoginModal.set(false);
    this.activeView.set('login');
  }

  public closeLoginModal(): void {
    this.isLoginOpen.set(false);
    this.showLoginModal.set(false);
  }

  public toggleLogin(): void {
    this.isLoginOpen.update(v => !v);
    this.showLoginModal.set(this.isLoginOpen());
  }




  private registerUserSession(name: string, email: string, role: string, avatar: string): void {
    try {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const newSession: DevSession = {
        id: 'sess-' + Date.now(),
        name,
        email,
        role,
        status: 'ONLINE',
        ip: '127.0.0.1',
        location: 'Workstation Node',
        connectedSince: timeStr,
        ping: Math.floor(Math.random() * 12) + 6,
        avatar
      };

      this.activeDevSessions.update(curr => [newSession, ...curr.filter(s => s.name !== name)]);

      this.monitorService.registerSession(newSession).subscribe({
        next: () => this.refreshLiveSessions(),
        error: () => {}
      });
    } catch (e) {
      console.warn('Live session registration skipped:', e);
    }
  }

  public loginWithCredentials(): void {
    let email = this.loginEmail.trim().toLowerCase();
    let password = this.loginPassword.trim();

    if (!email || !password) {
      this.loginErrorMessage.set('⚠️ Inserisci sia l\'email che la password per accedere.');
      return;
    }

    // Registra l'accesso automaticamente nel Database PostgreSQL
    this.monitorService.recordLogin(email, email.split('@')[0]).subscribe({
      next: () => {},
      error: () => {}
    });

    // 1. Controllo Amministratore Dev Principale
    if (email === 'ettorino.laguardia@unidos.it') {
      this.isLoggedIn.set(true);
      this.userRole.set('developer');
      this.activeView.set('developer');
      const profile: SocialUser = {
        name: 'Ettorino La Guardia (Admin Dev)',
        email: 'ettorino.laguardia@unidos.it',
        avatar: '👨‍💻',
        provider: 'github'
      };
      this.socialUser.set(profile);
      this.registerUserSession(profile.name, profile.email, 'Lead Full-Stack Dev & Admin', profile.avatar);
      this.loginErrorMessage.set(null);
      this.closeLoginModal();
      return;
    }

    // 2. Controllo Utenti Registrati nel Database
    const registered = this.registeredUsers().find(u => u.email.toLowerCase() === email);

    if (registered) {
      if (registered.status === 'BLOCKED') {
        this.loginErrorMessage.set('🚫 ACCESSO NEGATO: Il tuo account è stato disabilitato o bloccato dall\'amministratore.');
        return;
      }

      if (registered.password && registered.password !== password) {
        this.loginErrorMessage.set('❌ Password errata per l\'account ' + registered.email);
        return;
      }

      this.isLoggedIn.set(true);
      this.userRole.set(registered.role);
      this.activeView.set(registered.role);
      const profile: SocialUser = {
        name: registered.name,
        email: registered.email,
        avatar: registered.role === 'developer' ? '👨‍💻' : '👤',
        provider: 'google'
      };
      this.socialUser.set(profile);
      this.registerUserSession(profile.name, profile.email, registered.role === 'developer' ? 'Dev Team' : 'Cliente Autenticato', profile.avatar);
      this.loginErrorMessage.set(null);
      this.closeLoginModal();
      return;
    }

    // 3. Nuove Credenziali -> Registrazione automatica istantanea ed accesso
    const role: 'developer' | 'client' = (email.includes('dev') || email.includes('admin') || email.includes('unidos')) ? 'developer' : 'client';
    const namePart = email.split('@')[0];
    const formattedName = namePart.split(/[\._-]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    const newAcc: UserAccount = {
      id: 'usr-' + Date.now(),
      name: formattedName || 'Utente Autenticato',
      email: email,
      role: role,
      status: 'APPROVED',
      registeredAt: new Date().toISOString().split('T')[0]
    };

    this.registeredUsers.update(list => [...list, newAcc]);

    this.isLoggedIn.set(true);
    this.userRole.set(newAcc.role);
    this.activeView.set(newAcc.role);
    const profile: SocialUser = {
      name: newAcc.name,
      email: newAcc.email,
      avatar: newAcc.role === 'developer' ? '👨‍💻' : '👤',
      provider: 'github'
    };
    this.socialUser.set(profile);
    this.registerUserSession(newAcc.name, newAcc.email, newAcc.role === 'developer' ? 'Dev Team' : 'Cliente Registrato', profile.avatar);
    this.loginErrorMessage.set(null);
    this.closeLoginModal();
  }





  public loginAs(role: 'developer' | 'client'): void {
    this.isLoggedIn.set(true);
    this.userRole.set(role);
    this.activeView.set(role);
    this.closeLoginModal();
  }


  public loginWithSocial(provider: 'google' | 'facebook' | 'twitter' | 'github'): void {
    const mockProfiles: Record<string, SocialUser> = {
      google: {
        name: 'Mario Rossi',
        email: 'mario.rossi@gmail.com',
        avatar: '🌐',
        provider: 'google'
      },
      facebook: {
        name: 'Elena Bianchi',
        email: 'elena.bianchi@facebook.com',
        avatar: '📘',
        provider: 'facebook'
      },
      twitter: {
        name: 'Marco Verri',
        email: 'marco.verri@x.com',
        avatar: '𝕏',
        provider: 'twitter'
      },
      github: {
        name: 'Dev Client',
        email: 'client@github.com',
        avatar: '🐙',
        provider: 'github'
      }
    };

    const user = mockProfiles[provider];
    this.socialUser.set(user);
    this.companyProfile.update(prev => ({
      ...prev,
      contactPerson: user.name,
      contactEmail: user.email
    }));

    this.registerUserSession(user.name, user.email, 'Cliente Autenticato (' + provider.toUpperCase() + ')', user.avatar);
    this.isLoggedIn.set(true);
    this.userRole.set('client');
    this.activeView.set('client');
    this.closeLoginModal();
  }

  public logout(): void {
    this.isLoggedIn.set(false);
    this.socialUser.set(null);
    this.activeDevSessions.set([]);
    this.activeView.set('welcome');
  }




  // Navbar Mega-Dropdown State Signal
  public activeDropdown = signal<string | null>(null);

  public toggleDropdown(menuName: string): void {
    this.activeDropdown.update(current => current === menuName ? null : menuName);
  }

  // Language Selector State
  public selectedLanguage = signal<{ code: string; name: string; flag: string }>({
    code: 'it',
    name: 'Italiano',
    flag: '🇮🇹'
  });

  public availableLanguages = signal([
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
    { code: 'pl', name: 'Polski', flag: '🇵🇱' },
    { code: 'zh', name: '中文 (Cinese)', flag: '🇨🇳' },
    { code: 'ja', name: '日本語 (Giapponese)', flag: '🇯🇵' },
    { code: 'ar', name: 'العربية (Arabo)', flag: '🇸🇦' },
    { code: 'ru', name: 'Русский (Russo)', flag: '🇷🇺' }
  ]);

  public selectLanguage(lang: { code: string; name: string; flag: string }): void {
    this.selectedLanguage.set(lang);
    this.closeDropdown();
  }

  public closeDropdown(): void {
    this.activeDropdown.set(null);
  }

  // Translations Dictionary Signal Store (i18n)
  public translations = signal<Record<string, Record<string, string>>>({
    it: {
      shop: 'Shop',
      soluzioni: 'Soluzioni',
      contatto: 'Contatto',
      blog: 'Blog',
      cerca: 'Cerca...',
      subConsulenza: '🌐 Consulenza IT & Cloud',
      subMonitoraggio: '⚡ Monitoraggio Server H24',
      subSicurezza: '🔒 Sicurezza e Cybersecurity',
      subSviluppo: '🖥️ Sviluppo Software Su Misura',
      heroSubtitle: 'Informatica e Consulenza • Piattaforma di Monitoraggio Infrastrutturale'
    },
    en: {
      shop: 'Shop',
      soluzioni: 'Solutions',
      contatto: 'Contact',
      blog: 'Blog',
      cerca: 'Search...',
      subConsulenza: '🌐 IT & Cloud Consulting',
      subMonitoraggio: '⚡ 24/7 Server Monitoring',
      subSicurezza: '🔒 Security & Cybersecurity',
      subSviluppo: '🖥️ Custom Software Development',
      heroSubtitle: 'IT & Consulting • Infrastructure Monitoring Platform'
    },
    es: {
      shop: 'Tienda',
      soluzioni: 'Soluciones',
      contatto: 'Contacto',
      blog: 'Blog',
      cerca: 'Buscar...',
      subConsulenza: '🌐 Consultoría IT y Cloud',
      subMonitoraggio: '⚡ Monitoreo de Servidores 24/7',
      subSicurezza: '🔒 Seguridad y Ciberseguridad',
      subSviluppo: '🖥️ Desarrollo de Software a Medida',
      heroSubtitle: 'Informática y Consultoría • Plataforma de Monitoreo de Infraestructura'
    },
    de: {
      shop: 'Shop',
      soluzioni: 'Lösungen',
      contatto: 'Kontakt',
      blog: 'Blog',
      cerca: 'Suchen...',
      subConsulenza: '🌐 IT- & Cloud-Beratung',
      subMonitoraggio: '⚡ 24/7 Serverüberwachung',
      subSicurezza: '🔒 Sicherheit & Cybersicherheit',
      subSviluppo: '🖥️ Maßgeschneiderte Softwareentwicklung',
      heroSubtitle: 'IT & Beratung • Infrastruktur-Überwachungsplattform'
    },
    fr: {
      shop: 'Boutique',
      soluzioni: 'Solutions',
      contatto: 'Contact',
      blog: 'Blog',
      cerca: 'Rechercher...',
      subConsulenza: '🌐 Conseil IT & Cloud',
      subMonitoraggio: '⚡ Surveillance Serveur 24/7',
      subSicurezza: '🔒 Sécurité & Cybersécurité',
      subSviluppo: '🖥️ Développement Sur Mesure',
      heroSubtitle: 'Informatique & Conseil • Plateforme de Surveillance d\'Infrastructure'
    },
    pt: {
      shop: 'Loja',
      soluzioni: 'Soluções',
      contatto: 'Contato',
      blog: 'Blog',
      cerca: 'Pesquisar...',
      subConsulenza: '🌐 Consultoria em TI e Nuvem',
      subMonitoraggio: '⚡ Monitoramento de Servidores 24/7',
      subSicurezza: '🔒 Segurança e Cibersegurança',
      subSviluppo: '🖥️ Desenvolvimento de Software sob Medida',
      heroSubtitle: 'TI e Consultoria • Plataforma de Monitoramento de Infraestrutura'
    },
    nl: {
      shop: 'Winkel',
      soluzioni: 'Oplossingen',
      contatto: 'Contact',
      blog: 'Blog',
      cerca: 'Zoeken...',
      subConsulenza: '🌐 IT- & Cloud-advies',
      subMonitoraggio: '⚡ 24/7 Serverbewaking',
      subSicurezza: '🔒 Beveiliging & Cybersecurity',
      subSviluppo: '🖥️ Maatwerk Softwareontwikkeling',
      heroSubtitle: 'IT & Advies • Infrastructuur Bewakingsplatform'
    },
    pl: {
      shop: 'Sklep',
      soluzioni: 'Rozwiązania',
      contatto: 'Kontakt',
      blog: 'Blog',
      cerca: 'Szukaj...',
      subConsulenza: '🌐 Doradztwo IT i Chmurowe',
      subMonitoraggio: '⚡ Monitorowanie Serwerów 24/7',
      subSicurezza: '🔒 Bezpieczeństwo i Cyberbezpieczeństwo',
      subSviluppo: '🖥️ Dedykowane Oprogramowanie',
      heroSubtitle: 'IT i Doradztwo • Platforma Monitorowania Infrastruktury'
    },
    zh: {
      shop: '商店',
      soluzioni: '解决方案',
      contatto: '联系我们',
      blog: '博客',
      cerca: '搜索...',
      subConsulenza: '🌐 IT与云咨询',
      subMonitoraggio: '⚡ 全天候服务器监控',
      subSicurezza: '🔒 网络安全与防御',
      subSviluppo: '🖥️ 定制软件开发',
      heroSubtitle: 'IT与咨询 • 基础设施监控平台'
    },
    ja: {
      shop: 'ショップ',
      soluzioni: 'ソリューション',
      contatto: 'お問い合わせ',
      blog: 'ブログ',
      cerca: '検索...',
      subConsulenza: '🌐 IT＆クラウドコンサルティング',
      subMonitoraggio: '⚡ 24/7 サーバー監視',
      subSicurezza: '🔒 セキュリティ＆サイバーセキュリティ',
      subSviluppo: '🖥️ カスタムソフトウェア開発',
      heroSubtitle: 'IT＆コンサルティング • インフラ監視プラットフォーム'
    },
    ar: {
      shop: 'المتجر',
      soluzioni: 'الحلول',
      contatto: 'اتصل بنا',
      blog: 'المدونة',
      cerca: 'بحث...',
      subConsulenza: '🌐 استشارات تكنولوجيا المعلومات والسحب الإلكتروني',
      subMonitoraggio: '⚡ مراقبة الخوادم على مدار الساعة',
      subSicurezza: '🔒 الأمان والأمن السيبراني',
      subSviluppo: '🖥️ تطوير البرمجيات المخصصة',
      heroSubtitle: 'تكنولوجيا المعلومات والاستشارات • منصة مراقبة البنية التحتية'
    },
    ru: {
      shop: 'Магазин',
      soluzioni: 'Решения',
      contatto: 'Контакты',
      blog: 'Блог',
      cerca: 'Поиск...',
      subConsulenza: '🌐 IT и облачный консалтинг',
      subMonitoraggio: '⚡ Круглосуточный мониторинг серверов',
      subSicurezza: '🔒 Безопасность и кибербезопасность',
      subSviluppo: '🖥️ Разработка ПО на заказ',
      heroSubtitle: 'IT и консалтинг • Платформа мониторинга инфраструктуры'
    }
  });


  // Active UI Text Signal based on selected language
  public t = computed(() => {
    const code = this.selectedLanguage().code;
    const dict = this.translations()[code] || this.translations()['en'] || this.translations()['it'];
    return dict;
  });





  // Company Profile State
  public companyProfile = signal<CompanyProfile>({
    companyName: 'Unidos S.r.l.',
    vatNumber: 'IT01234567890',
    contactEmail: 'info@unidos.it',
    contactPhone: '+39 02 1234567',
    contactPerson: 'Marco Rossi',
    notes: 'Sede Principale Milano - Gestione Monitoraggio Server'
  });

  public showCompanyModal = false;
  public companyForm: CompanyProfile = { ...this.companyProfile() };

  // State Signals & Variables
  public stats = signal<MonitorStats>({
    total: 0,
    up: 0,
    down: 0,
    degraded: 0,
    paused: 0,
    pending: 0,
    uptimePercentage: 100,
    avgResponseTime: 0,
    openIncidentsCount: 0
  });

  public monitors = signal<Monitor[]>([]);
  public incidents = signal<Incident[]>([]);
  public filteredMonitors = signal<Monitor[]>([]);
  public monitorChecks = signal<MonitorCheck[]>([]);

  public searchTerm = '';
  public statusFilter = 'ALL';
  public typeFilter = 'ALL';

  public showModal = false;
  public showDetailModal = false;
  public selectedMonitor: Monitor | null = null;
  public isLoading = false;
  public isChecking = signal<Record<number, boolean>>({});

  // Form Model
  public monitorForm: Partial<Monitor> = {
    name: '',
    description: '',
    type: 'http',
    url: '',
    hostname: '',
    port: 80,
    interval: 2,
    timeout: 10,
    maxRetries: 3,
    expectedCode: 200,
    expectedString: ''
  };

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      (window as any).openLogin = () => this.openLoginModal();
      (window as any).closeLogin = () => this.closeLoginModal();
    }

    // Carica eventuale profilo aziendale salvato in localStorage

    const savedProfile = localStorage.getItem('unidos_company_profile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        this.companyProfile.set(parsed);
      } catch (e) {
        console.error('Errore durante il parsing del profilo aziendale salvato');
      }
    }

    this.refreshAll();

    // Auto-refresh stats & monitors every 15 seconds
    setInterval(() => {
      this.refreshAll();
    }, 15000);
  }

  public setView(view: UserPersona): void {
    this.activeView.set(view);
    if (view === 'login') {
      this.loginErrorMessage.set(null);
      this.isLoginOpen.set(false);
      this.showLoginModal.set(false);
    }
  }

  public openCompanyModal(): void {
    this.companyForm = { ...this.companyProfile() };
    this.showCompanyModal = true;
  }

  public closeCompanyModal(): void {
    this.showCompanyModal = false;
  }

  public saveCompanyProfile(): void {
    if (!this.companyForm.companyName.trim()) {
      alert('Inserisci la Ragione Sociale dell\'azienda!');
      return;
    }
    this.companyProfile.set({ ...this.companyForm });
    localStorage.setItem('unidos_company_profile', JSON.stringify(this.companyForm));
    this.closeCompanyModal();
  }

  public refreshAll(): void {
    this.isLoading = true;
    this.monitorService.getStats().subscribe({
      next: (s) => this.stats.set(s),
      error: (err) => console.error('Errore durante il recupero delle statistiche:', err)
    });

    this.monitorService.getMonitors().subscribe({
      next: (m) => {
        this.monitors.set(m);
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Errore durante il recupero dei monitor:', err);
        this.isLoading = false;
      }
    });

    this.monitorService.getIncidents().subscribe({
      next: (incidents) => this.incidents.set(incidents),
      error: (err) => console.error('Errore durante il recupero degli incidenti:', err)
    });
  }

  public applyFilters(): void {
    let list = this.monitors();

    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase();
      list = list.filter(m => 
        m.name.toLowerCase().includes(q) || 
        (m.url && m.url.toLowerCase().includes(q)) ||
        (m.hostname && m.hostname.toLowerCase().includes(q))
      );
    }

    if (this.statusFilter !== 'ALL') {
      list = list.filter(m => m.status === this.statusFilter);
    }

    if (this.typeFilter !== 'ALL') {
      list = list.filter(m => m.type === this.typeFilter);
    }

    this.filteredMonitors.set(list);
  }

  public openModal(monitor?: Monitor): void {
    if (monitor) {
      this.selectedMonitor = monitor;
      this.monitorForm = { ...monitor };
    } else {
      this.selectedMonitor = null;
      this.monitorForm = {
        name: '',
        description: '',
        type: 'http',
        url: '',
        hostname: '',
        port: 80,
        interval: 2,
        timeout: 10,
        maxRetries: 3,
        expectedCode: 200,
        expectedString: ''
      };
    }
    this.showModal = true;
  }

  public closeModal(): void {
    this.showModal = false;
    this.selectedMonitor = null;
  }

  public saveMonitor(): void {
    if (!this.monitorForm.name || (!this.monitorForm.url && !this.monitorForm.hostname)) {
      alert('Inserisci un nome e un URL o Hostname valido!');
      return;
    }

    if (this.selectedMonitor) {
      this.monitorService.updateMonitor(this.selectedMonitor.id, this.monitorForm).subscribe({
        next: () => {
          this.closeModal();
          this.refreshAll();
        },
        error: (err) => alert('Errore durante l\'aggiornamento del monitor: ' + err.message)
      });
    } else {
      this.monitorService.createMonitor(this.monitorForm).subscribe({
        next: (created) => {
          this.closeModal();
          this.refreshAll();
          // Avvia subito un primo controllo manuale
          this.triggerCheck(created.id);
        },
        error: (err) => alert('Errore durante la creazione del monitor: ' + err.message)
      });
    }
  }

  public triggerCheck(id: number): void {
    const checkingState = { ...this.isChecking() };
    checkingState[id] = true;
    this.isChecking.set(checkingState);

    this.monitorService.runCheck(id).subscribe({
      next: () => {
        const state = { ...this.isChecking() };
        state[id] = false;
        this.isChecking.set(state);
        this.refreshAll();
        if (this.selectedMonitor && this.selectedMonitor.id === id) {
          this.openDetail(this.selectedMonitor);
        }
      },
      error: (err) => {
        const state = { ...this.isChecking() };
        state[id] = false;
        this.isChecking.set(state);
        alert('Errore durante il controllo manuale: ' + err.message);
      }
    });
  }

  public togglePause(monitor: Monitor): void {
    const newStatus = monitor.status === 'PAUSED' ? 'PENDING' : 'PAUSED';
    this.monitorService.updateMonitor(monitor.id, { status: newStatus, isActive: newStatus !== 'PAUSED' }).subscribe({
      next: () => this.refreshAll(),
      error: (err) => alert('Errore durante l\'aggiornamento dello stato: ' + err.message)
    });
  }

  public deleteMonitor(id: number): void {
    if (confirm('Sei sicuro di voler eliminare questo monitor e il suo storico?')) {
      this.monitorService.deleteMonitor(id).subscribe({
        next: () => this.refreshAll(),
        error: (err) => alert('Errore durante l\'eliminazione del monitor: ' + err.message)
      });
    }
  }

  public openDetail(monitor: Monitor): void {
    this.selectedMonitor = monitor;
    this.showDetailModal = true;
    this.monitorService.getChecks(monitor.id).subscribe({
      next: (checks) => this.monitorChecks.set(checks),
      error: (err) => console.error('Errore recupero storico controlli:', err)
    });
  }

  public closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedMonitor = null;
  }
}
