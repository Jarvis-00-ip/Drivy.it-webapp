<template>
  <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6 flex flex-col">
    <div class="mb-6">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Allievi Iscritti</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400">Consulta l'anagrafica degli allievi associati alla tua autoscuola.</p>
    </div>

    <!-- Table -->
    <div class="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 flex-1">
      <div class="overflow-x-auto h-full">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-left text-sm">
          <thead class="bg-gray-50 dark:bg-white/[0.02]">
            <tr>
              <th class="px-5 py-4 font-medium text-gray-800 dark:text-white/90">Allievo</th>
              <th class="px-5 py-4 font-medium text-gray-800 dark:text-white/90">Data Associazione</th>
              <th class="px-5 py-4 font-medium text-gray-800 dark:text-white/90 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-transparent">
            <!-- Empty State -->
            <tr v-if="students.length === 0">
              <td colspan="3" class="px-5 py-12 text-center text-gray-500 dark:text-gray-400">
                <div class="flex flex-col items-center justify-center">
                  <svg class="mb-3 h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                  </svg>
                  <p class="font-medium text-gray-600 dark:text-gray-300">Nessun allievo ancora associato.</p>
                  <p class="mt-1 text-sm">Consegna un codice di invito per iniziare!</p>
                </div>
              </td>
            </tr>
            <!-- Student Rows -->
            <tr v-for="student in students" :key="student.id" class="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
              <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300 font-bold uppercase">
                    {{ student.displayName ? student.displayName.charAt(0) : (student.email ? student.email.charAt(0) : '?') }}
                  </div>
                  <div>
                    <p class="font-medium text-gray-800 dark:text-white/90">
                      {{ student.displayName || (student.firstName ? student.firstName + ' ' + (student.lastName || '') : '') || 'Nome non inserito' }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {{ student.email || 'Email non disponibile' }}
                      <span v-if="student.license" class="ml-1 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600 dark:bg-gray-800 dark:text-gray-400">Pat. {{ student.license }}</span>
                      <span v-if="isExpiring(student)" class="ml-2 inline-flex items-center gap-0.5 rounded bg-error-50 px-1.5 py-0.5 text-[10px] font-medium text-error-700 border border-error-200 dark:bg-error-500/10 dark:text-error-400 dark:border-error-800">
                        <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Scadenza!
                      </span>
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-5 py-4 text-gray-500 dark:text-gray-400">
                {{ formatDate(student.associated_at || student.created_at) }}
              </td>
              <td class="px-5 py-4 text-right">
                <button
                  @click="openStatsModal(student)"
                  class="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-white/90"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                  Statistiche
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modale Statistiche -->
    <StudentStatsModal :isOpen="isStatsModalOpen" :student="selectedStudent" @close="closeStatsModal" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { auth, db } from '@/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import StudentStatsModal from './StudentStatsModal.vue'

interface Student {
  id: string;
  email?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  license?: string;
  school_id: string;
  associated_at?: any;
  created_at?: any;
  last_login?: any;
  pink_slip_issue_date?: string;
  medical_cert_expiry?: string;
}

const students = ref<Student[]>([])
const isStatsModalOpen = ref(false)
const selectedStudent = ref<Student | undefined>(undefined)

let unsubscribe: (() => void) | null = null

const openStatsModal = (student: Student) => {
  selectedStudent.value = student
  isStatsModalOpen.value = true
}

const closeStatsModal = () => {
  isStatsModalOpen.value = false
  selectedStudent.value = undefined
}

const formatDate = (timestamp: any) => {
  if (!timestamp) return 'Data sconosciuta'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date)
}

const isExpiring = (student: Student) => {
  const now = new Date()
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000

  // Controlla Scadenza Certificato Medico
  if (student.medical_cert_expiry) {
    const medExpiry = new Date(student.medical_cert_expiry)
    if (medExpiry.getTime() - now.getTime() < thirtyDaysMs) return true
  }

  // Controlla Scadenza Foglio Rosa (Dura 1 anno)
  if (student.pink_slip_issue_date) {
    const issueDate = new Date(student.pink_slip_issue_date)
    const pinkSlipExpiry = new Date(issueDate)
    pinkSlipExpiry.setFullYear(pinkSlipExpiry.getFullYear() + 1)
    if (pinkSlipExpiry.getTime() - now.getTime() < thirtyDaysMs) return true
  }

  return false
}

onMounted(() => {
  const user = auth.currentUser
  if (!user) return

  const q = query(
    collection(db, 'users'),
    where('school_id', '==', user.uid)
  )

  unsubscribe = onSnapshot(q, (snapshot) => {
    // Ordiniamo l'array in memoria (lato client) per evitare di richiedere un altro indice composto su Firestore all'inizio.
    const loadedStudents = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Student))
    
    // Sort descending (più recenti prima)
    loadedStudents.sort((a, b) => {
      const timeA = a.associated_at?.toMillis() || a.created_at?.toMillis() || 0;
      const timeB = b.associated_at?.toMillis() || b.created_at?.toMillis() || 0;
      return timeB - timeA;
    })

    students.value = loadedStudents;

    if (selectedStudent.value) {
      const updated = loadedStudents.find(s => s.id === selectedStudent.value?.id)
      if (updated) {
        selectedStudent.value = updated
      }
    }
  }, (error) => {
    console.error("Error fetching students: ", error.message)
  })
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})
</script>
