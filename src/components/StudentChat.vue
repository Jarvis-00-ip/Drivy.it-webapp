<template>
  <div class="flex flex-col h-[500px] rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
    
    <!-- Header -->
    <div class="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
      <h4 class="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
        <svg class="h-5 w-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
        Chat con {{ studentName }}
      </h4>
    </div>

    <!-- Messages Area -->
    <div class="flex-1 overflow-y-auto p-6 space-y-4" ref="messagesContainer">
      <div v-if="messages.length === 0" class="text-center text-gray-500 my-auto pt-20">
        Nessun messaggio. Invia il primo messaggio!
      </div>
      
      <div v-for="msg in messages" :key="msg.id" :class="['flex', msg.sender === 'school' ? 'justify-end' : 'justify-start']">
        <div :class="['max-w-[75%] rounded-2xl px-4 py-2', msg.sender === 'school' ? 'bg-brand-500 text-black rounded-br-none' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 rounded-bl-none']">
          <p class="text-sm">{{ msg.text }}</p>
          <span :class="['text-[10px] mt-1 block', msg.sender === 'school' ? 'text-brand-100' : 'text-gray-400']">
            {{ formatTime(msg.timestamp) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <div class="border-t border-gray-200 p-4 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 rounded-b-xl">
      <form @submit.prevent="sendMessage" class="flex gap-2">
        <input 
          v-model="newMessage" 
          type="text" 
          placeholder="Scrivi un messaggio..." 
          class="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          :disabled="isSending"
        />
        <button 
          type="submit" 
          :disabled="!newMessage.trim() || isSending"
          class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-brand-600 disabled:opacity-50"
        >
          Invia
        </button>
      </form>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { db, auth } from '@/firebase'
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore'

const props = defineProps<{
  studentId: string
  studentName: string
}>()

const messages = ref<any[]>([])
const newMessage = ref('')
const isSending = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)

let unsub: (() => void) | null = null

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

onMounted(() => {
  const chatId = `${props.studentId}_${auth.currentUser?.uid}`
  const messagesRef = collection(db, 'chats', chatId, 'messages')
  const q = query(messagesRef, orderBy('timestamp', 'asc'))

  unsub = onSnapshot(q, (snap) => {
    messages.value = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    scrollToBottom()
  })
})

onUnmounted(() => {
  if (unsub) unsub()
})

const sendMessage = async () => {
  if (!newMessage.value.trim() || !auth.currentUser) return
  isSending.value = true
  
  try {
    const chatId = `${props.studentId}_${auth.currentUser.uid}`
    const messagesRef = collection(db, 'chats', chatId, 'messages')
    
    await addDoc(messagesRef, {
      text: newMessage.value.trim(),
      sender: 'school',
      timestamp: serverTimestamp()
    })
    
    newMessage.value = ''
  } catch (error) {
    console.error("Errore invio messaggio", error)
  } finally {
    isSending.value = false
  }
}

const formatTime = (ts: any) => {
  if (!ts) return ''
  const date = ts.toDate()
  return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}
</script>
