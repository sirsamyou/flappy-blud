// Config & globals
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const mazeCanvas = document.getElementById('mazeCanvas');
const mazeCtx = mazeCanvas.getContext('2d');
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
const menuHighScore = document.getElementById('menuHighScore');
const menuBalance = document.getElementById('menuBalance');
const currentLevel = document.getElementById('currentLevel');
const nextLevel = document.getElementById('nextLevel');
const menuProgressBar = document.getElementById('menuProgressBar');
const xpText = document.getElementById('xpText');
const inventoryTab = document.getElementById('inventoryTab');
const shopTab = document.getElementById('shopTab');
const achievementsTab = document.getElementById('achievementsTab');
const inventoryScreen = document.getElementById('inventoryScreen');
const shopScreen = document.getElementById('shopScreen');
const achievementsScreen = document.getElementById('achievementsScreen');
const currentBirdName = document.getElementById('currentBirdName');
const previewImg = document.getElementById('previewImg');
const prevBirdBtn = document.getElementById('prevBird');
const nextBirdBtn = document.getElementById('nextBird');
const playBtn = document.getElementById('playBtn');
const achievementNotification = document.getElementById('achievementNotification');
const modifierNotification = document.getElementById('modifierNotification');
const title = document.getElementById('title');
const secretProgress = document.getElementById('secretProgress');
const secretProgressBar = document.getElementById('secretProgressBar');
const secretCutscene = document.getElementById('secretCutscene');
const mazeScreen = document.getElementById('mazeScreen');
const exitMazeBtn = document.getElementById('exitMazeBtn');

let bird, pipes = [], coins = [], clouds = [], score = 0, highScore = 0, balance = 0, xp = 0, level = 1;
let gameRunning = false, isPaused = false, isSecretLevel = false, inMaze = false;
const gravity = 0.6, jump = -10;
let frames = 0, lastPipe = 0, pipesPassed = 0, lastTime = 0, totalCoinsCollected = 0;
let secretModifiers = [], modifierTimer = 0, modifierInterval = 5000;
let mazePlayer, mazeCoin, mazeWalls = [];

const birdOptions = Array.from({length: 8}, (_, i) => `bird${i+1}.png`);
const birdNames = Array.from({length: 8}, (_, i) => `Bird ${i+1}`);
const birdPrices = { 'bird1.png': 0, 'bird2.png': 10, 'bird3.png': 20, 'bird4.png': 30, 'bird5.png': 40, 'bird6.png': 50, 'bird7.png': 60, 'bird8.png': 70 };
let ownedBirds = ['bird1.png'], currentBirdIndex = 0;

// Achievements
const achievements = [
    { id: 'first_flight', name: 'First Flight', description: 'Score 10 points in a single run', condition: () => score >= 10, reward: 5, unlocked: false },
    { id: 'coin_collector', name: 'Coin Collector', description: 'Collect 10 coins total', condition: () => totalCoinsCollected >= 10, reward: 10, unlocked: false },
    { id: 'sky_master', name: 'Sky Master', description: 'Reach level 5', condition: () => level >= 5, reward: 20, unlocked: false },
    { id: 'bird_enthusiast', name: 'Bird Enthusiast', description: 'Own 5 birds', condition: () => ownedBirds.length >= 5, reward: 30, unloaded: false },
    { id: 'high_flyer', name: 'High Flyer', description: 'Achieve a high score of 100', condition: () => highScore >= 100, reward: 50, unlocked: false },
    { id: 'secret_seeker', name: 'Secret Seeker', description: '???', unlockedDescription: 'Died with exactly 13 points in the secret level!', condition: () => isSecretLevel && score === 13 && !gameRunning, reward: 100, unlocked: false },
    { id: 'maze_master', name: 'Maze Master', description: '???', unlockedDescription: 'Found the secret coin in the maze!', condition: () => mazeCoin?.collected, reward: 50, unlocked: false }
];
let notificationQueue = [];

// Secret Level Trigger
let holdStart = null, holdInterval = null;
title.addEventListener('mousedown', startHold);
title.addEventListener('touchstart', startHold, { passive: false });
title.addEventListener('mouseup', endHold);
title.addEventListener('touchend', endHold, { passive: false });

