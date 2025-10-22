// Firebase configuration for flappy-blud
const firebaseConfig = {
  apiKey: "AIzaSyD-tNj6_6jLIAuYKqice9081VjKESO7OCI",
  authDomain: "flappy-blud.firebaseapp.com",
  databaseURL: "https://flappy-blud-default-rtdb.firebaseio.com",
  projectId: "flappy-blud",
  storageBucket: "flappy-blud.firebasestorage.app",
  messagingSenderId: "566536613015",
  appId: "1:566536613015:web:7599ca7c0c253f65420dd2",
  measurementId: "G-RNEMPRW2FW"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
firebase.auth().signInAnonymously().catch(console.error);

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const finalScoreDisplay = document.getElementById('final-score');
const highScoreDisplay = document.getElementById('high-score');
const highScoreEndDisplay = document.getElementById('high-score-end');
const currentUserDisplay = document.getElementById('current-user');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const restartBtn = document.getElementById('restart-btn');
const gameOverScreen = document.getElementById('game-over');
const menu = document.getElementById('menu');
const gameUi = document.getElementById('game-ui');
const usernameSection = document.getElementById('username-section');
const usernameForm = document.getElementById('username-form');
const usernameBtn = document.getElementById('username-btn');
const usernameError = document.getElementById('username-error');
const usernameInput = document.getElementById('username');
const characterButtons = document.querySelectorAll('.character-btn');
const leaderboardDisplay = document.getElementById('leaderboard-display');
const tabButtons = document.querySelectorAll('.tab-btn');

let score = 0;
let highScore = 0;
let isPlaying = false;
let isPaused = false;
let animationFrameId;
let selectedBird = 'sparrow';
let currentUser = localStorage.getItem('flappyUsername') || null;
let userId = null;

// Show username section if no user
if (currentUser) {
    usernameSection.classList.add('hidden');
    gameMenu.classList.remove('hidden');
    menu.classList.remove('hidden');
    currentUserDisplay.textContent = currentUser;
    highScore = parseInt(localStorage.getItem(`highScore_${currentUser}`)) || 0;
    highScoreDisplay.textContent = highScore;
    highScoreEndDisplay.textContent = highScore;
} else {
    menu.classList.remove('hidden');
}

// Firebase auth
firebase.auth().onAuthStateChanged((user) => {
    if (user) userId = user.uid;
});

// Username handling
usernameForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    if (username.length < 3 || username.length > 20) {
        usernameError.textContent = 'Username must be 3-20 characters';
        usernameError.classList.remove('hidden');
        return;
    }
    currentUser = username;
    localStorage.setItem('flappyUsername', currentUser);
    currentUserDisplay.textContent = currentUser;
    highScore = parseInt(localStorage.getItem(`highScore_${currentUser}`)) || 0;
    highScoreDisplay.textContent = highScore;
    highScoreEndDisplay.textContent = highScore;
    usernameSection.classList.add('hidden');
    gameMenu.classList.remove('hidden');
    usernameInput.value = '';
    usernameError.classList.add('hidden');
});

// Canvas resizing
function resizeCanvas() {
    const maxWidth = 400;
    const maxHeight = 600;
    const aspectRatio = maxWidth / maxHeight;

    let width = window.innerWidth;
    let height = window.innerHeight - 80; // Account for HUD

    if (width / height > aspectRatio) {
        width = height * aspectRatio;
    } else {
        height = width / aspectRatio;
    }

    canvas.width = Math.min(width, maxWidth);
    canvas.height = Math.min(height, maxHeight);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Character selection
characterButtons.forEach(button => {
    button.addEventListener('click', () => {
        characterButtons.forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
        selectedBird = button.dataset.bird;
    });
});

// Start game
startBtn.addEventListener('click', () => {
    menu.classList.add('hidden');
    gameUi.classList.remove('hidden');
    isPlaying = true;
    isPaused = false;
    pauseBtn.textContent = 'Pause';
    gameLoop();
});

// Pause button
pauseBtn.addEventListener('click', () => {
    if (!isPlaying) return;
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
    if (!isPaused) gameLoop();
    else cancelAnimationFrame(animationFrameId);
});

// Restart
restartBtn.addEventListener('click', () => {
    score = 0;
    scoreDisplay.textContent = score;
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    pipes.length = 0;
    frameCount = 0;
    gameOverScreen.classList.add('hidden');
    isPlaying = true;
    isPaused = false;
    pauseBtn.textContent = 'Pause';
    gameLoop();
});

// Flap controls
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && isPlaying && !isPaused) {
        bird.velocity = bird.flap;
    }
});
canvas.addEventListener('click', () => {
    if (isPlaying && !isPaused) {
        bird.velocity = bird.flap;
    }
});
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (isPlaying && !isPaused) {
        bird.velocity = bird.flap;
    }
});

