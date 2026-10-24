// Test delle regole Firestore sull'emulatore locale (mai sul database vero).
// Avvio: cd firestore-tests && npm install && npm test   (serve Java installato)
import { readFileSync } from 'node:fs'
import { test, before, beforeEach, after } from 'node:test'
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing'
import {
  doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, collection,
  query, where, arrayUnion, arrayRemove, increment, deleteField, runTransaction,
  serverTimestamp, setLogLevel,
} from 'firebase/firestore'

const SCHOOL = 'schoolA'
const OTHER_SCHOOL = 'schoolB'

let env

before(async () => {
  setLogLevel('silent')
  env = await initializeTestEnvironment({
    projectId: 'demo-drivy',
    firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
  })
})

after(async () => {
  await env.cleanup()
})

// Dati finti di partenza, scritti senza regole.
beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'platform_admins/pietro'), { email: 'pietrocurcio2000@gmail.com' })
    await setDoc(doc(db, 'users/pietro'), { role: 'super_admin', email: 'pietrocurcio2000@gmail.com' })
    await setDoc(doc(db, `users/${SCHOOL}`), { role: 'school_admin', isActive: true, school_name: 'Autoscuola A' })
    await setDoc(doc(db, `users/${OTHER_SCHOOL}`), { role: 'school_admin', isActive: true, school_name: 'Autoscuola B' })
    await setDoc(doc(db, 'users/suspended'), { role: 'school_admin', isActive: false })
    await setDoc(doc(db, 'users/instrA'), { role: 'instructor', school_id: SCHOOL })
    await setDoc(doc(db, 'users/studA'), {
      role: 'student', school_id: SCHOOL, guide_credits: 5, documents: { id_card: 'data:...' },
    })
    await setDoc(doc(db, 'users/studB'), { role: 'student', school_id: OTHER_SCHOOL, guide_credits: 1 })
    await setDoc(doc(db, 'users/studA/quiz_results/q1'), { passed: true })
    await setDoc(doc(db, 'lessons/guida1'), {
      school_id: SCHOOL, type: 'guida', max_students: 1, booked_students: [], pending_students: [],
    })
    await setDoc(doc(db, 'lessons/lezione1'), {
      school_id: SCHOOL, type: 'lezione', max_students: 10, booked_students: [], pending_students: [],
    })
    await setDoc(doc(db, 'invitation_codes/STU123'), { code: 'STU123', school_id: SCHOOL, is_active: true })
    await setDoc(doc(db, 'invitation_codes/INS123'), {
      code: 'INS123', school_id: SCHOOL, is_active: true, role: 'instructor',
    })
    await setDoc(doc(db, 'notifications/n1'), { school_id: SCHOOL, student_uid: 'studA', read: false })
    await setDoc(doc(db, 'chats/studA_schoolA/messages/m1'), { text: 'ciao', sender: 'school' })
    await setDoc(doc(db, 'social_posts/p1'), {
      authorId: 'studB', upvotes: 14, upvotedBy: [], commentCount: 0, groupId: 'g_teoria',
    })
  })
})

const as = (uid) => env.authenticatedContext(uid).firestore()
const anon = () => env.unauthenticatedContext().firestore()

// ---------- Super admin ----------

test('solo chi ha il documento platform_admins è super admin', async () => {
  await assertSucceeds(updateDoc(doc(as('pietro'), `users/${SCHOOL}`), { isActive: false }))
  await assertFails(updateDoc(doc(as(OTHER_SCHOOL), `users/${SCHOOL}`), { isActive: false }))
  await assertSucceeds(getDoc(doc(as('pietro'), 'platform_admins/pietro')))
  await assertFails(getDoc(doc(as('studA'), 'platform_admins/pietro')))
  await assertFails(setDoc(doc(as('studA'), 'platform_admins/studA'), { x: 1 }))
})

