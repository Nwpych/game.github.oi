// Game Configuration
const CONFIG = {
    PLAYER: {
        INITIAL_SIZE: 20,
        INITIAL_SIZE_VALUE: 0,
        MIN_SIZE_VALUE: 0,
        MAX_SIZE_VALUE: 50,
        COLOR: '#D1D1D1',
        SPEED: 0.2,  // Speed multiplier when moving
        FRICTION: 0.95  // Slow down factor
    },
    BALLS: {
        MIN_RADIUS: 5,
        MAX_RADIUS: 15,
        ORANGE_BALL: {
            COLOR: '#F9A826',
            PROBABILITY: 0.98,
            SCORE_IMPACT: 1
        },
        GREEN_BALL: {
            COLOR: '#4ADE80',
            PROBABILITY: 0.02,
            SCORE_IMPACT: -1
        },
        BLUE_BALL: {
            COLOR: '#3B82F6',
            PROBABILITY: 0.005,
            SPAWN_DELAY: 10 // seconds before first blue ball appears
        },
        INITIAL_COUNT: 20,
        MAX_COUNT: 500,
        SPAWN_RATE: 2,  // New balls per second
        MAX_SPEED: 2
    },
    VEGETABLE: {
        SIZE: 25,
        SCORE_IMPACT: -20
    },
    EXPLOSION: {
        RADIUS: 100,
        DURATION: 500,  // milliseconds
        PARTICLES: 50
    }
};

// Game State
const gameState = {
    isRunning: false,
    startTime: 0,
    currentTime: 0,
    playerSizeValue: CONFIG.PLAYER.INITIAL_SIZE_VALUE,
    player: {
        x: 0,
        y: 0,
        radius: CONFIG.PLAYER.INITIAL_SIZE,
        velocity: { x: 0, y: 0 },
        isDragging: false
    },
    balls: [],
    particles: [],
    vegetables: [],
    explosions: [],
    lastBallSpawn: 0,
    score: 0
};

// DOM Elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startGameBtn = document.getElementById('startGameBtn');
const gameStats = document.getElementById('gameStats');
const timerDisplay = document.getElementById('timerDisplay');
const sizeDisplay = document.getElementById('sizeDisplay');
const gameOverModal = document.getElementById('gameOverModal');
const finalScore = document.getElementById('finalScore');
const gameOverMessage = document.getElementById('gameOverMessage');
const playAgainBtn = document.getElementById('playAgainBtn');
const submitScoreBtn = document.getElementById('submitScoreBtn');

// Ball pool for recycling balls
const ballPool = [];

// Initialize canvas size
function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    // If game is already started, update player position to center of new canvas
    if (gameState.isRunning) {
        gameState.player.x = canvas.width / 2;
        gameState.player.y = canvas.height / 2;
    }
}

// Initialize game
function initGame() {
    gameState.isRunning = true;
    gameState.playerSizeValue = CONFIG.PLAYER.INITIAL_SIZE_VALUE;
    gameState.startTime = Date.now();
    gameState.currentTime = 0;
    gameState.score = 0;
    gameState.balls = [];
    gameState.vegetables = [];
    gameState.explosions = [];
    gameState.particles = [];
    gameState.player.x = canvas.width / 2;
    gameState.player.y = canvas.height / 2;
    gameState.player.radius = CONFIG.PLAYER.INITIAL_SIZE;
    gameState.player.velocity = { x: 0, y: 0 };
    gameState.player.isDragging = false;
    
    // Initialize initial balls
    for (let i = 0; i < CONFIG.BALLS.INITIAL_COUNT; i++) {
        spawnBall();
    }
    
    startGameBtn.classList.add('hidden');
    gameStats.classList.remove('hidden');
    
    // Start the game loop
    requestAnimationFrame(gameLoop);
    
    // Play background music
    if (typeof playBackgroundMusic === 'function') {
        playBackgroundMusic();
    }
}