// Bird and pipes
const bird = {
    x: 100,
    y: canvas.height / 2,
    radius: 15,
    velocity: 0,
    gravity: 0.4,
    flap: -9,
    colors: {
        sparrow: '#ff6b6b',
        parrot: '#4ecdc4',
        owl: '#f4a261'
    }
};

const pipes = [];
const pipeWidth = 50;
const pipeGap = 160;
let pipeFrequency = 100;
let frameCount = 0;

// Game loop
function gameLoop() {
    if (!isPlaying || isPaused) return;

    update();
    draw();
    animationFrameId = requestAnimationFrame(gameLoop);
}

function update() {
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;

    if (frameCount % pipeFrequency === 0) {
        const pipeHeight = Math.random() * (canvas.height - pipeGap - 200) + 100;
        pipes.push({
            x: canvas.width,
            top: pipeHeight,
            bottom: pipeHeight + pipeGap,
            scored: false
        });
    }
    frameCount++;

    pipes.forEach(pipe => {
        pipe.x -= 2;

        if (!pipe.scored && pipe.x + pipeWidth < bird.x) {
            score++;
            scoreDisplay.textContent = score;
            pipe.scored = true;
        }

        if (
            (bird.x + bird.radius > pipe.x && bird.x - bird.radius < pipe.x + pipeWidth &&
             (bird.y - bird.radius < pipe.top || bird.y + bird.radius > pipe.bottom)) ||
            bird.y + bird.radius > canvas.height || bird.y - bird.radius < 0
        ) {
            endGame();
        }
    });

    pipes = pipes.filter(pipe => pipe.x + pipeWidth > 0);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#4ecdc4';
    pipes.forEach(pipe => {
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
        ctx.fillRect(pipe.x, pipe.bottom, pipeWidth, canvas.height - pipe.bottom);
    });

    ctx.beginPath();
    ctx.arc(bird.x, bird.y, bird.radius, 0, Math.PI * 2);
    ctx.fillStyle = bird.colors[selectedBird];
    ctx.fill();
    ctx.closePath();
}

// Leaderboard functions
function getCurrentDatePath(type) {
    const now = new Date();
    if (type === 'daily') return now.toISOString().split('T')[0];
    if (type === 'monthly') return now.toISOString().slice(0, 7);
    return 'global';
}

async function submitScoreToLeaderboard(score, username) {
    if (!currentUser || !userId) return;
    const timestamp = Date.now();
    const entry = { username, score, timestamp, userId };

    await db.ref('global').push(entry);
    await db.ref(`monthly/${getCurrentDatePath('monthly')}`).push(entry);
    await db.ref(`daily/${getCurrentDatePath('daily')}`).push(entry);
}

async function fetchLeaderboard(type, limit = 10) {
    const path = type === 'global' ? 'global' : `${type}/${getCurrentDatePath(type)}`;
    const snapshot = await db.ref(path).once('value');
    let entries = [];
    snapshot.forEach((child) => {
        entries.push({ ...child.val(), id: child.key });
    });
    entries.sort((a, b) => b.score - a.score);
    return entries.slice(0, limit);
}

function displayLeaderboard(entries, type) {
    let html = '<ul class="leaderboard-list">';
    entries.forEach((entry, index) => {
        html += `<li class="leaderboard-item">#${index + 1}: ${entry.username} - ${entry.score}</li>`;
    });
    html += '</ul>';
    leaderboardDisplay.innerHTML = html;
}

tabButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const type = btn.dataset.tab;
        const entries = await fetchLeaderboard(type);
        displayLeaderboard(entries, type);
    });
});

async function endGame() {
    isPlaying = false;
    isPaused = false;
    pauseBtn.textContent = 'Pause';
    finalScoreDisplay.textContent = score;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem(`highScore_${currentUser}`, highScore);
        highScoreDisplay.textContent = highScore;
        highScoreEndDisplay.textContent = highScore;
        await submitScoreToLeaderboard(score, currentUser);
    }
    gameOverScreen.classList.remove('hidden');
    cancelAnimationFrame(animationFrameId);

    const globalEntries = await fetchLeaderboard('global');
    displayLeaderboard(globalEntries, 'global');
}
