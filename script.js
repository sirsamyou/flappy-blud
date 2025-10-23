// -------------------------------------------------
// Config & globals
// -------------------------------------------------
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');
const game = document.getElementById('game');
const uiScore = document.getElementById('score');
const restartBtn = document.getElementById('restartBtn');
const menuBtn = document.getElementById('menuBtn');
const gameover = document.getElementById('gameover');
const finalScore = document.getElementById('finalScore');
const restartBtn2 = document.getElementById('restartBtn2');
const menuBtn2 = document.getElementById('menuBtn2');

let birdImg, bird, pipes = [], score = 0, gameRunning = false, gravity = 0.6, jump = -10;

// -------------------------------------------------
// Resize canvas to fill window
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
        this.img = new Image();
        this.img.src = 'assets/' + src;
        this.w = 60; this.h = 44;
        this.x = canvas.width * 0.2;
        this.y = canvas.height / 2;
        this.vel = 0;
    }
    update() {
        this.vel += gravity;
        this.y += this.vel;
        if (this.y + this.h > canvas.height) this.die();
        if (this.y < 0) this.y = 0;
    }
    draw() {
        ctx.drawImage(this.img, this.x - this.w/2, this.y - this.h/2, this.w, this.h);
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
        this.x -= this.speed;
        if (this.x + this.w < 0) pipes.splice(pipes.indexOf(this), 1);
        if (!this.passed && this.x + this.w < bird.x) {
            this.passed = true;
            score++;
            uiScore.textContent = score;
        }
    }
    draw() {
        const pipeColor = '#2d5016';
        // top pipe
        ctx.fillStyle = pipeColor;
        ctx.fillRect(this.x, 0, this.w, this.top);
        ctx.fillRect(this.x - 10, this.top - 40, this.w + 20, 40); // cap
        // bottom pipe
        ctx.fillRect(this.x, this.bottom, this.w, canvas.height - this.bottom);
        ctx.fillRect(this.x - 10, this.bottom, this.w + 20, 40); // cap
    }
    hits(b) {
        return b.x + b.w/2 > this.x && b.x - b.w/2 < this.x + this.w &&
               (b.y - b.h/2 < this.top || b.y + b.h/2 > this.bottom);
    }
}

// -------------------------------------------------
// Game loop
// -------------------------------------------------
let lastPipe = 0;
function loop() {
    if (!gameRunning) return;

    ctx.clearRect(0,0,canvas.width,canvas.height);

    // background sky
    const grad = ctx.createLinearGradient(0,0,0,canvas.height);
    grad.addColorStop(0, '#87CEEB');
    grad.addColorStop(1, '#E0F7FA');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // update & draw bird
    bird.update();
    bird.draw();

    // pipes
    if (frames - lastPipe > 90) {  // spawn every ~1.5 s at 60 fps
        pipes.push(new Pipe());
        lastPipe = frames;
    }
    for (let p of pipes) {
        p.update();
        p.draw();
        if (p.hits(bird)) bird.die();
    }

    requestAnimationFrame(loop);
    frames++;
}
let frames = 0;

// -------------------------------------------------
// Input
// -------------------------------------------------
function flap(e) {
    if (e.type === 'keydown' && e.code !== 'Space') return;
    if (e.type === 'click' && e.target !== canvas) return;
    if (gameRunning) bird.flap();
    e.preventDefault();
}
canvas.addEventListener('click', flap);
document.addEventListener('keydown', flap);

// -------------------------------------------------
// Start / Restart / Menu
// -------------------------------------------------
function startGame(birdSrc) {
    birdImg = birdSrc;
    menu.classList.add('hidden');
    game.classList.remove('hidden');
    restartBtn.classList.add('hidden');
    menuBtn.classList.add('hidden');
    gameover.classList.add('hidden');

    // reset state
    bird = new Bird(birdImg);
    pipes = [];
    score = 0;
    uiScore.textContent = '0';
    frames = 0;
    lastPipe = -100;
    gameRunning = true;
    loop();
}
function endGame() {
    gameRunning = false;
    finalScore.textContent = `Score: ${score}`;
    gameover.classList.remove('hidden');
    restartBtn.classList.remove('hidden');
    menuBtn.classList.remove('hidden');
}

// menu buttons
document.querySelectorAll('.bird-select button').forEach(btn => {
    btn.addEventListener('click', () => startGame(btn.dataset.bird));
});

// in-game UI buttons
restartBtn.onclick = () => startGame(birdImg);
menuBtn.onclick = () => { game.classList.add('hidden'); menu.classList.remove('hidden'); };

// game-over buttons
restartBtn2.onclick = () => startGame(birdImg);
menuBtn2.onclick = () => { game.classList.add('hidden'); menu.classList.remove('hidden'); };
