<template>
  <AdminLayout>
    <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 class="text-title-md2 font-semibold text-black dark:text-white">
          Profilo Autoscuola
        </h2>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <h3 class="mb-5 text-xl font-bold text-gray-900 dark:text-white">Informazioni Pubbliche</h3>
        <p class="text-sm text-gray-500 mb-6 dark:text-gray-400">
          Questi dati saranno visibili ai tuoi allievi all'interno dell'app.
        </p>
        
        <form @submit.prevent="saveProfile" class="space-y-5">
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Nome Autoscuola</label>
              <input v-model="form.school_name" type="text" class="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white" placeholder="Es. Autoscuola Sprint" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Indirizzo Sede</label>
              <input v-model="form.address" type="text" class="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white" placeholder="Es. Via Roma 1, Milano" />
            </div>
          </div>

          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Telefono</label>
              <input v-model="form.phone" type="text" class="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white" placeholder="Es. 02 1234567" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Email di Contatto</label>
              <input v-model="form.contact_email" type="email" class="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white" placeholder="Es. info@autoscuolasprint.it" />
            </div>
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Breve Descrizione</label>
            <textarea v-model="form.description" rows="4" class="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white" placeholder="Racconta qualcosa della tua autoscuola..."></textarea>
          </div>

          <div class="flex justify-end pt-4 relative">
            <p v-if="successMsg" class="text-success-600 dark:text-success-500 text-sm font-medium absolute left-0 bottom-3">{{ successMsg }}</p>
            <button type="submit" :disabled="isSaving" class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-6 py-3 text-sm font-medium text-black transition hover:bg-brand-600 disabled:opacity-50">
              {{ isSaving ? 'Salvataggio...' : 'Salva Profilo' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AdminLayout from "@/components/layout/AdminLayout.vue"
import { auth, db } from '@/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

const form = ref({
  school_name: '',
  address: '',
  phone: '',
  contact_email: '',
  description: ''
})

const isSaving = ref(false)
const successMsg = ref('')

onMounted(async () => {
  const user = auth.currentUser
  if (!user) return
  
  try {
    const docRef = doc(db, 'users', user.uid)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const data = docSnap.data()
      form.value = {
        school_name: data.school_name || '',
        address: data.address || '',
        phone: data.phone || '',
        contact_email: data.contact_email || '',
        description: data.description || ''
      }
    }
  } catch(e) {
    console.error(e)
  }
})

const saveProfile = async () => {
  const user = auth.currentUser
  if (!user) return
  
  isSaving.value = true
  successMsg.value = ''
  
  try {
    const docRef = doc(db, 'users', user.uid)
    // Usa merge: true per non sovrascrivere eventuali altri dati dell'utente (es. email, ruolo, ecc.)
    await setDoc(docRef, form.value, { merge: true })
    successMsg.value = 'Profilo aggiornato con successo!'
    setTimeout(() => { successMsg.value = '' }, 3000)
  } catch(e) {
    console.error(e)
    alert("Errore durante il salvataggio")
  } finally {
    isSaving.value = false
  }
}
</script>
