<template>
  <div v-if="isOpen" class="relative z-50" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
    <!-- Background backdrop -->
    <div class="fixed inset-0 bg-gray-500/75 transition-opacity dark:bg-gray-900/80"></div>

    <div class="fixed inset-0 overflow-hidden" @click="closeModal">
      <div class="absolute inset-0 overflow-hidden">
        <div class="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
          <!-- Slide-over panel -->
          <div class="pointer-events-auto w-screen max-w-2xl transform transition-all" @click.stop>
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

              <!-- Tabs Navigation -->
              <div class="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 sm:px-6">
                <nav class="-mb-px flex space-x-8 overflow-x-auto no-scrollbar" aria-label="Tabs">
                  <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
                    :class="[activeTab === tab.id ? 'border-brand-500 text-brand-600 dark:text-brand-400 dark:border-brand-400' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300', 'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium']">
                    {{ tab.name }}
                  </button>
                </nav>
              </div>

              <!-- Main Content -->
              <div class="relative flex-1 px-4 py-6 sm:px-6 space-y-8">
                
                <!-- SEZIONE DOCUMENTI -->
                <div v-if="activeTab === 'documenti'">
                  <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Documenti Sensibili</h4>
                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div v-for="docDef in documentDefinitions" :key="docDef.key" class="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/50">
                      <div class="flex items-start justify-between mb-2">
                        <span class="text-sm font-semibold text-gray-800 dark:text-white">{{ docDef.label }}</span>
                        <!-- Status Badge -->
                        <span v-if="hasDocument(docDef.key)" class="inline-flex rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-700 border border-success-200 dark:bg-success-500/10 dark:text-success-400 dark:border-success-800">
                          Caricato
                        </span>
                        <span v-else class="inline-flex rounded-full bg-error-50 px-2 py-0.5 text-xs font-medium text-error-700 border border-error-200 dark:bg-error-500/10 dark:text-error-400 dark:border-error-800">
                          Mancante
                        </span>
                      </div>
                      
                      <!-- Spinner in caricamento -->
                      <div v-if="isUploading[docDef.key]" class="flex items-center justify-center py-2">
                        <svg class="h-5 w-5 animate-spin text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                      
                      <!-- Thumbnail Anteprima -->
                      <div v-if="hasDocument(docDef.key) && !isUploading[docDef.key]" class="mt-3 relative h-24 w-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center group cursor-pointer" @click="openImageModal(getDocumentUrl(docDef.key))">
                        <template v-if="getDocumentUrl(docDef.key).startsWith('data:application/pdf')">
                          <svg class="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                          <span class="absolute bottom-2 text-[10px] font-semibold text-gray-500">PDF Document</span>
                        </template>
                        <template v-else>
                          <img :src="getDocumentUrl(docDef.key)" class="w-full h-full object-cover opacity-60 blur-[1px] group-hover:blur-none group-hover:opacity-100 transition duration-300" alt="Document Preview" />
                        </template>
                        <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                           <svg class="w-6 h-6 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                      </div>

                      <!-- Azioni -->
                      <div v-else-if="!isUploading[docDef.key]" class="mt-4 flex flex-wrap gap-2">
                        <button v-if="!hasDocument(docDef.key)" @click="triggerFileInput(docDef.key)" class="w-full inline-flex justify-center items-center rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 transition hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20">
                          Carica File
                        </button>
                      </div>
                      
                      <div v-if="hasDocument(docDef.key) && !isUploading[docDef.key]" class="mt-3 flex gap-2">
                          <button @click="openImageModal(getDocumentUrl(docDef.key))" class="flex-1 inline-flex justify-center items-center rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                            Visualizza
                          </button>
                          <button @click="triggerFileInput(docDef.key)" class="flex-1 inline-flex justify-center items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800">
                            Sostituisci
                          </button>
                      </div>
                    </div>
                  </div>
                  <!-- Hidden Input File -->
                  <input type="file" ref="fileInput" class="hidden" accept="image/jpeg, image/png, image/webp, application/pdf" @change="handleFileUpload" />
                </div>
                
                <!-- SEZIONE TEORIA -->
                <div v-if="activeTab === 'teoria'" class="space-y-8">
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
                </div>

                <!-- SEZIONE PRENOTAZIONI GUIDE E TEORIA -->
                <div v-if="activeTab === 'guide' || activeTab === 'prenotazioni_teoria'" class="space-y-8">
                  <div v-if="isLoadingLessons" class="flex justify-center py-12">
                    <p class="text-gray-500 dark:text-gray-400">Caricamento prenotazioni in corso...</p>
                  </div>
                  <div v-else>
                    <!-- Prossimi Appuntamenti -->
                    <div class="mb-8">
                      <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Prossimi Appuntamenti</h4>
                      <div v-if="futureLessons.length === 0" class="rounded-xl border border-dashed border-gray-300 p-6 text-center dark:border-gray-700">
                        <p class="text-sm text-gray-500 dark:text-gray-400">Nessuna prenotazione futura trovata.</p>
                      </div>
                      <div v-else class="space-y-3">
                        <div v-for="lesson in futureLessons" :key="lesson.id" class="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/50">
                          <div>
                            <p class="font-medium text-gray-900 dark:text-white">{{ lesson.title }}</p>
                            <p class="text-sm text-gray-500 dark:text-gray-400">{{ formatLessonDate(lesson.start_time) }}</p>
                          </div>
                          <span class="inline-flex rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 border border-brand-200 dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-800">
                            In arrivo
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Storico -->
                    <div>
                      <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Storico Passato</h4>
                      <div v-if="pastLessons.length === 0" class="rounded-xl border border-dashed border-gray-300 p-6 text-center dark:border-gray-700">
                        <p class="text-sm text-gray-500 dark:text-gray-400">Nessuno storico disponibile.</p>
                      </div>
                      <div v-else class="space-y-3">
                        <div v-for="lesson in pastLessons" :key="lesson.id" class="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/20 opacity-75">
                          <div>
                            <p class="font-medium text-gray-700 dark:text-gray-300">{{ lesson.title }}</p>
                            <p class="text-sm text-gray-500 dark:text-gray-500">{{ formatLessonDate(lesson.start_time) }}</p>
                          </div>
                          <span class="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
                            Completata
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- SEZIONE AMMINISTRAZIONE E SCADENZE -->
                <div v-if="activeTab === 'amministrazione'" class="space-y-8">
                  <!-- Wallet Guide -->
                  <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
                    <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <svg class="h-5 w-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                      Wallet Guide Pratiche
                    </h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Aggiungi o rimuovi crediti per le guide pagate dall'allievo. I crediti scalano automaticamente ad ogni guida effettuata.</p>
                    
                    <div class="flex items-center justify-center gap-6">
                      <button @click="updateCredits(-1)" :disabled="isUpdatingCredits" class="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path></svg>
                      </button>
                      
                      <div class="flex flex-col items-center min-w-[100px]">
                        <span class="text-4xl font-bold text-gray-900 dark:text-white">{{ student?.guide_credits || 0 }}</span>
                        <span class="text-xs uppercase tracking-wide text-gray-500 mt-1">Crediti</span>
                      </div>

                      <button @click="updateCredits(1)" :disabled="isUpdatingCredits" class="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                      </button>
                    </div>
                  </div>

                  <!-- Gestione Scadenze -->
                  <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
                    <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <svg class="h-5 w-5 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      Scadenze Documenti
                    </h4>
                    
                    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Rilascio Foglio Rosa</label>
                        <flat-pickr
                          :model-value="student?.pink_slip_issue_date"
                          @update:model-value="updateDate('pink_slip_issue_date', $event)"
                          :config="dateConfig"
                          class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                          placeholder="Seleziona data"
                        />
                        <p class="mt-1 text-xs text-gray-500">Scadenza automatica: +1 Anno</p>
                      </div>
                      
                      <div>
                        <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Scadenza Certificato Medico</label>
                        <flat-pickr
                          :model-value="student?.medical_cert_expiry"
                          @update:model-value="updateDate('medical_cert_expiry', $event)"
                          :config="dateConfig"
                          class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                          placeholder="Seleziona data"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- SEZIONE CHAT -->
                <div v-if="activeTab === 'chat'" class="h-full">
                  <StudentChat :student-id="student?.id" :student-name="student?.name + ' ' + student?.surname" />
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
    
    <!-- Image Fullscreen Modal -->
    <div v-if="imageModalOpen" class="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 p-4 transition-opacity backdrop-blur-sm" @click="imageModalOpen = false">
      <div class="relative w-full max-w-4xl max-h-screen flex items-center justify-center p-2">
        <button @click.stop="imageModalOpen = false" class="absolute -top-12 right-0 text-white hover:text-gray-300 bg-black/50 rounded-full p-2">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
        <object v-if="selectedImage.startsWith('data:application/pdf')" :data="selectedImage" type="application/pdf" class="w-full h-[85vh] rounded-lg bg-white" @click.stop>
           <p class="text-center p-4">Il tuo browser non supporta la visualizzazione dei PDF in modale. Aggiorna il browser o usa la visualizzazione immagine.</p>
        </object>
        <img v-else :src="selectedImage" class="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" @click.stop />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { db } from '@/firebase'
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteField, where, increment } from 'firebase/firestore'
import VueApexCharts from 'vue3-apexcharts'
import flatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import StudentChat from './StudentChat.vue'

