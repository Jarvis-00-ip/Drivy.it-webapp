<template>
  <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
      <div>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Codici di Invito</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">Genera i codici univoci da consegnare ai tuoi allievi.</p>
      </div>
      <button
        @click="generateCode"
        :disabled="isGenerating"
        class="mt-4 sm:mt-0 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-black transition hover:bg-brand-600 disabled:opacity-50"
      >
        <span v-if="isGenerating">Generazione...</span>
        <span v-else>Genera Nuovo Codice Invito</span>
      </button>
    </div>

    <!-- Table -->
    <div class="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-left text-sm">
          <thead class="bg-gray-50 dark:bg-white/[0.02]">
            <tr>
              <th class="px-5 py-4 font-medium text-gray-800 dark:text-white/90">Codice</th>
              <th class="px-5 py-4 font-medium text-gray-800 dark:text-white/90">Data Creazione</th>
              <th class="px-5 py-4 font-medium text-gray-800 dark:text-white/90">Stato</th>
              <th class="px-5 py-4 font-medium text-gray-800 dark:text-white/90 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-transparent">
            <tr v-if="codes.length === 0">
              <td colspan="4" class="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                Nessun codice generato.
              </td>
            </tr>
            <tr v-for="code in codes" :key="code.id" class="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
              <td class="px-5 py-4 font-medium text-gray-800 dark:text-white/90">
                <span class="rounded bg-gray-100 px-2.5 py-1 text-sm font-mono text-gray-800 dark:bg-gray-800 dark:text-white/90">
                  {{ code.code }}
                </span>
              </td>
              <td class="px-5 py-4 text-gray-500 dark:text-gray-400">
                {{ formatDate(code.created_at) }}
              </td>
              <td class="px-5 py-4">
                <span
                  v-if="code.is_active"
                  class="inline-flex rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-medium text-success-700 dark:bg-success-500/10 dark:text-success-400 border border-success-200 dark:border-success-800"
                >
                  Attivo
                </span>
                <span
                  v-else
                  class="inline-flex rounded-full bg-warning-50 px-2.5 py-0.5 text-xs font-medium text-warning-700 dark:bg-warning-500/10 dark:text-warning-400 border border-warning-200 dark:border-warning-800"
                >
                  Usato
                </span>
              </td>
              <td class="px-5 py-4 text-right">
                <button
                  @click="deleteCode(code.id)"
                  class="text-gray-400 hover:text-error-600 transition-colors dark:text-gray-500 dark:hover:text-error-500"
                  title="Elimina Codice"
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Errore degli indici Firestore -->
    <div v-if="indexError" class="mt-4 p-4 text-sm text-error-700 bg-error-50 rounded-lg dark:bg-error-500/10 dark:text-error-400">
      <p class="font-bold mb-1">Attenzione: Indice Firestore mancante.</p>
      <p>Per ordinare i risultati Firebase richiede un indice composto.</p>
      <a :href="indexErrorLink" target="_blank" class="underline hover:text-error-800 mt-2 block">
        Clicca qui per creare l'indice automaticamente nella console Firebase.
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { auth, db } from '@/firebase'
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore'

interface InvitationCode {
  id: string;
  code: string;
  school_id: string;
  created_at: any;
  is_active: boolean;
}

const codes = ref<InvitationCode[]>([])
const isGenerating = ref(false)
const indexError = ref(false)
const indexErrorLink = ref('')

let unsubscribe: (() => void) | null = null

const generateRandomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

const generateCode = async () => {
  const user = auth.currentUser
  if (!user) return

  isGenerating.value = true
  try {
    const newCode = generateRandomCode()
    await addDoc(collection(db, 'invitation_codes'), {
      code: newCode,
      school_id: user.uid,
      created_at: serverTimestamp(),
      is_active: true
    })
  } catch (error) {
    console.error('Error generating code:', error)
    alert('Errore durante la generazione del codice.')
  } finally {
    isGenerating.value = false
  }
}

const deleteCode = async (id: string) => {
  if (confirm("Sei sicuro di voler eliminare questo codice di invito?")) {
    try {
      await deleteDoc(doc(db, 'invitation_codes', id))
    } catch(e) {
      console.error(e)
      alert("Errore durante l'eliminazione.")
    }
  }
}

const formatDate = (timestamp: any) => {
  if (!timestamp) return '...'
  const date = timestamp.toDate()
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

onMounted(() => {
  const user = auth.currentUser
  if (!user) return

  const q = query(
    collection(db, 'invitation_codes'),
    where('school_id', '==', user.uid),
    orderBy('created_at', 'desc')
  )

  unsubscribe = onSnapshot(q, (snapshot) => {
    indexError.value = false // reset error state on success
    const loadedCodes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as InvitationCode))
    
    // Ordina in memoria: prima gli attivi, poi per data
    loadedCodes.sort((a, b) => {
      if (a.is_active === b.is_active) {
        const timeA = a.created_at?.toMillis() || 0
        const timeB = b.created_at?.toMillis() || 0
        return timeB - timeA
      }
      return a.is_active ? -1 : 1
    })

    codes.value = loadedCodes
  }, (error) => {
    console.error("Error fetching codes: ", error.message)
    // Firestore provides a handy link in the error message to build the composite index
    if (error.message.includes('FAILED_PRECONDITION')) {
      const urlMatch = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]*/)
      if (urlMatch) {
        indexError.value = true
        indexErrorLink.value = urlMatch[0]
      }
    }
  })
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})
</script>
