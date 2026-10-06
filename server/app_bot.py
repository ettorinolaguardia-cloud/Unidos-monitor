import os
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
import telebot
import urllib.request

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "8516382048:AAHzLx_YmQ7vPv5XiSZs7h3XSjads0O83xY")
CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", None)

bot = telebot.TeleBot(TOKEN)

server_instance = None
server_running = False
richieste_totali = 0
ultima_notifica_tempo = 0

# Variabili di simulazione anomalie
simula_errore_500 = False
simula_latenza = False
tempo_latenza = 0

class SandboxServerHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        global richieste_totali, ultima_notifica_tempo, CHAT_ID, simula_errore_500, simula_latenza, tempo_latenza
        richieste_totali += 1

        # 1. Simulazione Latenza / Timeout
        if simula_latenza:
            time.sleep(tempo_latenza)

        # 2. Simulazione Errore Server 500
        if simula_errore_500:
            self.send_response(500)
            self.send_header("Content-type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(b"<h1>500 Internal Server Error (Simulato)</h1>")
            return

        # 3. Risposta Standard OK 200
        self.send_response(200)
        self.send_header("Content-type", "text/html; charset=utf-8")
        self.end_headers()
        html = (
            "<html><head><title>Server di Test</title></head>"
            "<body style='font-family: sans-serif; text-align: center; padding-top: 50px; background-color: #f4f6f9;'>"
            "<h1 style='color: #2c3e50;'>Ambiente di Analisi Traffico</h1>"
            "<p>Stato attuale: <span style='color: #27ae60; font-weight: bold;'>ATTIVO</span></p>"
            "</body></html>"
        )
        self.wfile.write(bytes(html, "utf-8"))

        # Notifica automatica picco traffico su Telegram
        tempo_attuale = time.time()
        if richieste_totali >= 10 and (tempo_attuale - ultima_notifica_tempo) > 10:
            if CHAT_ID:
                try:
                    bot.send_message(CHAT_ID, f"⚠️ Rilevato picco di {richieste_totali} richieste sul server di test!")
                    richieste_totali = 0
                    ultima_notifica_tempo = tempo_attuale
                except Exception as e:
                    print("Errore notifica:", e)

def avvia_http():
    global server_instance, server_running
    server_instance = HTTPServer(("0.0.0.0", 5000), SandboxServerHandler)
    server_running = True
    server_instance.serve_forever()

# --- COMANDI TELEGRAM ---

@bot.message_handler(commands=['start', 'aiuto'])
def comando_start(message):
    global CHAT_ID
    CHAT_ID = message.chat.id
    menu = (
        "🛠️ **PANNELLO CONTROLLO & TEST MONITOR**\n\n"
        "🟢 **Gestione Base:**\n"
        "/accendi - Avvia il server su http://192.168.5.216:5000\n"
        "/spegni - Arresta il server (simula DOWN)\n"
        "/stato - Mostra statistiche e stato\n\n"
        "⚠️ **Simulazione Anomalie:**\n"
        "/errore500 - Attiva/Disattiva risposte HTTP 500\n"
        "/lag - Attiva latenza di 12 secondi (Timeout)\n"
        "/ripristina - Riporta tutti i valori a 200 OK normale\n\n"
        "⚡ **Stress Test:**\n"
        "/stress - Invia 50 richieste rapide consecutive"
    )
    bot.reply_to(message, menu, parse_mode="Markdown")

@bot.message_handler(commands=['accendi'])
def comando_accendi(message):
    global server_running
    if not server_running:
        t = threading.Thread(target=avvia_http, daemon=True)
        t.start()
        bot.reply_to(message, "🚀 Server ACCESO su http://192.168.5.216:5000 (porta 5000).")
    else:
        bot.reply_to(message, "⚠️ Il server è già acceso.")

@bot.message_handler(commands=['spegni'])
def comando_spegni(message):
    global server_instance, server_running
    if server_running and server_instance:
        server_instance.shutdown()
        server_instance.server_close()
        server_running = False
        bot.reply_to(message, "🛑 Server SPENTO. Il monitor passerà a DOWN!")
    else:
        bot.reply_to(message, "⚠️ Il server è già spento.")

@bot.message_handler(commands=['errore500'])
def comando_errore500(message):
    global simula_errore_500
    simula_errore_500 = not simula_errore_500
    stato = "ATTIVO (Risposte 500)" if simula_errore_500 else "DISATTIVATO (Risposte 200 OK)"
    bot.reply_to(message, f"⚠️ Errore 500: {stato}")

@bot.message_handler(commands=['lag'])
def comando_lag(message):
    global simula_latenza, tempo_latenza
    simula_latenza = not simula_latenza
    tempo_latenza = 12 if simula_latenza else 0
    stato = "ATTIVA (12s ritardo)" if simula_latenza else "DISATTIVATA"
    bot.reply_to(message, f"⏳ Simulazione Latenza/Timeout: {stato}")

@bot.message_handler(commands=['ripristina'])
def comando_ripristina(message):
    global simula_errore_500, simula_latenza, tempo_latenza
    simula_errore_500 = False
    simula_latenza = False
    tempo_latenza = 0
    bot.reply_to(message, "✅ Parametri ripristinati a 200 OK normale.")

@bot.message_handler(commands=['stress'])
def comando_stress(message):
    bot.reply_to(message, "⚡ Avvio Stress Test (50 richieste in corso)...")
    def bombardamento():
        for _ in range(50):
            try:
                urllib.request.urlopen("http://127.0.0.1:5000", timeout=2)
            except Exception:
                pass
        bot.send_message(message.chat.id, "✅ Stress test completato! Usa /stato per verificare il carico.")
    threading.Thread(target=bombardamento, daemon=True).start()

@bot.message_handler(commands=['stato'])
def comando_stato(message):
    global server_running, richieste_totali, simula_errore_500, simula_latenza
    stato_srv = "ATTIVO 🟢" if server_running else "SPENTO 🔴"
    dettagli = (
        f"📊 **RESOCONTO SERVER**:\n"
        f"• Stato: {stato_srv}\n"
        f"• Richieste totali: {richieste_totali}\n"
        f"• Modalità Errore 500: {'Attiva 🔴' if simula_errore_500 else 'Disattiva 🟢'}\n"
        f"• Modalità Latenza/Timeout: {'Attiva ⏳' if simula_latenza else 'Disattiva 🟢'}"
    )
    bot.reply_to(message, dettagli, parse_mode="Markdown")

if __name__ == "__main__":
    print("Bot avviato con controlli avanzati...")
    bot.infinity_polling()