const props = defineProps({
  isOpen: Boolean,
  student: Object
})

const emit = defineEmits(['close'])

const closeModal = () => {
  emit('close')
}

// TABS LOGIC
const activeTab = ref('teoria' as string)
const tabs = [
  { id: 'teoria', name: 'Teoria' },
  { id: 'guide', name: 'Prenotazioni Guide' },
  { id: 'prenotazioni_teoria', name: 'Prenotazioni Teoria' },
  { id: 'documenti', name: 'Documenti' },
  { id: 'chat', name: 'Chat' },
  { id: 'amministrazione', name: 'Amministrazione' }
]

// AMMINISTRAZIONE LOGIC
const isUpdatingCredits = ref(false)

const updateCredits = async (amount: number) => {
  if (!props.student?.id) return
  isUpdatingCredits.value = true
  try {
    const currentCredits = props.student.guide_credits || 0
    if (currentCredits + amount < 0) {
       // Previeni crediti negativi se vuoi (oppure no)
    }
    await updateDoc(doc(db, 'users', props.student.id), {
      guide_credits: increment(amount)
    })
    // Poiché usiamo vue props reattive (se passate in streaming) si aggiorneranno o dovranno essere gestite dal parent.
    // L'ideale è che la tabella principale sia real-time
  } catch (error) {
    console.error('Errore update crediti', error)
  } finally {
    isUpdatingCredits.value = false
  }
}

