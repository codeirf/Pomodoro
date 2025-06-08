/**
 * Minimalist Pomodoro Timer JavaScript
 * Handles timer logic, UI updates, and user interactions
 */

class PomodoroTimer {
    constructor() {
        this.timerConfigs = {
            pomodoro: 25 * 60,      // 25 minutes in seconds
            short_break: 5 * 60,    // 5 minutes in seconds
            long_break: 15 * 60     // 15 minutes in seconds
        };
        
        this.currentMode = 'pomodoro';
        this.timeRemaining = this.timerConfigs[this.currentMode];
        this.isRunning = false;
        this.intervalId = null;
        this.sessionCount = 0;
        
        this.initializeElements();
        this.bindEvents();
        this.updateDisplay();
        this.updateProgressRing();
    }

    initializeElements() {
        // Timer display elements
        this.timeDisplay = document.getElementById('timeDisplay');
        this.currentModeDisplay = document.getElementById('currentMode');
        this.sessionCountDisplay = document.getElementById('sessionCount');
        
        // Control buttons
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.skipBtn = document.getElementById('skipBtn');
        this.playPauseIcon = document.getElementById('playPauseIcon');
        this.playPauseText = document.getElementById('playPauseText');
        
        // Mode buttons
        this.modeButtons = document.querySelectorAll('.mode-btn');
        
        // Progress ring
        this.progressRing = document.querySelector('.progress-ring-progress');
        this.progressRingRadius = 140;
        this.progressRingCircumference = 2 * Math.PI * this.progressRingRadius;
        
        // Notification
        this.notification = document.getElementById('notification');
        this.notificationText = document.getElementById('notificationText');
        
        // Initialize progress ring
        this.progressRing.style.strokeDasharray = this.progressRingCircumference;
    }

    bindEvents() {
        // Control button events
        this.playPauseBtn.addEventListener('click', () => this.toggleTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());
        this.skipBtn.addEventListener('click', () => this.skipSession());
        
        // Mode button events
        this.modeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.switchMode(mode);
            });
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.toggleTimer();
            } else if (e.code === 'KeyR') {
                e.preventDefault();
                this.resetTimer();
            } else if (e.code === 'KeyS') {
                e.preventDefault();
                this.skipSession();
            }
        });
    }

    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }

    startTimer() {
        this.isRunning = true;
        this.playPauseIcon.textContent = '⏸';
        this.playPauseText.textContent = 'Pause';
        this.playPauseBtn.classList.add('timer-active');
        
        this.intervalId = setInterval(() => {
            this.timeRemaining--;
            this.updateDisplay();
            this.updateProgressRing();
            
            if (this.timeRemaining <= 0) {
                this.completeSession();
            }
        }, 1000);
    }

    pauseTimer() {
        this.isRunning = false;
        this.playPauseIcon.textContent = '▶';
        this.playPauseText.textContent = 'Start';
        this.playPauseBtn.classList.remove('timer-active');
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    resetTimer() {
        this.pauseTimer();
        this.timeRemaining = this.timerConfigs[this.currentMode];
        this.updateDisplay();
        this.updateProgressRing();
    }

    skipSession() {
        this.pauseTimer();
        this.completeSession();
    }

    completeSession() {
        this.pauseTimer();
        
        // Update session count for completed pomodoros
        if (this.currentMode === 'pomodoro') {
            this.sessionCount++;
            this.sessionCountDisplay.textContent = this.sessionCount;
        }
        
        // Show notification
        this.showNotification(this.getCompletionMessage());
        
        // Auto-switch to next mode
        this.autoSwitchMode();
        
        // Play notification sound (if browser supports it)
        this.playNotificationSound();
    }

    autoSwitchMode() {
        let nextMode;
        
        if (this.currentMode === 'pomodoro') {
            // After pomodoro, switch to break (long break every 4 sessions)
            nextMode = (this.sessionCount % 4 === 0) ? 'long_break' : 'short_break';
        } else {
            // After any break, switch back to pomodoro
            nextMode = 'pomodoro';
        }
        
        setTimeout(() => {
            this.switchMode(nextMode);
        }, 1000);
    }

    switchMode(mode) {
        if (mode === this.currentMode) return;
        
        this.pauseTimer();
        this.currentMode = mode;
        this.timeRemaining = this.timerConfigs[mode];
        
        // Update active mode button
        this.modeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        // Update progress ring color
        this.updateProgressRingColor();
        
        // Update display
        this.updateDisplay();
        this.updateProgressRing();
        
        // Add transition animation
        document.querySelector('.timer-container').classList.add('mode-transition');
        setTimeout(() => {
            document.querySelector('.timer-container').classList.remove('mode-transition');
        }, 500);
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        
        this.timeDisplay.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        this.currentModeDisplay.textContent = this.getModeDisplayText();
        
        // Update document title
        document.title = `${this.timeDisplay.textContent} - ${this.getModeDisplayText()}`;
    }

    updateProgressRing() {
        const totalTime = this.timerConfigs[this.currentMode];
        const progress = (totalTime - this.timeRemaining) / totalTime;
        const offset = this.progressRingCircumference * (1 - progress);
        
        this.progressRing.style.strokeDashoffset = offset;
    }

    updateProgressRingColor() {
        const colors = {
            pomodoro: '#e74c3c',
            short_break: '#3498db',
            long_break: '#27ae60'
        };
        
        this.progressRing.style.stroke = colors[this.currentMode];
    }

    getModeDisplayText() {
        const modeTexts = {
            pomodoro: 'Pomodoro Session',
            short_break: 'Short Break',
            long_break: 'Long Break'
        };
        
        return modeTexts[this.currentMode];
    }

    getCompletionMessage() {
        const messages = {
            pomodoro: 'Great work! Time for a break.',
            short_break: 'Break time is over. Ready to focus?',
            long_break: 'Long break completed. Let\'s get back to work!'
        };
        
        return messages[this.currentMode];
    }

    showNotification(message) {
        this.notificationText.textContent = message;
        this.notification.classList.add('show');
        
        setTimeout(() => {
            this.notification.classList.remove('show');
        }, 4000);
    }

    playNotificationSound() {
        // Create a simple beep sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('Audio notification not supported');
        }
    }
}

// Initialize the timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PomodoroTimer();
    
    // Add keyboard shortcuts info to console
    console.log('Keyboard shortcuts:');
    console.log('Space - Start/Pause timer');
    console.log('R - Reset timer');
    console.log('S - Skip session');
});
