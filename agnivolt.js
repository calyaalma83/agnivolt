import { db } from "./firebase-init.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";
import { auth } from "./firebase-init.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

// === KONSTANTA AI ===
const GEMINI_API_KEY = "AIzaSyBE_27Q5mMbOOzXDbnTpSarb69xMoBrppo";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;

// === Saat halaman siap ===
document.addEventListener("DOMContentLoaded", () => {
  const miniAvatar = document.querySelector(".user-avatar-header");
  const userNameEl = document.querySelector(".user-name");
  const chatMessages = document.getElementById("chatMessages");
  const chatInput = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendAiMessageButton");

  // ======== CONNECTION INDICATOR ========
  const indicator = document.getElementById("connectionIndicator");
  const indicatorText = document.getElementById("indicatorText");
  const indicatorDot = document.getElementById("indicatorDot");

  const connectionRef = ref(db, ".info/connected");
  onValue(connectionRef, (snapshot) => {
    const connected = snapshot.val();
    if (connected) {
      indicator.classList.add("online");
      indicator.classList.remove("offline");
      indicatorText.textContent = "Terhubung";
    } else {
      indicator.classList.add("offline");
      indicator.classList.remove("online");
      indicatorText.textContent = "Tidak terhubung";
    }
  });

  // Tombol AI Assistant
  const openAiBtn = document.getElementById("openAiAssistantButton");
  const closeAiBtn = document.getElementById("closeAiAssistantButton");
  const aiOverlay = document.getElementById("aiOverlay");
  const aiBackdrop = document.getElementById("aiBackdrop");

  // === LOGIN CHECK ===
  onAuthStateChanged(auth, (user) => {
    if (user) {
      const name = user.displayName || user.email.split("@")[0];
      const initial = name.charAt(0).toUpperCase();
      miniAvatar.textContent = initial;
      userNameEl.textContent = name;

      miniAvatar.style.visibility = "visible";
      userNameEl.style.visibility = "visible";

      startDashboard(); // mulai chart
    } else {
      window.location.href = "./login/login.html";
    }
  });

  // === LOGIKA DASHBOARD ===
  function startDashboard() {
    let realtimeData = { labels: [], voltage: [], current: [], power: [], rpm: [] };

    const dailyData = {
      labels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"],
      voltage: [12, 12.5, 13, 12.8, 12.7, 12.4],
      current: [2.5, 2.7, 3.2, 3.1, 2.9, 2.6],
      power: [30, 34, 41, 39, 36, 32],
      rpm: [420, 440, 480, 470, 460, 430]
    };

    const weeklyData = {
      labels: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"],
      voltage: [12.4, 12.6, 12.8, 12.7, 12.9, 12.5, 12.3],
      current: [2.8, 3.0, 3.1, 2.9, 3.2, 2.7, 2.6],
      power: [33, 37, 39, 36, 41, 32, 30],
      rpm: [430, 450, 470, 455, 480, 440, 420]
    };

    const ctx = document.getElementById("realtimeChart").getContext("2d");
    const chart = new Chart(ctx, {
      type: "line",
      data: { labels: [], datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { title: { display: true, text: "V / A / W" } },
          y1: { position: "right", title: { display: true, text: "RPM" }, grid: { drawOnChartArea: false } },
        },
        plugins: { legend: { display: true, position: "top" } },
      },
    });

    function setChartData(source) {
      chart.data.labels = source.labels;
      chart.data.datasets = [
        { label: "Tegangan (V)", data: source.voltage, borderColor: "#e53e3e", tension: 0.4 },
        { label: "Arus (A)", data: source.current, borderColor: "#3182ce", tension: 0.4 },
        { label: "Daya (W)", data: source.power, borderColor: "#38a169", tension: 0.4 },
        { label: "RPM", data: source.rpm, borderColor: "#d69e2e", yAxisID: "y1", tension: 0.4 },
      ];
      chart.update();
    }

    // === REALTIME DATABASE ===
    const pltmhRef = ref(db, "PLTMH");

    onValue(pltmhRef, (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.val();

      const voltage = data.Tegangan_V || 0;
      const current = data.Arus_mA || 0;
      const power = data.Daya_mW || 0;
      const rpm = data.RPM_Turbin || 0;
      const totalEnergy = data.Total_Energi_mWh || 0;

      // Update card di dashboard
      document.getElementById("voltage").textContent = voltage.toFixed(2);
      document.getElementById("current").textContent = current.toFixed(2);
      document.getElementById("power").textContent = power.toFixed(2);
      document.getElementById("rpm").textContent = rpm.toFixed(2);
      document.getElementById("totalPower").textContent = totalEnergy.toFixed(4);
      document.getElementById("duration").textContent = new Date().toLocaleTimeString();
      document.getElementById("efficiency").textContent = (85 + Math.random() * 10).toFixed(0);

      // Tambah ke chart data
      const timeLabel = new Date().toLocaleTimeString();
      realtimeData.labels.push(timeLabel);
      realtimeData.voltage.push(voltage);
      realtimeData.current.push(current);
      realtimeData.power.push(power);
      realtimeData.rpm.push(rpm);

      if (realtimeData.labels.length > 10) {
        Object.keys(realtimeData).forEach((key) => realtimeData[key].shift());
      }

      const activeTab = document.querySelector(".tab-button.active");
      if (activeTab && activeTab.dataset.chartType === "realtime") {
        setChartData(realtimeData);
      }
    });

    // === Ganti Tab ===
    document.querySelectorAll(".tab-button").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-button").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const chartTitle = document.getElementById("chartTitle");

        if (btn.dataset.chartType === "realtime") {
          chartTitle.textContent = "Grafik Monitoring Real-time";
          setChartData(realtimeData);
        } else if (btn.dataset.chartType === "daily") {
          chartTitle.textContent = "Grafik Monitoring Harian";
          setChartData(dailyData);
        } else if (btn.dataset.chartType === "weekly") {
          chartTitle.textContent = "Grafik Monitoring Mingguan";
          setChartData(weeklyData);
        }
      });
    });

    // Set awal
    setChartData(realtimeData);
  }

  // === FUNGSI AI ASSISTANT ===
  openAiBtn.addEventListener("click", () => aiOverlay.style.display = "flex");
  closeAiBtn.addEventListener("click", () => aiOverlay.style.display = "none");
  aiBackdrop.addEventListener("click", () => aiOverlay.style.display = "none");

  chatInput.addEventListener("input", () => sendBtn.disabled = !chatInput.value.trim());

  sendBtn.addEventListener("click", async () => {
    const msg = chatInput.value.trim();
    if (!msg) return;
    appendMessage("user", msg, miniAvatar.textContent);
    chatInput.value = "";
    sendBtn.disabled = true;
    const response = await generateAIResponse(msg);
    appendMessage("ai", response, "🤖");
  });

  function appendMessage(sender, text, avatar) {
    const msgRow = document.createElement("div");
    msgRow.className = `message-row ${sender}`;
    msgRow.innerHTML = `
      <div class="message-avatar">${avatar}</div>
      <div class="message-bubble">${text}</div>`;
    chatMessages.appendChild(msgRow);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function generateAIResponse(message) {
    const systemContext = `
Anda adalah asisten AI untuk sistem monitoring PLTMH bernama Agnivolt.
Tugas: bantu user memahami data monitoring, menjelaskan performa sistem,
dan memberi insight atau saran maintenance jika perlu.
Gunakan Bahasa Indonesia yang jelas dan profesional.`;

    const body = {
      contents: [{ parts: [{ text: systemContext + "\n\nPertanyaan user: " + message }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 300 },
    };

    try {
      const res = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "Tidak ada respons dari AI.";
    } catch {
      return "Terjadi kesalahan saat menghubungi AI.";
    }
  }
});

// === DROPDOWN PROFILE ===
const userInfoButton = document.getElementById("userInfoButton");
const profileDropdown = document.getElementById("profileDropdown");
const dropdownIcon = document.getElementById("dropdownIcon");

userInfoButton.addEventListener("click", () => {
  profileDropdown.classList.toggle("show");
  dropdownIcon.classList.toggle("rotate");
});

document.addEventListener("click", (e) => {
  if (!userInfoButton.contains(e.target) && !profileDropdown.contains(e.target)) {
    profileDropdown.classList.remove("show");
    dropdownIcon.classList.remove("rotate");
  }
});

// === AKSI TOMBOL DROPDOWN ===
const profileItem = profileDropdown.querySelector(".dropdown-item:nth-child(1)");
const settingsItem = profileDropdown.querySelector(".dropdown-item:nth-child(2)");
const logoutItem = profileDropdown.querySelector(".dropdown-item.logout");

profileItem.addEventListener("click", () => window.location.href = "/profile/profile.html");

settingsItem.addEventListener("click", () => {
  const toast = document.createElement("div");
  toast.className = "toast-message";
  toast.textContent = "Pengaturan belum tersedia";
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 100);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2000);
});

logoutItem.addEventListener("click", () => {
  signOut(auth) 
    .then(() => {
      toast.textContent = "Logout berhasil!";
      window.location.href = "/login/login.html";
    })
    .catch((error) => {
      console.log("Gagal logout:", error);
      toast.textContent = "Terjadi kesalahan saat logout. Silahkan coba lagi.";
    });
});