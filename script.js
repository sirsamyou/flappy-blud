// Config & globals
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');
const game = document.getElementById('game');
const pauseBtn = document.getElementById('pauseBtn');
const pausedOverlay = document.getElementById('pausedOverlay');
const resumeBtn = document.getElementById('resumeBtn');
const gameover = document.getElementById('gameover');
const finalScore = document.getElementById('finalScore');
const highScoreEl = document.getElementById('highScore');
const finalBalance = document.getElementById('finalBalance');
const restartBtn2 = document.getElementById('restartBtn2');
const menuBtn2 = document.getElementById('menuBtn2');
const liveScore = document.getElementById('liveScore');
const uiHighScore = document.getElementById('uiHighScore');
const uiBalance = document.getElementById('uiBalance');
const uiLevel = document.getElementById('uiLevel');
const uiProgressBar = document.getElementById('uiProgressBar');
const menuHighScore = document.getElementById('menuHighScore');
const menuBalance = document.getElementById('menuBalance');
const menuLevel = document.getElementById('menuLevel');
const menuProgressBar = document.getElementById('menuProgressBar');
const playTab = document.getElementById('playTab');
const shopTab = document.getElementById('shopTab');
const playScreen = document.getElementById('playScreen');
const shopScreen = document.getElementById('shopScreen');
const currentBirdName = document.getElementById('currentBirdName');
const previewImg = document.getElementById('previewImg');
const prevBirdBtn = document.getElementById('prevBird');
const nextBirdBtn = document.getElementById('nextBird');
const equipBirdBtn = document.getElementById('equipBird');

let bird, pipes = [], coins = [], clouds = [], score = 0, highScore = 0, balance = 0, xp = 0, level = 1, gameRunning = false, isPaused = false;
const gravity = 0.6, jump = -10;
let frames = 0, lastPipe = 0, pipesPassed = 0;

const birdOptions = Array.from({length: 8}, (_, i) => `bird${i+1}.png`);
const birdNames = Array.from({length: 8}, (_, i) => `Bird ${i+1}`);
const birdPrices = { 'bird1.png': 0, 'bird2.png': 10, 'bird3.png': 20, 'bird4.png': 30, 'bird5.png': 40, 'bird6.png': 50, 'bird7.png': 60, 'bird8.png': 70 };
let ownedBirds = ['bird1.png'], currentBirdIndex = 0;

// Preload assets
const birdImages = {}, cloudImg = new Image(), coinImg = new Image();
function preload() {
    birdOptions.forEach(src => {
        const img = new Image();
        img.src = 'assets/' + src;
        birdImages[src] = img;
    });
    cloudImg.src = 'assets/cloud.png';
    coinImg.src = 'assets/coin.png';
}
preload();

// Save/load
function loadSaves() {
    highScore = parseInt(localStorage.getItem('flappyHighScore') || '0');
    balance = parseInt(localStorage.getItem('flappyCoins') || '0');
    xp = parseInt(localStorage.getItem('flappyXP') || '0');
    ownedBirds = JSON.parse(localStorage.getItem('flappyOwnedBirds') || '["bird1.png"]');
    updateLevel();
    updateAllStats();
    updateShop();
    updateEquipMenu();
}
function saveSaves() {
    localStorage.setItem('flappyHighScore', highScore);
    localStorage.setItem('flappyCoins', balance);
    localStorage.setItem('flappyXP', xp);
    localStorage.setItem('flappyOwnedBirds', JSON.stringify(ownedBirds));
}
function updateAllStats() {
    uiHighScore.textContent = `BEST: ${highScore}`;
    uiBalance.textContent = `${balance}`;
    menuHighScore.textContent = `HIGH: ${highScore}`;
    menuBalance.textContent = `COINS: ${balance}`;
    highScoreEl.textContent = `High Score: ${highScore}`;
    finalBalance.textContent = `Coins: ${balance}`;
    uiLevel.textContent = `LVL ${level}`;
    menuLevel.textContent = `LEVEL ${level}`;
}
loadSaves();

// Level System
function updateLevel() {
    let newLevel = 1;
    let totalXP = xp;
    while (totalXP >= newLevel * 40) {
        totalXP -= newLevel * 40;
        newLevel++;
    }
    level = newLevel;
    xp = totalXP;
    const progress = (xp / (level * 40)) * 100;
    uiProgressBar.style.width = `${progress}%`;
    menuProgressBar.style.width = `${progress}%`;
}
function addXP(amount) {
    xp += amount;
    updateLevel();
    saveSaves();
}
function addCoinXP() {
    addXP(1); // 1 XP per coin collected
}

