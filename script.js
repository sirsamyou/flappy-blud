const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const pauseScreen = document.getElementById('pause-screen');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const currentScoreDisplay = document.getElementById('current-score');
const finalScoreDisplay = document.getElementById('final-score');
const highScoreDisplay = document.getElementById('high-score');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const birdImg = new Image();
birdImg.src = 'assets/bird1.png';

let bird = {
    x: 100,
    y: canvas.height / 2,
    width: 50,
    height: 50,
    velocity: 0,
    gravity: 0.5,
    jump: -10,
    rotation: 0
};

let pipes = [];
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gameState = 'start';
let frameCount = 0;

const pipeWidth = 50;
const pipeGap = 200;
const pipeSpeed = 2;

function drawBird() {
    ctx.save();
    ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
    ctx.rotate(bird.rotation);
    ctx.drawImage(birdImg, -bird.width / 2, -bird.height / 2, bird.width, bird.height);
    ctx.restore();
}

function drawPipes() {
    ctx.fillStyle = '#4CAF50';
    pipes.forEach(pipe => {
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
        ctx.fillRect(pipe.x, canvas.height - pipe.bottom, pipeWidth, pipe.bottom);
    });
}

function updateBird() {
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;
    bird.rotation = Math.min(Math.max(bird.velocity * 0.05, -0.5), 0.5);

    if (bird.y + bird.height > canvas.height || bird.y < 0) {
        gameState = 'gameover';
    }
}

function updatePipes() {
    if (frameCount % 90 === 0) {
        const gapY = Math.random() * (canvas.height - pipeGap - 200) + 100;
        pipes.push({
            x: canvas.width,
            top: gapY,
            bottom: canvas.height - gapY - pipeGap,
            scored: false
        });
    }

    pipes.forEach(pipe => {
        pipe.x -= pipeSpeed;
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

function drawBackground() {
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
}

function gameLoop() {
    if (gameState === 'playing') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBackground();
        updateBird();
        updatePipes();
        checkCollision();
        drawPipes();
        drawBird();
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
    gameOverScreen.classList.add('hidden');
    gameState = 'playing';
}

startButton.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    gameState = 'playing';
});

restartButton.addEventListener('click', resetGame);

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
