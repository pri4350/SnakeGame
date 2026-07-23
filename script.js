// ========== DOM Elements ==========
const board = document.getElementById('board');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const timeEl = document.getElementById('time');
const speedEl = document.getElementById('speed');
const gameOverOverlay = document.getElementById('game-over-overlay');
const finalScoreEl = document.getElementById('final-score');
const finalHighScoreEl = document.getElementById('final-high-score');
const restartBtn = document.getElementById('restart-btn');

// ========== Game Config ==========
const BLOCK_SIZE = 30;
const BASE_INTERVAL = 200; // ms (1x speed)
const GRID_GAP = 0;

let cols, rows;
let blocks = [];
let snake = [];
let direction = 'right';
let nextDirection = 'right';
let food = null;
let score = 0;
let highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
let gameRunning = false;
let gameLoop = null;
let gameSpeed = 1;
let startTime = null;
let timerInterval = null;
let isGameOver = false;

// ========== Initialize Board ==========
function initBoard() {
    // Calculate cols and rows based on board size
    const boardWidth = board.clientWidth;
    const boardHeight = board.clientHeight;
    cols = Math.floor(boardWidth / BLOCK_SIZE);
    rows = Math.floor(boardHeight / BLOCK_SIZE);

    // Set CSS grid
    board.style.gridTemplateColumns = `repeat(${cols}, ${BLOCK_SIZE}px)`;
    board.style.gridTemplateRows = `repeat(${rows}, ${BLOCK_SIZE}px)`;

    // Clear board
    board.innerHTML = '';
    blocks = [];

    // Create blocks
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const block = document.createElement('div');
            block.classList.add('block');
            block.dataset.row = row;
            block.dataset.col = col;
            board.appendChild(block);
            blocks[`${row}-${col}`] = block;
        }
    }
}

// ========== Snake Logic ==========
function resetSnake() {
    const midY = Math.floor(cols / 2);
    const midX = Math.floor(rows / 2);
    snake = [
        { x: midX, y: midY },
        { x: midX, y: midY - 1 },
        { x: midX, y: midY - 2 }
    ];
    direction = 'right';
    nextDirection = 'right';
}

function clearBoard() {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const block = blocks[`${row}-${col}`];
            if (block) {
                block.classList.remove('snake-head', 'snake-body', 'food');
            }
        }
    }
}

function render() {
    clearBoard();

    // Render snake
    snake.forEach((segment, index) => {
        const block = blocks[`${segment.x}-${segment.y}`];
        if (block) {
            if (index === 0) {
                block.classList.add('snake-head');
            } else {
                block.classList.add('snake-body');
            }
        }
    });

    // Render food
    if (food) {
        const foodBlock = blocks[`${food.x}-${food.y}`];
        if (foodBlock) {
            foodBlock.classList.add('food');
        }
    }
}

function moveSnake() {
    if (isGameOver) return;

    direction = nextDirection;
    const head = { ...snake[0] };

    // Calculate new head position
    switch (direction) {
        case 'up': head.x--; break;
        case 'down': head.x++; break;
        case 'left': head.y--; break;
        case 'right': head.y++; break;
    }

    // Check wall collision
    if (head.x < 0 || head.x >= rows || head.y < 0 || head.y >= cols) {
        gameOver();
        return;
    }

    // Check self collision (skip the tail since it will move)
    const willEat = food && head.x === food.x && head.y === food.y;
    const bodyToCheck = willEat ? snake : snake.slice(0, -1);
    
    if (bodyToCheck.some(seg => seg.x === head.x && seg.y === head.y)) {
        gameOver();
        return;
    }

    // Add new head
    snake.unshift(head);

    // Check food collision
    if (food && head.x === food.x && head.y === food.y) {
        score += 10;
        updateScore();
        spawnFood();
        increaseSpeed();
    } else {
        // Remove tail
        snake.pop();
    }

    render();
}

// ========== Food Logic ==========
function spawnFood() {
    const occupied = new Set(snake.map(s => `${s.x}-${s.y}`));
    const available = [];

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (!occupied.has(`${row}-${col}`)) {
                available.push({ x: row, y: col });
            }
        }
    }

    if (available.length === 0) {
        // You win! Snake filled the board
        gameOver(true);
        return;
    }

    const randIdx = Math.floor(Math.random() * available.length);
    food = available[randIdx];
}

