import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
  ],
  build: {
    // ApexCharts (~575 kB) è già caricato su richiesta, solo nella modale statistiche
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Librerie in chunk separati: restano in cache tra un deploy e l'altro
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          // Analytics resta separato: viene importato in differita in firebase.ts
          if (/analytics|installations/.test(id)) return
          if (id.includes('/firebase/') || id.includes('/@firebase/')) return 'firebase'
          if (/\/node_modules\/(vue|@vue|vue-router)\//.test(id)) return 'vue'
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
