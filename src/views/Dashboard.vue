<template>
  <AdminLayout>
    <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 class="text-title-md2 font-semibold text-black dark:text-white">
          Dashboard Autoscuola
        </h2>
      </div>

      <!-- Statistiche in tempo reale -->
      <DashboardStats />

      <!-- Layout a 2 colonne su schermi larghi -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 2xl:gap-7.5">
        <CodesManager class="h-full" />
        <StudentsList class="h-full" />
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import AdminLayout from "@/components/layout/AdminLayout.vue";
import DashboardStats from "@/components/DashboardStats.vue";
import CodesManager from "@/components/CodesManager.vue";
import StudentsList from "@/components/StudentsList.vue";
</script>

<style></style>