// Get a ball from the pool or create a new one
function getBall() {
    if (ballPool.length > 0) {
        return ballPool.pop();
    }
    return {};
}

// Return a ball to the pool
function releaseBall(ball) {
    if (ballPool.length < CONFIG.BALLS.MAX_COUNT) {
        ballPool.push(ball);
    }
}

// Spawn a new ball
function spawnBall(type) {
    if (gameState.balls.length >= CONFIG.BALLS.MAX_COUNT) return;
    
    const ball = getBall();
    const minRadius = CONFIG.BALLS.MIN_RADIUS;
    const maxRadius = CONFIG.BALLS.MAX_RADIUS;
    const radius = Math.random() * (maxRadius - minRadius) + minRadius;
    
    // Determine ball type if not specified
    let ballType;
    if (type) {
        ballType = type;
    } else {
        const random = Math.random();
        // Only spawn blue balls after some time
        const canSpawnBlueBall = gameState.currentTime > CONFIG.BALLS.BLUE_BALL.SPAWN_DELAY && 
                                random < CONFIG.BALLS.BLUE_BALL.PROBABILITY;
        
        if (canSpawnBlueBall) {
            ballType = 'blue';
        } else if (random < CONFIG.BALLS.GREEN_BALL.PROBABILITY) {
            ballType = 'green';
        } else {
            ballType = 'orange';
        }
    }
    
    // Set ball properties based on type
    let color;
    switch (ballType) {
        case 'green':
            color = CONFIG.BALLS.GREEN_BALL.COLOR;
            break;
        case 'blue':
            color = CONFIG.BALLS.BLUE_BALL.COLOR;
            break;
        case 'orange':
        default:
            color = CONFIG.BALLS.ORANGE_BALL.COLOR;
            break;
    }
    
    // Get random position outside the canvas
    let x, y;
    const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    
    switch (side) {
        case 0: // top
            x = Math.random() * canvas.width;
            y = -radius;
            break;
        case 1: // right
            x = canvas.width + radius;
            y = Math.random() * canvas.height;
            break;
        case 2: // bottom
            x = Math.random() * canvas.width;
            y = canvas.height + radius;
            break;
        case 3: // left
            x = -radius;
            y = Math.random() * canvas.height;
            break;
    }
    
    // Calculate velocity towards center with some randomness
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const angle = Math.atan2(centerY - y, centerX - x);
    const speed = Math.random() * CONFIG.BALLS.MAX_SPEED + 0.5;
    
    ball.x = x;
    ball.y = y;
    ball.radius = radius;
    ball.color = color;
    ball.type = ballType;
    ball.velocity = {
        x: Math.cos(angle) * speed + (Math.random() - 0.5),
        y: Math.sin(angle) * speed + (Math.random() - 0.5)
    };
    ball.glowing = ballType === 'blue';
    ball.eatenCount = 0; // For blue balls to track how many they've eaten
    ball.explosionTimer = 0; // For blue balls to track when they'll explode
    
    gameState.balls.push(ball);
}

// Spawn a vegetable
function spawnVegetable(x, y) {
    gameState.vegetables.push({
        x: x,
        y: y,
        radius: CONFIG.VEGETABLE.SIZE,
        rotation: Math.random() * Math.PI * 2
    });
}

// Detect collision between two circles
function detectCollision(circle1, circle2) {
    const dx = circle1.x - circle2.x;
    const dy = circle1.y - circle2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < circle1.radius + circle2.radius;
}

