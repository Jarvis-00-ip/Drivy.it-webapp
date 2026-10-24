# Diario frontend

Qui scriviamo tutto quello che facciamo noi (grafica, frontend e ogni modifica tecnica fatta da noi). Le voci più recenti stanno in cima. Il diario di Pietro è in `docs/BACKEND.md`.

## 2026-10-24 — Stop alle lezioni finte nel calendario

- Ramo / Pull Request: `claude/project-thread-bh4035` / [#2](https://github.com/Jarvis-00-ip/Drivy.it-webapp/pull/2)
- Cosa è stato fatto e perché: ogni volta che si apriva il calendario, se la scuola aveva 10 lezioni o meno, l'app scriveva da sola circa 40 lezioni finte nel database (anche sul sito online). Ora il calendario non crea più lezioni finte all'apertura, il pulsante "Genera Dati Test" si vede solo in sviluppo locale (`npm run dev`) e la funzione che genera i dati finti non fa nulla nella versione online. Era urgente perché scriveva dati sbagliati nel database vero.
- File toccati: `src/components/CalendarComponent.vue`, `src/utils/mockLessons.ts`
- Cosa deve provare Pietro: con `npm run build` + `npm run preview` (o sul sito dopo il merge), aprire il calendario di una scuola con poche lezioni e verificare che non compaiano lezioni nuove e che il pulsante "Genera Dati Test" non ci sia. Con `npm run dev` il pulsante deve esserci.
- Domande o richieste per Pietro (backend): (1) le lezioni finte già create restano in Firestore: vuoi cancellarle tu o preferisci che prepariamo uno script? (2) In locale si usa lo stesso progetto Firebase della produzione (scuolaguida-9a263), quindi "Genera Dati Test" in locale scrive comunque nel database vero: valuti un progetto Firebase separato o l'emulatore per lo sviluppo?
