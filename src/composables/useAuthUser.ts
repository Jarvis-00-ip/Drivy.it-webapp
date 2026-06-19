import { ref } from 'vue'
import { auth, db } from '@/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'

// Stato globale reattivo
const userRole = ref<string | null>(null)
const userData = ref<any>(null)
const isLoadingAuth = ref(true)

export function useAuthUser() {
  return {
    userRole,
    userData,
    isLoadingAuth
  }
}

// Inizializza l'ascoltatore di stato solo una volta
let authInitialized = false
let authResolve: any
export const authReady = new Promise(resolve => { authResolve = resolve })

let unsub: (() => void) | null = null;

onAuthStateChanged(auth, async (user) => {
  if (user) {
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
        if (user.email === 'pietrocurcio2000@gmail.com') {
          role = 'super_admin'
        }
        
        userData.value = data
        userRole.value = role
      } else {
        userData.value = null
        userRole.value = user.email === 'pietrocurcio2000@gmail.com' ? 'super_admin' : 'student' // Default se il doc non esiste
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
    isLoadingAuth.value = false
    if (!authInitialized) {
      authInitialized = true
      authResolve()
    }
  }
})
