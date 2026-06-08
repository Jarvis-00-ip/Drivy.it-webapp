<template>
  <div v-if="isOpen" class="relative z-50">
    <div class="fixed inset-0 bg-gray-500/75 transition-opacity dark:bg-gray-900/80" @click="close"></div>
    <div class="fixed inset-0 overflow-y-auto">
      <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div class="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          
          <div class="bg-gray-50 px-4 py-4 sm:px-6 border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ isEditing ? 'Gestisci Lezione/Guida' : 'Crea Nuova Lezione/Guida' }}
            </h3>
            <button @click="close" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="px-4 pb-4 pt-5 sm:p-6 sm:pb-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <form @submit.prevent="saveLesson" class="space-y-4">
              
              <!-- Tipo -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo di Evento</label>
                <select v-model="form.type" required class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                  <option value="lezione">Lezione di Teoria (Prenotazione Diretta)</option>
                  <option value="guida">Guida Pratica (Richiede Accettazione)</option>
                  <option value="visita">Visita Medica (Richiede Accettazione)</option>
                </select>
              </div>

              <!-- Titolo e Argomento -->
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titolo (Obbligatorio)</label>
                  <input v-model="form.title" type="text" required placeholder="Es. Guida Pratica" class="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:text-white" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Argomento (Obbligatorio)</label>
                  <input v-model="form.topic" type="text" required placeholder="Es. Parcheggi a S" class="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:text-white" />
                </div>
              </div>

              <!-- Istruttore e Capienza -->
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Istruttore (Facoltativo)</label>
                  <input v-model="form.instructor" type="text" placeholder="Nome Istruttore" class="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:text-white" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Numero Massimo Allievi</label>
                  <input v-model="form.max_students" type="number" min="1" required class="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:text-white" />
                </div>
              </div>

              <!-- Data Inizio e Fine -->
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Inizio</label>
                  <input v-model="form.start_time" type="datetime-local" required class="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:text-white" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fine</label>
                  <input v-model="form.end_time" type="datetime-local" required class="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:text-white" />
                </div>
              </div>

              <!-- Pending Requests Area (Only in Edit Mode) -->
              <div v-if="isEditing && (form.type === 'guida' || form.type === 'visita') && pendingStudentsDetails.length > 0" class="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 class="text-md font-semibold text-warning-600 mb-3 flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Richieste in Sospeso ({{ pendingStudentsDetails.length }})
                </h4>
                <ul class="space-y-2">
                  <li v-for="student in pendingStudentsDetails" :key="student.id" class="flex justify-between items-center bg-warning-50 dark:bg-warning-500/10 p-3 rounded-lg border border-warning-200 dark:border-warning-800">
                    <div>
                      <p class="font-medium text-gray-900 dark:text-white">{{ student.displayName || student.email }}</p>
                    </div>
                    <div class="flex gap-2">
                      <button type="button" @click="acceptStudent(student.id)" class="px-3 py-1 bg-success-500 text-white rounded hover:bg-success-600 text-sm font-medium">Accetta</button>
                      <button type="button" @click="rejectStudent(student.id)" class="px-3 py-1 bg-error-500 text-white rounded hover:bg-error-600 text-sm font-medium">Rifiuta</button>
                    </div>
                  </li>
                </ul>
              </div>

              <!-- Booked Students Area (Only in Edit Mode) -->
              <div v-if="isEditing && bookedStudentsDetails.length > 0" class="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 class="text-md font-semibold text-success-600 mb-3 flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Allievi Prenotati ({{ bookedStudentsDetails.length }} / {{ form.max_students }})
                </h4>
                <ul class="space-y-2">
                  <li v-for="student in bookedStudentsDetails" :key="student.id" class="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div>
                      <p class="font-medium text-gray-900 dark:text-white">{{ student.displayName || student.email }}</p>
                    </div>
                    <button type="button" @click="removeBookedStudent(student.id)" class="text-error-500 hover:text-error-700 text-sm font-medium">Rimuovi</button>
                  </li>
                </ul>
              </div>

              <!-- Actions -->
              <div class="mt-8 flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
                <button v-if="isEditing" type="button" @click="deleteLesson" class="px-4 py-2 text-sm font-medium text-error-600 hover:bg-error-50 rounded-lg mr-auto dark:hover:bg-error-500/10">
                  Elimina Lezione
                </button>
                <button type="button" @click="close" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
                  Annulla
                </button>
                <button type="submit" :disabled="isSaving" class="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50">
                  {{ isSaving ? 'Salvataggio...' : 'Salva' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { auth, db } from '@/firebase'
import { collection, addDoc, updateDoc, doc, deleteDoc, getDoc, Timestamp, arrayUnion, arrayRemove } from 'firebase/firestore'

const props = defineProps({
  isOpen: Boolean,
  lessonData: Object
})

const emit = defineEmits(['close'])

const isEditing = computed(() => !!props.lessonData)
const isSaving = ref(false)

const form = ref({
  title: '',
  topic: '',
  instructor: '',
  type: 'lezione',
  start_time: '',
  end_time: '',
  max_students: 1
})

const bookedStudentsDetails = ref<any[]>([])
const pendingStudentsDetails = ref<any[]>([])

const formatForInput = (timestamp: any) => {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  const tzoffset = (new Date()).getTimezoneOffset() * 60000
  const localISOTime = (new Date(date - tzoffset)).toISOString().slice(0, 16)
  return localISOTime
}

const loadStudentDetails = async (uidArray: string[], targetRef: any) => {
  const details = []
  for (const uid of uidArray) {
    try {
      const snap = await getDoc(doc(db, 'users', uid))
      if (snap.exists()) {
        details.push({ id: snap.id, ...snap.data() })
      }
    } catch (e) {
      console.error(e)
    }
  }
  targetRef.value = details
}

onMounted(() => {
  if (isEditing.value && props.lessonData) {
    form.value = {
      title: props.lessonData.title || '',
      topic: props.lessonData.topic || '',
      instructor: props.lessonData.instructor || '',
      type: props.lessonData.type || 'lezione',
      start_time: formatForInput(props.lessonData.start_time),
      end_time: formatForInput(props.lessonData.end_time),
      max_students: props.lessonData.max_students || 1
    }
    
    if (props.lessonData.booked_students?.length) {
      loadStudentDetails(props.lessonData.booked_students, bookedStudentsDetails)
    }
    if (props.lessonData.pending_students?.length) {
      loadStudentDetails(props.lessonData.pending_students, pendingStudentsDetails)
    }
  }
})

const close = () => emit('close')

const saveLesson = async () => {
  if (!auth.currentUser) return
  isSaving.value = true
  
  const payload = {
    school_id: auth.currentUser.uid,
    title: form.value.title,
    topic: form.value.topic,
    instructor: form.value.instructor,
    type: form.value.type,
    start_time: Timestamp.fromDate(new Date(form.value.start_time)),
    end_time: Timestamp.fromDate(new Date(form.value.end_time)),
    max_students: form.value.max_students,
  }

  try {
    if (isEditing.value && props.lessonData?.id) {
      await updateDoc(doc(db, 'lessons', props.lessonData.id), payload)
    } else {
      await addDoc(collection(db, 'lessons'), {
        ...payload,
        booked_students: [],
        pending_students: []
      })
    }
    close()
  } catch (error) {
    console.error("Error saving lesson:", error)
    alert("Errore durante il salvataggio.")
  } finally {
    isSaving.value = false
  }
}

const deleteLesson = async () => {
  if (confirm("Vuoi davvero eliminare questa lezione? Tutte le prenotazioni verranno annullate.")) {
    try {
      await deleteDoc(doc(db, 'lessons', props.lessonData!.id))
      close()
    } catch(e) {
      console.error(e)
    }
  }
}

const acceptStudent = async (studentId: string) => {
  try {
    await updateDoc(doc(db, 'lessons', props.lessonData!.id), {
      pending_students: arrayRemove(studentId),
      booked_students: arrayUnion(studentId)
    })
    // Aggiorna la vista locale
    pendingStudentsDetails.value = pendingStudentsDetails.value.filter(s => s.id !== studentId)
    const acceptedStudent = await getDoc(doc(db, 'users', studentId))
    if (acceptedStudent.exists()) {
      bookedStudentsDetails.value.push({ id: acceptedStudent.id, ...acceptedStudent.data() })
    }
  } catch (e) {
    console.error(e)
  }
}

const rejectStudent = async (studentId: string) => {
  try {
    await updateDoc(doc(db, 'lessons', props.lessonData!.id), {
      pending_students: arrayRemove(studentId)
    })
    pendingStudentsDetails.value = pendingStudentsDetails.value.filter(s => s.id !== studentId)
  } catch (e) {
    console.error(e)
  }
}

const removeBookedStudent = async (studentId: string) => {
  if (confirm("Vuoi rimuovere questo allievo dalla lezione?")) {
    try {
      await updateDoc(doc(db, 'lessons', props.lessonData!.id), {
        booked_students: arrayRemove(studentId)
      })
      bookedStudentsDetails.value = bookedStudentsDetails.value.filter(s => s.id !== studentId)
    } catch (e) {
      console.error(e)
    }
  }
}

</script>