function startHold(e) {
    if (gameRunning) return;
    holdStart = Date.now();
    title.style.animation = 'titleHold 0.5s ease-in-out infinite alternate';
    title.style.color = '#ff00ff';
    secretProgress.classList.remove('hidden');
    secretProgressBar.style.width = '0%';
    holdInterval = setInterval(() => {
        const heldTime = Date.now() - holdStart;
        const progress = Math.min((heldTime / 13000) * 100, 100);
        secretProgressBar.style.width = `${progress}%`;
        if (heldTime >= 13000) {
            endHold(e);
            showSecretCutscene();
        }
    }, 100);
    e.preventDefault();
}

function endHold(e) {
    if (holdStart) {
        clearInterval(holdInterval);
        title.style.animation = 'titlePulse 2s infinite alternate';
        title.style.color = '';
        secretProgress.classList.add('hidden');
        holdStart = null;
        e.preventDefault();
    }
}

function showSecretCutscene() {
    menu.classList.add('hidden');
    game.classList.remove('hidden');
    secretCutscene.classList.remove('hidden');
    setTimeout(() => {
        secretCutscene.classList.add('hidden');
        isSecretLevel = true;
        startGame(ownedBirds[currentBirdIndex]);
    }, 2000);
}

// Preload assets
const birdImages = {}, cloudImg = new Image(), coinImg = new Image(), checkmarkImg = new Image();
function preload() {
    try {
        birdOptions.forEach(src => {
            const img = new Image();
            img.src = 'assets/' + src;
            img.onerror = () => console.error(`Failed to load image: assets/${src}`);
            birdImages[src] = img;
        });
        cloudImg.src = 'assets/cloud.png';
        cloudImg.onerror = () => console.error('Failed to load cloud image');
        coinImg.src = 'assets/coin.png';
        coinImg.onerror = () => console.error('Failed to load coin image');
        checkmarkImg.src = 'assets/checkmark.png';
        checkmarkImg.onerror = () => console.error('Failed to load checkmark image');
    } catch (e) {
        console.error('Error preloading assets:', e);
    }
}
preload();

// Save/load
function loadSaves() {
    try {
        highScore = parseInt(localStorage.getItem('flappyHighScore') || '0');
        balance = parseInt(localStorage.getItem('flappyCoins') || '0');
        xp = parseInt(localStorage.getItem('flappyXP') || '0');
        totalCoinsCollected = parseInt(localStorage.getItem('flappyTotalCoins') || '0');
        ownedBirds = JSON.parse(localStorage.getItem('flappyOwnedBirds') || '["bird1.png"]');
        const savedAchievements = JSON.parse(localStorage.getItem('flappyAchievements') || '{}');
        achievements.forEach(a => a.unlocked = savedAchievements[a.id] || false);
        updateLevel();
        updateAllStats();
        updateShop();
        updateAchievements();
        updateEquipMenu();
    } catch (e) {
        console.error('Error loading saves:', e);
    }
}
function saveSaves() {
    try {
        localStorage.setItem('flappyHighScore', highScore);
        localStorage.setItem('flappyCoins', balance);
        localStorage.setItem('flappyXP', xp);
        localStorage.setItem('flappyTotalCoins', totalCoinsCollected);
        localStorage.setItem('flappyOwnedBirds', JSON.stringify(ownedBirds));
        const savedAchievements = {};
        achievements.forEach(a => savedAchievements[a.id] = a.unlocked);
        localStorage.setItem('flappyAchievements', JSON.stringify(savedAchievements));
    } catch (e) {
        console.error('Error saving data:', e);
    }
}
function updateAllStats() {
    uiHighScore.textContent = `BEST: ${highScore}`;
    menuHighScore.textContent = `HIGH: ${highScore}`;
    menuBalance.textContent = `COINS: ${balance}`;
    highScoreEl.textContent = `High Score: ${highScore}`;
    finalBalance.textContent = `Coins: ${balance}`;
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
    if (newLevel !== level) {
        level = newLevel;
        checkAchievements();
    }
    xp = totalXP;
    const progress = (xp / (level * 40)) * 100;
    menuProgressBar.style.width = `${progress}%`;
    currentLevel.textContent = `LVL ${level}`;
    nextLevel.textContent = `LVL ${level + 1}`;
    xpText.textContent = `${xp}/${level * 40}`;
}
function addXP(amount) {
    xp += amount;
    updateLevel();
    saveSaves();
}
function addCoinXP() {
    addXP(1);
}

