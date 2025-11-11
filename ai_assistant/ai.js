let messages = [
  {
    sender: "ai",
    text: "Selamat datang! Saya adalah asisten AI untuk sistem PLTMH Anda. Bagaimana saya bisa membantu Anda hari ini?",
    avatar: "🤖",
  },
];

let isLoading = false;
let userInitial = "U";

const GEMINI_API_KEY = "AIzaSyAEGw7E0699PjTBJfUkdnOzN9A5GxE2KTI";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;

// === Fungsi utama ===

// Render pesan ke tampilan
function renderMessages() {
  const chatMessages = document.getElementById("chatMessages");
  chatMessages.innerHTML = "";

  messages.forEach((msg) => {
    const row = document.createElement("div");
    row.classList.add("message-row", msg.sender);

    const avatar = document.createElement("div");
    avatar.classList.add("message-avatar");
    avatar.textContent = msg.avatar;

    const bubble = document.createElement("div");
    bubble.classList.add("message-bubble");
    bubble.innerHTML = msg.text;

    row.appendChild(avatar);
    row.appendChild(bubble);

    chatMessages.appendChild(row);
  });

  // Scroll ke bawah
  scrollToBottom();
}

// Scroll otomatis ke bawah
function scrollToBottom() {
  const chatMessages = document.getElementById("chatMessages");
  setTimeout(() => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 100);
}

// Tutup sidebar (bisa disesuaikan)
function closeChat() {
  const sidebar = document.querySelector(".ai-sidebar");
  const backdrop = document.querySelector(".sidebar-backdrop");
  sidebar.style.display = "none";
  backdrop.style.display = "none";
}

// Kirim pesan user
async function sendMessage() {
  const input = document.getElementById("chatInput");
  const msg = input.value.trim();
  if (!msg) return;

  messages.push({ sender: "user", text: msg, avatar: userInitial });
  renderMessages();
  input.value = "";

  showLoading(true);

  try {
    const response = await generateAIResponse(msg);
    messages.push({ sender: "ai", text: response, avatar: "🤖" });
    renderMessages();
  } catch (err) {
    console.error(err);
    messages.push({
      sender: "ai",
      text: "Maaf, terjadi kesalahan. Silakan coba lagi.",
      avatar: "🤖",
    });
    renderMessages();
  } finally {
    showLoading(false);
  }
}

// Tampilkan animasi loading
function showLoading(show) {
  const loading = document.getElementById("loading");
  loading.style.display = show ? "flex" : "none";
  isLoading = show;
  scrollToBottom();
}

// Fungsi untuk minta respons AI
async function generateAIResponse(message) {
  const systemContext = `
Anda adalah asisten AI untuk sistem monitoring PLTMH (Pembangkit Listrik Tenaga Mikro Hidro) bernama Agnivolt.

Tugas Anda:
1. Membantu user memahami data monitoring PLTMH
2. Memberikan insight tentang performa sistem
3. Menjawab pertanyaan tentang status, efisiensi, dan kondisi PLTMH
4. Memberikan saran maintenance jika diperlukan
5. Menjelaskan data dengan bahasa yang mudah dipahami

Jawab pertanyaan user dengan singkat, jelas, dan profesional dalam Bahasa Indonesia.
`;

  const body = {
    contents: [
      {
        parts: [{ text: systemContext + "\n\nPertanyaan user: " + message }],
      },
    ],
    generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
  };

  const res = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP error ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "Tidak ada respons dari AI.";
}

// Render pertama kali saat halaman dibuka
window.addEventListener("DOMContentLoaded", () => {
  renderMessages();
});