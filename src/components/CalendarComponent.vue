<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-xl font-bold text-gray-900 dark:text-white">Calendario</h3>
      <div class="flex gap-3">
        <button
          @click="approveAllPending"
          :disabled="isApprovingMassive"
          class="inline-flex items-center justify-center gap-2 rounded-lg bg-success-500 px-5 py-2.5 text-sm font-medium text-black transition hover:bg-success-600 disabled:opacity-50"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          <span v-if="isApprovingMassive">Approvazione...</span>
          <span v-else>Approva in Sospeso</span>
        </button>
        <button
          @click="openCreateModal"
          class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-black transition hover:bg-brand-600"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
          Aggiungi Lezione/Guida
        </button>
      </div>
    </div>

    <!-- Filtri e Generazione Dati -->
    <div class="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <div class="flex flex-wrap gap-4 items-center">
        <span class="text-sm font-semibold text-gray-900 dark:text-white">Filtri:</span>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" v-model="filterTeoria" class="rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-600" />
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Teoria</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" v-model="filterGuida" class="rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-600" />
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Guide Pratiche</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" v-model="filterVisita" class="rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-600" />
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Visite Mediche</span>
        </label>
      </div>
      <button
        @click="generateMoreData"
        class="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-200 dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white transition hover:bg-gray-300 dark:hover:bg-gray-600"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
        Genera Dati Test
      </button>
    </div>

    <!-- FullCalendar Wrapper -->
    <div class="calendar-wrapper">
      <FullCalendar ref="calendarRef" :options="calendarOptions" />
    </div>

    <!-- Modale Lezione -->
    <LessonModal 
      v-if="isModalOpen" 
      :is-open="isModalOpen"
      :lesson-data="selectedLesson"
      @close="closeModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { auth, db } from '@/firebase'
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import LessonModal from './LessonModal.vue'
import { seedMockLessonsIfEmpty } from '@/utils/mockLessons'

const calendarRef = ref(null)
const isModalOpen = ref(false)
const selectedLesson = ref<any>(undefined)
const lessons = ref<any[]>([])
const isApprovingMassive = ref(false)

const filterTeoria = ref(true)
const filterGuida = ref(true)
const filterVisita = ref(true)

let unsubscribe: (() => void) | null = null

const generateMoreData = async () => {
  if(confirm("Vuoi generare altri dati mock (lezioni, guide, visite) per i prossimi due mesi?")) {
    await seedMockLessonsIfEmpty(true);
  }
}

const approveAllPending = async () => {
  if (!confirm("Sei sicuro di voler approvare TUTTE le richieste in sospeso compatibili con i posti disponibili?")) return;
  
  isApprovingMassive.value = true;
  try {
    const promises = [];
    for (const lesson of lessons.value) {
      if (lesson.pending_students && lesson.pending_students.length > 0) {
        const availableSpots = lesson.max_students - (lesson.booked_students?.length || 0);
        if (availableSpots > 0) {
          const toApprove = lesson.pending_students.slice(0, availableSpots);
          const remainingPending = lesson.pending_students.slice(availableSpots);
          
          const newBooked = [...(lesson.booked_students || []), ...toApprove];
          
          promises.push(updateDoc(doc(db, 'lessons', lesson.id), {
            booked_students: newBooked,
            pending_students: remainingPending
          }));
        }
      }
    }
    
    if (promises.length > 0) {
      await Promise.all(promises);
      alert(`Approvate con successo le richieste in ${promises.length} lezioni!`);
    } else {
      alert("Non ci sono richieste in sospeso approvabili (posti esauriti o nessuna richiesta).");
    }
  } catch (error) {
    console.error(error);
    alert("Errore durante l'approvazione massiva.");
  } finally {
    isApprovingMassive.value = false;
  }
}

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'timeGridWeek',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay'
  },
  locale: 'it',
  events: lessons.value.filter(l => {
    if (l.type === 'lezione' && !filterTeoria.value) return false;
    if (l.type === 'guida' && !filterGuida.value) return false;
    if (l.type === 'visita' && !filterVisita.value) return false;
    return true;
  }).map(l => ({
    id: l.id,
    title: l.title,
    start: l.start_time?.toDate ? l.start_time.toDate() : l.start_time,
    end: l.end_time?.toDate ? l.end_time.toDate() : l.end_time,
    backgroundColor: getEventColor(l),
    borderColor: getEventColor(l),
    extendedProps: { ...l }
  })),
  eventClick: handleEventClick,
  height: 'auto',
  slotMinTime: '08:00:00',
  slotMaxTime: '20:00:00',
  allDaySlot: false,
  slotEventOverlap: false,
}))

const getEventColor = (lesson: any) => {
  const bookedCount = lesson.booked_students?.length || 0;
  if (bookedCount >= lesson.max_students) {
    return '#EF4444'; // Red (Full)
  }
  if (lesson.pending_students?.length > 0) {
    return '#F59E0B'; // Amber/Yellow (Pending Requests)
  }
  return '#10B981'; // Green (Available)
}

const openCreateModal = () => {
  selectedLesson.value = undefined
  isModalOpen.value = true
}

const handleEventClick = (info: any) => {
  selectedLesson.value = info.event.extendedProps
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  selectedLesson.value = undefined
}

onMounted(() => {
  const user = auth.currentUser
  if (!user) return

  // Seed data if empty
  seedMockLessonsIfEmpty()

  const q = query(
    collection(db, 'lessons'),
    where('school_id', '==', user.uid)
  )

  unsubscribe = onSnapshot(q, (snapshot) => {
    lessons.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  })
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})
</script>

<style>
/* Optional custom styling for FullCalendar */
.dark .fc-theme-standard .fc-scrollgrid,
.dark .fc-theme-standard th, 
.dark .fc-theme-standard td {
  border-color: #1f2937 !important; /* Tailwind gray-800 */
}
</style>
