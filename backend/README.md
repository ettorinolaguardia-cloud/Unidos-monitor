# Unidos - Backend API (NestJS)

Backend API dell'applicazione **Unidos**, sviluppato con NestJS, TypeORM e PostgreSQL.

---

## 🗄️ Configurazione Database (PostgreSQL)

Configurazione definita in `src/app.module.ts`:

- **DBMS**: PostgreSQL
- **Host**: `localhost`
- **Porta**: `5432`
- **Nome Database**: `unidos`
- **Username**: `postgres`
- **Password**: `unidos2026`

---

## 🔑 Credenziali Utenti di Test (Generati Automaticamente)

All'avvio del backend, le seguenti credenziali vengono create/verificate nel database:

- **Ettorino La Guardia**: `ettorino.laguardia@unidos.it` / `admin` *(Developer)*
- **Andrea Salvatore**: `andrea.salvatore@unidos.it` / `andrea2026` *(Developer)*
- **Flavio Mastrangelo**: `flavio.mastrangelo@unidos.it` / `flavio2026` *(Developer)*
- **Mario Rossi**: `mario.rossi@gmail.com` / `mario2026` *(Client)*

---

## 🚀 Avvio del Backend

```bash
# 1. Installazione dipendenze
npm install

# 2. Avvio in modalità sviluppo
npm run start:dev
```

Server attivo su `http://localhost:3000`.
