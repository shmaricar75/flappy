const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const scoreBoard = document.getElementById('score-board');
const currentScoreEl = document.getElementById('current-score');
const finalScoreEl = document.getElementById('final-score');
const bestScoreEl = document.getElementById('best-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// Game State
let frames = 0;
let score = 0;
let bestScore = localStorage.getItem('flappyBestScore') || 0;
let currentState = 'START'; // START, PLAYING, GAMEOVER
let animationId;

// Physics & Dimensions
const gravity = 0.25;
const jump = -5.5;
let speed = 2; // Pipe moving speed

// Set canvas size based on container
function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- Game Objects ---

const bird = {
    x: 50,
    y: 150,
    radius: 12,
    velocity: 0,
    color: '#feca57',
    
    draw: function() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#333';
        ctx.stroke();
        ctx.closePath();

        // Eye
        ctx.beginPath();
        ctx.arc(this.x + 4, this.y - 4, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.closePath();

        // Pupil
        ctx.beginPath();
        ctx.arc(this.x + 5, this.y - 4, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
        ctx.closePath();
    },
    
    update: function() {
        this.velocity += gravity;
        this.y += this.velocity;
        
        // Floor collision
        if (this.y + this.radius >= canvas.height) {
            this.y = canvas.height - this.radius;
            gameOver();
        }
        
        // Ceiling collision
        if (this.y - this.radius <= 0) {
            this.y = this.radius;
            this.velocity = 0;
        }
    },
    
    flap: function() {
        this.velocity = jump;
    },

    reset: function() {
        this.y = canvas.height / 2;
        this.velocity = 0;
    }
};

const pipes = {
    position: [],
    width: 50,
    gap: 120,
    color: '#2ed573',
    
    draw: function() {
        for (let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            
            // Top pipe
            ctx.fillStyle = this.color;
            ctx.fillRect(p.x, 0, this.width, p.top);
            ctx.strokeRect(p.x, 0, this.width, p.top);
            
            // Bottom pipe
            ctx.fillRect(p.x, p.bottom, this.width, canvas.height - p.bottom);
            ctx.strokeRect(p.x, p.bottom, this.width, canvas.height - p.bottom);

            // Pipe caps
            ctx.fillRect(p.x - 2, p.top - 20, this.width + 4, 20);
            ctx.strokeRect(p.x - 2, p.top - 20, this.width + 4, 20);
            
            ctx.fillRect(p.x - 2, p.bottom, this.width + 4, 20);
            ctx.strokeRect(p.x - 2, p.bottom, this.width + 4, 20);
        }
    },
    
    update: function() {
        // Add new pipe every 100 frames
        if (frames % 100 === 0) {
            let minPipeHeight = 50;
            let maxPipeHeight = canvas.height - this.gap - minPipeHeight;
            let topPipeHeight = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight + 1) + minPipeHeight);
            
            this.position.push({
                x: canvas.width,
                top: topPipeHeight,
                bottom: topPipeHeight + this.gap,
                passed: false
            });
        }
        
        for (let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            
            // Move pipe left
            p.x -= speed;
            
            // Collision Detection
            // Check if bird is within pipe x-coordinates
            if (bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + this.width) {
                // Check if bird hits top or bottom pipe
                if (bird.y - bird.radius < p.top || bird.y + bird.radius > p.bottom) {
                    gameOver();
                }
            }
            
            // Update score when passing pipe
            if (p.x + this.width < bird.x && !p.passed) {
                score++;
                currentScoreEl.innerText = score;
                p.passed = true;
                
                // Increase speed slightly
                if(score % 5 === 0) speed += 0.5;
            }
            
            // Remove off-screen pipes
            if (p.x + this.width < 0) {
                this.position.shift();
                i--; // Adjust index after removing
            }
        }
    },

    reset: function() {
        this.position = [];
        speed = 2;
    }
};

const background = {
    colorTop: '#1CB5E0',
    colorBottom: '#000046',
    
    draw: function() {
        let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, this.colorTop);
        gradient.addColorStop(1, this.colorBottom);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw some clouds or stars here if desired
    }
};

// --- Game Logic ---

function draw() {
    background.draw();
    pipes.draw();
    bird.draw();
}

function update() {
    if (currentState === 'PLAYING') {
        bird.update();
        pipes.update();
        frames++;
    }
}

function loop() {
    update();
    draw();
    if (currentState !== 'GAMEOVER') {
        animationId = requestAnimationFrame(loop);
    } else {
        // Draw one last time to show collision state
        draw();
    }
}

function startGame() {
    currentState = 'PLAYING';
    bird.reset();
    pipes.reset();
    score = 0;
    frames = 0;
    currentScoreEl.innerText = score;
    
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    scoreBoard.classList.remove('hidden');
    
    if (animationId) cancelAnimationFrame(animationId);
    loop();
}

function gameOver() {
    currentState = 'GAMEOVER';
    
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('flappyBestScore', bestScore);
    }
    
    finalScoreEl.innerText = score;
    bestScoreEl.innerText = bestScore;
    
    scoreBoard.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
}

// --- Controls ---

function handleInput(e) {
    if (e.type === 'keydown' && e.code !== 'Space') return;
    
    if (currentState === 'PLAYING') {
        bird.flap();
    }
}

window.addEventListener('keydown', handleInput);
canvas.addEventListener('mousedown', handleInput);
canvas.addEventListener('touchstart', handleInput, {passive: true});

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Initial Draw
background.draw();
bird.draw();
