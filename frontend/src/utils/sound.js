// Sound Manager - Complete working version
class SoundManager {
  constructor() {
    this.audio = null;
    this.isEnabled = true;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    
    try {
      this.audio = new Audio('/sounds/that-was-quick-606.mp3');
      this.audio.volume = 0.7;
      this.audio.load();
      this.isInitialized = true;
      console.log('Sound initialized');
    } catch (error) {
      console.error('Error loading sound:', error);
    }
  }

  // Add the preload method that App.jsx is calling
  preload() {
    console.log('Preloading sound...');
    this.init();
    
    // Try to unlock audio on user interaction
    if (this.audio) {
      this.audio.play().then(() => {
        this.audio.pause();
        this.audio.currentTime = 0;
        console.log('Audio preloaded and unlocked');
      }).catch(error => {
        console.log('Audio not yet unlocked:', error);
      });
    }
  }

  playMessageSound() {
    console.log('playMessageSound called, enabled:', this.isEnabled);
    
    if (!this.isEnabled) {
      console.log('Sound disabled');
      return;
    }
    
    this.init();
    
    if (!this.audio) {
      console.log('No audio element');
      return;
    }
    
    // Reset and play
    this.audio.currentTime = 0;
    const playPromise = this.audio.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.log('Play error:', error);
      });
    }
  }

  enable() {
    this.isEnabled = true;
    localStorage.setItem('soundEnabled', 'true');
    console.log('Sound enabled');
  }

  disable() {
    this.isEnabled = false;
    localStorage.setItem('soundEnabled', 'false');
    console.log('Sound disabled');
  }

  loadPreference() {
    const saved = localStorage.getItem('soundEnabled');
    if (saved !== null) {
      this.isEnabled = saved === 'true';
    }
    console.log('Sound preference loaded:', this.isEnabled);
    return this.isEnabled;
  }
}

export default new SoundManager();