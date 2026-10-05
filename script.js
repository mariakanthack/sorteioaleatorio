// ==========================================
// BANCO DE NOMES DE INGREDIENTES MÁGICOS
// ==========================================
const INGREDIENTS_LIST = [
  { name: "Pó de Estrela", icon: "✨" },
  { name: "Olho de Tritão", icon: "👁️" },
  { name: "Asa de Morcego", icon: "🦇" },
  { name: "Lágrima de Fênix", icon: "🔥" },
  { name: "Escama de Dragão", icon: "🐉" },
  { name: "Raiz de Mandrágora", icon: "🌱" },
  { name: "Cogumelo Brilhante", icon: "🍄" },
  { name: "Essência de Lua", icon: "🌙" },
  { name: "Teia de Uraneia", icon: "🕸️️" },
  { name: "Pena de Hipogrifo", icon: "🪶" },
  { name: "Orvalho Solar", icon: "☀️" },
  { name: "Cristal Místico", icon: "💎" },
  { name: "Sombra Congelada", icon: "❄️" },
  { name: "Cabelo de Sereia", icon: "🧜‍♀️" }
];

// ==========================================
// ESTADO DO JOGO E VARIÁVEIS
// Meta padrão = 13 (garante 97 combinações de 121 = 80.2% de vitória)
// ==========================================
let targetValue = 13;
let isRolling = false;
let soundEnabled = true;
let streak = 0;

let stats = {
  total: 0,
  wins: 0,
  losses: 0
};

// ==========================================
// SINTETIZADOR DE ÁUDIO WEB AUDIO API
// ==========================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
  if (!soundEnabled) return;
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const now = audioCtx.currentTime;

  if (type === 'spin') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280 + Math.random() * 80, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.07);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.07);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  } 
  else if (type === 'win') {
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const noteOsc = audioCtx.createOscillator();
      const noteGain = audioCtx.createGain();
      noteOsc.type = 'sine';
      noteOsc.frequency.setValueAtTime(freq, now + idx * 0.09);
      noteGain.gain.setValueAtTime(0.2, now + idx * 0.09);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.35);
      noteOsc.connect(noteGain);
      noteGain.connect(audioCtx.destination);
      noteOsc.start(now + idx * 0.09);
      noteOsc.stop(now + idx * 0.09 + 0.35);
    });
  } 
  else if (type === 'lose') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.linearRampToValueAtTime(50, now + 0.35);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }
  else if (type === 'click') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  const btn = document.getElementById('btn-sound');
  btn.innerText = soundEnabled ? '🔊 Som: LIGADO' : '🔇 Som: DESLIGADO';
  if (soundEnabled) playSound('click');
}

// ==========================================
// CÁLCULO DA PROBABILIDADE TEÓRICA EXATA
// ==========================================
function calculateTheoreticalWinrate(target) {
  let wins = 0;
  const totalPossible = 121; // 11 x 11 combinações (0 a 10)

  for (let a = 0; a <= 10; a++) {
    for (let b = 0; b <= 10; b++) {
      if ((a + b) <= target) {
        wins++;
      }
    }
  }

  return ((wins / totalPossible) * 100).toFixed(1);
}

// ==========================================
// CONTROLES DE META E MODO
// ==========================================
function setMode(mode) {
  playSound('click');
  document.getElementById('btn-easy').classList.toggle('active', mode === 'easy');
  document.getElementById('btn-hard').classList.toggle('active', mode === 'hard');

  if (mode === 'easy') {
    targetValue = 13; // Meta 13 = ~80.2% de vitória
  } else if (mode === 'hard') {
    targetValue = 9;  // Meta 9 = ~45.5% de vitória
  }

  document.getElementById('slider-target').value = targetValue;
  document.getElementById('input-target').value = targetValue;
  updateTargetUI();
}

function syncTargetFromSlider(val) {
  targetValue = parseInt(val);
  document.getElementById('input-target').value = targetValue;
  clearModeButtonsActive();
  updateTargetUI();
}

function syncTargetFromInput(val) {
  let parsed = parseInt(val);
  if (isNaN(parsed)) parsed = 13;
  if (parsed < 0) parsed = 0;
  if (parsed > 20) parsed = 20;

  targetValue = parsed;
  document.getElementById('slider-target').value = targetValue;
  document.getElementById('input-target').value = targetValue;
  clearModeButtonsActive();
  updateTargetUI();
}

function clearModeButtonsActive() {
  document.getElementById('btn-easy').classList.remove('active');
  document.getElementById('btn-hard').classList.remove('active');
}

function updateTargetUI() {
  const rate = calculateTheoreticalWinrate(targetValue);
  document.getElementById('recipe-target').innerText = `Meta: Poder Total DEVE ser ≤ ${targetValue}`;
  document.getElementById('expected-rate').innerText = rate + "%";
  document.getElementById('bar-expected').style.width = Math.min(rate, 100) + "%";
}