// Handle collision response
function handleCollision(ball1, ball2) {
    const dx = ball2.x - ball1.x;
    const dy = ball2.y - ball1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = ball1.radius + ball2.radius;
    
    // Calculate collision normal
    const nx = dx / distance;
    const ny = dy / distance;
    
    // Calculate relative velocity
    const dvx = ball2.velocity.x - ball1.velocity.x;
    const dvy = ball2.velocity.y - ball1.velocity.y;
    
    // Calculate collision impulse
    const impulse = (dvx * nx + dvy * ny) * 1.5; // Elasticity factor
    
    // Apply impulse to velocities
    ball1.velocity.x += impulse * nx;
    ball1.velocity.y += impulse * ny;
    ball2.velocity.x -= impulse * nx;
    ball2.velocity.y -= impulse * ny;
    
    // Move balls apart to prevent sticking
    const correction = (minDistance - distance) / 2;
    ball1.x -= correction * nx;
    ball1.y -= correction * ny;
    ball2.x += correction * nx;
    ball2.y += correction * ny;
}

// Create an explosion
function createExplosion(x, y, color) {
    gameState.explosions.push({
        x: x,
        y: y,
        radius: 10,
        maxRadius: CONFIG.EXPLOSION.RADIUS,
        color: color,
        alpha: 1,
        startTime: Date.now()
    });
    
    // Create particles
    for (let i = 0; i < CONFIG.EXPLOSION.PARTICLES; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        const size = Math.random() * 8 + 2;
        const lifetime = Math.random() * 1000 + 500;
        
        gameState.particles.push({
            x: x,
            y: y,
            size: size,
            color: color,
            velocity: {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            },
            alpha: 1,
            lifetime: lifetime,
            startTime: Date.now()
        });
    }
    
    // Play explosion sound
    if (typeof playExplosionSound === 'function') {
        playExplosionSound();
    }
}

// Update player's size based on their size value
function updatePlayerSize() {
    // Calculate the new radius based on the size value
    // Add 20 as the base size, then scale the size value
    gameState.player.radius = CONFIG.PLAYER.INITIAL_SIZE + gameState.playerSizeValue * 2;
    
    // Update display
    sizeDisplay.textContent = gameState.playerSizeValue;
}

// Handle player eating a ball
function handlePlayerEatBall(ball) {
    // Remove the ball from the array
    const ballIndex = gameState.balls.indexOf(ball);
    if (ballIndex > -1) {
        const ball = gameState.balls[ballIndex];
        gameState.balls.splice(ballIndex, 1);
        releaseBall(ball);
        
        // Play eat sound
        if (typeof playEatSound === 'function') {
            playEatSound();
        }
        
        // Create eating effect
        if (typeof createEatingEffect === 'function') {
            createEatingEffect(ball.x, ball.y, ball.color);
        }
        
        // Update player size based on ball type
        if (ball.type === 'orange') {
            gameState.playerSizeValue += CONFIG.BALLS.ORANGE_BALL.SCORE_IMPACT;
        } else if (ball.type === 'green') {
            gameState.playerSizeValue += CONFIG.BALLS.GREEN_BALL.SCORE_IMPACT;
        }
        
        updatePlayerSize();
        
        // Check if game over
        if (gameState.playerSizeValue > CONFIG.PLAYER.MAX_SIZE_VALUE || 
            gameState.playerSizeValue < CONFIG.PLAYER.MIN_SIZE_VALUE) {
            endGame();
        }
    }
}

// Handle player eating a vegetable
function handlePlayerEatVegetable(vegetable) {
    // Remove the vegetable from the array
    const vegetableIndex = gameState.vegetables.indexOf(vegetable);
    if (vegetableIndex > -1) {
        gameState.vegetables.splice(vegetableIndex, 1);
        
        // Update player size
        gameState.playerSizeValue += CONFIG.VEGETABLE.SCORE_IMPACT;
        updatePlayerSize();
        
        // Play vegetable eat sound
        if (typeof playVegetableSound === 'function') {
            playVegetableSound();
        }
    }
}

// Handle blue ball eating another ball
function handleBlueBallEatBall(blueBall, targetBall) {
    // Remove the target ball from the array
    const ballIndex = gameState.balls.indexOf(targetBall);
    if (ballIndex > -1) {
        const ball = gameState.balls[ballIndex];
        gameState.balls.splice(ballIndex, 1);
        releaseBall(ball);
        
        // Increase blue ball's eaten count and size
        blueBall.eatenCount++;
        blueBall.radius = Math.min(blueBall.radius + 2, 50);
        
        // Check if blue ball should explode
        if (blueBall.eatenCount >= 10) {
            blueBall.explosionTimer = 2000; // Will explode in 2 seconds
            
            // Pulse animation effect
            blueBall.pulsePhase = 0;
        }
    }
}

