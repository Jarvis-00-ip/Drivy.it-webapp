<template>
  <div v-if="isOpen" class="relative z-50" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
    <!-- Background backdrop -->
    <div class="fixed inset-0 bg-gray-500/75 transition-opacity dark:bg-gray-900/80" @click="closeModal"></div>

    <div class="fixed inset-0 overflow-hidden">
      <div class="absolute inset-0 overflow-hidden">
        <div class="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
          <!-- Slide-over panel -->
          <div class="pointer-events-auto w-screen max-w-2xl transform transition-all">
            <div class="flex h-full flex-col overflow-y-scroll bg-white shadow-xl dark:bg-gray-900">
              <!-- Header -->
              <div class="bg-gray-50 px-4 py-6 sm:px-6 dark:bg-gray-800">
                <div class="flex items-center justify-between">
                  <h2 class="text-lg font-semibold text-gray-900 dark:text-white" id="slide-over-title">Statistiche Allievo</h2>
                  <div class="ml-3 flex h-7 items-center">
                    <button type="button" class="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none dark:hover:text-gray-300" @click="closeModal">
                      <span class="sr-only">Chiudi pannello</span>
                      <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <!-- Info allievo -->
                <div class="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div class="flex items-center gap-4">
                    <div class="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300 text-xl font-bold uppercase shrink-0">
                      {{ student?.displayName ? student.displayName.charAt(0) : (student?.email ? student.email.charAt(0) : '?') }}
                    </div>
                    <div>
                      <h3 class="text-xl font-bold text-gray-900 dark:text-white">
                        {{ student?.displayName || (student?.firstName ? student?.firstName + ' ' + (student?.lastName || '') : '') || 'Nome non inserito' }}
                      </h3>
                      <p class="text-sm text-gray-500 dark:text-gray-400">{{ student?.email || 'Email non disponibile' }}</p>
                    </div>
                  </div>
                  
                  <button @click="unlinkStudent" class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-error-50 px-4 py-2 text-sm font-medium text-error-700 transition hover:bg-error-100 dark:bg-error-500/10 dark:text-error-400 dark:hover:bg-error-500/20 border border-error-200 dark:border-error-800">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                    </svg>
                    Scollega Allievo
                  </button>
                </div>
              </div>

              <!-- Main Content -->
              <div class="relative flex-1 px-4 py-6 sm:px-6 space-y-8">
                
                <!-- Loading State -->
                <div v-if="isLoading" class="flex justify-center py-12">
                  <p class="text-gray-500 dark:text-gray-400">Caricamento statistiche in corso...</p>
                </div>
                
                <!-- Empty State -->
                <div v-else-if="quizzes.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
                  <svg class="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white">Nessun quiz completato</h3>
                  <p class="mt-1 text-gray-500 dark:text-gray-400">L'allievo non ha ancora svolto simulazioni d'esame, o l'app non le ha caricate su Firestore.</p>
                </div>
                
                <div v-else class="space-y-8">
                  <!-- Charts Row -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Pie Chart -->
                    <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/50">
                      <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Esito Globale</h4>
                      <apexchart type="donut" height="250" :options="pieChartOptions" :series="pieChartSeries"></apexchart>
                    </div>
                    
                    <!-- Line Chart -->
                    <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/50">
                      <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Errori (Ultime 10 simulazioni)</h4>
                      <apexchart type="line" height="250" :options="lineChartOptions" :series="lineChartSeries"></apexchart>
                    </div>
                  </div>

                  <!-- Table -->
                  <div>
                    <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Cronologia Quiz</h4>
                    <div class="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-left text-sm">
                        <thead class="bg-gray-50 dark:bg-white/[0.02]">
                          <tr>
                            <th class="px-4 py-3 font-medium text-gray-800 dark:text-white/90">Data</th>
                            <th class="px-4 py-3 font-medium text-gray-800 dark:text-white/90">Tipo</th>
                            <th class="px-4 py-3 font-medium text-gray-800 dark:text-white/90 text-center">Errori</th>
                            <th class="px-4 py-3 font-medium text-gray-800 dark:text-white/90">Esito</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-transparent">
                          <tr v-for="quiz in quizzes" :key="quiz.id" class="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                            <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ formatDate(quiz.date) }}</td>
                            <td class="px-4 py-3 text-gray-800 dark:text-white/90 font-medium">{{ quiz.quiz_type }}</td>
                            <td class="px-4 py-3 text-center text-gray-600 dark:text-gray-400">{{ quiz.total_errors }}</td>
                            <td class="px-4 py-3">
                              <span v-if="quiz.passed" class="inline-flex rounded-full bg-success-50 px-2 py-1 text-xs font-medium text-success-700 border border-success-200 dark:bg-success-500/10 dark:text-success-400 dark:border-success-800">
                                Promosso
                              </span>
                              <span v-else class="inline-flex rounded-full bg-error-50 px-2 py-1 text-xs font-medium text-error-700 border border-error-200 dark:bg-error-500/10 dark:text-error-400 dark:border-error-800">
                                Bocciato
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <!-- Pulsante di chiusura in basso per sicurezza -->
                <div class="mt-8 border-t border-gray-200 pt-6 flex justify-end dark:border-gray-800">
                  <button type="button" @click="closeModal" class="rounded-lg bg-gray-100 px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:focus:ring-offset-gray-900">
                    Chiudi Scheda
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { db } from '@/firebase'
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteField } from 'firebase/firestore'