test('nessuno può promuoversi cambiando il proprio ruolo', async () => {
  await assertFails(updateDoc(doc(as('studA'), 'users/studA'), { role: 'super_admin' }))
  await assertFails(updateDoc(doc(as('studA'), 'users/studA'), { role: 'school_admin' }))
  await assertFails(updateDoc(doc(as(SCHOOL), `users/${SCHOOL}`), { isActive: true, role: 'super_admin' }))
})

// ---------- Utenti ----------

test('chi non ha fatto l\'accesso non legge niente', async () => {
  await assertFails(getDoc(doc(anon(), 'users/studA')))
  await assertFails(getDoc(doc(anon(), 'lessons/guida1')))
})

test('un allievo legge il proprio profilo e quello della sua scuola, non gli altri allievi', async () => {
  await assertSucceeds(getDoc(doc(as('studA'), 'users/studA')))
  await assertSucceeds(getDoc(doc(as('studA'), `users/${SCHOOL}`)))
  await assertFails(getDoc(doc(as('studA'), 'users/studB')))
  await assertFails(getDoc(doc(as('studB'), 'users/studA')))
})

test('un allievo non cambia crediti, scuola o ban', async () => {
  const db = as('studA')
  await assertFails(updateDoc(doc(db, 'users/studA'), { guide_credits: 999 }))
  await assertFails(updateDoc(doc(db, 'users/studA'), { school_id: OTHER_SCHOOL }))
  await assertFails(updateDoc(doc(db, 'users/studA'), { bannedUntil: null }))
  await assertSucceeds(updateDoc(doc(db, 'users/studA'), { displayName: 'Mario', total_xp: increment(50) }))
  await assertSucceeds(setDoc(doc(db, 'users/studA'), { documents: { tax_code: 'data:...' } }, { merge: true }))
})

test('l\'autoscuola vede e gestisce solo i propri allievi', async () => {
  const db = as(SCHOOL)
  await assertSucceeds(getDocs(query(collection(db, 'users'), where('school_id', '==', SCHOOL))))
  await assertFails(getDocs(query(collection(db, 'users'), where('school_id', '==', OTHER_SCHOOL))))
  await assertFails(getDocs(collection(db, 'users')))
  await assertSucceeds(updateDoc(doc(db, 'users/studA'), { guide_credits: increment(3) }))
  await assertSucceeds(updateDoc(doc(db, 'users/studA'), { medical_cert_expiry: '2027-01-01' }))
  await assertSucceeds(getDocs(collection(db, 'users/studA/quiz_results')))
  await assertFails(updateDoc(doc(db, 'users/studB'), { guide_credits: increment(3) }))
  await assertFails(updateDoc(doc(db, 'users/studA'), { role: 'school_admin' }))
  await assertFails(updateDoc(doc(db, 'users/studA'), { school_id: OTHER_SCHOOL }))
  await assertSucceeds(updateDoc(doc(db, 'users/studA'), { school_id: deleteField(), associated_at: deleteField() }))
})

test('un\'autoscuola sospesa perde l\'accesso', async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'users/studS'), { role: 'student', school_id: 'suspended' })
  })
  await assertFails(getDoc(doc(as('suspended'), 'users/studS')))
})

test('l\'istruttore vede gli allievi della propria scuola', async () => {
  await assertSucceeds(getDoc(doc(as('instrA'), 'users/studA')))
  await assertFails(getDoc(doc(as('instrA'), 'users/studB')))
  await assertFails(updateDoc(doc(as('instrA'), 'users/studA'), { guide_credits: 100 }))
})

test('il pannello super admin elenca le autoscuole', async () => {
  await assertSucceeds(getDocs(query(collection(as('pietro'), 'users'), where('role', '==', 'school_admin'))))
  await assertSucceeds(getDocs(collection(as('pietro'), 'users')))
})

// ---------- Registrazione e codici invito ----------

