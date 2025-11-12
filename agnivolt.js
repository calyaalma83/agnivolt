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
      indicator?.classList.add("online");
      indicator?.classList.remove("offline");
      if (indicatorText) indicatorText.textContent = "Terhubung";
    } else {
      indicator?.classList.add("offline");
      indicator?.classList.remove("online");
      if (indicatorText) indicatorText.textContent = "Tidak terhubung";
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
      const name = user.displayName || (user.email ? user.email.split("@")[0] : "User");
      const initial = name.charAt(0).toUpperCase();
      if (miniAvatar) miniAvatar.textContent = initial;
      if (userNameEl) userNameEl.textContent = name;

      if (miniAvatar) miniAvatar.style.visibility = "visible";
      if (userNameEl) userNameEl.style.visibility = "visible";

      startDashboard(); // mulai chart
    } else {
      window.location.href = "./login/login.html";
    }
  });

  // === LOGIKA DASHBOARD ===
  function startDashboard() {
    // data realtime (hanya diisi dari PLTMH)
    let realtimeData = { labels: [], voltage: [], current: [], power: [], rpm: [] };

    const ctx = document.getElementById("realtimeChart")?.getContext?.("2d");
    const chart = ctx
      ? new Chart(ctx, {
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
        })
      : null;

    function setChartData(source) {
      if (!chart) return;
      chart.data.labels = source.labels;
      chart.data.datasets = [
        { label: "Tegangan (V)", data: source.voltage, borderColor: "#e53e3e", tension: 0.4, fill: false },
        { label: "Arus (A)", data: source.current, borderColor: "#3182ce", tension: 0.4, fill: false },
        { label: "Daya (W)", data: source.power, borderColor: "#38a169", tension: 0.4, fill: false },
        { label: "RPM", data: source.rpm, borderColor: "#d69e2e", yAxisID: "y1", tension: 0.4, fill: false },
      ];
      chart.update();
    }

    // helper: aman parsing number (terima "0,2" atau 0.2)
    function parseNumberSafe(v) {
      if (v === null || v === undefined) return 0;
      if (typeof v === "number") return v;
      if (typeof v === "string") {
        // replace comma decimal to dot, remove spaces
        const normalized = v.replace(/\s+/g, "").replace(",", ".");
        const n = Number(normalized);
        return Number.isFinite(n) ? n : 0;
      }
      return 0;
    }

    // helper: show small toast (informasi)
    function showToast(text, duration = 2000) {
      const toast = document.createElement("div");
      toast.className = "toast-message";
      toast.textContent = text;
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0,0,0,0.85);
        color: white;
        padding: 10px 16px;
        border-radius: 8px;
        z-index: 100000;
        opacity: 0;
        transition: opacity 0.2s ease;
        font-size: 14px;
      `;
      document.body.appendChild(toast);
      requestAnimationFrame(() => (toast.style.opacity = "1"));
      setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 250);
      }, duration);
    }

    // === REALTIME DATABASE ===
    const pltmhRef = ref(db, "PLTMH");

    onValue(pltmhRef, (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.val();

      // ambil data dengan parsing aman (terima string "0,2" juga)
      const voltage = parseNumberSafe(data.Tegangan_V);
      const current = parseNumberSafe(data.Arus_mA);
      const power = parseNumberSafe(data.Daya_mW);
      const rpm = parseNumberSafe(data.RPM_Turbin);
      const totalEnergy = parseNumberSafe(data.Total_Energi_mWh);

      // Update card di dashboard (cek elemen ada)
      const elVoltage = document.getElementById("voltage");
      const elCurrent = document.getElementById("current");
      const elPower = document.getElementById("power");
      const elRpm = document.getElementById("rpm");
      const elTotalPower = document.getElementById("totalPower");
      const elDuration = document.getElementById("duration");
      const elEfficiency = document.getElementById("efficiency");

      if (elVoltage) elVoltage.textContent = isFinite(voltage) ? voltage.toFixed(2) : "0.00";
      if (elCurrent) elCurrent.textContent = isFinite(current) ? current.toFixed(2) : "0.00";
      if (elPower) elPower.textContent = isFinite(power) ? power.toFixed(2) : "0.00";
      if (elRpm) elRpm.textContent = isFinite(rpm) ? rpm.toFixed(2) : "0.00";
      if (elTotalPower) elTotalPower.textContent = isFinite(totalEnergy) ? totalEnergy.toFixed(6) : "0.000000";
      if (elDuration) elDuration.textContent = new Date().toLocaleTimeString();

      // Efficiency: data history/parameter rated nggak ada, jadi tunjukkan "N/A" kalau belum bisa dihitung
      if (elEfficiency) {
        // kalau mau logika hitung, ganti bagian ini dengan rumus yang valid berdasarkan data nyata
        elEfficiency.textContent = "N/A";
      }

      // Tambah ke chart data realtime (sliding window)
      const timeLabel = new Date().toLocaleTimeString();
      realtimeData.labels.push(timeLabel);
      realtimeData.voltage.push(voltage);
      realtimeData.current.push(current);
      realtimeData.power.push(power);
      realtimeData.rpm.push(rpm);

      // jaga panjang array maksimal 20 (bisa disesuaikan)
      const MAX_POINTS = 20;
      if (realtimeData.labels.length > MAX_POINTS) {
        Object.keys(realtimeData).forEach((key) => realtimeData[key].shift());
      }

      // update chart jika tab realtime aktif atau default
      const activeTab = document.querySelector(".tab-button.active");
      if (!activeTab || activeTab.dataset.chartType === "realtime") {
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
          if (chartTitle) chartTitle.textContent = "Grafik Monitoring Real-time";
          setChartData(realtimeData);
        } else if (btn.dataset.chartType === "daily" || btn.dataset.chartType === "weekly") {
          // history belum tersedia — beri tahu user (nanti bisa diganti untuk ambil dari node History)
          if (chartTitle) chartTitle.textContent = btn.dataset.chartType === "daily" ? "Grafik Monitoring Harian" : "Grafik Monitoring Mingguan";
          showToast("Data history belum tersedia. Fitur harian/mingguan akan tampil setelah data history disimpan.", 3000);
          // tetap tampilkan realtime sebagai fallback
          setChartData(realtimeData);
        }
      });
    });

    // Set awal ke realtime
    setChartData(realtimeData);
  }

  // === FUNGSI AI ASSISTANT ===

  // PENTING: Pastikan display awal hidden
  if (aiOverlay) {
    aiOverlay.style.display = "none";
  }

  // Event listener untuk membuka AI chat
  if (openAiBtn) {
    openAiBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("Opening AI Assistant..."); // Debug

      if (aiOverlay) {
        // Paksa semua style yang diperlukan
        aiOverlay.style.cssText = `
          display: flex !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          z-index: 99999 !important;
          align-items: center !important;
          justify-content: flex-end !important;
          pointer-events: auto !important;
          visibility: visible !important;
          opacity: 1 !important;
        `;

        console.log("AI Overlay displayed with styles");
        console.log("Computed style:", window.getComputedStyle(aiOverlay).display);
      }
    });
  }

  // Event listener untuk menutup AI chat
  if (closeAiBtn) {
    closeAiBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("Closing AI Assistant..."); // Debug

      if (aiOverlay) {
        aiOverlay.style.display = "none";
      }
    });
  }

  // Klik backdrop juga menutup
  if (aiBackdrop) {
    aiBackdrop.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (aiOverlay) {
        aiOverlay.style.display = "none";
      }
    });
  }

  // Enable/disable tombol kirim
  if (chatInput && sendBtn) {
    chatInput.addEventListener("input", () => {
      sendBtn.disabled = !chatInput.value.trim();
    });

    // Kirim pesan dengan Enter
    chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !sendBtn.disabled) {
        e.preventDefault();
        sendBtn.click();
      }
    });
  }

  // Event listener untuk tombol kirim
  if (sendBtn) {
    sendBtn.addEventListener("click", async () => {
      const msg = chatInput.value.trim();
      if (!msg) return;

      // Append pesan user
      appendMessage("user", msg, miniAvatar?.textContent || "U");
      chatInput.value = "";
      sendBtn.disabled = true;

      // Tampilkan loading
      const loadingId = appendMessage("ai", "Mengetik...", "🤖");

      try {
        // Generate respons AI
        const response = await generateAIResponse(msg);

        // Hapus loading message
        const loadingMsg = document.getElementById(loadingId);
        if (loadingMsg) {
          loadingMsg.remove();
        }

        // Tampilkan respons AI
        appendMessage("ai", response, "🤖");
      } catch (error) {
        console.error("Error generating AI response:", error);

        // Hapus loading message
        const loadingMsg = document.getElementById(loadingId);
        if (loadingMsg) {
          loadingMsg.remove();
        }

        // Tampilkan error message
        appendMessage("ai", "Maaf, terjadi kesalahan. Silakan coba lagi.", "🤖");
      } finally {
        sendBtn.disabled = false;
      }
    });
  }

  // Fungsi untuk menambahkan pesan ke chat
  function appendMessage(sender, text, avatar) {
    if (!chatMessages) return;

    const msgRow = document.createElement("div");
    const uniqueId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    msgRow.id = uniqueId;
    msgRow.className = `message-row ${sender}`;
    msgRow.innerHTML = `
      <div class="message-avatar">${avatar}</div>
      <div class="message-bubble">${text}</div>`;

    chatMessages.appendChild(msgRow);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return uniqueId;
  }

  // Fungsi untuk generate respons AI
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

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "Tidak ada respons dari AI.";
    } catch (error) {
      console.error("AI API Error:", error);
      throw error;
    }
  }
});

// === DROPDOWN PROFILE ===
const userInfoButton = document.getElementById("userInfoButton");
const profileDropdown = document.getElementById("profileDropdown");
const dropdownIcon = document.getElementById("dropdownIcon");

if (userInfoButton && profileDropdown && dropdownIcon) {
  userInfoButton.addEventListener("click", (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle("show");
    dropdownIcon.classList.toggle("rotate");
  });

  document.addEventListener("click", (e) => {
    if (!userInfoButton.contains(e.target) && !profileDropdown.contains(e.target)) {
      profileDropdown.classList.remove("show");
      dropdownIcon.classList.remove("rotate");
    }
  });
}

// === AKSI TOMBOL DROPDOWN ===
const profileItem = document.querySelector(".dropdown-item:nth-child(1)");
const settingsItem = document.querySelector(".dropdown-item:nth-child(2)");
const logoutItem = document.querySelector(".dropdown-item.logout");

if (profileItem) {
  profileItem.addEventListener("click", () => {
    window.location.href = "/profile/profile.html";
  });
}

if (settingsItem) {
  settingsItem.addEventListener("click", () => {
    const toast = document.createElement("div");
    toast.className = "toast-message";
    toast.textContent = "Pengaturan belum tersedia";
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(102, 126, 234, 0.95);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 100000;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "1";
    }, 100);

    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 2000);
  });
}

if (logoutItem) {
  logoutItem.addEventListener("click", () => {
    const toast = document.createElement("div");
    toast.className = "toast-message";
    toast.textContent = "Memproses logout...";
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(102, 126, 234, 0.95);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 100000;
    `;
    document.body.appendChild(toast);

    signOut(auth)
      .then(() => {
        toast.textContent = "Logout berhasil!";
        setTimeout(() => {
          window.location.href = "/login/login.html";
        }, 1000);
      })
      .catch((error) => {
        console.error("Gagal logout:", error);
        toast.textContent = "Terjadi kesalahan saat logout. Silakan coba lagi.";
        toast.style.background = "rgba(239, 68, 68, 0.95)";
        setTimeout(() => {
          toast.remove();
        }, 3000);
      });
  });
}
