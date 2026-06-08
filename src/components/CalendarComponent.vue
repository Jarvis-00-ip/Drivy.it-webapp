<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-xl font-bold text-gray-900 dark:text-white">Calendario</h3>
      <button
        @click="openCreateModal"
        class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
        Aggiungi Lezione/Guida
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
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import LessonModal from './LessonModal.vue'
import { seedMockLessonsIfEmpty } from '@/utils/mockLessons'

const calendarRef = ref(null)
const isModalOpen = ref(false)
const selectedLesson = ref(null)
const lessons = ref<any[]>([])

let unsubscribe: (() => void) | null = null

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'timeGridWeek',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay'
  },
  locale: 'it',
  events: lessons.value.map(l => ({
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
  selectedLesson.value = null
  isModalOpen.value = true
}

const handleEventClick = (info: any) => {
  selectedLesson.value = info.event.extendedProps
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  selectedLesson.value = null
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