test('registrazione semplice: solo come allievo senza scuola', async () => {
  await assertSucceeds(setDoc(doc(as('newbie'), 'users/newbie'), { email: 'a@b.it', role: 'student' }))
  await assertFails(setDoc(doc(as('evil'), 'users/evil'), { role: 'instructor', school_id: SCHOOL }))
  await assertFails(setDoc(doc(as('evil2'), 'users/evil2'), { role: 'student', guide_credits: 50 }))
  await assertFails(setDoc(doc(as('evil3'), 'users/evil3'), { role: 'super_admin' }))
})

test('registrazione con codice istruttore (come fa l\'app Android)', async () => {
  const db = as('newInstr')
  const codeRef = doc(db, 'invitation_codes/INS123')
  await assertSucceeds(runTransaction(db, async (tx) => {
    const snap = await tx.get(codeRef)
    tx.update(codeRef, { is_active: false, used_by: 'newInstr', used_at: serverTimestamp() })
    tx.set(doc(db, 'users/newInstr'), {
      email: 'i@b.it', role: snap.data().role, school_id: snap.data().school_id,
      invitation_code_id: 'INS123', associated_at: serverTimestamp(),
    }, { merge: true })
  }))
  // Il codice ora è bruciato: un secondo utente non può usarlo.
  await assertFails(updateDoc(doc(as('other'), 'invitation_codes/INS123'), { is_active: false, used_by: 'other' }))
  await assertFails(setDoc(doc(as('other'), 'users/other'), {
    role: 'instructor', school_id: SCHOOL, invitation_code_id: 'INS123',
  }))
})

test('un allievo esistente si collega a una scuola con un codice', async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'users/solo'), { role: 'student', email: 's@b.it' })
  })
  const db = as('solo')
  await assertFails(updateDoc(doc(db, 'users/solo'), { school_id: SCHOOL }))
  await assertSucceeds(runTransaction(db, async (tx) => {
    tx.update(doc(db, 'invitation_codes/STU123'), { is_active: false, used_by: 'solo' })
    tx.set(doc(db, 'users/solo'), {
      school_id: SCHOOL, invitation_code_id: 'STU123', associated_at: serverTimestamp(),
    }, { merge: true })
  }))
  // Un codice studente non dà il ruolo di istruttore.
  await assertFails(updateDoc(doc(db, 'users/solo'), { role: 'instructor' }))
})

test('i codici si leggono conoscendoli, ma non si possono elencare', async () => {
  await assertSucceeds(getDoc(doc(as('newbie'), 'invitation_codes/STU123')))
  await assertFails(getDocs(collection(as('newbie'), 'invitation_codes')))
  await assertFails(getDocs(query(collection(as('newbie'), 'invitation_codes'), where('is_active', '==', true))))
  await assertSucceeds(getDocs(query(collection(as(SCHOOL), 'invitation_codes'), where('school_id', '==', SCHOOL))))
  await assertFails(getDocs(query(collection(as(SCHOOL), 'invitation_codes'), where('school_id', '==', OTHER_SCHOOL))))
})

test('solo l\'autoscuola crea codici per sé stessa', async () => {
  await assertSucceeds(setDoc(doc(as(SCHOOL), 'invitation_codes/NEW001'), {
    code: 'NEW001', school_id: SCHOOL, is_active: true, role: 'instructor', created_at: serverTimestamp(),
  }))
  await assertFails(setDoc(doc(as(SCHOOL), 'invitation_codes/NEW002'), {
    code: 'NEW002', school_id: OTHER_SCHOOL, is_active: true,
  }))
  await assertFails(setDoc(doc(as('studA'), 'invitation_codes/NEW003'), {
    code: 'NEW003', school_id: SCHOOL, is_active: true,
  }))
  await assertFails(setDoc(doc(as(SCHOOL), 'invitation_codes/NEW004'), {
    code: 'NEW004', school_id: SCHOOL, is_active: true, role: 'school_admin',
  }))
})

// ---------- Lezioni ----------

