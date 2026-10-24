import { ref } from 'vue'
import { auth, db } from '@/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'

// Stato globale reattivo
const userRole = ref<string | null>(null)
const userData = ref<any>(null)
const isLoadingAuth = ref(true)
// ID dell'autoscuola: per l'autoscuola è il proprio uid, per l'istruttore è il suo school_id
const schoolId = ref<string | null>(null)

export function useAuthUser() {
  return {
    userRole,
    userData,
    schoolId,
    isLoadingAuth
  }
}

// Super admin: esiste il documento platform_admins/{uid} (creato a mano dalla console Firebase).
// Le regole Firestore usano lo stesso controllo, quindi non è aggirabile dal browser.
async function checkSuperAdmin(uid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'platform_admins', uid))
    return snap.exists()
  } catch {
    return false
  }
}

// Inizializza l'ascoltatore di stato solo una volta
let authInitialized = false
let authResolve: any
export const authReady = new Promise(resolve => { authResolve = resolve })

let unsub: (() => void) | null = null;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const isSuperAdmin = await checkSuperAdmin(user.uid)
    const docRef = doc(db, 'users', user.uid)
    unsub = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        
        // Kill Switch: Controllo sospensione account
        if (data.isActive === false && data.role !== 'student') {
          alert("L'account della tua autoscuola è stato momentaneamente sospeso. Contatta l'amministrazione centrale per riattivare i servizi e sbloccare i tuoi allievi.")
          if (unsub) { unsub(); unsub = null; }
          await auth.signOut()
          window.location.href = '/signin'
          return
        }

        let role = data.role || 'student'
        if (isSuperAdmin) {
          role = 'super_admin'
        } else if (role === 'super_admin') {
          // Il campo role da solo non basta per essere super admin
          role = 'student'
        }
        
        userData.value = data
        userRole.value = role
        schoolId.value = role === 'instructor' ? (data.school_id || null) : user.uid
      } else {
        userData.value = null
        userRole.value = isSuperAdmin ? 'super_admin' : 'student' // Default se il doc non esiste
        schoolId.value = null
      }
      
      isLoadingAuth.value = false
      if (!authInitialized) {
        authInitialized = true
        authResolve()
      }
    }, (err) => {
      console.error('Errore nel recupero dati utente:', err)
      userRole.value = 'student'
      isLoadingAuth.value = false
      if (!authInitialized) {
        authInitialized = true
        authResolve()
      }
    })
  } else {
    if (unsub) {
      unsub()
      unsub = null
    }
    userRole.value = null
    userData.value = null
    schoolId.value = null
    isLoadingAuth.value = false
    if (!authInitialized) {
      authInitialized = true
      authResolve()
    }
  }
})
