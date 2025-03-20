// Visual effects for 吃货球球

// Eating effect particles
const eatingEffects = [];

// Create eating effect at position
function createEatingEffect(x, y, color) {
    // Create multiple particles in a circular pattern
    const particleCount = 8;
    
    for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        const distance = 10 + Math.random() * 20;
        const particleX = x + Math.cos(angle) * distance;
        const particleY = y + Math.sin(angle) * distance;
        const size = 3 + Math.random() * 5;
        const lifetime = 500 + Math.random() * 500;
        
        eatingEffects.push({
            x: particleX,
            y: particleY,
            originalX: particleX,
            originalY: particleY,
            targetX: x,
            targetY: y,
            size: size,
            color: color,
            opacity: 1,
            startTime: Date.now(),
            lifetime: lifetime
        });
    }
    
    // Add a starburst effect
    const burstParticleCount = 6;
    for (let i = 0; i < burstParticleCount; i++) {
        const angle = (i / burstParticleCount) * Math.PI * 2;
        const distance = 5;
        const particleX = x + Math.cos(angle) * distance;
        const particleY = y + Math.sin(angle) * distance;
        const endX = x + Math.cos(angle) * 30;
        const endY = y + Math.sin(angle) * 30;
        const size = 3 + Math.random() * 3;
        const lifetime = 300 + Math.random() * 200;
        
        eatingEffects.push({
            x: particleX,
            y: particleY,
            originalX: particleX,
            originalY: particleY,
            targetX: endX,
            targetY: endY,
            size: size,
            color: '#FFFFFF',
            opacity: 1,
            startTime: Date.now(),
            lifetime: lifetime,
            type: 'star'
        });
    }
    
    // Add text effect
    const textEffect = {
        x: x,
        y: y - 20,
        text: "+1",
        color: "#FFFFFF",
        opacity: 1,
        size: 16,
        startTime: Date.now(),
        lifetime: 1000,
        type: 'text'
    };
    
    if (color === CONFIG.BALLS.GREEN_BALL.COLOR) {
        textEffect.text = "-1";
        textEffect.color = "#FF6B6B";
    }
    
    eatingEffects.push(textEffect);
}

// Update eating effects
function updateEatingEffects() {
    const currentTime = Date.now();
    
    for (let i = eatingEffects.length - 1; i >= 0; i--) {
        const effect = eatingEffects[i];
        const timePassed = currentTime - effect.startTime;
        const progress = Math.min(1, timePassed / effect.lifetime);
        
        if (progress >= 1) {
            eatingEffects.splice(i, 1);
            continue;
        }
        
        // Update position and opacity based on effect type
        if (effect.type === 'text') {
            effect.y -= 0.5; // Float up
            effect.opacity = 1 - progress;
        } else if (effect.type === 'star') {
            effect.x = effect.originalX + (effect.targetX - effect.originalX) * progress;
            effect.y = effect.originalY + (effect.targetY - effect.originalY) * progress;
            effect.opacity = 1 - progress;
            effect.size *= 0.98;
        } else {
            // Regular effect particles move inward
            effect.x = effect.originalX + (effect.targetX - effect.originalX) * progress * 2;
            effect.y = effect.originalY + (effect.targetY - effect.originalY) * progress * 2;
            // Start fading out halfway through the lifetime
            if (progress > 0.5) {
                effect.opacity = 1 - (progress - 0.5) * 2;
            }
        }
    }
}

// Draw eating effects
function drawEatingEffects() {
    for (const effect of eatingEffects) {
        if (effect.type === 'text') {
            ctx.save();
            ctx.font = `bold ${effect.size}px Arial`;
            ctx.fillStyle = `rgba(255, 255, 255, ${effect.opacity})`;
            ctx.strokeStyle = `rgba(0, 0, 0, ${effect.opacity})`;
            ctx.lineWidth = 3;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.strokeText(effect.text, effect.x, effect.y);
            ctx.fillStyle = `rgba(${effect.color.r || 255}, ${effect.color.g || 255}, ${effect.color.b || 255}, ${effect.opacity})`;
            ctx.fillText(effect.text, effect.x, effect.y);
            ctx.restore();
        } else if (effect.type === 'star') {
            const size = effect.size;
            ctx.save();
            ctx.translate(effect.x, effect.y);
            ctx.beginPath();
            
            // Draw a simple star shape
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                const length = i === 0 ? size : size / 2;
                if (i === 0) {
                    ctx.moveTo(Math.cos(angle) * length, Math.sin(angle) * length);
                } else {
                    ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
                }
                
                const angle2 = ((i + 0.5) * 2 * Math.PI) / 5 - Math.PI / 2;
                ctx.lineTo(Math.cos(angle2) * (size / 2), Math.sin(angle2) * (size / 2));
            }
            
            ctx.closePath();
            ctx.fillStyle = `rgba(255, 255, 255, ${effect.opacity})`;
            ctx.fill();
            ctx.restore();
        } else {
            // Regular circular particles
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${effect.color}, ${effect.opacity})`;
            ctx.fill();
        }
    }
}

// Add these functions to the game loop
const originalUpdateGame = updateGame;
updateGame = function(deltaTime) {
    originalUpdateGame(deltaTime);
    updateEatingEffects();
};

const originalDrawGame = drawGame;
drawGame = function() {
    originalDrawGame();
    drawEatingEffects();
};