// Achievements
function checkAchievements() {
    achievements.forEach(a => {
        if (!a.unlocked && a.condition()) {
            a.unlocked = true;
            balance += a.reward;
            updateAllStats();
            saveSaves();
            showAchievementNotification(a);
        }
    });
    updateAchievements();
}
function showAchievementNotification(achievement) {
    notificationQueue.push(achievement);
    if (notificationQueue.length === 1) displayNextNotification();
}
function displayNextNotification() {
    if (!notificationQueue.length) return;
    const achievement = notificationQueue[0];
    achievementNotification.innerHTML = `
        <h3>ACHIEVEMENT UNLOCKED!</h3>
        <p>${achievement.name}</p>
        <p>${achievement.unlockedDescription || achievement.description}</p>
        <p>Reward: ${achievement.reward} Coins</p>
    `;
    achievementNotification.classList.remove('hidden');
    setTimeout(() => {
        achievementNotification.classList.add('hidden');
        notificationQueue.shift();
        displayNextNotification();
    }, 3000);
}
function updateAchievements() {
    const container = document.querySelector('.achievement-items');
    container.innerHTML = '';
    achievements.forEach(a => {
        const div = document.createElement('div');
        div.className = `achievement-item ${a.unlocked ? 'unlocked' : ''}`;
        div.innerHTML = `
            <h3>${a.name}</h3>
            <p>${a.unlocked ? (a.unlockedDescription || a.description) : '???'}</p>
            <p>Reward: ${a.reward} Coins</p>
            ${a.unlocked ? '<img src="assets/checkmark.png" alt="Achievement unlocked" class="checkmark">' : ''}
        `;
        container.appendChild(div);
    });
}

// Resize
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    mazeCanvas.width = window.innerWidth;
    mazeCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Bird
class Bird {
    constructor(src) {
        this.img = birdImages[src] || birdImages['bird1.png'];
        this.w = 60; this.h = 44;
        this.x = canvas.width * 0.2;
        this.y = canvas.height / 2;
        this.vel = 0;
        this.isUpsideDown = false;
    }
    update(deltaTime) {
        if (isPaused || !gameRunning || inMaze) return;
        this.vel += gravity * deltaTime * (this.isUpsideDown ? -1 : 1);
        this.y += this.vel * deltaTime;
        if (this.y + this.h > canvas.height - 100 || this.y < -this.h) this.die();
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        const rot = Math.min(this.vel * 0.05, Math.PI / 3) * (this.isUpsideDown ? -1 : 1);
        ctx.rotate(rot);
        if (isSecretLevel) {
            ctx.save();
            ctx.filter = secretModifiers.includes('darkness') ? 'brightness(50%)' : 'grayscale(100%)';
            ctx.scale(1, this.isUpsideDown ? -1 : 1);
            ctx.drawImage(this.img, -this.w/2, -this.h/2, this.w, this.h);
            ctx.restore();
        } else {
            ctx.scale(1, this.isUpsideDown ? -1 : 1);
            ctx.drawImage(this.img, -this.w/2, -this.h/2, this.w, this.h);
        }
        ctx.restore();
    }
    flap() { this.vel = jump * (this.isUpsideDown ? -1 : 1); }
    die() { endGame(); }
}

