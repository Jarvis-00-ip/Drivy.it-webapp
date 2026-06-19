# Drivy.it Webapp - Architecture & Guidelines for AI Instances

Questo documento è stato generato automaticamente per fornire a future istanze AI (su questo o altri PC) una mappa completa dell'architettura, delle scelte di design e dello schema database del progetto Drivy.it Webapp.

## Scopo del Progetto
**Drivy.it Webapp** è il portale B2B per la Segreteria (Autoscuola) e l'amministrazione centrale (Super Admin). Si interfaccia con la stessa base dati Firebase dell'App Mobile (dedicata ad Allievi e Istruttori). 

## Stack Tecnologico
- **Frontend Framework**: Vue.js 3 (Composition API, `<script setup>`)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v3/v4 con colori custom (es. `brand-500` = Neon Lime `#ccff00`)
- **Backend/DB**: Firebase (Authentication, Firestore, Hosting)
- **Architettura DB**: Serverless / No backend custom (Logica gestita via client Firestore)

---

## 1. Sicurezza e RBAC (Role-Based Access Control)
Nel database Firestore, la collezione `users` ha un campo stringa obbligatorio chiamato `role`.

I ruoli possibili sono:
- `student`: Accesso **NEGATO** alla Web App (viene intercettato dal router Vue e da `useAuthUser.ts` e rimbalzato).
- `instructor`: Può accedere alla Web App ma NON alla dashboard amministrativa (rimbalzato a `/calendar` e `/profile`). Sull'App Mobile vede solo la gestione delle proprie guide.
- `school_admin`: Il ruolo principale per la Web App. Può gestire studenti, crediti, guide e istruttori della propria scuola.
- `super_admin`: L'amministratore del sistema. Può accedere alla rotta `/platform` per gestire le autoscuole.

## 2. Collezione Firestore: `users`
Ogni utente loggato tramite Firebase Auth ha un documento in `users/{uid}`.

**Campi per `school_admin` (Autoscuole)**:
- `isActive`: (boolean) **Kill Switch**. Se impostato a `false` (dal Super Admin in `/platform`), l'autoscuola è bloccata sulla Web App e sull'App Mobile i suoi studenti scalano al piano Freemium.
- `name`, `email`: Informazioni di base.

**Campi per `student` (Allievi)**:
- `school_id`: L'ID (`uid` del `school_admin`) a cui sono iscritti.
- `guide_credits`: (number) Crediti attuali (Wallet). Usati per prenotare le lezioni pratiche. La segreteria può ricaricarli via `StudentStatsModal.vue`.
- `pink_slip_issue_date`: Data rilascio foglio rosa (scade in automatico dopo 1 anno in Italia).
- `medical_cert_expiry`: Scadenza certificato medico.

**Campi per `instructor` (Istruttori)**:
- `school_id`: L'ID (`uid` del `school_admin`) per cui lavorano. Sull'App Mobile visualizzeranno solo le lezioni associate a questo `school_id`.

## 3. Collezione Firestore: `lessons`
Contiene gli slot delle lezioni di guida (e teoria).

- `school_id`: Riferimento all'autoscuola.
- `start_time` / `end_time`: Timestamp di inizio e fine.
- `max_students`: Numero massimo di allievi ammessi.
- `pending_students`: Array di oggetti (es. `{ id: '...', name: '...' }`) degli studenti che hanno richiesto la guida ma non sono ancora confermati.
- `booked_students`: Array degli studenti confermati.
- **Logica Approvazione**: Sulla Web App (`CalendarComponent.vue`), c'è una funzione `approveAllPending` che sposta gli allievi da `pending` a `booked` massivamente se c'è posto.

## 4. Collezione Firestore: `invitation_codes`
Contiene i codici usati per registrare nuovi utenti e legarli automaticamente a una scuola e a un ruolo specifico.

- `code`: Stringa alfanumerica di 6 caratteri.
- `school_id`: L'autoscuola che lo ha generato.
- `role`: (Opzionale) Se specificato come `instructor`, l'utente che usa questo codice verrà creato come `instructor` invece che `student`.
- `is_active`: (boolean) Se il codice è ancora utilizzabile o è stato bruciato.

## 5. Collezione Firestore: `chats` (Sottocollezione `messages`)
Contiene i messaggi in real-time tra l'Autoscuola e un Allievo.

- **Struttura ID**: I documenti root della collezione `chats` usano come ID la composizione `${studentId}_${schoolId}`.
- All'interno c'è una sottocollezione `messages`.
- **Campi dei Messaggi**:
  - `text`: Il contenuto.
  - `sender`: "student" o "school".
  - `timestamp`: Firebase ServerTimestamp per ordinamento chronologico ASC.

---

## Moduli Principali Front-end (Web App)
- `src/composables/useAuthUser.ts`: Gestisce l'Auth Firebase, mappa i ruoli e gestisce il Kill Switch tramite `onSnapshot` su `users/{uid}`.
- `src/router/index.ts`: Protezione rotte (Route Guards). Se un `student` cerca di entrare, `auth.signOut()` scatta. Se un `instructor` cerca di vedere la gestione staff, rimbalza al calendario.
- `src/views/Dashboard.vue` e `src/components/DashboardStats.vue`: Analitica (Conteggio Allievi, Guide odierne, Richieste in sospeso).
- `src/views/StaffManagement.vue` e `src/components/CodesManager.vue`: Generazione codici d'invito rispettivamente per Istruttori (`role: instructor`) e Studenti.
- `src/components/CalendarComponent.vue`: Calendario fullcalendar per le lezioni, con modale (`LessonModal.vue`) per creare/modificare e bottone approvazione massiva.
- `src/views/PlatformManagement.vue`: Pannello Super Admin per abilitare o disabilitare le autoscuole (`isActive`).

---
**NOTA PER L'IA**: Quando riprendi in mano questo progetto, rispetta le palette cromatiche di Tailwind (`brand-500` è chiaro, quindi i testi sopra di esso devono essere `text-black` o `text-gray-900`), e mantieni la filosofia Serverless (lavoriamo senza backend node.js custom, tutto si fa chiamando e strutturando bene i dati su Firestore).