// ==========================================
// AÇÃO PRINCIPAL DO JOGO (SORTEIO MÁGICO)
// ==========================================
function brewPotion() {
  if (isRolling) return;
  isRolling = true;

  playSound('click');

  const btn = document.getElementById('btn-brew');
  const cauldron = document.getElementById('cauldron');
  const resultMsg = document.getElementById('result-message');
  
  btn.disabled = true;
  resultMsg.innerText = "";
  resultMsg.className = "result-message";
  cauldron.classList.add('shake');

  let ticks = 0;
  const maxTicks = 14;

  const interval = setInterval(() => {
    const temp1 = Math.floor(Math.random() * 11);
    const temp2 = Math.floor(Math.random() * 11);

    const randName1 = INGREDIENTS_LIST[Math.floor(Math.random() * INGREDIENTS_LIST.length)];
    const randName2 = INGREDIENTS_LIST[Math.floor(Math.random() * INGREDIENTS_LIST.length)];

    document.getElementById('slot-1').innerText = temp1;
    document.getElementById('name-1').innerText = `${randName1.icon} ${randName1.name}`;

    document.getElementById('slot-2').innerText = temp2;
    document.getElementById('name-2').innerText = `${randName2.icon} ${randName2.name}`;

    document.getElementById('slot-total').innerText = "?";
    document.getElementById('name-total').innerText = "Misturando...";

    playSound('spin');
    ticks++;

    if (ticks >= maxTicks) {
      clearInterval(interval);
      finalizeBrew();
    }
  }, 70);
}

function finalizeBrew() {
  // Sorteio dos valores e dos nomes de ingredientes
  const val1 = Math.floor(Math.random() * 11);
  const val2 = Math.floor(Math.random() * 11);
  const total = val1 + val2;

  const ing1 = INGREDIENTS_LIST[Math.floor(Math.random() * INGREDIENTS_LIST.length)];
  let ing2 = INGREDIENTS_LIST[Math.floor(Math.random() * INGREDIENTS_LIST.length)];

  // Evita selecionar o exato mesmo ingrediente se houver mais de um na lista
  if (ing1.name === ing2.name) {
    ing2 = INGREDIENTS_LIST[(INGREDIENTS_LIST.indexOf(ing2) + 1) % INGREDIENTS_LIST.length];
  }

  document.getElementById('slot-1').innerText = val1;
  document.getElementById('name-1').innerText = `${ing1.icon} ${ing1.name}`;

  document.getElementById('slot-2').innerText = val2;
  document.getElementById('name-2').innerText = `${ing2.icon} ${ing2.name}`;

  document.getElementById('slot-total').innerText = total;
  document.getElementById('name-total').innerText = `Poção Resultante`;

  const cauldron = document.getElementById('cauldron');
  const resultMsg = document.getElementById('result-message');
  cauldron.classList.remove('shake');

  const isWin = total <= targetValue;
  stats.total++;

  if (isWin) {
    stats.wins++;
    streak++;
    cauldron.classList.add('win-anim');
    setTimeout(() => cauldron.classList.remove('win-anim'), 600);

    resultMsg.innerText = `✨ Sucesso! A mistura de ${ing1.name} + ${ing2.name} gerou uma Poção Perfeita com Poder ${total} (≤ ${targetValue})! 🎉`;
    resultMsg.classList.add('win');
    playSound('win');
    triggerConfetti();
  } else {
    stats.losses++;
    streak = 0;
    resultMsg.innerText = `💥 Puf! A reatividade entre ${ing1.name} e ${ing2.name} gerou Poder ${total} (ultrapassou ${targetValue}) e o caldeirão explodiu!`;
    resultMsg.classList.add('lose');
    playSound('lose');
  }

  document.getElementById('streak-badge').innerText = `🔥 Combo: ${streak}`;
  updateStats();

  document.getElementById('btn-brew').disabled = false;
  isRolling = false;
}

// ==========================================
// ESTATÍSTICAS E CONFETES
// ==========================================
function updateStats() {
  document.getElementById('stat-total').innerText = stats.total;
  document.getElementById('stat-wins').innerText = stats.wins;
  document.getElementById('stat-losses').innerText = stats.losses;

  const winrate = stats.total > 0 ? ((stats.wins / stats.total) * 100).toFixed(1) : 0;
  
  document.getElementById('stat-winrate').innerText = winrate + "%";
  document.getElementById('actual-rate-text').innerText = winrate + "%";
  document.getElementById('bar-actual').style.width = Math.min(winrate, 100) + "%";
}

function triggerConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.7 }
    });
  }
}

// ==========================================
// PARTÍCULAS NO FUNDO
// ==========================================
function initBgCanvas() {
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  const particles = Array.from({ length: 45 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 3.5 + 1,
    speedY: Math.random() * 0.7 + 0.2,
    opacity: Math.random() * 0.6 + 0.2
  }));

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(224, 176, 255, ${p.opacity})`;
      ctx.fill();

      p.y -= p.speedY;
      if (p.y < 0) {
        p.y = canvas.height;
        p.x = Math.random() * canvas.width;
      }
    });
    requestAnimationFrame(animate);
  }
  animate();
}

window.addEventListener('DOMContentLoaded', () => {
  setMode('easy');
  initBgCanvas();
});