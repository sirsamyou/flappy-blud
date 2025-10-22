// Your Firebase config - Replace with your project's config
const firebaseConfig = {
    // Example: apiKey: "AIzaSy...", authDomain: "yourproject.firebaseapp.com", ...
    // Paste your full config here
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Anonymous auth for simple user tracking (optional but recommended for unique IDs)
firebase.auth().signInAnonymously().catch(console.error);

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const finalScoreDisplay = document.getElementById('final-score');
const highScoreDisplay = document.getElementById('high-score');
const highScoreEndDisplay = document.getElementById('high-score-end');
const currentUserDisplay = document.getElementById('current-user');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const gameOverScreen = document.getElementById('game-over');
const menu = document.getElementById('menu');
const gameUi = document.getElementById('game-ui');
const gameMenu = document.getElementById('game-menu');
const accountSection = document.getElementById('account-section');
const accountForm = document.getElementById('account-form');
const accountBtn = document.getElementById('account-btn');
const toggleFormBtn = document.getElementById('toggle-form');
const accountTitle = document.getElementById('account-title');
const accountError = document.getElementById('account-error');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const logoutBtn = document.getElementById('logout-btn');
const characterButtons = document.querySelectorAll('.character-btn');
const leaderboardDisplay = document.getElementById('leaderboard-display');
const tabButtons = document.querySelectorAll('.tab-btn');

let score = 0;
let highScore = 0;
let isPlaying = false;
let animationFrameId;
let selectedBird = 'sparrow';
let currentUser = null;
let isLoginMode = true;
let userId = null; // From Firebase auth

// Load accounts from localStorage (fallback)
const accounts = JSON.parse(localStorage.getItem('flappyAccounts')) || {};

// Get Firebase user ID after auth
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        userId = user.uid;
    }
});

// Account form handling (same as before)
accountForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    accountError.classList.add('hidden');

    if (isLoginMode) {
        if (accounts[username] && accounts[username].password === password) {
            currentUser = username;
            highScore = accounts[username].highScore || 0;
            currentUserDisplay.textContent = currentUser;
            highScoreDisplay.textContent = highScore;
            highScoreEndDisplay.textContent = highScore;
            accountSection.classList.add('hidden');
            gameMenu.classList.remove('hidden');
            usernameInput.value = '';
            passwordInput.value = '';
        } else {
            accountError.textContent = 'Invalid username or password';
            accountError.classList.remove('hidden');
        }
    } else {
        if (accounts[username]) {
            accountError.textContent = 'Username already exists';
            accountError.classList.remove('hidden');
        } else {
            accounts[username] = { password, highScore: 0 };
            localStorage.setItem('flappyAccounts', JSON.stringify(accounts));
            accountError.textContent = 'Account created! Please log in.';
            accountError.classList.remove('hidden');
            toggleForm();
        }
    }
});

function toggleForm() {
    isLoginMode = !isLoginMode;
    accountTitle.textContent = isLoginMode ? 'Login' : 'Create Account';
    accountBtn.textContent = isLoginMode ? 'Login' : 'Register';
    toggleFormBtn.textContent = isLoginMode ? 'Create Account' : 'Back to Login';
    accountError.classList.add('hidden');
    usernameInput.value = '';
    passwordInput.value = '';
}

toggleFormBtn.addEventListener('click', toggleForm);

logoutBtn.addEventListener('click', () => {
    currentUser = null;
    gameMenu.classList.add('hidden');
    accountSection.classList.remove('hidden');
    score = 0;
    scoreDisplay.textContent = score;
    highScoreDisplay.textContent = '0';
    currentUserDisplay.textContent = '';
});

// Character selection (same)
characterButtons.forEach(button => {
    button.addEventListener('click', () => {
        characterButtons.forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
        selectedBird = button.dataset.bird;
    });
});

// Start game (same)
startBtn.addEventListener('click', () => {
    menu.classList.add('hidden');
    gameUi.classList.remove('hidden');
    isPlaying = true;
    gameLoop();
});

// Restart (same)
restartBtn.addEventListener('click', () => {
    score = 0;
    scoreDisplay.textContent = score;
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    pipes.length = 0;
    frameCount = 0;
    gameOverScreen.classList.add('hidden');
    isPlaying = true;
    gameLoop();
});

// Flap controls (same)
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && isPlaying) {
        bird.velocity = bird.flap;
    }
});
canvas.addEventListener('click', () => {
    if (isPlaying) {
        bird.velocity = bird.flap;
    }
});
canvas.addEventListener('touchstart', () => {
    if (isPlaying) {
        bird.velocity = bird.flap;
    }
});

// Bird and pipes (same)
const bird = {
    x: 100,
    y: canvas.height / 2,
    radius: 15,
    velocity: 0,
    gravity: 0.5,
    flap: -10,
    colors: {
        sparrow: '#ff6b6b',
        parrot: '#4ecdc4',
        owl: '#f4a261'
    }
};

const pipes = [];
const pipeWidth = 50;
const pipeGap = 150;
let pipeFrequency = 90;
let frameCount = 0;

// Game loop and update/draw (same as before, omitted for brevity)
function gameLoop() {
    if (!isPlaying) return;
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
    if (type === 'daily') {
        return now.toISOString().split('T')[0]; // YYYY-MM-DD
    } else if (type === 'monthly') {
        return now.toISOString().slice(0, 7); // YYYY-MM
    }
    return 'global';
}

async function submitScoreToLeaderboard(score, username) {
    if (!currentUser || !userId) return;
    const timestamp = Date.now();
    const entry = { username, score, timestamp, userId };

    // Submit to global
    await db.ref('global').push(entry);

    // Submit to monthly and daily
    const monthlyPath = `monthly/${getCurrentDatePath('monthly')}`;
    await db.ref(monthlyPath).push(entry);

    const dailyPath = `daily/${getCurrentDatePath('daily')}`;
    await db.ref(dailyPath).push(entry);
}

async function fetchLeaderboard(type, limit = 10) {
    const path = type === 'global' ? 'global' : `${type}/${getCurrentDatePath(type)}`;
    const snapshot = await db.ref(path).once('value');
    let entries = [];
    snapshot.forEach((child) => {
        entries.push({ ...child.val(), id: child.key });
    });
    // Sort by score descending, limit to top
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

// Tab switching
tabButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const type = btn.dataset.tab;
        const entries = await fetchLeaderboard(type);
        displayLeaderboard(entries, type);
    });
});

// End game - Update local high score and submit to leaderboards
async function endGame() {
    isPlaying = false;
    finalScoreDisplay.textContent = score;
    if (score > highScore) {
        highScore = score;
        accounts[currentUser].highScore = highScore;
        localStorage.setItem('flappyAccounts', JSON.stringify(accounts));
        highScoreDisplay.textContent = highScore;
        highScoreEndDisplay.textContent = highScore;
        // Submit to leaderboards
        await submitScoreToLeaderboard(score, currentUser);
    }
    gameOverScreen.classList.remove('hidden');
    cancelAnimationFrame(animationFrameId);

    // Load initial global leaderboard
    const globalEntries = await fetchLeaderboard('global');
    displayLeaderboard(globalEntries, 'global');
}