test('le lezioni sono visibili solo alla propria scuola', async () => {
  await assertSucceeds(getDocs(query(collection(as('studA'), 'lessons'), where('school_id', '==', SCHOOL))))
  await assertSucceeds(getDocs(query(collection(as('instrA'), 'lessons'), where('school_id', '==', SCHOOL))))
  await assertFails(getDocs(query(collection(as('studB'), 'lessons'), where('school_id', '==', SCHOOL))))
  await assertFails(getDocs(collection(as('studA'), 'lessons')))
  await assertSucceeds(getDocs(query(collection(as(SCHOOL), 'lessons'),
    where('school_id', '==', SCHOOL), where('booked_students', 'array-contains', 'studA'))))
})

test('prenotazioni: l\'allievo aggiunge o toglie solo sé stesso', async () => {
  const db = as('studA')
  await assertSucceeds(updateDoc(doc(db, 'lessons/guida1'), { pending_students: arrayUnion('studA') }))
  await assertSucceeds(updateDoc(doc(db, 'lessons/lezione1'), { booked_students: arrayUnion('studA') }))
  await assertSucceeds(updateDoc(doc(db, 'lessons/lezione1'), { booked_students: arrayRemove('studA') }))
  // Non può auto-confermarsi una guida, né prenotare altri, né cambiare orari.
  await assertFails(updateDoc(doc(db, 'lessons/guida1'), { booked_students: arrayUnion('studA') }))
  await assertFails(updateDoc(doc(db, 'lessons/guida1'), { pending_students: arrayUnion('studX') }))
  await assertFails(updateDoc(doc(db, 'lessons/guida1'), { max_students: 99 }))
  await assertFails(updateDoc(doc(as('studB'), 'lessons/guida1'), { pending_students: arrayUnion('studB') }))
})

test('l\'autoscuola e i suoi istruttori gestiscono le lezioni', async () => {
  await assertSucceeds(addDoc(collection(as(SCHOOL), 'lessons'), { school_id: SCHOOL, type: 'guida' }))
  await assertSucceeds(addDoc(collection(as('instrA'), 'lessons'), { school_id: SCHOOL, type: 'guida' }))
  await assertFails(addDoc(collection(as(SCHOOL), 'lessons'), { school_id: OTHER_SCHOOL }))
  await assertFails(addDoc(collection(as('studA'), 'lessons'), { school_id: SCHOOL }))
  await assertSucceeds(updateDoc(doc(as(SCHOOL), 'lessons/guida1'), { booked_students: ['studA'] }))
  await assertFails(updateDoc(doc(as(OTHER_SCHOOL), 'lessons/guida1'), { booked_students: [] }))
  await assertFails(updateDoc(doc(as(SCHOOL), 'lessons/guida1'), { school_id: OTHER_SCHOOL }))
  await assertSucceeds(deleteDoc(doc(as(SCHOOL), 'lessons/lezione1')))
})

// ---------- Notifiche ----------

test('notifiche: l\'allievo scrive solo alla propria scuola, la scuola legge le sue', async () => {
  await assertSucceeds(addDoc(collection(as('studA'), 'notifications'), {
    school_id: SCHOOL, student_uid: 'studA', message: 'ciao', read: false, created_at: serverTimestamp(),
  }))
  await assertFails(addDoc(collection(as('studA'), 'notifications'), {
    school_id: OTHER_SCHOOL, student_uid: 'studA', read: false,
  }))
  await assertSucceeds(getDocs(query(collection(as(SCHOOL), 'notifications'), where('school_id', '==', SCHOOL))))
  await assertFails(getDocs(query(collection(as('studA'), 'notifications'), where('school_id', '==', SCHOOL))))
  await assertSucceeds(updateDoc(doc(as(SCHOOL), 'notifications/n1'), { read: true }))
  await assertFails(updateDoc(doc(as(SCHOOL), 'notifications/n1'), { message: 'x' }))
})

// ---------- Chat ----------

