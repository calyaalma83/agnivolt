// === AI Chat ===
  function sendMessage() {
    const input = document.getElementById("chatInput");
    const msg = input.value.trim();
    if (!msg) return;

    const userInitial = document.getElementById("miniAvatar")?.textContent || "U";

    addMessage("user", msg, userInitial);
    setTimeout(() => addMessage("ai", generateAIResponse(msg), "🤖"), 800);

    input.value = "";
  }

  function addMessage(sender, text, avatarText) {
    const messagesDiv = document.getElementById("chatMessages");

    const row = document.createElement("div");
    row.className = `message-row ${sender}`;

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = avatarText || (sender === "ai" ? "🤖" : "U");

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    bubble.innerHTML = text;

    if (sender === "ai") {
      row.appendChild(avatar);
      row.appendChild(bubble);
    } else {
      row.appendChild(bubble);
      row.appendChild(avatar);
    }

    messagesDiv.appendChild(row);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  function generateAIResponse(message) {
    const responses = {
      status: "Sistem PLTMH beroperasi normal. Efisiensi 87%, tegangan 12.5V, RPM 450.",
      masalah: "Tidak ada masalah terdeteksi. Sistem berjalan optimal.",
      maintenance: "Maintenance terakhir 2 minggu lalu. Berikutnya dijadwalkan 4 minggu lagi.",
      efisiensi: "Efisiensi saat ini 87%. Pastikan saluran air bersih dari sampah untuk hasil lebih baik.",
      daya: `Total daya hari ini ${document.getElementById("totalPower").textContent} kWh.`
    };
    const key = Object.keys(responses).find(k => message.toLowerCase().includes(k));
    return key ? responses[key] : "Terima kasih. Untuk info detail, hubungi admin atau lihat dokumentasi Agnivolt.";
  }

  document.getElementById("chatInput").addEventListener("keypress", e => {
    if (e.key === "Enter") sendMessage();
  });
  window.sendMessage = sendMessage;

  const aiFab = document.getElementById("aiFab");
  const aiOverlay = document.getElementById("aiOverlay");
  const aiClose = document.getElementById("aiClose");

  if (aiFab && aiOverlay && aiClose) {
    aiFab.addEventListener("click", () => {
      aiOverlay.style.display = "flex";
    });

    aiClose.addEventListener("click", () => {
      aiOverlay.style.display = "none";
    });
  }