// ========== Score Logic ==========
function updateScore() {
    scoreEl.textContent = score;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
    }
    highScoreEl.textContent = highScore;
}

// ========== Speed Logic ==========
function increaseSpeed() {
    // Increase speed every 50 points, max 5x
    const newSpeed = Math.min(5, 1 + Math.floor(score / 50));
    if (newSpeed !== gameSpeed) {
        gameSpeed = newSpeed;
        speedEl.textContent = `${gameSpeed}x`;
        resetGameLoop();
    }
}

function getInterval() {
    return Math.max(80, BASE_INTERVAL - (gameSpeed - 1) * 30);
}

function resetGameLoop() {
    if (gameLoop) {
        clearInterval(gameLoop);
        gameLoop = null;
    }
    if (gameRunning) {
        gameLoop = setInterval(moveSnake, getInterval());
    }
}

// ========== Timer ==========
function startTimer() {
    startTime = Date.now();
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    if (!startTime) return;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const secs = String(elapsed % 60).padStart(2, '0');
    timeEl.textContent = `${mins}:${secs}`;
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function resetTimer() {
    stopTimer();
    timeEl.textContent = '00:00';
    startTime = null;
}

// ========== Game Over / Win ==========
function gameOver(win = false) {
    if (isGameOver) return;
    isGameOver = true;
    gameRunning = false;

    if (gameLoop) {
        clearInterval(gameLoop);
        gameLoop = null;
    }
    stopTimer();

    // Update final score display
    finalScoreEl.textContent = score;
    finalHighScoreEl.textContent = highScore;

    // Show overlay with appropriate message
    const titleEl = gameOverOverlay.querySelector('h1');
    titleEl.textContent = win ? '🎉 You Win!' : 'Game Over!';
    titleEl.style.color = win ? '#4CAF50' : '#FF5252';

    gameOverOverlay.classList.remove('hidden');
}

// ========== Keyboard Controls ==========
function handleKeydown(e) {
    const key = e.key;
    const reverseMap = {
        'up': 'down',
        'down': 'up',
        'left': 'right',
        'right': 'left'
    };

    let newDir = null;
    if (key === 'ArrowUp' || key === 'w' || key === 'W') newDir = 'up';
    else if (key === 'ArrowDown' || key === 's' || key === 'S') newDir = 'down';
    else if (key === 'ArrowLeft' || key === 'a' || key === 'A') newDir = 'left';
    else if (key === 'ArrowRight' || key === 'd' || key === 'D') newDir = 'right';
    else if (key === ' ' || key === 'Space') {
        e.preventDefault();
        if (isGameOver) restartGame();
        return;
    }

    if (newDir && reverseMap[newDir] !== direction && gameRunning) {
        e.preventDefault();
        nextDirection = newDir;
    }
}

// ========== Restart ==========
function restartGame() {
    // Reset state
    isGameOver = false;
    gameRunning = false;
    score = 0;
    gameSpeed = 1;
    food = null;
    direction = 'right';
    nextDirection = 'right';

    gameOverOverlay.classList.add('hidden');

    // Reset UI
    scoreEl.textContent = '0';
    highScoreEl.textContent = highScore;
    speedEl.textContent = '1x';
    resetTimer();

    // Reset snake
    resetSnake();
    clearBoard();

    // Start game
    startGame();
}

function startGame() {
    initBoard();
    resetSnake();
    score = 0;
    gameSpeed = 1;
    direction = 'right';
    nextDirection = 'right';
    food = null;
    isGameOver = false;
    gameRunning = true;

    updateScore();
    speedEl.textContent = '1x';
    resetTimer();

    spawnFood();
    render();
    startTimer();
    resetGameLoop();
}

// ========== Initialize ==========
function init() {
    highScoreEl.textContent = highScore;
    document.addEventListener('keydown', handleKeydown);
    restartBtn.addEventListener('click', restartGame);
    
    startGame();

    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (!isGameOver) {
                gameRunning = false;
                if (gameLoop) {
                    clearInterval(gameLoop);
                    gameLoop = null;
                }
                startGame();
            }
        }, 300);
    });
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