const props = defineProps({
  isOpen: Boolean,
  student: Object
})

const emit = defineEmits(['close'])

const closeModal = () => {
  emit('close')
}

const unlinkStudent = async () => {
  if (!props.student || !props.student.id) return
  if (confirm("Sei sicuro di voler scollegare questo allievo dalla tua autoscuola? Non avrai più accesso alle sue statistiche e i servizi premium sull'App gli verranno disabilitati.")) {
    try {
      await updateDoc(doc(db, 'users', props.student.id), {
        school_id: deleteField(),
        associated_at: deleteField()
      })
      closeModal()
    } catch (e) {
      console.error(e)
      alert("Errore durante lo scollegamento dell'allievo.")
    }
  }
}

interface QuizResult {
  id: string;
  date: any;
  quiz_type: string;
  total_errors: number;
  passed: boolean;
  critical_topics: string[];
}

const quizzes = ref<QuizResult[]>([])
const isLoading = ref(false)
let unsubscribe: (() => void) | null = null

watch(() => props.isOpen, (newVal) => {
  if (newVal && props.student) {
    loadData()
  } else {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }
})

const loadData = () => {
  if (!props.student || !props.student.id) return
  isLoading.value = true

  const q = query(
    collection(db, 'users', props.student.id, 'quiz_results'),
    orderBy('date', 'desc')
  )

  unsubscribe = onSnapshot(q, (snapshot) => {
    quizzes.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as QuizResult))
    isLoading.value = false
  }, (error) => {
    console.error("Error fetching quiz results:", error)
    isLoading.value = false
  })
}

const formatDate = (timestamp: any) => {
  if (!timestamp) return '-'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)
}

const pieChartSeries = computed(() => {
  let passed = 0
  let failed = 0
  quizzes.value.forEach(q => {
    if (q.passed) passed++
    else failed++
  })
  return [passed, failed]
})

const pieChartOptions = computed(() => {
  return {
    chart: { type: 'donut', fontFamily: 'inherit' },
    colors: ['#10B981', '#EF4444'],
    labels: ['Promossi', 'Bocciati'],
    plotOptions: {
      pie: {
        donut: { size: '65%' }
      }
    },
    dataLabels: { enabled: false },
    legend: { position: 'bottom' }
  }
})

const lineChartSeries = computed(() => {
  const last10 = quizzes.value.slice(0, 10).reverse()
  return [{
    name: 'Errori',
    data: last10.map(q => q.total_errors)
  }]
})

const lineChartOptions = computed(() => {
  const last10 = quizzes.value.slice(0, 10).reverse()
  return {
    chart: {
      type: 'line',
      fontFamily: 'inherit',
      toolbar: { show: false },
      zoom: { enabled: false }
    },
    colors: ['#3C50E0'],
    stroke: { curve: 'smooth', width: 3 },
    xaxis: {
      categories: last10.map(q => {
        if(!q.date) return '-'
        const d = q.date.toDate ? q.date.toDate() : new Date(q.date)
        return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })
      }),
      tooltip: { enabled: false }
    },
    yaxis: {
      min: 0,
      tickAmount: 4
    },
    markers: { size: 4 }
  }
})
</script>
