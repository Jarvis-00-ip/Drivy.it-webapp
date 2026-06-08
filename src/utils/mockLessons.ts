import { auth, db } from '@/firebase'
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore'

export const seedMockLessonsIfEmpty = async () => {
  const user = auth.currentUser
  if (!user) return

  try {
    const q = query(collection(db, 'lessons'), where('school_id', '==', user.uid))
    const snapshot = await getDocs(q)
    
    // Se ci sono già più di 10 lezioni, consideriamo il db già popolato
    if (snapshot.size > 10) return

    console.log("Generazione di un set massiccio di mock data (2 mesi)...")

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    // Funzione helper per creare date partendo da oggi
    const addDaysAndHours = (daysOffset: number, hours: number, minutes = 0) => {
      const d = new Date(today)
      d.setDate(d.getDate() + daysOffset)
      d.setHours(hours, minutes, 0, 0)
      return Timestamp.fromDate(d)
    }

    const mockLessons = []
    
    const topicsTeoria = ["Segnali di Precedenza", "Limiti di Velocità", "Incroci e Precedenze", "Assicurazione RCA", "Distanza di Sicurezza", "Fattori di Rischio", "Semafori e Vigili", "Sorpasso"]
    const topicsGuida = ["Parcheggio a S", "Inversione a U", "Guida nel traffico", "Partenza in salita", "Rotatorie", "Autostrada", "Guida notturna"]
    const instructors = ["Mario Rossi", "Luigi Bianchi", "Giulia Verdi", "Antonio Neri"]

    // Generiamo circa 40 eventi sparsi nei prossimi 60 giorni
    for (let i = 1; i <= 60; i++) {
      // Salta le domeniche
      const currentDay = new Date(today)
      currentDay.setDate(currentDay.getDate() + i)
      if (currentDay.getDay() === 0) continue;

      // 30% di probabilità di avere una teoria
      if (Math.random() < 0.3) {
        mockLessons.push({
          school_id: user.uid,
          title: "Teoria Patente B",
          topic: topicsTeoria[Math.floor(Math.random() * topicsTeoria.length)],
          instructor: instructors[Math.floor(Math.random() * instructors.length)],
          type: "lezione",
          start_time: addDaysAndHours(i, 18, 0),
          end_time: addDaysAndHours(i, 19, 30),
          max_students: 20,
          booked_students: [],
          pending_students: []
        })
      }

      // 60% di probabilità di avere 1 o 2 guide al giorno
      if (Math.random() < 0.6) {
        const numGuide = Math.floor(Math.random() * 2) + 1;
        for (let j = 0; j < numGuide; j++) {
          const startHour = 9 + Math.floor(Math.random() * 8); // Dalle 9 alle 16
          mockLessons.push({
            school_id: user.uid,
            title: "Guida Pratica",
            topic: topicsGuida[Math.floor(Math.random() * topicsGuida.length)],
            instructor: instructors[Math.floor(Math.random() * instructors.length)],
            type: "guida",
            start_time: addDaysAndHours(i, startHour, 0),
            end_time: addDaysAndHours(i, startHour + 1, 0),
            max_students: 1,
            booked_students: [],
            pending_students: []
          })
        }
      }

      // 5% di probabilità di avere visite mediche
      if (Math.random() < 0.05) {
        mockLessons.push({
          school_id: user.uid,
          title: "Visita Medica",
          topic: "Rinnovo/Conseguimento",
          instructor: "Dott. " + instructors[Math.floor(Math.random() * instructors.length)].split(" ")[1],
          type: "visita",
          start_time: addDaysAndHours(i, 17, 0),
          end_time: addDaysAndHours(i, 19, 0),
          max_students: 15,
          booked_students: [],
          pending_students: []
        })
      }
    }

    for (const lesson of mockLessons) {
      await addDoc(collection(db, 'lessons'), lesson)
    }

    console.log(`Generati ${mockLessons.length} eventi finti con successo. Aggiorna la pagina se necessario.`)
  } catch (error) {
    console.error("Errore durante la generazione dei mock data:", error)
  }
}
