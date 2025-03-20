// Particle system for 吃货球球

// Particle pool for recycling
const particlePool = [];
const MAX_PARTICLES = 1000;

// Initialize particle pool
function initParticlePool() {
    for (let i = 0; i < MAX_PARTICLES; i++) {
        particlePool.push({});
    }
}

// Get a particle from the pool
function getParticle() {
    if (particlePool.length > 0) {
        return particlePool.pop();
    } else {
        return {};
    }
}

// Return a particle to the pool
function releaseParticle(particle) {
    if (particlePool.length < MAX_PARTICLES) {
        particlePool.push(particle);
    }
}

// Create particles at position
function createParticles(x, y, count, color, speed, size, lifetime) {
    for (let i = 0; i < count; i++) {
        if (gameState.particles.length >= MAX_PARTICLES) return;
        
        const angle = Math.random() * Math.PI * 2;
        const velocity = speed * (0.5 + Math.random() * 0.5);
        const particleSize = size * (0.5 + Math.random() * 0.5);
        const particleLifetime = lifetime * (0.8 + Math.random() * 0.4);
        
        const particle = getParticle();
        particle.x = x;
        particle.y = y;
        particle.size = particleSize;
        particle.color = color;
        particle.velocity = {
            x: Math.cos(angle) * velocity,
            y: Math.sin(angle) * velocity
        };
        particle.alpha = 1;
        particle.lifetime = particleLifetime;
        particle.startTime = Date.now();
        
        gameState.particles.push(particle);
    }
}

// Create explosion particles
function createExplosionParticles(x, y, radius, color) {
    const particleCount = Math.min(100, radius * 0.5);
    createParticles(x, y, particleCount, color, 2, 5, 1000);
    
    // Create a shock wave
    gameState.explosions.push({
        x: x,
        y: y,
        radius: 10,
        maxRadius: radius,
        color: color,
        alpha: 1,
        startTime: Date.now()
    });
    
    // Create some debris particles
    for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * radius * 0.7;
        const debrisX = x + Math.cos(angle) * distance;
        const debrisY = y + Math.sin(angle) * distance;
        
        createParticles(debrisX, debrisY, 5, '#FFFFFF', 1, 3, 800);
    }
}

// Update explosion effects
function updateExplosionEffects() {
    const currentTime = Date.now();
    
    // Update explosions
    for (let i = gameState.explosions.length - 1; i >= 0; i--) {
        const explosion = gameState.explosions[i];
        const timePassed = currentTime - explosion.startTime;
        
        if (timePassed < CONFIG.EXPLOSION.DURATION) {
            const progress = timePassed / CONFIG.EXPLOSION.DURATION;
            explosion.radius = progress * explosion.maxRadius;
            explosion.alpha = 1 - progress;
        } else {
            gameState.explosions.splice(i, 1);
        }
    }
    
    // Update particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const particle = gameState.particles[i];
        const timePassed = currentTime - particle.startTime;
        
        // Update position
        particle.x += particle.velocity.x;
        particle.y += particle.velocity.y;
        
        // Apply gravity
        particle.velocity.y += 0.05;
        
        // Slow down
        particle.velocity.x *= 0.98;
        particle.velocity.y *= 0.98;
        
        // Fade out
        particle.alpha = 1 - (timePassed / particle.lifetime);
        
        // Remove if lifetime expired
        if (timePassed >= particle.lifetime) {
            releaseParticle(particle);
            gameState.particles.splice(i, 1);
        }
    }
}

// Initialize the particle system
window.addEventListener('load', initParticlePool);