// Make a blue ball explode
function explodeBlueBall(blueBall) {
    // Create explosion
    createExplosion(blueBall.x, blueBall.y, blueBall.color);
    
    // Remove balls within explosion radius
    const explosionRadius = CONFIG.EXPLOSION.RADIUS;
    let ballsRemoved = 0;
    
    for (let i = gameState.balls.length - 1; i >= 0; i--) {
        const ball = gameState.balls[i];
        // Skip the exploding blue ball itself
        if (ball === blueBall) continue;
        
        const dx = ball.x - blueBall.x;
        const dy = ball.y - blueBall.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < explosionRadius) {
            gameState.balls.splice(i, 1);
            releaseBall(ball);
            ballsRemoved++;
        }
    }
    
    // Remove the blue ball itself
    const blueIndex = gameState.balls.indexOf(blueBall);
    if (blueIndex > -1) {
        gameState.balls.splice(blueIndex, 1);
        releaseBall(blueBall);
    }
    
    // Spawn vegetable if at least some balls were removed
    if (ballsRemoved > 0) {
        spawnVegetable(blueBall.x, blueBall.y);
    }
}

// Update all game entities
function updateGame(deltaTime) {
    // Calculate spawn rate based on time
    // Gradually increase spawn rate over time
    const currentSpawnRate = CONFIG.BALLS.SPAWN_RATE * (1 + gameState.currentTime / 30);
    
    // Spawn new balls
    if (Date.now() - gameState.lastBallSpawn > 1000 / currentSpawnRate) {
        spawnBall();
        gameState.lastBallSpawn = Date.now();
    }
    
    // Update player position based on velocity
    gameState.player.x += gameState.player.velocity.x;
    gameState.player.y += gameState.player.velocity.y;
    
    // Apply friction to player velocity
    gameState.player.velocity.x *= CONFIG.PLAYER.FRICTION;
    gameState.player.velocity.y *= CONFIG.PLAYER.FRICTION;
    
    // Keep player within canvas bounds
    if (gameState.player.x < gameState.player.radius) {
        gameState.player.x = gameState.player.radius;
        gameState.player.velocity.x = 0;
    } else if (gameState.player.x > canvas.width - gameState.player.radius) {
        gameState.player.x = canvas.width - gameState.player.radius;
        gameState.player.velocity.x = 0;
    }
    
    if (gameState.player.y < gameState.player.radius) {
        gameState.player.y = gameState.player.radius;
        gameState.player.velocity.y = 0;
    } else if (gameState.player.y > canvas.height - gameState.player.radius) {
        gameState.player.y = canvas.height - gameState.player.radius;
        gameState.player.velocity.y = 0;
    }
    
    // Update balls
    for (let i = gameState.balls.length - 1; i >= 0; i--) {
        const ball = gameState.balls[i];
        
        // Update position
        ball.x += ball.velocity.x;
        ball.y += ball.velocity.y;
        
        // Check if ball is far outside the canvas and remove it
        if (
            ball.x < -100 ||
            ball.x > canvas.width + 100 ||
            ball.y < -100 ||
            ball.y > canvas.height + 100
        ) {
            gameState.balls.splice(i, 1);
            releaseBall(ball);
            continue;
        }
        
        // Bounce off canvas edges
        if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
            ball.velocity.x *= -1;
            // Make sure it doesn't get stuck in the wall
            if (ball.x - ball.radius < 0) {
                ball.x = ball.radius;
            } else {
                ball.x = canvas.width - ball.radius;
            }
        }
        
        if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
            ball.velocity.y *= -1;
            // Make sure it doesn't get stuck in the wall
            if (ball.y - ball.radius < 0) {
                ball.y = ball.radius;
            } else {
                ball.y = canvas.height - ball.radius;
            }
        }
        
        // If it's a blue ball that's about to explode
        if (ball.type === 'blue' && ball.explosionTimer > 0) {
            ball.explosionTimer -= deltaTime;
            // Pulse animation
            ball.pulsePhase = (ball.pulsePhase || 0) + deltaTime * 0.01;
            
            if (ball.explosionTimer <= 0) {
                explodeBlueBall(ball);
                continue;
            }
        }
        
        // Check if player collides with the ball
        if (detectCollision(gameState.player, ball)) {
            handlePlayerEatBall(ball);
            continue;
        }
        
        // Check if blue ball collides with other balls (blue balls eat other balls)
        if (ball.type === 'blue') {
            for (let j = gameState.balls.length - 1; j >= 0; j--) {
                const otherBall = gameState.balls[j];
                if (otherBall !== ball && otherBall.type !== 'blue' && 
                    detectCollision(ball, otherBall)) {
                    handleBlueBallEatBall(ball, otherBall);
                    break;
                }
            }
        }
        
        // Check collision with other balls
        for (let j = i + 1; j < gameState.balls.length; j++) {
            const otherBall = gameState.balls[j];
            if (detectCollision(ball, otherBall)) {
                handleCollision(ball, otherBall);
            }
        }
    }
    
    // Update vegetables
    for (let i = gameState.vegetables.length - 1; i >= 0; i--) {
        const vegetable = gameState.vegetables[i];
        
        // Rotate vegetable
        vegetable.rotation += 0.01;
        
        // Check if player collides with vegetable
        if (detectCollision(gameState.player, vegetable)) {
            handlePlayerEatVegetable(vegetable);
        }
    }
    
    // Update explosions
    for (let i = gameState.explosions.length - 1; i >= 0; i--) {
        const explosion = gameState.explosions[i];
        const timePassed = Date.now() - explosion.startTime;
        
        if (timePassed < CONFIG.EXPLOSION.DURATION) {
            // Expand radius
            explosion.radius = (timePassed / CONFIG.EXPLOSION.DURATION) * explosion.maxRadius;
            // Fade out
            explosion.alpha = 1 - (timePassed / CONFIG.EXPLOSION.DURATION);
        } else {
            gameState.explosions.splice(i, 1);
        }
    }
    
    // Update particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const particle = gameState.particles[i];
        const timePassed = Date.now() - particle.startTime;
        
        // Update position
        particle.x += particle.velocity.x;
        particle.y += particle.velocity.y;
        
        // Apply gravity
        particle.velocity.y += 0.1;
        
        // Slow down
        particle.velocity.x *= 0.98;
        particle.velocity.y *= 0.98;
        
        // Fade out
        particle.alpha = 1 - (timePassed / particle.lifetime);
        
        // Remove if lifetime expired
        if (timePassed >= particle.lifetime) {
            gameState.particles.splice(i, 1);
        }
    }
    
    // Update timer
    gameState.currentTime = (Date.now() - gameState.startTime) / 1000;
    timerDisplay.textContent = gameState.currentTime.toFixed(1);
}