const dateConfig = {
  dateFormat: "Y-m-d"
}

const updateDate = async (field: string, value: string | Date | any) => {
  if (!props.student?.id) return
  try {
    await updateDoc(doc(db, 'users', props.student.id), {
      [field]: value
    })
  } catch (error) {
    console.error('Errore update date', error)
  }
}

// LOGICA DOCUMENTI
const fileInput = ref<HTMLInputElement | null>(null)
const currentUploadType = ref<string | null>(null)
const isUploading = ref<Record<string, boolean>>({})

// Modale Immagine
const imageModalOpen = ref(false)
const selectedImage = ref('')

const openImageModal = (base64Str: string) => {
  selectedImage.value = base64Str
  imageModalOpen.value = true
}

const documentDefinitions = [
  { key: 'id_card', label: "Carta d'Identità" },
  { key: 'tax_code', label: "Codice Fiscale" },
  { key: 'medical_cert', label: "Certificato Medico" },
  { key: 'passport_photo', label: "Foto Tessera" },
  { key: 'residence_permit', label: "Permesso Soggiorno" }
]

const hasDocument = (key: string) => {
  return props.student && props.student.documents && props.student.documents[key]
}

const getDocumentUrl = (key: string) => {
  return props.student && props.student.documents && props.student.documents[key] ? props.student.documents[key] : '#'
}

