// Audio system for 吃货球球

// Audio elements
let backgroundMusic;
let eatSound;
let vegetableSound;
let explosionSound;

// Audio state
let isMuted = false;
let isAudioInitialized = false;

// Initialize audio
function initAudio() {
    if (isAudioInitialized) return;
    
    // Create audio elements
    backgroundMusic = new Audio("https://assets.codepen.io/21542/howling-wind.mp3");
    eatSound = new Audio("https://assets.codepen.io/21542/pop1.mp3");
    vegetableSound = new Audio("https://assets.codepen.io/21542/ding.mp3");
    explosionSound = new Audio("https://assets.codepen.io/21542/explosion.mp3");
    
    // Set properties
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.4;
    
    eatSound.volume = 0.6;
    vegetableSound.volume = 0.7;
    explosionSound.volume = 0.5;
    
    isAudioInitialized = true;
}

// Play background music
function playBackgroundMusic() {
    if (!isAudioInitialized) initAudio();
    if (!isMuted) {
        backgroundMusic.play().catch(err => {
            console.log("Background music could not be played automatically", err);
        });
    }
}

// Stop background music
function stopBackgroundMusic() {
    if (!isAudioInitialized) return;
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
}

// Play eat sound
function playEatSound() {
    if (!isAudioInitialized) initAudio();
    if (!isMuted) {
        // Clone the sound to allow overlapping playback
        const sound = eatSound.cloneNode();
        sound.volume = Math.min(0.6, 0.3 + Math.random() * 0.3); // Slight volume variation
        sound.playbackRate = 0.8 + Math.random() * 0.4; // Slight pitch variation
        sound.play().catch(err => {
            console.log("Eat sound could not be played automatically", err);
        });
    }
}

// Play vegetable sound
function playVegetableSound() {
    if (!isAudioInitialized) initAudio();
    if (!isMuted) {
        vegetableSound.currentTime = 0;
        vegetableSound.play().catch(err => {
            console.log("Vegetable sound could not be played automatically", err);
        });
    }
}

// Play explosion sound
function playExplosionSound() {
    if (!isAudioInitialized) initAudio();
    if (!isMuted) {
        explosionSound.currentTime = 0;
        explosionSound.play().catch(err => {
            console.log("Explosion sound could not be played automatically", err);
        });
    }
}

// Toggle mute
function toggleMute() {
    isMuted = !isMuted;
    
    if (!isAudioInitialized) initAudio();
    
    if (isMuted) {
        stopBackgroundMusic();
    } else if (gameState.isRunning) {
        playBackgroundMusic();
    }
    
    return isMuted;
}

// Initialize audio on first user interaction
window.addEventListener('click', function() {
    if (!isAudioInitialized) {
        initAudio();
    }
}, { once: true });
