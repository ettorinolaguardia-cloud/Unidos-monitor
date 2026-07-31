# 🚀 Unidos - Piattaforma di Monitoraggio e Gestione Utenti

Unidos è una piattaforma full-stack per il monitoraggio di servizi, la gestione degli incidenti, il tracciamento delle sessioni e la gestione degli utenti in tempo reale.

---

## 🛠️ Architettura e Tecnologie

- **Frontend**: [Angular 22](https://angular.dev/) (Tailwind CSS v4, RxJS, Vitest)
- **Backend**: [NestJS](https://nestjs.com/) (TypeORM, Express, Class Validator)
- **Database**: [PostgreSQL](https://www.postgresql.org/)

---

## 🗄️ Configurazione Database (PostgreSQL)

L'applicazione si collega a una fonte dati PostgreSQL tramite TypeORM. All'avvio del backend, le tabelle e gli account di default vengono creati/sincronizzati automaticamente.

- **DBMS**: PostgreSQL
- **Host**: `localhost`
- **Porta**: `5432`
- **Nome Database**: `unidos`
- **Username**: `postgres`
- **Password**: `unidos2026`

> **Nota**: Assicurarsi che PostgreSQL sia in esecuzione sulla porta `5432` e che il database `unidos` sia stato creato prima di avviare il backend (es. tramite pgAdmin o command line `CREATE DATABASE unidos;`).

---

## 🔑 Credenziali Utenti Predefinite (Seed Accounts)

All'avvio del backend, vengono creati/verificati automaticamente i seguenti account di test nel database:

| Nome | Email | Password | Ruolo |
| :--- | :--- | :--- | :--- |
| **Ettorino La Guardia** | `ettorino.laguardia@unidos.it` | `admin` | Developer |
| **Andrea Salvatore** | `andrea.salvatore@unidos.it` | `andrea2026` | Developer |
| **Flavio Mastrangelo** | `flavio.mastrangelo@unidos.it` | `flavio2026` | Developer |
| **Mario Rossi** | `mario.rossi@gmail.com` | `mario2026` | Client |

---

## ⚙️ Variabili d'Ambiente (`backend/.env`)

Il backend include un file `.env` situato in `backend/.env` per la configurazione dei servizi esterni (es. integrazione notifiche WhatsApp via Twilio):

```env
TWILIO_API_KEY_SID=SK0b4e8175416cd452ab3423a29b34fd90
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=+14155238886
```

---

## 📥 Guida di Installazione e Avvio

### 1. Prerequisiti
- **Node.js** (v18+ consigliata)
- **npm**
- **PostgreSQL** in esecuzione su `localhost:5432`

---

### 2. Installazione delle Dipendenze

#### Frontend (cartella radice):
```bash
npm install
```

#### Backend (cartella `backend`):
```bash
cd backend
npm install
cd ..
```

---

### 3. Avvio dell'Applicazione

#### Passo A: Avviare il Backend (NestJS)
In un terminale dedicato:
```bash
cd backend
npm run start:dev
```
- Il backend si avvierà all'indirizzo: `http://localhost:3000`
- Al primo avvio, NestJS eseguirà la sincronizzazione del DB e la creazione automatica degli utenti predefiniti.

#### Passo B: Avviare il Frontend (Angular)
In un altro terminale (dalla radice del progetto):
```bash
npm start
```
- Il frontend si avvierà all'indirizzo: `http://localhost:4200`

---

## 🧪 Comandi Utili

### Frontend
- **Avvio server dev**: `npm start` o `ng serve`
- **Build di produzione**: `npm run build` o `ng build`
- **Esecuzione Test Unitari**: `npm test` o `ng test`

### Backend
- **Avvio in sviluppo (watch mode)**: `npm run start:dev`
- **Avvio in produzione**: `npm run start:prod`
- **Build backend**: `npm run build`
- **Esecuzione Test**: `npm test`