// Pipe
class Pipe {
    constructor() {
        this.gap = isSecretLevel ? 160 : 180;
        this.w = 80;
        this.top = Math.random() * (canvas.height - this.gap - 300) + 150;
        this.bottom = this.top + this.gap;
        this.x = canvas.width;
        this.speed = isSecretLevel && secretModifiers.includes('highSpeed') ? 6 : 4;
        this.passed = false;
    }
    update(deltaTime) {
        if (isPaused || !gameRunning || inMaze) return;
        this.x -= this.speed * deltaTime;
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
                checkAchievements();
                saveSaves();
                updateAllStats();
            }
            if (score % 50 === 0) addXP(10);
            if (pipesPassed % (10 + Math.floor(Math.random() * 6)) === 0) {
                const safeY = this.top + this.gap / 2;
                coins.push(new Coin(this.x + this.w/2, safeY));
            }
            if (isSecretLevel && pipesPassed === 4 && bird.y < -this.h) {
                enterMaze();
            }
            checkAchievements();
        }
    }
    draw() {
        const pipeColor = isSecretLevel ? '#333' : '#2d5016';
        const capColor = isSecretLevel ? '#222' : '#1e3a0d';
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
    update(deltaTime) {
        if (isPaused || !gameRunning || inMaze) return;
        this.x -= (isSecretLevel && secretModifiers.includes('highSpeed') ? 6 : 4) * deltaTime;
        if (this.x + this.w < 0) coins = coins.filter(c => c !== this);
        if (!this.collected && this.hits(bird)) {
            this.collected = true;
            balance++;
            totalCoinsCollected++;
            addCoinXP();
            checkAchievements();
            updateAllStats();
            saveSaves();
        }
    }
    draw() {
        if (this.collected) return;
        ctx.save();
        if (isSecretLevel) ctx.filter = secretModifiers.includes('darkness') ? 'brightness(50%)' : 'grayscale(100%)';
        ctx.drawImage(coinImg, this.x, this.y, this.w, this.h);
        ctx.restore();
    }
    hits(b) {
        const bl = b.x - b.w/2, br = b.x + b.w/2;
        const bt = b.y - b.h/2, bb = b.y + b.h/2;
        return br > this.x && bl < this.x + this.w && bb > this.y && bt < this.y + this.h;
    }
}

// Maze
class MazePlayer {
    constructor() {
        this.w = 40; this.h = 40;
        this.x = 50; this.y = mazeCanvas.height - 150;
        this.speed = 5;
    }
    update() {
        const newX = this.x, newY = this.y;
        let dx = 0, dy = 0;
        if (keys.w) dy -= this.speed;
        if (keys.s) dy += this.speed;
        if (keys.a) dx -= this.speed;
        if (keys.d) dx += this.speed;
        this.x += dx;
        this.y += dy;
        if (this.hitsWalls()) {
            this.x = newX;
            this.y = newY;
        }
        if (mazeCoin && !mazeCoin.collected && this.hitsCoin()) {
            mazeCoin.collected = true;
            balance += 20;
            totalCoinsCollected += 20;
            checkAchievements();
            updateAllStats();
            saveSaves();
        }
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.drawImage(bird.img, -this.w/2, -this.h/2, this.w, this.h);
        ctx.restore();
    }
    hitsWalls() {
        for (let wall of mazeWalls) {
            if (this.x - this.w/2 < wall.x + wall.w &&
                this.x + this.w/2 > wall.x &&
                this.y - this.h/2 < wall.y + wall.h &&
                this.y + this.h/2 > wall.y) {
                return true;
            }
        }
        return this.x - this.w/2 < 0 || this.x + this.w/2 > mazeCanvas.width ||
               this.y - this.h/2 < 0 || this.y + this.h/2 > mazeCanvas.height;
    }
    hitsCoin() {
        return this.x - this.w/2 < mazeCoin.x + mazeCoin.w &&
               this.x + this.w/2 > mazeCoin.x &&
               this.y - this.h/2 < mazeCoin.y + mazeCoin.h &&
               this.y + this.h/2 > mazeCoin.y;
    }
}