// Resize
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Bird
class Bird {
    constructor(src) {
        this.img = birdImages[src];
        this.w = 60; this.h = 44;
        this.x = canvas.width * 0.2;
        this.y = canvas.height / 2;
        this.vel = 0;
    }
    update() {
        if (isPaused || !gameRunning) return;
        this.vel += gravity;
        this.y += this.vel;
        if (this.y + this.h > canvas.height - 100 || this.y < -this.h) this.die();
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

// Pipe
class Pipe {
    constructor() {
        this.gap = 180;
        this.w = 80;
        this.top = Math.random() * (canvas.height - this.gap - 300) + 150;
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
            return;
        }
        if (!this.passed && this.x + this.w < bird.x) {
            this.passed = true;
            score++;
            pipesPassed++;
            liveScore.textContent = score;
            if (score > highScore) {
                highScore = score;
                saveSaves();
                updateAllStats();
            }
            if (pipesPassed % 20 === 0) addXP(1);
            // Coin every 10-15 pipes, outside gap
            if (pipesPassed % (10 + Math.floor(Math.random() * 6)) === 0) {
                const coinY = Math.random() < 0.5 ? this.top - 60 : this.bottom + 20;
                coins.push(new Coin(this.x + this.w/2, coinY));
            }
        }
    }
    draw() {
        const pipeColor = '#2d5016', capColor = '#1e3a0d';
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
        const bl = b.x - b.w/2, br = b.x + b.w/2;
        const bt = b.y - b.h/2, bb = b.y + b.h/2;
        return br > this.x && bl < this.x + this.w && (bt < this.top || bb > this.bottom);
    }
}

// Coin
class Coin {
    constructor(x, y) {
        this.w = 40; this.h = 40;
        this.x = x;
        this.y = Math.max(50, Math.min(y, canvas.height - 150));
        this.collected = false;
    }
    update() {
        if (isPaused || !gameRunning) return;
        this.x -= 4;
        if (this.x + this.w < 0) coins = coins.filter(c => c !== this);
        if (!this.collected && this.hits(bird)) {
            this.collected = true;
            balance++;
            addCoinXP();
            updateAllStats();
            saveSaves();
        }
    }
    draw() {
        if (this.collected) return;
        ctx.drawImage(coinImg, this.x, this.y, this.w, this.h);
    }
    hits(b) {
        const bl = b.x - b.w/2, br = b.x + b.w/2;
        const bt = b.y - b.h/2, bb = b.y + b.h/2;
        return br > this.x && bl < this.x + this.w && bb > this.y && bt < this.y + this.h;
    }
}

// Clouds
let lastCloudTime = 0;
function spawnCloud() {
    const now = Date.now();
    if (now - lastCloudTime < 4000 + Math.random() * 3000) return;
    clouds.push({
        x: canvas.width + 100,
        y: 50 + Math.random() * (canvas.height * 0.3),
        speed: 0.3 + Math.random() * 0.4,
        wobble: Math.random() * 0.02
    });
    lastCloudTime = now;
}

// Game loop
function loop() {
    if (!gameRunning || isPaused) {
        if (gameRunning && isPaused) requestAnimationFrame(loop);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Sky
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#87CEEB');
    grad.addColorStop(0.5, '#B0E0E6');
    grad.addColorStop(1, '#E0F7FA');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clouds
    spawnCloud();
    clouds.forEach(c => {
        c.x -= c.speed;
        c.y += Math.sin(frames * c.wobble) * 0.5;
        if (c.x + 200 < 0) clouds = clouds.filter(cl => cl !== c);
        ctx.globalAlpha = 0.8;
        ctx.drawImage(cloudImg, c.x, c.y, 200, 120);
        ctx.globalAlpha = 1;
    });

    // Ground
    ctx.fillStyle = '#4a7c59';
    ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
    ctx.fillStyle = '#5d8c4f';
    ctx.fillRect(0, canvas.height - 100, canvas.width, 20);

    bird.update();
    bird.draw();

    if (frames - lastPipe > 90) {
        pipes.push(new Pipe());
        lastPipe = frames;
    }

    pipes.forEach(p => { p.update(); p.draw(); if (p.hits(bird)) bird.die(); });
    coins.forEach(c => { c.update(); c.draw(); });

    frames++;
    requestAnimationFrame(loop);
}

// Input
function flap(e) {
    if (!gameRunning || isPaused) return;
    if (e.type === 'keydown' && e.code !== 'Space') return;
    if (e.target.closest('.ui-btn, button')) return;
    bird.flap();
    e.preventDefault();
}
canvas.addEventListener('mousedown', flap);
canvas.addEventListener('touchstart', flap);
document.addEventListener('keydown', flap);

// Pause/Resume
function togglePause() {
    if (!gameRunning) return;
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? 'RESUME' : 'PAUSE';
    pausedOverlay.classList.toggle('hidden', !isPaused);
}
function resumeGame() {
    if (!isPaused) return;
    isPaused = false;
    pauseBtn.textContent = 'PAUSE';
    pausedOverlay.classList.add('hidden');
    requestAnimationFrame(loop);
}
pauseBtn.addEventListener('click', togglePause);
resumeBtn.addEventListener('click', resumeGame);

// Game Flow
let currentBird = 'bird1.png';
function startGame(birdSrc) {
    currentBird = birdSrc;
    menu.classList.add('hidden');
    game.classList.remove('hidden');
    gameover.classList.add('hidden');

    isPaused = false;
    pauseBtn.textContent = 'PAUSE';
    pausedOverlay.classList.add('hidden');

    bird = new Bird(currentBird);
    pipes = []; coins = []; clouds = [];
    score = 0; pipesPassed = 0; frames = 0; lastPipe = 0;
    liveScore.textContent = '0';
    gameRunning = true;
    updateAllStats();
    requestAnimationFrame(loop);
}
function endGame() {
    gameRunning = false;
    finalScore.textContent = `Score: ${score}`;
    updateAllStats();
    gameover.classList.remove('hidden');
}
function goToMenu() {
    game.classList.add('hidden');
    menu.classList.remove('hidden');
    gameover.classList.add('hidden');
    gameRunning = false; isPaused = false;
    pausedOverlay.classList.add('hidden');
    showPlayTab();
}

// Menu Tabs
function showPlayTab() {
    playTab.classList.add('active');
    shopTab.classList.remove('active');
    playScreen.classList.remove('hidden');
    shopScreen.classList.add('hidden');
    updateEquipMenu();
}
function showShopTab() {
    playTab.classList.remove('active');
    shopTab.classList.add('active');
    playScreen.classList.add('hidden');
    shopScreen.classList.remove('hidden');
    updateShop();
}
playTab.addEventListener('click', showPlayTab);
shopTab.addEventListener('click', showShopTab);

// Equip Menu
function updateEquipMenu() {
    currentBirdIndex = ownedBirds.indexOf(currentBird);
    if (currentBirdIndex === -1) {
        currentBirdIndex = 0;
        currentBird = ownedBirds[0];
    }
    currentBirdName.textContent = birdNames[birdOptions.indexOf(ownedBirds[currentBirdIndex])];
    previewImg.src = 'assets/' + ownedBirds[currentBirdIndex];
    prevBirdBtn.disabled = currentBirdIndex === 0;
    nextBirdBtn.disabled = currentBirdIndex === ownedBirds.length - 1;
}
prevBirdBtn.addEventListener('click', () => {
    if (currentBirdIndex > 0) {
        currentBirdIndex--;
        updateEquipMenu();
    }
});
nextBirdBtn.addEventListener('click', () => {
    if (currentBirdIndex < ownedBirds.length - 1) {
        currentBirdIndex++;
        updateEquipMenu();
    }
});
equipBirdBtn.addEventListener('click', () => startGame(ownedBirds[currentBirdIndex]));

// Shop
function updateShop() {
    document.querySelectorAll('.shop-item').forEach(item => {
        const src = item.dataset.bird;
        const btn = item.querySelector('.buy-btn');
        if (ownedBirds.includes(src)) {
            item.classList.add('owned');
            if (btn) btn.remove();
        } else {
            item.classList.remove('owned');
        }
    });
}
document.querySelectorAll('.buy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const item = btn.closest('.shop-item');
        const src = item.dataset.bird;
        const price = birdPrices[src];
        if (ownedBirds.includes(src) || balance < price) return;
        balance -= price;
        ownedBirds.push(src);
        saveSaves();
        updateAllStats();
        updateShop();
        updateEquipMenu();
    });
});

restartBtn2.onclick = () => startGame(currentBird);
menuBtn2.onclick = goToMenu;

// Init
window.addEventListener('load', () => {
    updateAllStats();
    updateShop();
    updateEquipMenu();
});
