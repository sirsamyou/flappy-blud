// Config & globals
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const cutsceneCanvas = document.getElementById('cutsceneCanvas');
const cutsceneCtx = cutsceneCanvas.getContext('2d');
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
const levelNumber = document.getElementById('levelNumber');
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
const holdProgress = document.getElementById('holdProgress');
const holdProgressBar = document.getElementById('holdProgressBar');
const secretCutscene = document.getElementById('secretCutscene');
const mazeScreen = document.getElementById('mazeScreen');
const exitMazeBtn = document.getElementById('exitMazeBtn');

let bird, pipes = [], coins = [], clouds = [], score = 0, highScore = 0, balance = 0, xp = 0, level = 1;
let gameRunning = false, isPaused = false, isSecretLevel = false, inMaze = false, mazeEntered = false;
const gravity = 0.6, jump = -10;
let frames = 0, lastPipe = 0, pipesPassed = 0, lastTime = 0, totalCoinsCollected = 0, lastCoinPipe = 0;
let secretModifiers = [], modifierTimer = 0, modifierInterval = 8000;
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
    { id: 'bird_enthusiast', name: 'Bird Enthusiast', description: 'Own 5 birds', condition: () => ownedBirds.length >= 5, reward: 30, unlocked: false },
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
    holdProgress.classList.remove('hidden');
    holdProgressBar.style.width = '0%';
    holdInterval = setInterval(() => {
        const heldTime = Date.now() - holdStart;
        const progress = Math.min((heldTime / 13000) * 100, 100);
        holdProgressBar.style.width = `${progress}%`;
        if (heldTime >= 13000) {
            endHold(e);
            showSecretCutscene();
        }
    }, 50);
    e.preventDefault();
}

function endHold(e) {
    if (holdStart) {
        clearInterval(holdInterval);
        title.style.animation = 'titlePulse 2s infinite alternate';
        title.style.color = '';
        holdProgress.classList.add('hidden');
        holdStart = null;
        e.preventDefault();
    }
}

function showSecretCutscene() {
    menu.classList.add('hidden');
    game.classList.remove('hidden');
    secretCutscene.classList.remove('hidden');
    cutsceneCanvas.width = window.innerWidth;
    cutsceneCanvas.height = window.innerHeight;
    let cutsceneFrames = 0;
    const cutsceneLoop = () => {
        cutsceneCtx.fillStyle = '#000';
        cutsceneCtx.fillRect(0, 0, cutsceneCanvas.width, cutsceneCanvas.height);
        
        // Distortion effect
        cutsceneCtx.save();
        cutsceneCtx.filter = `hue-rotate(${cutsceneFrames * 5}deg) contrast(2) brightness(0.3)`;
        cutsceneCtx.globalAlpha = 0.8;
        for (let i = 0; i < 50; i++) {
            cutsceneCtx.fillStyle = `hsl(${cutsceneFrames * 2 + i * 7}, 100%, ${30 + Math.sin(cutsceneFrames * 0.1 + i) * 20}%)`;
            cutsceneCtx.beginPath();
            cutsceneCtx.arc(
                cutsceneCanvas.width / 2 + Math.sin(cutsceneFrames * 0.05 + i) * 200,
                cutsceneCanvas.height / 2 + Math.cos(cutsceneFrames * 0.03 + i) * 150,
                20 + Math.sin(cutsceneFrames * 0.1) * 10,
                0, Math.PI * 2
            );
            cutsceneCtx.fill();
        }
        cutsceneCtx.restore();
        
        // Title pulse
        cutsceneCtx.save();
        cutsceneCtx.translate(cutsceneCanvas.width / 2, cutsceneCanvas.height / 2);
        cutsceneCtx.rotate(Math.sin(cutsceneFrames * 0.2) * 0.1);
        cutsceneCtx.font = 'bold 4rem var(--font)';
        cutsceneCtx.fillStyle = '#ff00ff';
        cutsceneCtx.textAlign = 'center';
        cutsceneCtx.shadowColor = '#ff00ff';
        cutsceneCtx.shadowBlur = 30;
        cutsceneCtx.fillText('SECRET REALM', 0, 0);
        cutsceneCtx.restore();
        
        cutsceneFrames++;
        if (cutsceneFrames < 120) {
            requestAnimationFrame(cutsceneLoop);
        } else {
            secretCutscene.classList.add('hidden');
            isSecretLevel = true;
            startGame(ownedBirds[currentBirdIndex]);
        }
    };
    cutsceneLoop();
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
    levelNumber.textContent = `${level}`;
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
    cutsceneCanvas.width = window.innerWidth;
    cutsceneCanvas.height = window.innerHeight;
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
        const effectiveGravity = gravity * (secretModifiers.includes('highGravity') ? 1.5 : 1);
        this.vel += effectiveGravity * deltaTime * (this.isUpsideDown ? -1 : 1);
        this.y += this.vel * deltaTime;
        if (this.y + this.h > canvas.height - 100 || (!mazeEntered && this.y < -this.h)) {
            if (!mazeEntered && this.y < -this.h && isSecretLevel) {
                enterMaze();
            } else {
                this.die();
            }
        }
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        const rot = Math.min(this.vel * 0.05, Math.PI / 3) * (this.isUpsideDown ? -1 : 1);
        ctx.rotate(rot);
        ctx.scale(1, this.isUpsideDown ? -1 : 1);
        ctx.save();
        if (isSecretLevel) {
            if (secretModifiers.includes('darkness')) ctx.filter = 'brightness(40%)';
            else ctx.filter = 'grayscale(100%) saturate(0.5)';
        }
        ctx.drawImage(this.img, -this.w/2, -this.h/2, this.w, this.h);
        ctx.restore();
        ctx.restore();
    }
    flap() { 
        this.vel = jump * (this.isUpsideDown ? -1 : 1); 
    }
    die() { endGame(); }
}