const triggerFileInput = (docType: string) => {
  currentUploadType.value = docType
  if (fileInput.value) {
    fileInput.value.value = '' // reset
    fileInput.value.click()
  }
}

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const studentId = props.student?.id
  if (!target.files || target.files.length === 0 || !currentUploadType.value || !studentId) {
    return
  }
  
  const file = target.files[0]
  const docType = currentUploadType.value
  
  if (file.size > 700 * 1024) {
    alert('Il file è troppo grande (Max 700KB). Per favore comprimi il PDF o carica una foto JPEG/PNG.')
    currentUploadType.value = null
    if (fileInput.value) fileInput.value.value = ''
    return
  }

  isUploading.value[docType] = true

  // Leggi il file come Data URI (Base64)
  const reader = new FileReader()
  
  reader.onload = async (e) => {
    const base64String = e.target?.result as string
    if (!base64String) {
      isUploading.value[docType] = false
      currentUploadType.value = null
      return
    }

    try {
      // Aggiorna Firestore salvando direttamente la stringa Base64
      await updateDoc(doc(db, 'users', studentId), {
        [`documents.${docType}`]: base64String
      })
    } catch (error) {
      console.error("Errore durante l'upload su Firestore:", error)
      alert("Errore durante il salvataggio del documento.")
    } finally {
      isUploading.value[docType] = false
      currentUploadType.value = null
      if (fileInput.value) fileInput.value.value = ''
    }
  }

  reader.onerror = () => {
    alert("Errore durante la lettura del file dal tuo PC.")
    isUploading.value[docType] = false
    currentUploadType.value = null
  }

  // Avvia la lettura
  reader.readAsDataURL(file)
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
const isLoadingLessons = ref(false)
const allLessons = ref<any[]>([])

let unsubscribeQuizzes: (() => void) | null = null
let unsubscribeLessons: (() => void) | null = null

watch(() => props.isOpen, (newVal) => {
  if (newVal && props.student) {
    activeTab.value = 'teoria'
    loadQuizzes()
    loadLessons()
  } else {
    if (unsubscribeQuizzes) {
      unsubscribeQuizzes()
      unsubscribeQuizzes = null
    }
    if (unsubscribeLessons) {
      unsubscribeLessons()
      unsubscribeLessons = null
    }
  }
})

const loadQuizzes = () => {
  if (!props.student || !props.student.id) return
  isLoading.value = true

  const q = query(
    collection(db, 'users', props.student.id, 'quiz_results'),
    orderBy('date', 'desc')
  )

  unsubscribeQuizzes = onSnapshot(q, (snapshot) => {
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

const loadLessons = () => {
  if (!props.student || !props.student.id) return
  isLoadingLessons.value = true

  const q = query(
    collection(db, 'lessons'),
    where('booked_students', 'array-contains', props.student.id)
  )

  unsubscribeLessons = onSnapshot(q, (snapshot) => {
    allLessons.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    // Sort lessons manually by date descending
    allLessons.value.sort((a, b) => {
      const dateA = a.start_time?.toDate ? a.start_time.toDate().getTime() : (a.start_time ? new Date(a.start_time).getTime() : 0)
      const dateB = b.start_time?.toDate ? b.start_time.toDate().getTime() : (b.start_time ? new Date(b.start_time).getTime() : 0)
      return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA)
    })
    isLoadingLessons.value = false
  }, (error) => {
    console.error("Error fetching lessons:", error)
    isLoadingLessons.value = false
  })
}

const formatLessonDate = (timestamp: any) => {
  if (!timestamp) return '-'
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    if (isNaN(date.getTime())) return '-'
    return new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)
  } catch (e) {
    return '-'
  }
}

const filteredLessons = computed(() => {
  if (activeTab.value === 'guide') {
    return allLessons.value.filter(l => l.type === 'guida' || l.type === 'visita')
  } else if (activeTab.value === 'prenotazioni_teoria') {
    return allLessons.value.filter(l => l.type === 'lezione' || l.type === 'teoria')
  }
  return []
})

const futureLessons = computed(() => {
  const now = new Date().getTime()
  return filteredLessons.value.filter(l => {
    if (!l.start_time) return false;
    const d = l.start_time?.toDate ? l.start_time.toDate().getTime() : new Date(l.start_time).getTime()
    return !isNaN(d) && d >= now
  }).reverse() // Mostriamo le più vicine per prime (reverse dato che l'array originale è desc)
})

const pastLessons = computed(() => {
  const now = new Date().getTime()
  return filteredLessons.value.filter(l => {
    if (!l.start_time) return true;
    const d = l.start_time?.toDate ? l.start_time.toDate().getTime() : new Date(l.start_time).getTime()
    return isNaN(d) || d < now
  })
})

const formatDate = (timestamp: any) => {
  if (!timestamp) return '-'
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    if (isNaN(date.getTime())) return '-'
    return new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)
  } catch (e) {
    return '-'
  }
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