// Draw the game
function drawGame() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw balls
    for (const ball of gameState.balls) {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.fill();
        
        // Draw glow effect for blue balls
        if (ball.glowing) {
            ctx.save();
            ctx.beginPath();
            const pulseFactor = ball.pulsePhase ? (1 + 0.2 * Math.sin(ball.pulsePhase)) : 1;
            const glowRadius = ball.radius * 1.5 * pulseFactor;
            
            const gradient = ctx.createRadialGradient(
                ball.x, ball.y, ball.radius,
                ball.x, ball.y, glowRadius
            );
            
            gradient.addColorStop(0, ball.color);
            gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
            
            ctx.arc(ball.x, ball.y, glowRadius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.restore();
        }
    }
    
    // Draw vegetables
    for (const vegetable of gameState.vegetables) {
        drawVegetable(vegetable.x, vegetable.y, vegetable.radius, vegetable.rotation);
    }
    
    // Draw explosions
    for (const explosion of gameState.explosions) {
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59, 130, 246, ${explosion.alpha * 0.3})`;
        ctx.fill();
        
        // Draw explosion rings
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, explosion.radius * 0.8, 0, Math.PI * 2);
        ctx.lineWidth = 3;
        ctx.strokeStyle = `rgba(59, 130, 246, ${explosion.alpha * 0.8})`;
        ctx.stroke();
    }
    
    // Draw particles
    for (const particle of gameState.particles) {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${particle.alpha})`;
        ctx.fill();
    }
    
    // Draw player
    ctx.beginPath();
    ctx.arc(gameState.player.x, gameState.player.y, gameState.player.radius, 0, Math.PI * 2);
    ctx.fillStyle = CONFIG.PLAYER.COLOR;
    ctx.fill();
    
    // Draw player face (simple eyes and mouth)
    const eyeSize = Math.max(3, gameState.player.radius * 0.15);
    const eyeOffset = Math.max(4, gameState.player.radius * 0.25);
    const mouthSize = Math.max(5, gameState.player.radius * 0.3);
    
    // Left eye
    ctx.beginPath();
    ctx.arc(gameState.player.x - eyeOffset, gameState.player.y - eyeOffset * 0.5, eyeSize, 0, Math.PI * 2);
    ctx.fillStyle = '#333';
    ctx.fill();
    
    // Right eye
    ctx.beginPath();
    ctx.arc(gameState.player.x + eyeOffset, gameState.player.y - eyeOffset * 0.5, eyeSize, 0, Math.PI * 2);
    ctx.fillStyle = '#333';
    ctx.fill();
    
    // Mouth (smile)
    ctx.beginPath();
    ctx.arc(gameState.player.x, gameState.player.y + eyeOffset * 0.7, mouthSize, 0, Math.PI);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = Math.max(2, gameState.player.radius * 0.08);
    ctx.stroke();
}

