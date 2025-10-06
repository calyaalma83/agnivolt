import { auth } from "./firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const miniAvatar = document.getElementById("miniAvatar");

  onAuthStateChanged(auth, (user) => {
    if (user) {
      // ✅ Kalau sudah login
      let initial = "?";
      if (user.displayName && user.displayName.trim() !== "") {
        initial = user.displayName.charAt(0).toUpperCase();
      } else if (user.email) {
        initial = user.email.charAt(0).toUpperCase();
      }
      miniAvatar.textContent = initial;

      if (miniAvatar) {
        miniAvatar.addEventListener("click", () => {
          window.location.href = "./profile/profile.html";
        });
      }

      // === Semua logic dashboard jalan hanya kalau sudah login ===
      startDashboard();

    } else {
      // ❌ Kalau belum login → langsung tendang ke login.html
      window.location.href = "./auth/login.html";
    }
  });
});

// === Fungsi untuk inisialisasi dashboard ===
function startDashboard() {
  // === DATA SIMULASI ===
  let realtimeData = { labels: [], voltage: [], current: [], power: [], rpm: [] };

  const dailyData = {
    labels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"],
    voltage: [12, 12.5, 13, 12.8, 12.7, 12.4],
    current: [2.5, 2.7, 3.2, 3.1, 2.9, 2.6],
    power: [30, 34, 41, 39, 36, 32],
    rpm: [420, 440, 480, 470, 460, 430]
  };

  const weeklyData = {
    labels: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"],
    voltage: [12.4, 12.6, 12.8, 12.7, 12.9, 12.5, 12.3],
    current: [2.8, 3.0, 3.1, 2.9, 3.2, 2.7, 2.6],
    power: [33, 37, 39, 36, 41, 32, 30],
    rpm: [430, 450, 470, 455, 480, 440, 420]
  };

  // === INISIALISASI CHART ===
  const ctx = document.getElementById("realtimeChart").getContext("2d");
  const chart = new Chart(ctx, {
    type: "line",
    data: { labels: [], datasets: [] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { type: "linear", position: "left", title: { display: true, text: "V / A / W" } },
        y1: { type: "linear", position: "right", title: { display: true, text: "RPM" }, grid: { drawOnChartArea: false } }
      },
      plugins: { legend: { display: true, position: "top" } },
      animation: { duration: 500 },
      elements: { point: { radius: 3 } }
    }
  });

  function setChartData(source) {
    chart.data.labels = source.labels;
    chart.data.datasets = [
      { label: "Tegangan (V)", data: source.voltage, borderColor: "#e53e3e", backgroundColor: "rgba(229,62,62,0.1)", tension: 0.4 },
      { label: "Arus (A)", data: source.current, borderColor: "#3182ce", backgroundColor: "rgba(49,130,206,0.1)", tension: 0.4 },
      { label: "Daya (W)", data: source.power, borderColor: "#38a169", backgroundColor: "rgba(56,161,105,0.1)", tension: 0.4 },
      { label: "RPM", data: source.rpm, borderColor: "#d69e2e", backgroundColor: "rgba(214,158,46,0.1)", tension: 0.4, yAxisID: "y1" }
    ];
    chart.update();
  }

  function generateRandomData() {
    const voltage = 12 + Math.random() * 2;
    const current = 2.5 + Math.random() * 1;
    const power = voltage * current;
    const rpm = 400 + Math.random() * 100;
    return { voltage, current, power, rpm };
  }

  function updateRealtimeData() {
    const now = new Date();
    const label = now.toLocaleTimeString();
    const data = generateRandomData();

    document.getElementById("voltage").textContent = data.voltage.toFixed(1);
    document.getElementById("current").textContent = data.current.toFixed(1);
    document.getElementById("power").textContent = data.power.toFixed(0);
    document.getElementById("rpm").textContent = data.rpm.toFixed(0);

    realtimeData.labels.push(label);
    realtimeData.voltage.push(data.voltage);
    realtimeData.current.push(data.current);
    realtimeData.power.push(data.power);
    realtimeData.rpm.push(data.rpm);

    if (realtimeData.labels.length > 10) {
      realtimeData.labels.shift();
      realtimeData.voltage.shift();
      realtimeData.current.shift();
      realtimeData.power.shift();
      realtimeData.rpm.shift();
    }

    const activeTab = document.querySelector(".tab-button.active");
    if (activeTab && activeTab.textContent.includes("Real-time")) {
      setChartData(realtimeData);
    }

    document.getElementById("duration").textContent = (now.getHours() + Math.random()).toFixed(1);
    const totalPower = parseFloat(document.getElementById("totalPower").textContent);
    document.getElementById("totalPower").textContent = (totalPower + data.power / 3600).toFixed(1);
    document.getElementById("efficiency").textContent = (85 + Math.random() * 10).toFixed(0);
  }

  window.switchChart = (type, btn) => {
    document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");

    const chartTitle = document.querySelector(".chart-container h2");

    if (type === "realtime") {
      setChartData(realtimeData);
      chartTitle.textContent = "Grafik Monitoring Real-time";
    } else if (type === "daily") {
      setChartData(dailyData);
      chartTitle.textContent = "Grafik Monitoring Harian";
    } else if (type === "weekly") {
      setChartData(weeklyData);
      chartTitle.textContent = "Grafik Monitoring Mingguan";
    }
  };

  // === Jalankan update realtime ===
  updateRealtimeData();
  setInterval(updateRealtimeData, 3000);

  // Default tampilan realtime
  setChartData(realtimeData);
}