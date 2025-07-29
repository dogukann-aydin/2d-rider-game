const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("startScreen");
const startButton = document.getElementById("startButton");
const timer = document.getElementById("timer");
const gameOverScreen = document.getElementById("gameOverScreen");
const restartButton = document.getElementById("restartButton");
const scoreDisplay = document.getElementById("score");
const gameArea = document.getElementById("gameArea");
const pauseButton = document.getElementById("pauseButton");

const coinSound = new Audio("assets/audio/audio1.wav");

const coinImage = new Image();
coinImage.src = "assets/img/coin.png";

const riderImage = new Image();
riderImage.src = "assets/img/rider.png";

let riderWidth = 140;
let riderHeight = 120;
let riderX = canvas.width / 2 - riderWidth / 2;
let riderY = canvas.height - 140; // rider starting position
let riderInitialX = riderX;
const riderLimitLeft = 55;
const riderLimitRight = 55;

const riderPaddingX = 20;
const riderPaddingY = 20;

let scrollSpeed = 2;
const minSpeed = 1;
const maxSpeed = 10;
const moveSpeed = 10;

let bg1Y = 0;
let bg2Y = -canvas.height;

let gameStarted = false;
let gameOver = false;
let paused = false;
let timeLeft = 40;
let timerInterval = null;
let score = 0;
let coins = [];
let lastCoinTimestamp = 0;

function updateScore() {
  scoreDisplay.innerText = `Score: ${score}`;
}

function drawBackgroundScene(ctx, yOffset) {
  const sandColor = "#F5C57D";
  const grassColor = "#6B954C";
  const seaColor = "#4DB9AF";
  const beachStripColor = "#F1D08D";
  const roadLineColor = "#EFECE5";
  const umbrellaRed = "#D84F6C";
  const umbrellaWhite = "#FAF5ED";
  const treeTrunk = "#8C4F2F";
  const leafGreen = "#3B803F";

  const roadWidth = 220;
  const roadX = (canvas.width - roadWidth) / 2;

  ctx.fillStyle = sandColor;
  ctx.fillRect(0, yOffset, roadX, canvas.height);

  ctx.fillStyle = grassColor;
  ctx.fillRect(roadX, yOffset, roadWidth, canvas.height);

  ctx.fillStyle = beachStripColor;
  ctx.fillRect(roadX + roadWidth, yOffset, 10, canvas.height);

  ctx.fillStyle = seaColor;
  ctx.fillRect(roadX + roadWidth + 10, yOffset, canvas.width - (roadX + roadWidth + 10), canvas.height);

  ctx.fillStyle = roadLineColor;
  const laneLineWidth = 8;
  const laneLineHeight = 40;
  const laneLineSpacing = 60;
  const centerX = roadX + roadWidth / 2 - laneLineWidth / 2;

  for (let y = -laneLineHeight; y < canvas.height + laneLineHeight; y += laneLineHeight + laneLineSpacing) {
    ctx.fillRect(centerX, y + yOffset, laneLineWidth, laneLineHeight);
  }

  function drawPalmTree(x, y) {
    const shiftX = x - 8;
    ctx.fillStyle = treeTrunk;
    ctx.fillRect(shiftX, y + yOffset, 8, 40);
    ctx.fillStyle = leafGreen;
    const r = 20;
    ctx.beginPath();
    ctx.arc(shiftX + 4, y + yOffset, r, 0, Math.PI * 2);
    ctx.fill();
  }

  drawPalmTree(60, 100);
  drawPalmTree(60, 300);
  drawPalmTree(60, 500);

  function drawUmbrella(x, y, radius) {
    const shiftX = x - 8;
    const segments = 6;
    for (let i = 0; i < segments; i++) {
      ctx.beginPath();
      ctx.moveTo(shiftX, y + yOffset);
      const angle1 = (i * 2 * Math.PI) / segments;
      const angle2 = ((i + 1) * 2 * Math.PI) / segments;
      ctx.arc(shiftX, y + yOffset, radius, angle1, angle2);
      ctx.fillStyle = i % 2 === 0 ? umbrellaRed : umbrellaWhite;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(shiftX, y + yOffset + radius * 0.4, radius * 1.1, 0, Math.PI, true);
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    ctx.fill();
  }

  drawUmbrella(60, 400, 30);
}

let animationFrameId = null;

function drawBackground(timestamp) {
  if (!gameStarted || gameOver || paused) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const bg1YInt = Math.floor(bg1Y);
  const bg2YInt = Math.floor(bg2Y);

  drawBackgroundScene(ctx, bg1YInt);
  drawBackgroundScene(ctx, bg2YInt);

  bg1Y += scrollSpeed;
  bg2Y += scrollSpeed;

  if (bg1Y >= canvas.height) bg1Y = bg2Y - canvas.height;
  if (bg2Y >= canvas.height) bg2Y = bg1Y - canvas.height;

  if (timestamp - lastCoinTimestamp > 1000) {
    spawnCoin();
    lastCoinTimestamp = timestamp;
  }

  updateCoins();
  drawCoins();
  ctx.drawImage(riderImage, riderX, riderY, riderWidth, riderHeight);
  checkCoinCollision();

  animationFrameId = requestAnimationFrame(drawBackground);
}

function startCountdown() {
  timer.innerText = timeLeft;
  timerInterval = setInterval(() => {
    if (!paused) {
      timeLeft--;
      timer.innerText = timeLeft;
      if (timeLeft <= 0) endGame();
    }
  }, 1000);
}

function spawnCoin() {
  const roadCenterX = canvas.width / 2;
  const roadWidth = 140;
  const roadMinX = roadCenterX - roadWidth / 2;
  const roadMaxX = roadCenterX + roadWidth / 2 - 40;
  const x = Math.random() * (roadMaxX - roadMinX) + roadMinX;
  const y = -40;
  coins.push({ x, y });
}

function drawCoins() {
  for (let coin of coins) {
    ctx.drawImage(coinImage, coin.x, coin.y, 40, 40);
  }
}

function updateCoins() {
  for (let coin of coins) {
    coin.y += scrollSpeed;
  }
  coins = coins.filter(coin => coin.y < canvas.height + 40);
}

function checkCoinCollision() {
  coins = coins.filter((coin) => {
    const collided =
      riderX + riderPaddingX < coin.x + 40 &&
      riderX + riderWidth - riderPaddingX > coin.x &&
      riderY + riderPaddingY < coin.y + 40 &&
      riderY + riderHeight - riderPaddingY > coin.y;

    if (collided) {
      coinSound.currentTime = 0;
      coinSound.play();
      score += 200;
      updateScore();
      return false;
    }
    return true;
  });
}

function endGame() {
  gameOver = true;
  clearInterval(timerInterval);
  gameOverScreen.style.display = "flex";
  scoreDisplay.style.display = "none";
}

function togglePause() {
  if (!gameStarted || gameOver) return;
  paused = !paused;
  pauseButton.innerHTML = paused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
  if (!paused) requestAnimationFrame(drawBackground);
}

startButton.addEventListener("click", () => {
  startScreen.style.display = "none";
  resetGameState();
});

restartButton.addEventListener("click", resetGameState);
pauseButton.addEventListener("click", togglePause);

window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    togglePause();
    return;
  }
  if (!gameStarted || gameOver || paused) return;

  const minX = riderInitialX - riderLimitLeft;
  const maxX = riderInitialX + riderLimitRight;

  switch (e.key) {
    case "ArrowLeft":
      riderX = Math.max(minX, riderX - moveSpeed);
      break;
    case "ArrowRight":
      riderX = Math.min(maxX, riderX + moveSpeed);
      break;
    case "ArrowUp":
      scrollSpeed = Math.min(scrollSpeed + 1, maxSpeed);
      break;
    case "ArrowDown":
      scrollSpeed = Math.max(scrollSpeed - 1, minSpeed);
      break;
  }
});

