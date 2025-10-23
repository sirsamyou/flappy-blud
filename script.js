// -------------------------------------------------
// GLOBALS
// -------------------------------------------------
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');
const game = document.getElementById('game');
const uiScore = document.getElementById('score');
const menuHigh = document.getElementById('menuHigh');
const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');
const menuBtn = document.getElementById('menuBtn');
const pauseOverlay = document.getElementById('pause');
const gameover = document.getElementById('gameover');
const finalScore = document.getElementById('finalScore');
const newRecord = document.getElementById('newRecord');
const restartBtn2 = document.getElementById('restartBtn2');
const menuBtn2 = document.getElementById('menuBtn2');

let bird, pipes = [], score = 0, highScore = 0;
let gameRunning = false, paused = false;
const GRAVITY = 0.6, JUMP = -11;
let frames = 0, currentBird = null;

// Load high score
highScore = parseInt(localStorage.getItem('flappyBludHigh') || '0');
menuHigh.textContent = highScore;

// Preload bird images
const birdImages = {};
function preloadBird(src) {
    const img = new Image();
    img.src = 'assets/' + src;
    birdImages[src] = img;
}
preloadBird('bird1.png');
preloadBird('bird2.png');

// -------------------------------------------------
// RESIZE
// -------------------------------------------------
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// -------------------------------------------------
// BIRD
// -------------------------------------------------
class Bird {
    constructor(src) {
        this.img = birdImages[src];
        this.w = 60; this.h = 44;  // SAME HITBOX
        this.x = 100;
        this.y = canvas.height / 2;
        this.vel = 0;
    }
    update() {
        if (!gameRunning || paused) return;
        this.vel += GRAVITY;
        this.y += this.vel;
        if (this.y + this.h > canvas.height - 80 || this.y < 0) this.die();
    }
    draw() {
        ctx.drawImage(this.img, this.x - this.w/2, this.y - this.h/2, this.w, this.h);
    }
    flap() {
        if (!gameRunning || paused) return;
        this.vel = JUMP;
    }
    die() { endGame(); }
}

// -------------------------------------------------
// PIPE
// -------------------------------------------------
class Pipe {
    constructor() {
        this.gap = 150;
        this.w = 70;
        this.top = Math.random() * (canvas.height - this.gap - 200) + 80;
        this.bottom = this.top + this.gap;
        this.x = canvas.width;
        this.speed = 3;
        this.passed = false;
    }
    update() {
        this.x -= this.speed;
        if (this.x + this.w < 0) pipes = pipes.filter(p => p !== this);
        if (!this.passed && this.x + this.w < bird.x) {
            this.passed = true;
            score++;
            uiScore.textContent = score;
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('flappyBludHigh', highScore);
                menuHigh.textContent = highScore;
            }
        }
    }
    draw() {
        ctx.fillStyle = '#6b8e23';
        ctx.fillRect(this.x, 0, this.w, this.top);
        ctx.fillRect(this.x, this.bottom, this.w, canvas.height - this.bottom - 80);
        ctx.fillRect(this.x - 5, this.top - 30, this.w + 10, 30);
        ctx.fillRect(this.x - 5, this.bottom, this.w + 10, 30);
    }
    hits(b) {
        return b.x + b.w/2 > this.x && b.x - b.w/2 < this.x + this.w &&
               (b.y - b.h/2 < this.top || b.y + b.h/2 > this.bottom);
    }
}

// -------------------------------------------------
// GROUND
// -------------------------------------------------
function drawGround() {
    ctx.fillStyle = '#7fb800';
    ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, canvas.height - 80, canvas.width, 3);
}

// -------------------------------------------------
// GAME LOOP
// -------------------------------------------------
function loop() {
    if (!gameRunning || paused) {
        requestAnimationFrame(loop);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Sky
    ctx.fillStyle = '#5c94fc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Pipes
    if (frames % 90 === 0) pipes.push(new Pipe());
    pipes.forEach(p => { p.update(); p.draw(); if (p.hits(bird)) bird.die(); });

    // Bird
    bird.update();
    bird.draw();

    // Ground
    drawGround();

    frames++;
    requestAnimationFrame(loop);
}

// -------------------------------------------------
// INPUT
// -------------------------------------------------
function flap(e) {
    if (e.type === 'keydown' && e.code !== 'Space') return;
    if (paused || !gameRunning) return;
    bird.flap();
}
canvas.addEventListener('mousedown', flap);
canvas.addEventListener('touchstart', flap);
document.addEventListener('keydown', e => {
    if (e.code === 'Space') flap(e);
    if (e.code === 'KeyP') togglePause();
});

// -------------------------------------------------
// PAUSE
// -------------------------------------------------
function togglePause() {
    if (!gameRunning) return;
    paused = !paused;
    pauseOverlay.classList.toggle('hidden');
    pauseBtn.textContent = paused ? 'RESUME' : 'PAUSE';
}

// -------------------------------------------------
// GAME FLOW
// -------------------------------------------------
function startGame(birdSrc) {
    currentBird = birdSrc;
    menu.classList.add('hidden');
    game.classList.remove('hidden');
    gameover.classList.add('hidden');
    pauseOverlay.classList.add('hidden');
    restartBtn.classList.add('hidden');
    menuBtn.classList.add('hidden');
    pauseBtn.classList.remove('hidden');
    pauseBtn.textContent = 'PAUSE';

    bird = new Bird(currentBird);
    pipes = []; score = 0; frames = 0;
    uiScore.textContent = '0';
    paused = false; gameRunning = true;
    loop();
}

function endGame() {
    gameRunning = false;
    finalScore.textContent = `SCORE: ${score}`;
    newRecord.classList.toggle('hidden', score <= highScore);
    gameover.classList.remove('hidden');
    restartBtn.classList.remove('hidden');
    menuBtn.classList.remove('hidden');
    pauseBtn.classList.add('hidden');
}

// -------------------------------------------------
// BIRD SELECTION — FIXED & WORKING
// -------------------------------------------------
document.querySelectorAll('.bird-select button').forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove selected from all
        document.querySelectorAll('.bird-select button').forEach(b => b.classList.remove('selected'));
        // Add to clicked
        btn.classList.add('selected');
        // Start game with chosen bird
        startGame(btn.dataset.bird);
    });
});

// UI Buttons
pauseBtn.onclick = togglePause;
restartBtn.onclick = () => startGame(currentBird);
menuBtn.onclick = goToMenu;
restartBtn2.onclick = () => startGame(currentBird);
menuBtn2.onclick = goToMenu;

function goToMenu() {
    game.classList.add('hidden');
    menu.classList.remove('hidden');
    gameRunning = false;
}