function generateMaze() {
    mazeWalls = [];
    const cellSize = 100;
    const rows = Math.floor(mazeCanvas.height / cellSize);
    const cols = Math.floor(mazeCanvas.width / cellSize);
    const grid = Array(rows).fill().map(() => Array(cols).fill(true));
    grid[0][0] = false;
    const stack = [[0, 0]];
    while (stack.length) {
        const [x, y] = stack.pop();
        const neighbors = [];
        if (x > 1) neighbors.push([x-2, y]);
        if (x < cols-2) neighbors.push([x+2, y]);
        if (y > 1) neighbors.push([x, y-2]);
        if (y < rows-2) neighbors.push([x, y+2]);
        if (neighbors.length) {
            stack.push([x, y]);
            const [nx, ny] = neighbors[Math.floor(Math.random() * neighbors.length)];
            grid[nx][ny] = false;
            grid[(x+nx)/2][(y+ny)/2] = false;
            stack.push([nx, ny]);
        }
    }
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (grid[y][x]) {
                mazeWalls.push({ x: x * cellSize, y: y * cellSize, w: cellSize, h: cellSize });
            }
        }
    }
    mazeCoin = { x: mazeCanvas.width - 150, y: 100, w: 40, h: 40, collected: false };
}

function enterMaze() {
    inMaze = true;
    gameRunning = false;
    mazeScreen.classList.remove('hidden');
    mazePlayer = new MazePlayer();
    generateMaze();
    document.addEventListener('keydown', handleMazeInput);
    document.addEventListener('keyup', handleMazeInput);
    requestAnimationFrame(mazeLoop);
}

function exitMaze() {
    inMaze = false;
    mazeScreen.classList.add('hidden');
    document.removeEventListener('keydown', handleMazeInput);
    document.removeEventListener('keyup', handleMazeInput);
    startGame(currentBird);
}

const keys = { w: false, a: false, s: false, d: false };
function handleMazeInput(e) {
    if (!inMaze) return;
    const key = e.key.toLowerCase();
    if (['w', 'a', 's', 'd'].includes(key)) {
        keys[key] = e.type === 'keydown';
        e.preventDefault();
    }
}

function mazeLoop() {
    if (!inMaze) return;
    mazeCtx.clearRect(0, 0, mazeCanvas.width, mazeCanvas.height);
    mazeCtx.fillStyle = '#333';
    mazeCtx.fillRect(0, 0, mazeCanvas.width, mazeCanvas.height);
    mazeWalls.forEach(wall => {
        mazeCtx.fillStyle = '#2d5016';
        mazeCtx.fillRect(wall.x, wall.y, wall.w, wall.h);
    });
    if (!mazeCoin.collected) {
        mazeCtx.drawImage(coinImg, mazeCoin.x, mazeCoin.y, mazeCoin.w, mazeCoin.h);
    }
    mazePlayer.update();
    mazePlayer.draw();
    requestAnimationFrame(mazeLoop);
}

exitMazeBtn.addEventListener('click', exitMaze);

// Clouds
let lastCloudTime = 0;
function spawnCloud() {
    const now = Date.now();
    if (now - lastCloudTime < 6000 + Math.random() * 4000) return;
    clouds.push({
        x: canvas.width + 100,
        y: 50 + Math.random() * (canvas.height * 0.3),
        speed: 0.1 + Math.random() * 0.2,
        wobble: Math.random() * 0.01
    });
    lastCloudTime = now;
}

// Secret Level Modifiers
const possibleModifiers = [
    { name: 'Upside Down', apply: () => bird.isUpsideDown = true, remove: () => bird.isUpsideDown = false },
    { name: 'High Speed', apply: () => {}, remove: () => {} },
    { name: 'Fog', apply: () => {}, remove: () => {} },
    { name: 'Darkness', apply: () => {}, remove: () => {} }
];
function applyRandomModifier() {
    if (!isSecretLevel || inMaze) return;
    const available = possibleModifiers.filter(m => !secretModifiers.includes(m.name));
    if (!available.length) return;
    const modifier = available[Math.floor(Math.random() * available.length)];
    secretModifiers.push(modifier.name);
    modifier.apply();
    modifierNotification.textContent = `Modifier: ${modifier.name}`;
    modifierNotification.classList.remove('hidden');
    setTimeout(() => modifierNotification.classList.add('hidden'), 2000);
}