// Pipe
class Pipe {
    constructor() {
        this.gap = isSecretLevel ? 150 : 180;
        this.w = 80;
        this.top = Math.random() * (canvas.height - this.gap - 300) + 150;
        this.bottom = this.top + this.gap;
        this.x = canvas.width;
        this.speed = (isSecretLevel ? 5 : 4) * (secretModifiers.includes('highSpeed') ? 1.5 : 1);
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
            lastCoinPipe = pipesPassed;
            checkAchievements();
        }
    }
    draw() {
        const pipeColor = isSecretLevel ? (secretModifiers.includes('darkness') ? '#111' : '#333') : '#2d5016';
        const capColor = isSecretLevel ? '#222' : '#1e3a0d';
        ctx.save();
        if (secretModifiers.includes('fog')) {
            ctx.filter = 'blur(2px)';
        }
        ctx.fillStyle = pipeColor;
        ctx.fillRect(this.x, 0, this.w, this.top);
        ctx.fillStyle = capColor;
        ctx.fillRect(this.x - 10, this.top - 40, this.w + 20, 40);
        ctx.fillStyle = pipeColor;
        ctx.fillRect(this.x, this.bottom, this.w, canvas.height - this.bottom);
        ctx.fillStyle = capColor;
        ctx.fillRect(this.x - 10, this.bottom, this.w + 20, 40);
        ctx.restore();
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
        this.spin = 0;
    }
    update(deltaTime) {
        if (isPaused || !gameRunning || inMaze) return;
        this.x -= (isSecretLevel ? 5 : 4) * (secretModifiers.includes('highSpeed') ? 1.5 : 1) * deltaTime;
        this.spin += deltaTime * 10;
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
        ctx.translate(this.x + this.w/2, this.y + this.h/2);
        ctx.rotate(this.spin);
        if (isSecretLevel) {
            if (secretModifiers.includes('darkness')) ctx.filter = 'brightness(40%)';
            else ctx.filter = 'grayscale(100%)';
        }
        if (secretModifiers.includes('fog')) ctx.globalAlpha = 0.7;
        ctx.drawImage(coinImg, -this.w/2, -this.h/2, this.w, this.h);
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
        this.x = 80; this.y = mazeCanvas.height - 130;
        this.speed = 4;
    }
    update() {
        let dx = 0, dy = 0;
        if (keys.w) dy -= this.speed;
        if (keys.s) dy += this.speed;
        if (keys.a) dx -= this.speed;
        if (keys.d) dx += this.speed;
        const newX = this.x + dx;
        const newY = this.y + dy;
        if (!this.hitsWalls(newX, newY)) {
            this.x = newX;
            this.y = newY;
        }
        if (mazeCoin && !mazeCoin.collected && this.hitsCoin()) {
            mazeCoin.collected = true;
            balance += 20;
            totalCoinsCollected += 20;
            addXP(5);
            checkAchievements();
            updateAllStats();
            saveSaves();
        }
    }
    draw() {
        mazeCtx.save();
        mazeCtx.translate(this.x + this.w/2, this.y + this.h/2);
        mazeCtx.rotate(Math.sin(Date.now() * 0.005) * 0.2);
        mazeCtx.drawImage(bird.img, -this.w/2, -this.h/2, this.w, this.h);
        mazeCtx.restore();
    }
    hitsWalls(x = this.x, y = this.y) {
        for (let wall of mazeWalls) {
            if (x < wall.x + wall.w &&
                x + this.w > wall.x &&
                y < wall.y + wall.h &&
                y + this.h > wall.y) {
                return true;
            }
        }
        return x < 40 || x + this.w > mazeCanvas.width - 40 ||
               y < 40 || y + this.h > mazeCanvas.height - 40;
    }
    hitsCoin() {
        return this.x < mazeCoin.x + mazeCoin.w &&
               this.x + this.w > mazeCoin.x &&
               this.y < mazeCoin.y + mazeCoin.h &&
               this.y + this.h > mazeCoin.y;
    }
}

