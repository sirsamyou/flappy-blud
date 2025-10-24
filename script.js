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
const title = document.getElementById('title');

let bird, pipes = [], coins = [], clouds = [], score = 0, highScore = 0, balance = 0, xp = 0, level = 1;
let gameRunning = false, isPaused = false, isSecretLevel = false;
const gravity = 0.6, jump = -10;
let frames = 0, lastPipe = 0, pipesPassed = 0, lastTime = 0, totalCoinsCollected = 0;

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
    { id: 'secret_seeker', name: 'Secret Seeker', description: '???', unlockedDescription: 'Found the secret level and scored exactly 13 points!', condition: () => isSecretLevel && score === 13, reward: 100, unlocked: false }
];
let notificationQueue = [];

// Secret Level Trigger
let holdStart = null;
let holdInterval = null;
title.addEventListener('mousedown', startHold);
title.addEventListener('touchstart', startHold, { passive: false });
title.addEventListener('mouseup', endHold);
title.addEventListener('touchend', endHold, { passive: false });

function startHold(e) {
    if (gameRunning) return;
    holdStart = Date.now();
    title.style.animation = 'titleHold 0.5s ease-in-out infinite alternate';
    title.style.color = '#00ff88';
    holdInterval = setInterval(() => {
        const heldTime = Date.now() - holdStart;
        if (heldTime >= 13000) {
            endHold(e);
            isSecretLevel = true;
            startGame(ownedBirds[currentBirdIndex]);
        }
    }, 100);
    e.preventDefault();
}

function endHold(e) {
    if (holdStart) {
        clearInterval(holdInterval);
        title.style.animation = 'titlePulse 2s infinite alternate';
        title.style.color = '';
        holdStart = null;
        e.preventDefault();
    }
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
    xpText.textContent = `${xp}/40`;
}
function addXP(amount) {
    xp += amount;
    updateLevel();
    saveSaves();
}
function addCoinXP() {
    addXP(1); // 1 XP per coin collected
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
    }
    update(deltaTime) {
        if (isPaused || !gameRunning) return;
        this.vel += gravity * deltaTime;
        this.y += this.vel * deltaTime;
        if (this.y + this.h > canvas.height - 100 || this.y < -this.h) this.die();
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        const rot = Math.min(this.vel * 0.05, Math.PI / 3);
        ctx.rotate(rot);
        if (isSecretLevel) {
            ctx.save();
            ctx.filter = 'grayscale(100%)';
            ctx.drawImage(this.img, -this.w/2, -this.h/2, this.w, this.h);
            ctx.restore();
        } else {
            ctx.drawImage(this.img, -this.w/2, -this.h/2, this.w, this.h);
        }
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
    update(deltaTime) {
        if (isPaused || !gameRunning) return;
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
            if (score % 50 === 0) addXP(10); // 10 XP every 50 score
            if (pipesPassed % (10 + Math.floor(Math.random() * 6)) === 0) {
                // Find safe Y zones for coin spawn
                const safeZones = [];
                let y = 100;
                while (y < canvas.height - 150) {
                    let isSafe = true;
                    for (let p of pipes) {
                        if (y > p.top - 50 && y < p.bottom + 50) {
                            isSafe = false;
                            break;
                        }
                    }
                    if (isSafe) safeZones.push(y);
                    y += 10;
                }
                const coinY = safeZones.length > 0 ? safeZones[Math.floor(Math.random() * safeZones.length)] : canvas.height / 2;
                coins.push(new Coin(this.x + this.w/2, coinY));
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
        if (isPaused || !gameRunning) return;
        this.x -= 4 * deltaTime;
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
        if (isSecretLevel) {
            ctx.save();
            ctx.filter = 'grayscale(100%)';
            ctx.drawImage(coinImg, this.x, this.y, this.w, this.h);
            ctx.restore();
        } else {
            ctx.drawImage(coinImg, this.x, this.y, this.w, this.h);
        }
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
    if (now - lastCloudTime < 6000 + Math.random() * 4000) return;
    clouds.push({
        x: canvas.width + 100,
        y: 50 + Math.random() * (canvas.height * 0.3),
        speed: 0.1 + Math.random() * 0.2, // Slower horizontal movement
        wobble: Math.random() * 0.01 // Slower wobble
    });
    lastCloudTime = now;
}

// Game loop
function loop(timestamp) {
    if (!gameRunning || isPaused) {
        if (gameRunning && isPaused) requestAnimationFrame(loop);
        return;
    }

    const deltaTime = Math.min((timestamp - lastTime) / 16.67, 2);
    lastTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Sky
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (isSecretLevel) {
        grad.addColorStop(0, '#999');
        grad.addColorStop(0.5, '#ccc');
        grad.addColorStop(1, '#eee');
    } else {
        grad.addColorStop(0, '#87CEEB');
        grad.addColorStop(0.5, '#B0E0E6');
        grad.addColorStop(1, '#E0F7FA');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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
        c.x -= c.speed * deltaTime * 0.5; // Even slower horizontal movement
        c.y += Math.sin(frames * c.wobble) * 0.3 * deltaTime; // Gentle shaking
        ctx.globalAlpha = 0.8;
        if (isSecretLevel) {
            ctx.save();
            ctx.filter = 'grayscale(100%)';
            ctx.drawImage(cloudImg, c.x, c.y, 200, 120);
            ctx.restore();
        } else {
            ctx.drawImage(cloudImg, c.x, c.y, 200, 120);
        }
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

    frames++;
    requestAnimationFrame(loop);
}

// Input
let lastTouchTime = 0;
function flap(e) {
    if (!gameRunning || isPaused) return;
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
    if (!gameRunning || !gameover.classList.contains('hidden')) return;
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
    notificationQueue = [];

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
    isSecretLevel = false; // Reset after game ends
}
function goToMenu() {
    game.classList.add('hidden');
    menu.classList.remove('hidden');
    gameover.classList.add('hidden');
    achievementNotification.classList.add('hidden');
    notificationQueue = [];
    gameRunning = false; isPaused = false; isSecretLevel = false;
    pausedOverlay.classList.add('hidden');
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
        updateEquipMenu();
    }
});
nextBirdBtn.addEventListener('click', () => {
    if (currentBirdIndex < ownedBirds.length - 1) {
        currentBirdIndex++;
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
