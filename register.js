import { auth } from "./firebase-init.js";
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } 
  from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

// Toggle show/hide password
document.getElementById("toggleRegisterPassword").addEventListener("click", () => {
  const input = document.getElementById("registerPassword");
  input.type = input.type === "password" ? "text" : "password";
});

// Register email & password
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("registerName").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });

    alert("Registrasi berhasil!");
    window.location.href = "agnivolt.html";
  } catch (error) {
    alert("Registrasi gagal: " + error.message);
  }
});

// Register/Login dengan Google
document.getElementById("googleRegister").addEventListener("click", async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
    alert("Google Auth berhasil!");
    window.location.href = "agnivolt.html";
  } catch (error) {
    alert("Google Auth gagal: " + error.message);
  }
});