function generateMaze() {
    mazeWalls = [];
    const cellSize = 80;
    const cols = Math.floor((mazeCanvas.width - 80) / cellSize);
    const rows = Math.floor((mazeCanvas.height - 80) / cellSize);
    const grid = Array(rows).fill().map(() => Array(cols).fill(1));
    
    // Recursive backtracker
    const stack = [];
    let current = {x: 0, y: 0};
    grid[0][0] = 0;
    while (true) {
        const neighbors = [];
        const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
        for (let [dx, dy] of dirs) {
            const nx = current.x + dx * 2;
            const ny = current.y + dy * 2;
            if (nx > 0 && nx < cols && ny > 0 && ny < rows && grid[ny][nx] === 1) {
                neighbors.push({x: nx, y: ny, dx, dy});
            }
        }
        if (neighbors.length > 0) {
            stack.push(current);
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            grid[current.y + next.dy][current.x + next.dx] = 0;
            grid[next.y][next.x] = 0;
            current = next;
        } else if (stack.length > 0) {
            current = stack.pop();
        } else {
            break;
        }
    }
    
    // Create walls
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (grid[y][x] === 1) {
                mazeWalls.push({ 
                    x: 40 + x * cellSize, 
                    y: 40 + y * cellSize, 
                    w: cellSize, 
                    h: cellSize 
                });
            }
        }
    }
    // Secret coin in random open cell
    let coinPlaced = false;
    while (!coinPlaced) {
        const cx = 40 + Math.floor(Math.random() * (cols - 2)) * cellSize + cellSize / 2;
        const cy = 40 + Math.floor(Math.random() * (rows - 2)) * cellSize + cellSize / 2;
        if (!mazeWalls.some(w => 
            cx > w.x && cx < w.x + w.w && 
            cy > w.y && cy < w.y + w.h)) {
            mazeCoin = { x: cx - 20, y: cy - 20, w: 40, h: 40, collected: false };
            coinPlaced = true;
        }
    }
}

