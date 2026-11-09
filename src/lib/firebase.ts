import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCFpbJ-GJYdIh1s8_HYs8nA78hv7eTlmT0",
  authDomain: "myaiclip-b1dcd.firebaseapp.com",
  projectId: "myaiclip-b1dcd",
  storageBucket: "myaiclip-b1dcd.firebasestorage.app",
  messagingSenderId: "111097108832",
  appId: "1:111097108832:web:a86d3cbcc33c34b9576605",
  measurementId: "G-C25GJXGVGE"
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
const auth = getAuth(app)
const db = getFirestore(app)

export { app, auth, db }
