// -------------------------------------------------
// Config & globals
// -------------------------------------------------
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');
const game = document.getElementById('game');
const pauseBtn = document.getElementById('pauseBtn');
const gameover = document.getElementById('gameover');
const finalScore = document.getElementById('finalScore');
const highScoreEl = document.getElementById('highScore');
const restartBtn2 = document.getElementById('restartBtn2');
const menuBtn2 = document.getElementById('menuBtn2');
const liveScore = document.getElementById('liveScore');
const uiHighScore = document.getElementById('uiHighScore');
const countdownEl = document.getElementById('countdown');

let bird, pipes = [], score = 0, highScore = 0, gameRunning = false, isPaused = false;
const gravity = 0.6, jump = -10;
let frames = 0, lastPipe = 0;

// Preload all 8 bird images
const birdImages = {};
const birdOptions = [
    'bird1.png', 'bird2.png', 'bird3.png', 'bird4.png',
    'bird5.png', 'bird6.png', 'bird7.png', 'bird8.png'
];

function preloadBirds() {
    birdOptions.forEach(src => {
        const img = new Image();
        img.src = 'assets/' + src;
        birdImages[src] = img;
    });
}

// Load high score
function loadHighScore() {
    const saved = localStorage.getItem('flappyHighScore');
    highScore = saved ? parseInt(saved) : 0;
    uiHighScore.textContent = `BEST: ${highScore}`;
    highScoreEl.textContent = `High Score: ${highScore}`;
}
loadHighScore();

// -------------------------------------------------
// Resize canvas
// -------------------------------------------------
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// -------------------------------------------------
// Bird object — SAME HITBOX FOR ALL
// -------------------------------------------------
class Bird {
    constructor(src) {
        this.img = birdImages[src];
        this.w = 60; this.h = 44;  // FIXED HITBOX
        this.x = canvas.width * 0.2;
        this.y = canvas.height / 2;
        this.vel = 0;
    }
    update() {
        if (isPaused || !gameRunning) return;
        this.vel += gravity;
        this.y += this.vel;
        if (this.y + this.h > canvas.height || this.y < -this.h) this.die();
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        const rot = Math.min(this.vel * 0.05, Math.PI / 3);
        ctx.rotate(rot);
        ctx.drawImage(this.img, -this.w/2, -this.h/2, this.w, this.h);
        ctx.restore();
    }
    flap() { this.vel = jump; }
    die() { endGame(); }
}

// -------------------------------------------------
// Pipe object
// -------------------------------------------------
class Pipe {
    constructor() {
        this.gap = 180;
        this.w = 80;
        this.top = Math.random() * (canvas.height - this.gap - 200) + 100;
        this.bottom = this.top + this.gap;
        this.x = canvas.width;
        this.speed = 4;
        this.passed = false;
    }
    update() {
        if (isPaused || !gameRunning) return;
        this.x -= this.speed;
        if (this.x + this.w < 0) {
            pipes = pipes.filter(p => p !== this);
        }
        if (!this.passed && this.x + this.w < bird.x) {
            this.passed = true;
            score++;
            liveScore.textContent = score;
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('flappyHighScore', highScore);
                uiHighScore.textContent = `BEST: ${highScore}`;
                highScoreEl.textContent = `High Score: ${highScore}`;
            }
        }
    }
    draw() {
        const pipeColor = '#2d5016';
        const capColor = '#1e3a0d';
        ctx.fillStyle = pipeColor;
        ctx.fillRect(this.x, 0, this.w, this.top);
        ctx.fillStyle = capColor;
        ctx.fillRect(this.x - 10, this.top - 40, this.w + 20, 40);
        ctx.fillStyle = pipeColor;
        ctx.fillRect(this.x, this.bottom, this.w, canvas.height - this.bottom);
        ctx.fillStyle = capColor;
        ctx.fillRect(this.x - 10, this.bottom, this.w + 20, 40);
    }
    hits(b) {
        const birdLeft = b.x - b.w/2;
        const birdRight = b.x + b.w/2;
        const birdTop = b.y - b.h/2;
        const birdBottom = b.y + b.h/2;
        return birdRight > this.x && birdLeft < this.x + this.w &&
               (birdTop < this.top || birdBottom > this.bottom);
    }
}