// Game loop
function loop(timestamp) {
    if (!gameRunning || isPaused || inMaze) {
        if (gameRunning && isPaused) requestAnimationFrame(loop);
        return;
    }

    const deltaTime = Math.min((timestamp - lastTime) / 16.67, 2);
    lastTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Sky
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (isSecretLevel) {
        grad.addColorStop(0, '#666');
        grad.addColorStop(0.5, '#999');
        grad.addColorStop(1, '#ccc');
    } else {
        grad.addColorStop(0, '#87CEEB');
        grad.addColorStop(0.5, '#B0E0E6');
        grad.addColorStop(1, '#E0F7FA');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Fog effect
    if (isSecretLevel && secretModifiers.includes('Fog')) {
        ctx.fillStyle = 'rgba(200,200,200,0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Vignette
    const vigGrad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, canvas.height/4, canvas.width/2, canvas.height/2, canvas.height);
    vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
    vigGrad.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clouds
    spawnCloud();
    clouds = clouds.filter(c => c.x + 200 >= 0);
    clouds.forEach(c => {
        c.x -= c.speed * deltaTime * 0.5;
        c.y += Math.sin(frames * c.wobble) * 0.3 * deltaTime;
        ctx.globalAlpha = isSecretLevel && secretModifiers.includes('Fog') ? 0.4 : 0.8;
        ctx.save();
        if (isSecretLevel) ctx.filter = secretModifiers.includes('Darkness') ? 'brightness(50%)' : 'grayscale(100%)';
        ctx.drawImage(cloudImg, c.x, c.y, 200, 120);
        ctx.restore();
        ctx.globalAlpha = 1;
    });

    // Ground
    ctx.fillStyle = isSecretLevel ? '#666' : '#4a7c59';
    ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
    ctx.fillStyle = isSecretLevel ? '#777' : '#5d8c4f';
    ctx.fillRect(0, canvas.height - 100, canvas.width, 20);

    bird.update(deltaTime);
    bird.draw();

    if (frames - lastPipe > 90) {
        pipes.push(new Pipe());
        lastPipe = frames;
    }

    pipes.forEach(p => { p.update(deltaTime); p.draw(); if (p.hits(bird)) bird.die(); });
    coins.forEach(c => { c.update(deltaTime); c.draw(); });

    if (isSecretLevel && timestamp - modifierTimer > modifierInterval) {
        applyRandomModifier();
        modifierTimer = timestamp;
    }

    frames++;
    requestAnimationFrame(loop);
}

// Input
let lastTouchTime = 0;
function flap(e) {
    if (!gameRunning || isPaused || inMaze) return;
    if (e.type === 'keydown' && e.code !== 'Space') return;
    if (e.target.closest('.btn')) return;
    const now = Date.now();
    if (e.type === 'touchstart' && now - lastTouchTime < 200) return;
    bird.flap();
    if (e.type === 'touchstart') lastTouchTime = now;
    e.preventDefault();
}
canvas.addEventListener('mousedown', flap);
canvas.addEventListener('touchstart', flap, { passive: false });
document.addEventListener('keydown', flap);

// Pause/Resume
function togglePause() {
    if (!gameRunning || !gameover.classList.contains('hidden') || inMaze) return;
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? 'RESUME' : 'PAUSE';
    pausedOverlay.classList.toggle('hidden', !isPaused);
    if (!isPaused) {
        lastTime = performance.now();
        requestAnimationFrame(loop);
    }
}
function resumeGame() {
    if (!isPaused) return;
    isPaused = false;
    pauseBtn.textContent = 'PAUSE';
    pausedOverlay.classList.add('hidden');
    lastTime = performance.now();
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
    achievementNotification.classList.add('hidden');
    modifierNotification.classList.add('hidden');
    notificationQueue = [];
    secretModifiers = [];
    modifierTimer = performance.now();

    bird = new Bird(currentBird);
    pipes = []; coins = []; clouds = [];
    score = 0; pipesPassed = 0; frames = 0; lastPipe = 0;
    lastTime = performance.now();
    liveScore.textContent = '0';
    gameRunning = true;
    updateAllStats();
    requestAnimationFrame(loop);
}
function endGame() {
    gameRunning = false;
    finalScore.textContent = `Score: ${score}`;
    checkAchievements();
    updateAllStats();
    gameover.classList.remove('hidden');
    isSecretLevel = false;
    secretModifiers = [];
}
function goToMenu() {
    game.classList.add('hidden');
    menu.classList.remove('hidden');
    gameover.classList.add('hidden');
    achievementNotification.classList.add('hidden');
    modifierNotification.classList.add('hidden');
    notificationQueue = [];
    gameRunning = false; isPaused = false; isSecretLevel = false; inMaze = false;
    pausedOverlay.classList.add('hidden');
    mazeScreen.classList.add('hidden');
    showInventoryTab();
}

// Menu Tabs
function showInventoryTab() {
    inventoryTab.classList.add('active');
    shopTab.classList.remove('active');
    achievementsTab.classList.remove('active');
    inventoryScreen.classList.remove('hidden');
    shopScreen.classList.add('hidden');
    achievementsScreen.classList.add('hidden');
    updateEquipMenu();
}
function showShopTab() {
    inventoryTab.classList.remove('active');
    shopTab.classList.add('active');
    achievementsTab.classList.remove('active');
    inventoryScreen.classList.add('hidden');
    shopScreen.classList.remove('hidden');
    achievementsScreen.classList.add('hidden');
    updateShop();
}
function showAchievementsTab() {
    inventoryTab.classList.remove('active');
    shopTab.classList.remove('active');
    achievementsTab.classList.add('active');
    inventoryScreen.classList.add('hidden');
    shopScreen.classList.add('hidden');
    achievementsScreen.classList.remove('hidden');
    updateAchievements();
}
inventoryTab.addEventListener('click', showInventoryTab);
shopTab.addEventListener('click', showShopTab);
achievementsTab.addEventListener('click', showAchievementsTab);

// Equip Menu
function updateEquipMenu() {
    currentBirdIndex = ownedBirds.indexOf(currentBird);
    if (currentBirdIndex === -1 || !ownedBirds.length) {
        currentBirdIndex = 0;
        currentBird = ownedBirds[0] || 'bird1.png';
    }
    currentBirdName.textContent = birdNames[birdOptions.indexOf(ownedBirds[currentBirdIndex])] || 'Bird 1';
    previewImg.src = 'assets/' + ownedBirds[currentBirdIndex];
    prevBirdBtn.disabled = currentBirdIndex === 0 || ownedBirds.length <= 1;
    nextBirdBtn.disabled = currentBirdIndex === ownedBirds.length - 1 || ownedBirds.length <= 1;
}
prevBirdBtn.addEventListener('click', () => {
    if (currentBirdIndex > 0) {
        currentBirdIndex--;
        currentBird = ownedBirds[currentBirdIndex];
        updateEquipMenu();
    }
});
nextBirdBtn.addEventListener('click', () => {
    if (currentBirdIndex < ownedBirds.length - 1) {
        currentBirdIndex++;
        currentBird = ownedBirds[currentBirdIndex];
        updateEquipMenu();
    }
});
playBtn.addEventListener('click', () => startGame(ownedBirds[currentBirdIndex]));

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
            if (btn) btn.disabled = balance < birdPrices[src];
        }
    });
    checkAchievements();
}
function attachShopListeners() {
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.removeEventListener('click', handleBuy);
        btn.addEventListener('click', handleBuy);
    });
}
function handleBuy(e) {
    const item = e.target.closest('.shop-item');
    const src = item.dataset.bird;
    const price = birdPrices[src];
    if (ownedBirds.includes(src) || balance < price) return;
    if (!confirm(`Buy ${birdNames[birdOptions.indexOf(src)]} for ${price} coins?`)) return;
    balance -= price;
    ownedBirds.push(src);
    currentBird = src;
    currentBirdIndex = ownedBirds.length - 1;
    saveSaves();
    updateAllStats();
    updateShop();
    attachShopListeners();
    updateEquipMenu();
}

restartBtn2.onclick = () => startGame(currentBird);
menuBtn2.onclick = goToMenu;

// Init
window.addEventListener('load', () => {
    updateAllStats();
    updateShop();
    attachShopListeners();
    updateAchievements();
    updateEquipMenu();
});
