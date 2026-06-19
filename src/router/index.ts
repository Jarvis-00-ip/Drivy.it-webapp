import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '../firebase'
import { useAuthUser, authReady } from '../composables/useAuthUser'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { left: 0, top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'Dashboard',
      component: () => import('../views/Dashboard.vue'),
      meta: {
        title: 'Dashboard',
        requiresAuth: true
      },
    },
    {
      path: '/signin',
      name: 'Signin',
      component: () => import('../views/Auth/Signin.vue'),
      meta: {
        title: 'Sign In',
        requiresGuest: true
      },
    },
    {
      path: '/calendar',
      name: 'Calendar',
      component: () => import('../views/CalendarView.vue'),
      meta: {
        title: 'Calendario Guide',
        requiresAuth: true
      },
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('../views/ProfileView.vue'),
      meta: {
        title: 'Profilo Autoscuola',
        requiresAuth: true
      },
    },
    {
      path: '/staff',
      name: 'Staff',
      component: () => import('../views/StaffManagement.vue'),
      meta: {
        title: 'Gestione Staff',
        requiresAuth: true,
        requiresAdmin: true
      },
    },
    {
      path: '/platform',
      name: 'Platform',
      component: () => import('../views/PlatformManagement.vue'),
      meta: {
        title: 'Gestione Piattaforma',
        requiresAuth: true,
        requiresAdmin: true
      },
    }
  ],
})

router.beforeEach(async (to, from, next) => {
  document.title = `${to.meta.title} | Drivy.it Webapp`
  
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest);
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin);

  // Attende che l'auth Firebase + la fetch del documento Firestore siano completati
  await authReady;

  const currentUser = auth.currentUser;
  const { userRole } = useAuthUser();

  if (requiresAuth && !currentUser) {
    next('/signin');
  } else if (requiresAuth && currentUser) {
    if (userRole.value === 'student') {
      alert("Accesso negato. Questa piattaforma è riservata alle Autoscuole.");
      await auth.signOut();
      next('/signin');
    } else if (userRole.value === 'instructor' && (requiresAdmin || to.path === '/')) {
      // Istruttori non possono vedere la dashboard principale ne la gestione staff
      next('/calendar');
    } else {
      next();
    }
  } else if (requiresGuest && currentUser) {
    if (userRole.value === 'instructor') {
      next('/calendar');
    } else {
      next('/');
    }
  } else {
    next();
  }
})

export default router
