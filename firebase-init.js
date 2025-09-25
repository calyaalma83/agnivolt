// === Firebase Init ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCHvLP731nG0J4emMOrZRhI3wOFfFF7gck",
  authDomain: "agnivolt-c61a6.firebaseapp.com",
  projectId: "agnivolt-c61a6",
  storageBucket: "agnivolt-c61a6.firebasestorage.app",
  messagingSenderId: "453833599474",
  appId: "1:453833599474:web:bc3e76ca1deeea0969a36b"
};

// Inisialisasi Firebase App
const app = initializeApp(firebaseConfig);

// Export service yang dipakai
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);