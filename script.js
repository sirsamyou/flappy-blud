const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const pauseScreen = document.getElementById('pause-screen');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const skinButtons = document.querySelectorAll('.skin-button');
const currentScoreDisplay = document.getElementById('current-score');
const finalScoreDisplay = document.getElementById('final-score');
const highScoreDisplay = document.getElementById('high-score');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let birdImg = new Image();
birdImg.src = 'assets/bird1.png'; // Default skin
let backgroundImg = new Image();
backgroundImg.src = 'assets/background.png'; // Optional
let groundImg = new Image();
groundImg.src = 'assets/ground.png'; // Optional

let bird = {
    x: canvas.width / 4, // Closer to pipes
    y: canvas.height / 2,
    width: 34, // Flappy Bird size
    height: 24,
    velocity: 0,
    gravity: 0.25, // Slower fall
    jump: -6.5, // Smoother jump
    rotation: 0
};

let pipes = [];
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gameState = 'start';
let frameCount = 0;
let groundX = 0;
let groundSpeed = 2;

const pipeWidth = 52; // Flappy Bird pipe width
const pipeGap = 120; // Tighter gap
const pipeSpacing = 100; // Frames between pipes

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
    groundX -= groundSpeed;
    if (groundX <= -canvas.width) groundX = 0;
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
    bird.rotation = Math.min(Math.max(bird.velocity * 0.06, -0.4), 0.8); // Smoother rotation

    if (bird.y + bird.height > canvas.height - 112 || bird.y < 0) {
        gameState = 'gameover';
    }
}

function updatePipes() {
    if (frameCount % pipeSpacing === 0) {
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
            pipe.scored = true;
            currentScoreDisplay.textContent = score;
        }
    });

    pipes = pipes.filter(pipe => pipe.x + pipeWidth > 0);
}

function checkCollision() {
    for (let pipe of pipes) {
        if (
            bird.x + bird.width > pipe.x &&
            bird.x < pipe.x + pipeWidth &&
            (bird.y < pipe.top || bird.y + bird.height > canvas.height - pipe.bottom)
        ) {
            gameState = 'gameover';
        }
    }
}

function gameLoop() {
    if (gameState === 'playing') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBackground();
        updatePipes();
        checkCollision();
        drawPipes();
        updateBird();
        drawBird();
        drawGround();
        frameCount++;
    } else if (gameState === 'gameover') {
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

startButton.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    gameState = 'playing';
});

restartButton.addEventListener('click', resetGame);

skinButtons.forEach(button => {
    button.addEventListener('click', () => {
        birdImg.src = `assets/${button.dataset.skin}`;
    });
});

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && gameState === 'playing') {
        bird.velocity = bird.jump;
    } else if (e.code === 'KeyP' && gameState === 'playing') {
        gameState = 'paused';
    } else if (e.code === 'KeyP' && gameState === 'paused') {
        gameState = 'playing';
        pauseScreen.classList.add('hidden');
    }
});

canvas.addEventListener('click', () => {
    if (gameState === 'playing') {
        bird.velocity = bird.jump;
    }
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    bird.y = canvas.height / 2;
});

birdImg.onload = () => {
    highScoreDisplay.textContent = highScore;
    gameLoop();
};