function enterMaze() {
    mazeEntered = true;
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
    mazeEntered = false;
    mazeScreen.classList.add('hidden');
    document.removeEventListener('keydown', handleMazeInput);
    document.removeEventListener('keyup', handleMazeInput);
    pipes = []; coins = []; clouds = [];
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
    mazeCtx.fillStyle = '#111';
    mazeCtx.fillRect(0, 0, mazeCanvas.width, mazeCanvas.height);
    
    mazeWalls.forEach(wall => {
        mazeCtx.fillStyle = '#2d5016';
        mazeCtx.shadowColor = '#4a7c59';
        mazeCtx.shadowBlur = 8;
        mazeCtx.fillRect(wall.x, wall.y, wall.w, wall.h);
        mazeCtx.shadowBlur = 0;
    });
    
    if (mazeCoin && !mazeCoin.collected) {
        mazeCtx.save();
        mazeCtx.shadowColor = '#ffd700';
        mazeCtx.shadowBlur = 15;
        mazeCtx.drawImage(coinImg, mazeCoin.x, mazeCoin.y, mazeCoin.w, mazeCoin.h);
        mazeCtx.restore();
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
    if (now - lastCloudTime < 3000 + Math.random() * 3000) return;
    clouds.push({
        x: canvas.width + Math.random() * 300,
        y: 30 + Math.random() * (canvas.height * 0.25),
        speed: 0.8 + Math.random() * 1.2,
        wobble: Math.random() * 0.02,
        scale: 0.6 + Math.random() * 0.4
    });
    lastCloudTime = now;
}

// Secret Level Modifiers
function applyRandomModifier() {
    if (!isSecretLevel || inMaze) return;
    const modifiers = [
        { name: 'Upside Down', active: () => bird.isUpsideDown = !bird.isUpsideDown },
        { name: 'High Speed', active: () => secretModifiers.includes('High Speed') ? secretModifiers = secretModifiers.filter(m => m !== 'High Speed') : secretModifiers.push('High Speed') },
        { name: 'High Gravity', active: () => secretModifiers.includes('High Gravity') ? secretModifiers = secretModifiers.filter(m => m !== 'High Gravity') : secretModifiers.push('High Gravity') },
        { name: 'Fog', active: () => secretModifiers.includes('Fog') ? secretModifiers = secretModifiers.filter(m => m !== 'Fog') : secretModifiers.push('Fog') },
        { name: 'Darkness', active: () => secretModifiers.includes('Darkness') ? secretModifiers = secretModifiers.filter(m => m !== 'Darkness') : secretModifiers.push('Darkness') }
    ];
    const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
    modifier.active();
    modifierNotification.textContent = `${modifier.name} ${secretModifiers.includes(modifier.name) ? 'ON' : 'OFF'}`;
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

    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (isSecretLevel) {
        grad.addColorStop(0, secretModifiers.includes('darkness') ? '#222' : '#666');
        grad.addColorStop(0.5, secretModifiers.includes('darkness') ? '#444' : '#999');
        grad.addColorStop(1, secretModifiers.includes('darkness') ? '#555' : '#ccc');
    } else {
        grad.addColorStop(0, '#87CEEB');
        grad.addColorStop(0.5, '#B0E0E6');
        grad.addColorStop(1, '#E0F7FA');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Fog overlay
    if (secretModifiers.includes('fog')) {
        const fogGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        fogGrad.addColorStop(0, 'rgba(200,200,200,0.1)');
        fogGrad.addColorStop(1, 'rgba(150,150,150,0.4)');
        ctx.fillStyle = fogGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Vignette
    const vigGrad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, Math.hypot(canvas.width, canvas.height));
    vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
    vigGrad.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clouds
    spawnCloud();
    clouds = clouds.filter(c => c.x + 200 * c.scale >= -200);
    clouds.forEach(c => {
        c.x -= c.speed * deltaTime;
        c.y += Math.sin(frames * c.wobble) * 0.5;
        ctx.save();
        ctx.globalAlpha = secretModifiers.includes('fog') ? 0.5 : 0.8;
        if (isSecretLevel && !secretModifiers.includes('darkness')) ctx.filter = 'grayscale(100%)';
        ctx.scale(c.scale, c.scale);
        ctx.drawImage(cloudImg, c.x / c.scale, c.y / c.scale, 200, 120);
        ctx.restore();
    });

    // Ground
    ctx.fillStyle = isSecretLevel ? (secretModifiers.includes('darkness') ? '#333' : '#666') : '#4a7c59';
    ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
    ctx.fillStyle = isSecretLevel ? '#555' : '#5d8c4f';
    ctx.fillRect(0, canvas.height - 100, canvas.width, 20);

    bird.update(deltaTime);
    bird.draw();

    // Spawn pipes
    if (frames - lastPipe > (isSecretLevel ? 75 : 90)) {
        pipes.push(new Pipe());
        lastPipe = frames;
    }

    pipes.forEach(p => { 
        p.update(deltaTime); 
        p.draw(); 
        if (p.hits(bird)) bird.die(); 
    });
    
    // Spawn coins between pipes (every 5-10 pipes)
    if (pipesPassed - lastCoinPipe >= 5 + Math.floor(Math.random() * 6)) {
        if (pipes.length > 0) {
            const recentPipe = pipes[pipes.length - 1];
            const safeY = recentPipe.top + recentPipe.gap / 2;
            coins.push(new Coin(recentPipe.x + recentPipe.w, safeY));
            lastCoinPipe = pipesPassed;
        }
    }

    coins.forEach(c => { c.update(deltaTime); c.draw(); });

    // Modifiers
    if (isSecretLevel && timestamp - modifierTimer > modifierInterval) {
        applyRandomModifier();
        modifierTimer = timestamp;
        modifierInterval = 5000 + Math.random() * 5000;
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
    mazeEntered = false;

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
    score = 0; pipesPassed = 0; lastCoinPipe = 0; frames = 0; lastPipe = 0;
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
    mazeEntered = false;
}
function goToMenu() {
    game.classList.add('hidden');
    menu.classList.remove('hidden');
    gameover.classList.add('hidden');
    achievementNotification.classList.add('hidden');
    modifierNotification.classList.add('hidden');
    notificationQueue = [];
    gameRunning = false; isPaused = false; isSecretLevel = false; inMaze = false; mazeEntered = false;
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
    if (!ownedBirds.length) ownedBirds = ['bird1.png'];
    currentBirdIndex = Math.max(0, Math.min(currentBirdIndex, ownedBirds.length - 1));
    currentBird = ownedBirds[currentBirdIndex];
    currentBirdName.textContent = birdNames[birdOptions.indexOf(currentBird)] || 'Bird 1';
    previewImg.src = 'assets/' + currentBird;
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
playBtn.addEventListener('click', () => startGame(currentBird));

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
            if (btn) {
                btn.disabled = balance < birdPrices[src];
                btn.textContent = balance >= birdPrices[src] ? 'BUY' : 'NOT ENOUGH';
            }
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