// -------------------------------------------------
// Game loop
// -------------------------------------------------
function loop() {
    if (!gameRunning || isPaused) {
        if (gameRunning && isPaused) requestAnimationFrame(loop);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#87CEEB');
    grad.addColorStop(1, '#E0F7FA');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    bird.update();
    bird.draw();

    if (frames - lastPipe > 90) {
        pipes.push(new Pipe());
        lastPipe = frames;
    }

    for (let i = pipes.length - 1; i >= 0; i--) {
        const p = pipes[i];
        p.update();
        p.draw();
        if (p.hits(bird)) bird.die();
    }

    frames++;
    requestAnimationFrame(loop);
}

// -------------------------------------------------
// Input
// -------------------------------------------------
function flap(e) {
    if (!gameRunning || isPaused) return;
    if (e.type === 'keydown' && e.code !== 'Space') return;
    if (e.type === 'mousedown' || e.type === 'touchstart') {
        if (e.target.closest('.ui-btn') && !isPaused) return;
    }
    bird.flap();
    e.preventDefault();
}

canvas.addEventListener('mousedown', flap);
canvas.addEventListener('touchstart', flap);
document.addEventListener('keydown', flap);

// -------------------------------------------------
// Pause System + 3-2-1 Countdown
// -------------------------------------------------
let pausedOverlay = null;
let countdownActive = false;

function togglePause() {
    if (!gameRunning || countdownActive) return;
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? 'RESUME' : 'PAUSE';

    if (isPaused) {
        pausedOverlay = document.createElement('div');
        pausedOverlay.id = 'paused';
        pausedOverlay.innerHTML = 'PAUSED<br><small>Tap to resume</small>';
        document.body.appendChild(pausedOverlay);
    } else {
        startCountdown();
    }
}

function startCountdown() {
    if (!isPaused) return;
    countdownActive = true;
    isPaused = false;
    pauseBtn.textContent = 'PAUSE';

    if (pausedOverlay) {
        pausedOverlay.remove();
        pausedOverlay = null;
    }

    let count = 3;
    countdownEl.classList.remove('hidden');
    countdownEl.textContent = count;

    const interval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownEl.textContent = count;
        } else {
            countdownEl.classList.add('hidden');
            countdownActive = false;
            requestAnimationFrame(loop);
            clearInterval(interval);
        }
    }, 800);
}

// Tap anywhere to resume when paused
canvas.addEventListener('mousedown', (e) => {
    if (isPaused && !countdownActive && !e.target.closest('#pauseBtn')) {
        startCountdown();
    }
});
canvas.addEventListener('touchstart', (e) => {
    if (isPaused && !countdownActive && !e.target.closest('#pauseBtn')) {
        startCountdown();
    }
});

pauseBtn.addEventListener('click', togglePause);

// -------------------------------------------------
// Start / Restart / Menu
// -------------------------------------------------
let currentBird = null;

function startGame(birdSrc) {
    currentBird = birdSrc;
    menu.classList.add('hidden');
    game.classList.remove('hidden');
    gameover.classList.add('hidden');

    isPaused = false;
    countdownActive = false;
    pauseBtn.textContent = 'PAUSE';
    countdownEl.classList.add('hidden');
    if (pausedOverlay) {
        pausedOverlay.remove();
        pausedOverlay = null;
    }

    bird = new Bird(currentBird);
    pipes = [];
    score = 0;
    liveScore.textContent = '0';
    frames = 0;
    lastPipe = -100;
    gameRunning = true;
    requestAnimationFrame(loop);
}

function endGame() {
    gameRunning = false;
    finalScore.textContent = `Score: ${score}`;
    highScoreEl.textContent = `High Score: ${highScore}`;
    gameover.classList.remove('hidden');
}

function goToMenu() {
    game.classList.add('hidden');
    menu.classList.remove('hidden');
    gameover.classList.add('hidden');
    gameRunning = false;
    isPaused = false;
    countdownActive = false;
    if (pausedOverlay) {
        pausedOverlay.remove();
        pausedOverlay = null;
    }
    countdownEl.classList.add('hidden');
}

// -------------------------------------------------
// Bird selection
// -------------------------------------------------
document.querySelectorAll('.bird-select button').forEach(btn => {
    btn.addEventListener('click', () => {
        const src = btn.dataset.bird;
        document.querySelectorAll('.bird-select button').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        startGame(src);
    });
});

restartBtn2.onclick = () => startGame(currentBird);
menuBtn2.onclick = goToMenu;

// -------------------------------------------------
// Preload & Init
// -------------------------------------------------
window.addEventListener('load', () => {
    preloadBirds();
});
