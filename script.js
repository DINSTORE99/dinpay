const API = "https://my-payment.autsc.my.id";
const API_KEY = "fcddf332-c491-450e-8909-7b398833d2d7";
const TARGET = 35000;

let countdownInterval;
let isLoading = false;
let currentSaldo = 0;


document.getElementById("refreshBtn").onclick = refreshSaldo;
document.getElementById("customBtn").onclick = customQRIS;


function animateSaldo(target) {
  const el = document.getElementById("saldo");
  const start = currentSaldo;
  const duration = 700;
  let startTime = null;
  
  function animate(time) {
    if (!startTime) startTime = time;
    let progress = time - startTime;
    
    let value = Math.floor(start + (target - start) * (progress / duration));
    if (progress >= duration) value = target;
    
    el.innerText = "Rp " + value.toLocaleString();
    
    if (progress < duration) {
      requestAnimationFrame(animate);
    } else {
      currentSaldo = target;
    }
  }
  
  requestAnimationFrame(animate);
}


async function loadSaldo() {
  try {
    const res = await fetch(`${API}/api/saldo?apikey=${API_KEY}`);
    const data = await res.json();
    
    let saldo = Number(data?.data?.saldo || 0);
    animateSaldo(saldo);
    
    let kurang = TARGET - saldo;
    if (kurang < 0) kurang = 0;
    
    document.getElementById("kurang").innerText =
      kurang === 0 ? "✅ Sudah cukup!" :
      "Kurang Rp " + kurang.toLocaleString();
    
  } catch {
    document.getElementById("saldo").innerText = "Error";
  }
}


async function refreshSaldo() {
  if (isLoading) return;
  
  const btn = document.getElementById("refreshBtn");
  isLoading = true;
  
  btn.classList.add("loading");
  btn.innerHTML = `<span class="spinner"></span> Loading...`;
  
  await loadSaldo();
  
  setTimeout(() => {
    btn.classList.remove("loading");
    btn.innerHTML = "🔄 Refresh Saldo";
    isLoading = false;
  }, 800);
}


function pindahQRIS() {
  const box = document.getElementById("qrisBox");
  const cards = document.querySelectorAll(".card");
  
  if (!box.classList.contains("moved")) {
    const parent = cards[0].parentNode;
    
    if (cards.length >= 3) {
      parent.insertBefore(box, cards[2]); 
      box.classList.add("moved");
    }
  }
}


async function buatQRIS(amount) {
  if (amount < 1) {
    alert("Minimal 1");
    return;
  }
  
  const box = document.getElementById("qrisBox");
  
  pindahQRIS();
  
  document.getElementById("qrisImg").src = "";
  document.getElementById("info").innerHTML = "";
  document.getElementById("timer").innerText = "";
  
  box.style.display = "block";
  box.scrollIntoView({ behavior: "smooth", block: "start" });
  
  document.getElementById("status").innerText = "Membuat QRIS...";
  
  try {
    const res = await fetch(`${API}/api/deposit?amount=${amount}&apikey=${API_KEY}`);
    const data = await res.json();
    
    if (data.status !== "success") {
      document.getElementById("status").innerText = "Gagal membuat QRIS ❌";
      return;
    }
    
    const d = data.data;
    
    const fee = Number(d.fee || 0);
    const total = Number(d.total_amount || amount);
    
    const expiredTime = new Date(Date.now() + 5 * 60 * 1000);
    
    document.getElementById("qrisImg").src = d.qris_url;
    
    document.getElementById("status").innerText = "Menunggu pembayaran...";
    document.getElementById("status").className = "status wait";
    
    document.getElementById("info").innerHTML = `
      💰 Fee: Rp ${fee.toLocaleString()} <br>
      💵 Total: Rp ${total.toLocaleString()} <br>
      ⏳ Expired: 5 menit
    `;
    
    startCountdown(expiredTime);
    cekStatus(d.transaction_id);
    
  } catch {
    document.getElementById("status").innerText = "Error membuat QRIS ❌";
  }
}

function customQRIS() {
  let val = parseInt(document.getElementById("nominal").value);
  
  if (!val || val < 1) {
    alert("Minimal 1");
    return;
  }
  
  buatQRIS(val);
}

function cekStatus(id) {
  const interval = setInterval(async () => {
    try {
      const res = await fetch(`${API}/api/status/payment?transaction_id=${id}&apikey=${API_KEY}`);
      const data = await res.json();
      
      if (data.paid) {
        document.getElementById("status").innerText = "Pembayaran berhasil ✅";
        document.getElementById("status").className = "status success";
        
        clearInterval(interval);
        loadSaldo();
      }
    } catch {}
  }, 5000);
}

function startCountdown(expiredTime) {
  clearInterval(countdownInterval);
  
  const end = new Date(expiredTime).getTime();
  
  countdownInterval = setInterval(() => {
    const diff = end - Date.now();
    
    if (diff <= 0) {
      clearInterval(countdownInterval);
      
      document.getElementById("timer").innerText = "QRIS expired ❌";
      document.getElementById("status").innerText = "Expired";
      document.getElementById("status").className = "status expired";
      
      return;
    }
    
    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    
    document.getElementById("timer").innerText =
      `Expired dalam ${m}m ${s}s`;
    
  }, 1000);
}


setInterval(loadSaldo, 15000);

loadSaldo();
