const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const pauseScreen = document.getElementById('pause-screen');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const menuButton = document.getElementById('menu-button');
const skinButtons = document.querySelectorAll('.skin-button');
const keyInput = document.getElementById('key-input');
const mouseButton = document.getElementById('mouse-button');
const controlDisplay = document.getElementById('control-display');
const skinPreview = document.getElementById('skin-preview');
const currentScoreDisplay = document.getElementById('current-score');
const finalScoreDisplay = document.getElementById('final-score');
const highScoreDisplay = document.getElementById('high-score');

// Canvas setup
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    bird.y = canvas.height / 2;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Assets
let birdImg = new Image();
birdImg.src = 'assets/bird1.png';
let backgroundImg = new Image();
backgroundImg.src = 'assets/background.png';
let groundImg = new Image();
groundImg.src = 'assets/ground.png';

// Sound effects
const sfxWing = new Audio('assets/sfx_wing.mp3');
const sfxPoint = new Audio('assets/sfx_point.mp3');
const sfxHit = new Audio('assets/sfx_hit.mp3');
const sfxDie = new Audio('assets/sfx_die.mp3');

let bird = {
    x: canvas.width / 3, // Closer to pipes
    y: canvas.height / 2,
    width: 34,
    height: 24,
    velocity: 0,
    gravity: 0.2, // Smoother fall
    jump: -6, // Gentler jump
    rotation: 0
};

let pipes = [];
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gameState = 'start';
let frameCount = 0;
let groundX = 0;
let groundSpeed = 1.5; // Slower for easier gameplay
const pipeWidth = 52;
const pipeGap = 140; // Wider gap
const pipeSpacing = 120; // More space between pipes

let selectedKey = 'Space';
let selectedMouseButton = null;

function drawBird() {
    ctx.save();
    ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
    ctx.rotate(bird.rotation);
    ctx.drawImage(birdImg, -bird.width / 2, -bird.height / 2, bird.width, bird.height);
    ctx.restore();
}

function drawBackground() {
    if (backgroundImg.complete && backgroundImg.naturalWidth !== 0) {
        ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height - 112);
    } else {
        ctx.fillStyle = '#70c5ce';
        ctx.fillRect(0, 0, canvas.width, canvas.height - 112);
    }
}

function drawGround() {
    if (groundImg.complete && groundImg.naturalWidth !== 0) {
        ctx.drawImage(groundImg, groundX, canvas.height - 112, canvas.width, 112);
        ctx.drawImage(groundImg, groundX + canvas.width, canvas.height - 112, canvas.width, 112);
    } else {
        ctx.fillStyle = '#ded895';
        ctx.fillRect(0, canvas.height - 112, canvas.width, 112);
    }
    if (gameState === 'playing') {
        groundX -= groundSpeed;
        if (groundX <= -canvas.width) groundX = 0;
    }
}

function drawPipes() {
    ctx.fillStyle = '#73a942';
    pipes.forEach(pipe => {
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
        ctx.fillRect(pipe.x, canvas.height - pipe.bottom, pipeWidth, pipe.bottom);
    });
}

function updateBird() {
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;
    bird.rotation = Math.min(Math.max(bird.velocity * 0.05, -0.3), 0.6); // Smoother rotation

    if (bird.y + bird.height > canvas.height - 112 || bird.y < 0) {
        sfxHit.play();
        sfxDie.play();
        gameState = 'gameover';
    }
}

function updatePipes() {
    if (frameCount % pipeSpacing === 0 && gameState === 'playing') {
        const gapY = Math.random() * (canvas.height - pipeGap - 300) + 150;
        pipes.push({
            x: canvas.width,
            top: gapY,
            bottom: canvas.height - gapY - pipeGap,
            scored: false
        });
    }

    pipes.forEach(pipe => {
        pipe.x -= groundSpeed;
        if (!pipe.scored && pipe.x + pipeWidth < bird.x) {
            score++;
            sfxPoint.play();
            pipe.scored = true;
            currentScoreDisplay.textContent = score;
        }
    });

    pipes = pipes.filter(pipe => pipe.x + pipeWidth > 0);
}

function checkCollision() {
    for (let pipe of pipes) {
        const gapTop = pipe.top;
        const gapBottom = canvas.height - pipe.bottom;
        if (
            bird.x + bird.width > pipe.x &&
            bird.x < pipe.x + pipeWidth &&
            (bird.y < gapTop - 10 || bird.y + bird.height > gapBottom + 10) // Allow touching gap edges
        ) {
            sfxHit.play();
            sfxDie.play();
            gameState = 'gameover';
        }
    }
}

function jump() {
    if (gameState === 'playing') {
        bird.velocity = bird.jump;
        sfxWing.play();
    }
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    updatePipes();
    checkCollision();
    drawPipes();
    updateBird();
    drawBird();
    drawGround();
    frameCount++;

    if (gameState === 'gameover') {
        finalScoreDisplay.textContent = score;
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('highScore', highScore);
        }
        highScoreDisplay.textContent = highScore;
        gameOverScreen.classList.remove('hidden');
    } else if (gameState === 'paused') {
        pauseScreen.classList.remove('hidden');
    }
    requestAnimationFrame(gameLoop);
}

function resetGame() {
    bird.x = canvas.width / 3;
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    bird.rotation = 0;
    pipes = [];
    score = 0;
    currentScoreDisplay.textContent = score;
    frameCount = 0;
    groundX = 0;
    gameOverScreen.classList.add('hidden');
    gameState = 'playing';
}

// Control selection
keyInput.addEventListener('keydown', (e) => {
    e.preventDefault();
    selectedKey = e.code;
    selectedMouseButton = null;
    keyInput.value = e.key;
    controlDisplay.textContent = `Current: ${e.key}`;
});

mouseButton.addEventListener('click', () => {
    controlDisplay.textContent = 'Click any mouse button...';
    const mouseListener = (e) => {
        selectedMouseButton = e.button;
        selectedKey = null;
        controlDisplay.textContent = `Current: Mouse ${['Left', 'Middle', 'Right'][e.button]}`;
        document.removeEventListener('mousedown', mouseListener);
    };
    document.addEventListener('mousedown', mouseListener);
});

// Input handling
document.addEventListener('keydown', (e) => {
    if (gameState === 'start' || e.target === keyInput) return;
    if (e.code === selectedKey) {
        jump();
    } else if (e.code === 'KeyP' && gameState === 'playing') {
        gameState = 'paused';
    } else if (e.code === 'KeyP' && gameState === 'paused') {
        gameState = 'playing';
        pauseScreen.classList.add('hidden');
    }
});

canvas.addEventListener('mousedown', (e) => {
    if (selectedMouseButton !== null && e.button === selectedMouseButton) {
        jump();
    }
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState === 'playing') {
        jump();
    }
});

startButton.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    gameState = 'playing';
});

restartButton.addEventListener('click', resetGame);

menuButton.addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    resetGame();
    gameState = 'start';
});

skinButtons.forEach(button => {
    button.addEventListener('click', () => {
        const skin = button.dataset.skin;
        birdImg.src = `assets/${skin}`;
        skinPreview.src = `assets/${skin}`;
    });
});

birdImg.onload = () => {
    highScoreDisplay.textContent = highScore;
    gameLoop();
};
