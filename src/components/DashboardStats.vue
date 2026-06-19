<template>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3 2xl:gap-7.5 mb-6">
    
    <!-- Stat 1: Allievi Attivi -->
    <div class="rounded-lg border border-gray-200 bg-white py-6 px-7.5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div class="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
        <svg class="h-6 w-6 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
      </div>
      <div class="mt-4 flex items-end justify-between">
        <div>
          <h4 class="text-title-md font-bold text-black dark:text-white">{{ activeStudents }}</h4>
          <span class="text-sm font-medium">Allievi Attivi</span>
        </div>
      </div>
    </div>

    <!-- Stat 2: Guide Odierne -->
    <div class="rounded-lg border border-gray-200 bg-white py-6 px-7.5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div class="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
        <svg class="h-6 w-6 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
      </div>
      <div class="mt-4 flex items-end justify-between">
        <div>
          <h4 class="text-title-md font-bold text-black dark:text-white">{{ todayLessons }}</h4>
          <span class="text-sm font-medium">Guide Odierne</span>
        </div>
      </div>
    </div>

    <!-- Stat 3: Richieste in Sospeso -->
    <div class="rounded-lg border border-gray-200 bg-white py-6 px-7.5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div class="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
        <svg class="h-6 w-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      </div>
      <div class="mt-4 flex items-end justify-between">
        <div>
          <h4 class="text-title-md font-bold text-black dark:text-white">{{ pendingRequests }}</h4>
          <span class="text-sm font-medium text-warning">Richieste in Sospeso</span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { db, auth } from '@/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'

const activeStudents = ref(0)
const todayLessons = ref(0)
const pendingRequests = ref(0)

let unsubStudents: any = null
let unsubLessons: any = null

onMounted(() => {
  const user = auth.currentUser
  if (!user) return

  // Query Allievi
  const qStudents = query(collection(db, 'users'), where('school_id', '==', user.uid), where('role', '==', 'student'))
  unsubStudents = onSnapshot(qStudents, (snap) => {
    activeStudents.value = snap.size
  })

  // Query Lezioni (Oggi e in sospeso)
  const qLessons = query(collection(db, 'lessons'), where('school_id', '==', user.uid))
  unsubLessons = onSnapshot(qLessons, (snap) => {
    let todayCount = 0
    let pendingCount = 0
    
    const today = new Date()
    today.setHours(0,0,0,0)

    snap.forEach(doc => {
      const data = doc.data()
      // Conta pending requests
      if (data.pending_students && data.pending_students.length > 0) {
        pendingCount += data.pending_students.length
      }

      // Conta guide odierne
      if (data.start_time) {
        const lessonDate = data.start_time.toDate()
        lessonDate.setHours(0,0,0,0)
        if (lessonDate.getTime() === today.getTime() && data.type === 'guide') {
          todayCount++
        }
      }
    })

    todayLessons.value = todayCount
    pendingRequests.value = pendingCount
  })
})

onUnmounted(() => {
  if (unsubStudents) unsubStudents()
  if (unsubLessons) unsubLessons()
})
</script>
