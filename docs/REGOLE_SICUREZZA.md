# Regole di sicurezza Firestore

Il file `firestore.rules` decide chi può leggere e scrivere ogni dato del database.
Vale per **entrambe** le app (Web App gestionale e App Android), perché usano lo stesso progetto Firebase `scuolaguida-9a263`.

## Chi può fare cosa

| Chi | Cosa può fare |
| --- | --- |
| Super admin | Tutto. È super admin solo chi ha un documento `platform_admins/{uid}` (creato a mano dalla console). |
| Autoscuola (`school_admin`) | Vede e gestisce solo i propri allievi, istruttori, lezioni, codici invito, chat e notifiche. Se è sospesa (`isActive: false`) perde l'accesso. |
| Istruttore | Vede allievi e lezioni della propria scuola; crea e modifica le lezioni della scuola. |
| Allievo | Vede il proprio profilo, la propria scuola e le sue lezioni. Si prenota o si cancella solo per sé stesso. Non può cambiare ruolo, scuola, crediti o ban. |
| Chiunque abbia fatto l'accesso | Legge teoria, community e profili pubblici (`public_profiles`). |
| Chi non ha fatto l'accesso | Niente. |

Tutto ciò che non è elencato in `firestore.rules` è vietato.

## Codici invito

L'ID del documento in `invitation_codes` è il codice stesso (es. `invitation_codes/R81U6O`).
Chi conosce il codice può leggerlo e riscattarlo (salvando `used_by` = il proprio uid);
nessuno può elencare i codici delle altre scuole. Il profilo utente può ricevere `school_id`
o il ruolo `instructor` solo se contiene `invitation_code_id` di un codice riscattato da lui.

## Test

I test girano sull'emulatore locale, mai sul database vero (serve Java):

```bash
cd firestore-tests
npm install
npm test
```

Girano anche in automatico su ogni PR che tocca le regole.

## Pubblicazione (da fare solo con l'ok di Dido)

Il deploy automatico su `main` pubblica solo l'hosting, **non** le regole. Passi:

1. Unire anche la PR dell'App Android con le correzioni compatibili, e distribuire l'app aggiornata.
2. Console Firebase → Authentication: copiare l'UID di `pietrocurcio2000@gmail.com`.
3. Console Firebase → Firestore: creare la collezione `platform_admins` con un documento il cui ID è quell'UID (un campo qualsiasi, es. `email`).
4. Pubblicare regole e indici: `firebase deploy --only firestore:rules,firestore:indexes`.
5. I vecchi codici invito (con ID casuale) non funzionano più: rigenerarli dalla Web App.

Per tornare indietro: Console Firebase → Firestore → Regole → cronologia, e ripristinare la versione precedente.
