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

let bird, pipes = [], score = 0, highScore = 0, gameRunning = false, isPaused = false;
const gravity = 0.6, jump = -10;
let frames = 0, lastPipe = 0;

// Preload bird images
const birdImages = {};
const birdOptions = ['bird1.png', 'bird2.png'];

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
// Bird object
// -------------------------------------------------
class Bird {
    constructor(src) {
        this.img = birdImages[src];
        this.w = 60; this.h = 44;
        this.x = canvas.width * 0.2;
        this.y = canvas.height / 2;
        this.vel = 0;
    }
    update() {
        if (isPaused) return;
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
        if (isPaused) return;
        this.x -= this.speed;
        if (this.x + this.w < 0) {
            pipes = pipes.filter(p => p !== this);
        }
        if (!this.passed && this.x + this.w < bird.x) {
            this.passed = true;
            score++;
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('flappyHighScore', highScore);
                highScoreEl.textContent = `High Score: ${highScore}`;
            }
        }
    }
    draw() {
        const pipeColor = '#2d5016';
        const capColor = '#1e3a0d';
        // Top pipe
        ctx.fillStyle = pipeColor;
        ctx.fillRect(this.x, 0, this.w, this.top);
        ctx.fillStyle = capColor;
        ctx.fillRect(this.x - 10, this.top - 40, this.w + 20, 40);

        // Bottom pipe
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

    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#87CEEB');
    grad.addColorStop(1, '#E0F7FA');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update & draw bird
    bird.update();
    bird.draw();

    // Spawn pipes
    if (frames - lastPipe > 90) {
        pipes.push(new Pipe());
        lastPipe = frames;
    }

    // Update & draw pipes
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
        if (e.target.closest('.ui-btn')) return;
    }
    bird.flap();
    e.preventDefault();
}

canvas.addEventListener('mousedown', flap);
canvas.addEventListener('touchstart', flap);
document.addEventListener('keydown', flap);

// -------------------------------------------------
// Pause System
// -------------------------------------------------
let pausedOverlay = null;

function togglePause() {
    if (!gameRunning) return;
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? 'RESUME' : 'PAUSE';

    if (isPaused) {
        // Create paused overlay
        pausedOverlay = document.createElement('div');
        pausedOverlay.id = 'paused';
        pausedOverlay.textContent = 'PAUSED';
        document.body.appendChild(pausedOverlay);
    } else {
        // Remove paused overlay
        if (pausedOverlay) {
            pausedOverlay.remove();
            pausedOverlay = null;
        }
        loop(); // Resume loop
    }
}

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

    // Reset UI
    isPaused = false;
    pauseBtn.textContent = 'PAUSE';
    if (pausedOverlay) {
        pausedOverlay.remove();
        pausedOverlay = null;
    }

    // Reset game state
    bird = new Bird(currentBird);
    pipes = [];
    score = 0;
    frames = 0;
    lastPipe = -100;
    gameRunning = true;
    loop();
}

function endGame() {
    gameRunning = false;
    finalScore.textContent = `Score: ${score}`;
    highScoreEl.textContent = `High Score: ${highScore}`;
    gameover.classList.remove('hidden');
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

// UI Buttons
restartBtn2.onclick = () => startGame(currentBird);
menuBtn2.onclick = () => goToMenu();

function goToMenu() {
    game.classList.add('hidden');
    menu.classList.remove('hidden');
    gameRunning = false;
    isPaused = false;
    if (pausedOverlay) {
        pausedOverlay.remove();
        pausedOverlay = null;
    }
}

// -------------------------------------------------
// Preload & Init
// -------------------------------------------------
window.addEventListener('load', () => {
    preloadBirds();
    setTimeout(() => {}, 100);
});