test('chat: solo l\'allievo e la sua scuola', async () => {
  await assertSucceeds(getDocs(collection(as('studA'), 'chats/studA_schoolA/messages')))
  await assertSucceeds(getDocs(collection(as(SCHOOL), 'chats/studA_schoolA/messages')))
  await assertFails(getDocs(collection(as('studB'), 'chats/studA_schoolA/messages')))
  await assertFails(getDocs(collection(as(OTHER_SCHOOL), 'chats/studA_schoolA/messages')))
  await assertSucceeds(addDoc(collection(as('studA'), 'chats/studA_schoolA/messages'), {
    senderId: 'studA', text: 'ciao', timestamp: Date.now(),
  }))
  await assertSucceeds(addDoc(collection(as(SCHOOL), 'chats/studA_schoolA/messages'), {
    sender: 'school', text: 'ciao', timestamp: serverTimestamp(),
  }))
  // L'allievo non può fingersi la scuola.
  await assertFails(addDoc(collection(as('studA'), 'chats/studA_schoolA/messages'), {
    sender: 'school', text: 'finto',
  }))
})

// ---------- Community e teoria ----------

test('profili pubblici: si leggono, ma ognuno scrive solo il proprio e solo campi innocui', async () => {
  await assertSucceeds(setDoc(doc(as('studA'), 'public_profiles/studA'), { displayName: 'Mario', shareStats: true }))
  await assertSucceeds(getDoc(doc(as('studB'), 'public_profiles/studA')))
  await assertFails(setDoc(doc(as('studB'), 'public_profiles/studA'), { displayName: 'Hack' }))
  await assertFails(setDoc(doc(as('studA'), 'public_profiles/studA'), { documents: {} }))
})

test('statistiche e dati personali visibili agli altri solo se condivisi', async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'users/studA/progress/p1'), { score: 10, total: 10 })
    await setDoc(doc(db, 'users/studA/profile/personal_data'), { age: '16', sharePersonalData: false })
  })
  await assertFails(getDocs(collection(as('studB'), 'users/studA/progress')))
  await assertFails(getDoc(doc(as('studB'), 'users/studA/profile/personal_data')))
  await setDoc(doc(as('studA'), 'public_profiles/studA'), { shareStats: true })
  await assertSucceeds(getDocs(collection(as('studB'), 'users/studA/progress')))
})

test('social: post a proprio nome e voto solo proprio', async () => {
  await assertSucceeds(addDoc(collection(as('studA'), 'social_posts'), {
    authorId: 'studA', title: 'x', upvotes: 0, upvotedBy: [], commentCount: 0,
  }))
  await assertFails(addDoc(collection(as('studA'), 'social_posts'), { authorId: 'studB', title: 'x' }))
  await assertSucceeds(updateDoc(doc(as('studA'), 'social_posts/p1'), { upvotes: 15, upvotedBy: ['studA'] }))
  await assertFails(updateDoc(doc(as('studA'), 'social_posts/p1'), { upvotes: 100 }))
  await assertFails(updateDoc(doc(as('studA'), 'social_posts/p1'), { groupId: 'g_bmw' }))
  await assertSucceeds(updateDoc(doc(as('pietro'), 'social_posts/p1'), { groupId: 'g_bmw' }))
})

test('teoria: tutti leggono, solo il super admin modifica', async () => {
  await assertSucceeds(getDocs(collection(as('studA'), 'teoria_patente')))
  await assertFails(setDoc(doc(as(SCHOOL), 'teoria_patente/c1'), { titolo: 'x' }))
  await assertSucceeds(setDoc(doc(as('pietro'), 'teoria_patente/c1'), { titolo: 'x' }))
})

test('le collezioni non previste sono bloccate', async () => {
  await assertFails(setDoc(doc(as('pietro'), 'random/x'), { a: 1 }))
  await assertFails(getDoc(doc(as('studA'), 'random/x')))
})
