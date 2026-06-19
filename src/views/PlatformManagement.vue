<template>
  <AdminLayout>
    <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 class="text-title-md2 font-semibold text-black dark:text-white">
          Gestione Piattaforma (Super Admin)
        </h2>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Autoscuole Registrate</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">Pannello di controllo per abilitare/disabilitare le autoscuole.</p>
        </div>

        <div class="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-left text-sm">
              <thead class="bg-gray-50 dark:bg-white/[0.02]">
                <tr>
                  <th class="px-5 py-4 font-medium text-gray-800 dark:text-white/90">Nome Autoscuola</th>
                  <th class="px-5 py-4 font-medium text-gray-800 dark:text-white/90">Email</th>
                  <th class="px-5 py-4 font-medium text-gray-800 dark:text-white/90">Stato Abbonamento</th>
                  <th class="px-5 py-4 font-medium text-gray-800 dark:text-white/90 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-transparent">
                <tr v-if="schools.length === 0">
                  <td colspan="4" class="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                    Caricamento autoscuole...
                  </td>
                </tr>
                <tr v-for="school in schools" :key="school.id" class="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td class="px-5 py-4 font-medium text-gray-800 dark:text-white/90">
                    {{ school.name || 'Senza Nome' }}
                  </td>
                  <td class="px-5 py-4 text-gray-500 dark:text-gray-400">
                    {{ school.email }}
                  </td>
                  <td class="px-5 py-4">
                    <span v-if="school.isActive !== false" class="inline-flex rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-medium text-success-700 dark:bg-success-500/10 dark:text-success-400 border border-success-200 dark:border-success-800">
                      Attiva (Premium)
                    </span>
                    <span v-else class="inline-flex rounded-full bg-error-50 px-2.5 py-0.5 text-xs font-medium text-error-700 dark:bg-error-500/10 dark:text-error-400 border border-error-200 dark:border-error-800">
                      Sospesa (Freemium)
                    </span>
                  </td>
                  <td class="px-5 py-4 text-right">
                    <button @click="toggleSchoolStatus(school)" class="inline-flex items-center justify-center rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                      {{ school.isActive !== false ? 'Sospendi' : 'Riattiva' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { db } from '@/firebase'
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import AdminLayout from '@/components/layout/AdminLayout.vue'

const schools = ref<any[]>([])
let unsub: (() => void) | null = null

onMounted(() => {
  const q = query(
    collection(db, 'users'),
    where('role', '==', 'school_admin')
  )

  unsub = onSnapshot(q, (snapshot) => {
    schools.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  })
})

onUnmounted(() => {
  if (unsub) unsub()
})

const toggleSchoolStatus = async (school: any) => {
  const newStatus = school.isActive === false ? true : false
  const actionText = newStatus ? "riattivare" : "sospendere"
  
  if (confirm(`Sei sicuro di voler ${actionText} l'autoscuola ${school.name || school.email}?`)) {
    try {
      await updateDoc(doc(db, 'users', school.id), {
        isActive: newStatus
      })
    } catch (e) {
      console.error(e)
      alert("Errore durante l'aggiornamento.")
    }
  }
}
</script>