// Draw vegetable
function drawVegetable(x, y, radius, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    // Draw a simple broccoli or lettuce like vegetable
    ctx.fillStyle = '#4ADE80';
    
    // Draw stem
    ctx.beginPath();
    ctx.rect(-radius/6, 0, radius/3, radius/1.5);
    ctx.fill();
    
    // Draw vegetable parts
    for (let i = 0; i < 7; i++) {
        const angle = (i / 7) * Math.PI * 2;
        const leafRadius = radius * 0.7;
        const leafX = Math.cos(angle) * radius * 0.33;
        const leafY = Math.sin(angle) * radius * 0.33 - radius * 0.3;
        
        ctx.beginPath();
        ctx.arc(leafX, leafY, leafRadius * 0.55, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
    if (!gameState.isRunning) return;
    
    const deltaTime = lastTime ? timestamp - lastTime : 0;
    lastTime = timestamp;
    
    updateGame(deltaTime);
    drawGame();
    
    requestAnimationFrame(gameLoop);
}

// End game
function endGame() {
    gameState.isRunning = false;
    gameState.score = gameState.currentTime;
    
    // Stop background music
    if (typeof stopBackgroundMusic === 'function') {
        stopBackgroundMusic();
    }
    
    // Show game over modal
    finalScore.textContent = gameState.currentTime.toFixed(1);
    
    // Different messages based on how the game ended
    if (gameState.playerSizeValue > CONFIG.PLAYER.MAX_SIZE_VALUE) {
        gameOverMessage.textContent = "你吃太多了，变得太大而无法移动！";
    } else if (gameState.playerSizeValue < CONFIG.PLAYER.MIN_SIZE_VALUE) {
        gameOverMessage.textContent = "你变得太小，消失了！";
    }
    
    gameOverModal.classList.remove('hidden');
    
    // Only enable submit score button if user is logged in
    submitScoreBtn.disabled = !isLoggedIn();
    if (!isLoggedIn()) {
        submitScoreBtn.classList.add('opacity-50', 'cursor-not-allowed');
        submitScoreBtn.textContent = "请先登录后提交分数";
    } else {
        submitScoreBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        submitScoreBtn.textContent = "提交分数";
    }
    
    startGameBtn.classList.remove('hidden');
    gameStats.classList.add('hidden');
}

// Event Listeners
startGameBtn.addEventListener('click', () => {
    if (!gameState.isRunning) {
        initGame();
    }
});

// Handle mouse down on player
canvas.addEventListener('mousedown', (e) => {
    if (!gameState.isRunning) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const dx = mouseX - gameState.player.x;
    const dy = mouseY - gameState.player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Check if clicked on player
    if (distance < gameState.player.radius) {
        gameState.player.isDragging = true;
        
        // Track movement
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
    }
});

// Handle mouse move for player dragging
function handleMouseMove(e) {
    if (!gameState.player.isDragging || !gameState.isRunning) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Move towards mouse position
    const dx = mouseX - gameState.player.x;
    const dy = mouseY - gameState.player.y;
    
    // Acceleration towards mouse
    gameState.player.velocity.x += dx * CONFIG.PLAYER.SPEED;
    gameState.player.velocity.y += dy * CONFIG.PLAYER.SPEED;
}

// Handle mouse up for player dragging
function handleMouseUp() {
    gameState.player.isDragging = false;
    
    // Remove movement tracking
    canvas.removeEventListener('mousemove', handleMouseMove);
    canvas.removeEventListener('mouseup', handleMouseUp);
}

// Touch events for mobile
canvas.addEventListener('touchstart', (e) => {
    if (!gameState.isRunning) return;
    e.preventDefault();
    
    const rect = canvas.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    const touchY = e.touches[0].clientY - rect.top;
    
    const dx = touchX - gameState.player.x;
    const dy = touchY - gameState.player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Check if touched on player
    if (distance < gameState.player.radius) {
        gameState.player.isDragging = true;
        
        // Track movement
        canvas.addEventListener('touchmove', handleTouchMove);
        canvas.addEventListener('touchend', handleTouchEnd);
    }
}, { passive: false });

// Handle touch move for player dragging
function handleTouchMove(e) {
    if (!gameState.player.isDragging || !gameState.isRunning) return;
    e.preventDefault();
    
    const rect = canvas.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    const touchY = e.touches[0].clientY - rect.top;
    
    // Move towards touch position
    const dx = touchX - gameState.player.x;
    const dy = touchY - gameState.player.y;
    
    // Acceleration towards touch
    gameState.player.velocity.x += dx * CONFIG.PLAYER.SPEED;
    gameState.player.velocity.y += dy * CONFIG.PLAYER.SPEED;
}

// Handle touch end for player dragging
function handleTouchEnd() {
    gameState.player.isDragging = false;
    
    // Remove movement tracking
    canvas.removeEventListener('touchmove', handleTouchMove);
    canvas.removeEventListener('touchend', handleTouchEnd);
}

playAgainBtn.addEventListener('click', () => {
    gameOverModal.classList.add('hidden');
    initGame();
});

submitScoreBtn.addEventListener('click', () => {
    if (isLoggedIn()) {
        submitScore(gameState.currentTime);
        gameOverModal.classList.add('hidden');
    } else {
        // Flash message
        submitScoreBtn.classList.add('bg-red-500');
        setTimeout(() => {
            submitScoreBtn.classList.remove('bg-red-500');
        }, 500);
    }
});

// Resize event
window.addEventListener('resize', resizeCanvas);

// Initialize canvas on load
window.addEventListener('load', () => {
    resizeCanvas();
    
    // Position the player at center initially
    gameState.player.x = canvas.width / 2;
    gameState.player.y = canvas.height / 2;
});
