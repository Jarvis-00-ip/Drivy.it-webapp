# Drivy.it Webapp

Portale web B2B di Drivy.it per le autoscuole. Lo usano:

- **Segreteria dell'autoscuola** (`school_admin`): allievi, crediti guida, calendario lezioni, staff e codici d'invito.
- **Istruttori** (`instructor`): calendario e profilo.
- **Super Admin** (`super_admin`): pannello `/platform` per abilitare o disabilitare le autoscuole.

Gli allievi non accedono alla webapp: usano l'app mobile, che condivide lo stesso progetto Firebase.

## Stack

- Vue 3 (Composition API, `<script setup>`) + TypeScript
- Vite
- Tailwind CSS 4 (layout di partenza: template TailAdmin Vue)
- Firebase: Authentication, Firestore, Hosting (progetto `scuolaguida-9a263`)

Non c'è un backend dedicato: tutta la logica gira nel client e legge/scrive direttamente su Firestore.

## Avvio in locale

Serve Node.js 22.

```bash
npm ci
npm run dev        # server di sviluppo su http://localhost:5173
```

Altri comandi:

```bash
npm run build      # type-check + build di produzione in dist/
npm run preview    # serve la build di produzione in locale
npm run lint       # ESLint con fix automatico
npm run format     # Prettier su src/
```

> La configurazione Firebase è in `src/firebase.ts` e punta al progetto reale: in locale si lavora sui dati veri.

## Struttura

```
src/
  router/index.ts          rotte (caricate su richiesta) e controllo accessi per ruolo
  composables/useAuthUser.ts  stato utente, ruolo e "kill switch" della scuola
  views/                   pagine: Dashboard, Calendario, Profilo, Staff, Piattaforma, Login
  components/              calendario, lezioni, allievi, chat, codici d'invito, layout
  firebase.ts              inizializzazione Firebase
```

Rotte principali:

| Rotta       | Pagina                  | Accesso                       |
|-------------|-------------------------|-------------------------------|
| `/signin`   | Login                   | solo utenti non loggati       |
| `/`         | Dashboard               | school_admin, super_admin     |
| `/calendar` | Calendario guide        | tutti i ruoli staff           |
| `/profile`  | Profilo autoscuola      | tutti i ruoli staff           |
| `/staff`    | Gestione staff e codici | school_admin, super_admin     |
| `/platform` | Gestione piattaforma    | super_admin (*)               |

(*) Il link compare solo ai super_admin, ma oggi il router blocca solo gli istruttori: un school_admin che digita l'URL può aprire la pagina.

Non esiste una registrazione pubblica: gli account vengono creati tramite codici d'invito.

Schema del database, ruoli e scelte architetturali sono descritti in [AI_ARCHITECTURE_README.md](./AI_ARCHITECTURE_README.md).

## Deploy

Ogni push su `main` esegue la GitHub Action `.github/workflows/firebase-hosting-merge.yml`, che fa la build e pubblica su Firebase Hosting (canale `live`). Non serve deploy manuale.
