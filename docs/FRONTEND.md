# Diario frontend

Qui annotiamo tutto il lavoro di grafica, frontend e ogni modifica tecnica fatta da noi.
Il diario del backend è `docs/BACKEND.md` (lo scrive Pietro).

## 2026-10-24 — Pulizia del template e app più leggera

- **Ramo / Pull Request:** `claude/project-thread-f4vbi1` · [PR #1](https://github.com/Jarvis-00-ip/Drivy.it-webapp/pull/1)
- **Cosa è stato fatto e perché:**
  - Tolta la pagina di registrazione del template (`Signup.vue`): non era collegata a nessuna rotta e non salvava nulla. Gli account si creano con i codici d'invito. Tolto anche il link "Sign Up" dal login, che portava a una pagina inesistente.
  - Sostituito il README di TailAdmin con uno vero sul progetto; tolta `banner.png` del template.
  - Nome del pacchetto da `tailadmin-vue-pro-2.0.1` a `drivy-it-webapp`; tolta la frase del template nel pannello del login.
  - App più leggera all'avvio: il JavaScript iniziale passa da 1,2 MB a circa 590 kB. I grafici (ApexCharts) ora si caricano solo quando si apre la scheda statistiche di un allievo; Firebase Analytics si carica dopo l'avvio; tolto Firebase Storage perché non usato; tolti i CSS di Swiper (non usato); Firebase e Vue in file separati, così il browser li tiene in cache tra un aggiornamento e l'altro.
- **File toccati:** `README.md`, `banner.png` (rimosso), `src/views/Auth/Signup.vue` (rimosso), `src/views/Auth/Signin.vue`, `src/main.ts`, `src/firebase.ts`, `src/components/StudentStatsModal.vue`, `vite.config.ts`, `package.json`, `package-lock.json`, `docs/FRONTEND.md`.
- **Cosa deve provare Pietro:**
  - `npm ci && npm run build` passa.
  - Login e logout funzionano; nella pagina di login non c'è più il link "Sign Up".
  - Dashboard → lista allievi → apri le statistiche di un allievo: i due grafici (torta e linea) compaiono correttamente.
  - In Firebase Analytics gli eventi continuano ad arrivare.
- **Domande o richieste per Pietro (backend):**
  - `firebase.ts` non esporta più `storage`. Se in futuro serve Firebase Storage va riaggiunto lì.
  - Sicurezza: il router blocca solo gli istruttori dalle pagine riservate. Un utente `school_admin` che scrive `/platform` nell'indirizzo apre il pannello del super admin (il link è solo nascosto nel menu). Non l'ho toccato qui: va sistemato insieme alle regole di sicurezza del database.