gameArea.addEventListener("click", function (e) {
  if (!gameStarted || gameOver || paused) return;

  const areaCenter = gameArea.getBoundingClientRect().left + gameArea.offsetWidth / 2;
  const clickX = e.clientX;
  const minX = riderInitialX - riderLimitLeft;
  const maxX = riderInitialX + riderLimitRight;

  if (clickX < areaCenter) {
    riderX = Math.max(minX, riderX - moveSpeed);
  } else {
    riderX = Math.min(maxX, riderX + moveSpeed);
  }
});

gameArea.addEventListener("touchstart", function (e) {
  if (e.touches.length === 1) {
    const touch = e.touches[0];
    const isLeft = touch.clientX < gameArea.getBoundingClientRect().left + gameArea.offsetWidth / 2;
    const minX = riderInitialX - riderLimitLeft;
    const maxX = riderInitialX + riderLimitRight;

    if (isLeft) {
      riderX = Math.max(minX, riderX - moveSpeed);
    } else {
      riderX = Math.min(maxX, riderX + moveSpeed);
    }
  }
}, { passive: true });

function resetGameState() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  gameStarted = true;
  gameOver = false;
  paused = false;
  timeLeft = 40;
  scrollSpeed = 2;
  score = 0;
  coins = [];
  lastCoinTimestamp = 0;

  riderX = canvas.width / 2 - riderWidth / 2;
  riderInitialX = riderX;
  bg1Y = 0;
  bg2Y = -canvas.height;

  updateScore();
  timer.style.display = "block";
  scoreDisplay.style.display = "block";
  gameOverScreen.style.display = "none";
  pauseButton.innerHTML = '<i class="fas fa-pause"></i>';

  animationFrameId = requestAnimationFrame(drawBackground);
  startCountdown();
}

function resizeCanvas() {
  const container = document.getElementById("gameArea");
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;

  bg1Y = 0;
  bg2Y = -canvas.height;

  riderX = canvas.width / 2 - riderWidth / 2;
  riderInitialX = riderX;

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  if (gameStarted && !gameOver && !paused) {
    animationFrameId = requestAnimationFrame(drawBackground);
  } else {
    drawStaticBackground(); // If the game hasn't started, redraw the static background
  }
}

function drawStaticBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackgroundScene(ctx, 0);
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("load", resizeCanvas);

window.addEventListener("load", () => {
  gameOverScreen.style.display = "none";
  timer.style.display = "none";
  scoreDisplay.style.display = "none";

  resizeCanvas(); // Canvas size
  drawStaticBackground(); // Draw background before game starts
});

window.addEventListener("resize", () => {
  riderX = canvas.width / 2 - riderWidth / 2;
  riderInitialX = riderX;
});
