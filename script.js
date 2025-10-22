const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const finalScoreDisplay = document.getElementById('final-score');
const highScoreDisplay = document.getElementById('high-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const gameOverScreen = document.getElementById('game-over');
const menu = document.getElementById('menu');
const gameUi = document.getElementById('game-ui');
const characterButtons = document.querySelectorAll('.character-btn');

let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
highScoreDisplay.textContent = highScore;
let isPlaying = false;
let animationFrameId;
let selectedBird = 'sparrow';

// Bird properties
const bird = {
    x: 100,
    y: canvas.height / 2,
    radius: 15,
    velocity: 0,
    gravity: 0.5,
    flap: -10,
    colors: {
        sparrow: '#ff6b6b', // Red
        parrot: '#4ecdc4', // Cyan
        owl: '#f4a261'     // Orange
    }
};

// Pipes
const pipes = [];
const pipeWidth = 50;
const pipeGap = 150;
let pipeFrequency = 90;
let frameCount = 0;

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
    gameLoop();
});

// Restart game
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

// Flap controls (spacebar, click, or touch)
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

// Game loop
function gameLoop() {
    if (!isPlaying) return;

    update();
    draw();
    animationFrameId = requestAnimationFrame(gameLoop);
}

function update() {
    // Update bird
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;

    // Generate pipes
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

    // Update pipes
    pipes.forEach(pipe => {
        pipe.x -= 2;

        // Score points
        if (!pipe.scored && pipe.x + pipeWidth < bird.x) {
            score++;
            scoreDisplay.textContent = score;
            pipe.scored = true;
        }

        // Collision detection
        if (
            (bird.x + bird.radius > pipe.x && bird.x - bird.radius < pipe.x + pipeWidth &&
             (bird.y - bird.radius < pipe.top || bird.y + bird.radius > pipe.bottom)) ||
            bird.y + bird.radius > canvas.height || bird.y - bird.radius < 0
        ) {
            endGame();
        }
    });

    // Remove off-screen pipes
    pipes.filter(pipe => pipe.x + pipeWidth > 0);
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw pipes
    ctx.fillStyle = '#4ecdc4';
    pipes.forEach(pipe => {
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
        ctx.fillRect(pipe.x, pipe.bottom, pipeWidth, canvas.height - pipe.bottom);
    });

    // Draw bird
    ctx.beginPath();
    ctx.arc(bird.x, bird.y, bird.radius, 0, Math.PI * 2);
    ctx.fillStyle = bird.colors[selectedBird];
    ctx.fill();
    ctx.closePath();
}

function endGame() {
    isPlaying = false;
    finalScoreDisplay.textContent = score;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        highScoreDisplay.textContent = highScore;
    }
    gameOverScreen.classList.remove('hidden');
    cancelAnimationFrame(animationFrameId);
}
