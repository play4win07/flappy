const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const menu = document.getElementById("menu");
const startBtn = document.getElementById("startBtn");
const themeSelect = document.getElementById("themeSelect");
const avatars = document.querySelectorAll(".avatar");

let selectedAvatar = 1;
let selectedTheme = "normal";

// Avatar select
avatars.forEach(a => {
  a.addEventListener("click", () => {
    avatars.forEach(av => av.classList.remove("selected"));
    a.classList.add("selected");
    selectedAvatar = parseInt(a.dataset.id);
  });
});

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Themes
const themes = {
  normal: ["#4a90e2", "#50e3c2"],
  freefire: ["#111", "#ff9100"],
  instagram: ["#833ab4", "#fd1d1d", "#fcb045"]
};

let birdImg = new Image();
let jumpSound = new Audio();
let hitSound = new Audio();

let jumpReady = false;
let hitReady = false;

// ---- START GAME ----
startBtn.addEventListener("click", startGame);

async function preloadAudio(audio, src) {
  return new Promise(resolve => {
    audio.src = src;
    audio.load();
    audio.addEventListener("canplaythrough", () => resolve(true), { once: true });
  });
}

async function startGame() {
  selectedTheme = themeSelect.value;

  const avatarFiles = {
    1: { img: "sim.png", jump: "tung.mp3", hit: "sahur.mp3" },
    2: { img: "acp.png", jump: "aruk.mp3", hit: "lemdc.mp3" },
    3: { img: "amit.png", jump: "aag.mp3", hit: "mkb.mp3" }
  };

  const files = avatarFiles[selectedAvatar];
  birdImg.src = files.img;

  jumpSound.pause();
  hitSound.pause();

  jumpReady = false;
  hitReady = false;

  // Preload both sounds fully
  await Promise.all([
    preloadAudio(jumpSound, files.jump).then(() => (jumpReady = true)),
    preloadAudio(hitSound, files.hit).then(() => (hitReady = true))
  ]);

  // Chrome warm-up fix (instant playback)
  jumpSound.volume = 0;
  jumpSound.play().then(() => {
    jumpSound.pause();
    jumpSound.volume = 1;
    jumpSound.currentTime = 0;
  }).catch(() => {});

  menu.style.display = "none";
  canvas.style.display = "block";

  initGame();
}

// --- GAME VARIABLES ---
let bird, pipes, frame, distance, level, gap, pipeSpeed, gameOver, hitOnce;

function initGame() {
  bird = { x: 100, y: 250, w: 60, h: 60, vel: 0, gravity: 0.6, lift: -10 };
  pipes = [];
  frame = 0;
  distance = 0;
  level = 1;
  gap = 200;
  pipeSpeed = 3;
  gameOver = false;
  hitOnce = false;

  jumpSound.pause();
  hitSound.pause();
  jumpSound.currentTime = 0;
  hitSound.currentTime = 0;

  update();
}

function backgroundGradient() {
  let t = themes[selectedTheme];
  let gradient;
  if (selectedTheme === "instagram") {
    gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, t[0]);
    gradient.addColorStop(0.5, t[1]);
    gradient.addColorStop(1, t[2]);
  } else {
    gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, t[0]);
    gradient.addColorStop(1, t[1]);
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawBird() {
  ctx.drawImage(birdImg, bird.x, bird.y, bird.w, bird.h);
}

function drawPipes() {
  ctx.fillStyle = selectedTheme === "freefire" ? "#ff9800" : "#34c759";
  pipes.forEach(p => {
    ctx.fillRect(p.x, 0, p.w, p.top);
    ctx.fillRect(p.x, canvas.height - p.bottom, p.w, p.bottom);
  });
}

function updatePipes() {
  if (frame % 100 === 0) {
    let top = Math.random() * (canvas.height / 3) + 80;
    pipes.push({ x: canvas.width, w: 80, top, bottom: canvas.height - (top + gap) });
  }
  pipes.forEach(p => (p.x -= pipeSpeed));
  pipes = pipes.filter(p => p.x + p.w > 0);
}

function checkCollision() {
  let collisionOccurred = false;
  for (let p of pipes) {
    if (
      bird.x < p.x + p.w &&
      bird.x + bird.w > p.x &&
      (bird.y < p.top || bird.y + bird.h > canvas.height - p.bottom)
    ) {
      collisionOccurred = true;
      break;
    }
  }
  if (bird.y + bird.h >= canvas.height || bird.y <= 0) collisionOccurred = true;

  if (collisionOccurred && !hitOnce) {
    hitOnce = true;
    gameOver = true;

    // Stop jump sound instantly
    jumpSound.pause();
    jumpSound.currentTime = 0;

    // Play hit sound instantly (only if preloaded)
    if (hitReady) {
      hitSound.pause();
      hitSound.currentTime = 0;
      hitSound.play().catch(() => {});
    }
  }
}

function drawHUD() {
  ctx.fillStyle = "#fff";
  ctx.font = "bold 24px Poppins";
  ctx.fillText(`Distance: ${distance} m`, 30, 40);
  ctx.fillText(`Level: ${level}`, 30, 70);
}

function updateLevel() {
  if (distance >= 1000 && level < 10) {
    level++;
    pipeSpeed += 0.5;
    gap -= 10;
    distance = 0;
  }
}

function update() {
  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 60px Poppins";
    ctx.fillText("GAME OVER", canvas.width / 2 - 180, canvas.height / 2);
    ctx.font = "24px Poppins";
    ctx.fillText("Press Space / Enter to Restart", canvas.width / 2 - 160, canvas.height / 2 + 50);
    return;
  }

  backgroundGradient();
  bird.vel += bird.gravity;
  bird.y += bird.vel;

  updatePipes();
  drawPipes();
  drawBird();
  checkCollision();
  drawHUD();

  frame++;
  if (frame % 5 === 0) distance += 5;
  updateLevel();

  requestAnimationFrame(update);
}

function jumpAction() {
  if (gameOver) {
    initGame();
  } else if (jumpReady) {
    bird.vel = bird.lift;

    jumpSound.pause();
    jumpSound.currentTime = 0;
    jumpSound.play().catch(() => {});
  }
}

canvas.addEventListener("click", jumpAction);
window.addEventListener("keydown", e => {
  if (e.code === "Space" || e.code === "Enter") jumpAction();
});
