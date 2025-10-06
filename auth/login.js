import { auth } from "../firebase-init.js";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } 
  from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

// Toggle show/hide password
document.getElementById("toggleLoginPassword").addEventListener("click", () => {
  const input = document.getElementById("loginPassword");
  input.type = input.type === "password" ? "text" : "password";
});

// Login email & password
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Login berhasil!");
    window.location.href = "../agnivolt.html";
  } catch (error) {
    alert("Login gagal: " + error.message);
  }
});

// Login Google
document.getElementById("googleLogin").addEventListener("click", async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
    alert("Login Google berhasil!");
    window.location.href = "../agnivolt.html";
  } catch (error) {
    alert("Login Google gagal: " + error.message);
  }
});