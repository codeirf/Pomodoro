/**
 * Modern Dark Pomodoro Timer - Enhanced JavaScript
 * Handles timer logic, UI updates, task tracking, and user interactions
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
        this.totalTimeToday = 0;
        this.currentTask = '';
        this.currentTheme = 'auto'; // 'auto', 'light', 'dark'

        this.initializeElements();
        this.bindEvents();
        this.loadStoredData();
        this.initializeTheme();
        this.updateDisplay();
        this.updateProgressRing();
        this.updateTheme();
    }

    initializeElements() {
        // Timer display elements
        this.timeDisplay = document.getElementById('timeDisplay');
        this.currentModeDisplay = document.getElementById('currentMode');
        this.sessionCountDisplay = document.getElementById('sessionCount');
        this.totalTimeDisplay = document.getElementById('totalTime');

        // Control buttons
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.skipBtn = document.getElementById('skipBtn');
        this.playIcon = document.getElementById('playIcon');
        this.pauseIcon = document.getElementById('pauseIcon');

        // Mode buttons
        this.modeButtons = document.querySelectorAll('.mode-tab');

        // Progress ring
        this.progressRing = document.querySelector('.progress-fill');
        this.progressRingRadius = 140;
        this.progressRingCircumference = 2 * Math.PI * this.progressRingRadius;

        // Task elements
        this.taskInput = document.getElementById('taskInput');
        this.taskDisplay = document.getElementById('taskDisplay');
        this.editTaskBtn = document.getElementById('editTaskBtn');

        // Theme toggle
        this.themeToggle = document.getElementById('themeToggle');
        if (!this.themeToggle) {
            console.error('Theme toggle element not found!');
        }

        // Notification
        this.notification = document.getElementById('notification');
        this.toastTitle = document.getElementById('toastTitle');
        this.toastMessage = document.getElementById('toastMessage');
        this.toastClose = document.getElementById('toastClose');

        // Initialize progress ring
        this.progressRing.style.strokeDasharray = this.progressRingCircumference;
    }

    loadStoredData() {
        // Load data from localStorage
        const stored = localStorage.getItem('pomodoroData');
        if (stored) {
            const data = JSON.parse(stored);
            this.sessionCount = data.sessionCount || 0;
            this.totalTimeToday = data.totalTimeToday || 0;
            this.currentTask = data.currentTask || '';
            this.currentTheme = data.theme || 'auto';

            // Check if it's a new day
            const lastDate = data.lastDate;
            const today = new Date().toDateString();
            if (lastDate !== today) {
                this.totalTimeToday = 0;
            }
        }

        this.updateTaskDisplay();
    }

    saveData() {
        const data = {
            sessionCount: this.sessionCount,
            totalTimeToday: this.totalTimeToday,
            currentTask: this.currentTask,
            theme: this.currentTheme,
            lastDate: new Date().toDateString()
        };
        localStorage.setItem('pomodoroData', JSON.stringify(data));
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

        // Task events
        this.editTaskBtn.addEventListener('click', () => this.editTask());
        this.taskDisplay.addEventListener('click', () => this.editTask());
        this.taskInput.addEventListener('blur', () => this.saveTask());
        this.taskInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.saveTask();
            } else if (e.key === 'Escape') {
                this.cancelTaskEdit();
            }
        });

        // Theme toggle events
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => {
                console.log('Theme toggle clicked!');
                this.toggleTheme();
            });
        }

        // Notification events
        this.toastClose.addEventListener('click', () => this.hideNotification());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts when typing in input
            if (e.target.tagName === 'INPUT') return;

            if (e.code === 'Space') {
                e.preventDefault();
                this.toggleTimer();
            } else if (e.code === 'KeyR') {
                e.preventDefault();
                this.resetTimer();
            } else if (e.code === 'KeyS') {
                e.preventDefault();
                this.skipSession();
            } else if (e.code === 'KeyT') {
                e.preventDefault();
                this.editTask();
            }
        });

        // Auto-hide notification after 5 seconds
        this.notificationTimeout = null;
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
        this.playIcon.classList.add('hidden');
        this.pauseIcon.classList.remove('hidden');
        document.body.classList.add('timer-active');

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
        this.playIcon.classList.remove('hidden');
        this.pauseIcon.classList.add('hidden');
        document.body.classList.remove('timer-active');

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

        // Update session count and total time for completed pomodoros
        if (this.currentMode === 'pomodoro') {
            this.sessionCount++;
            this.totalTimeToday += 25; // Add 25 minutes
            this.updateStats();
        }

        // Show notification
        this.showNotification(
            this.getCompletionTitle(),
            this.getCompletionMessage()
        );

        // Auto-switch to next mode
        this.autoSwitchMode();

        // Play notification sound
        this.playNotificationSound();

        // Save data
        this.saveData();
    }

    updateStats() {
        this.sessionCountDisplay.textContent = this.sessionCount;

        const hours = Math.floor(this.totalTimeToday / 60);
        const minutes = this.totalTimeToday % 60;

        if (hours > 0) {
            this.totalTimeDisplay.textContent = `${hours}h ${minutes}m`;
        } else {
            this.totalTimeDisplay.textContent = `${minutes}m`;
        }
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

        // Update theme
        this.updateTheme();

        // Update display
        this.updateDisplay();
        this.updateProgressRing();

        // Add transition animation
        document.querySelector('.timer-container').classList.add('mode-transition');
        setTimeout(() => {
            document.querySelector('.timer-container').classList.remove('mode-transition');
        }, 500);
    }

    updateTheme() {
        const themes = {
            pomodoro: 'theme-focus',
            short_break: 'theme-break',
            long_break: 'theme-rest'
        };

        // Remove all theme classes
        document.body.classList.remove('theme-focus', 'theme-break', 'theme-rest');

        // Add current theme class
        document.body.classList.add(themes[this.currentMode]);

        // Update progress gradient
        this.updateProgressGradient();
    }

    updateProgressGradient() {
        const gradients = {
            pomodoro: ['#ff6b6b', '#ee5a52'],
            short_break: ['#4ecdc4', '#44a08d'],
            long_break: ['#a8e6cf', '#88d8a3']
        };

        const gradient = gradients[this.currentMode];
        const progressGradient = document.getElementById('progressGradient');

        if (progressGradient) {
            const stops = progressGradient.querySelectorAll('stop');
            stops[0].style.stopColor = gradient[0];
            stops[1].style.stopColor = gradient[1];
        }
    }

    // Theme Management Methods
    initializeTheme() {
        // Apply stored theme or detect system preference
        this.applyTheme(this.currentTheme);
        this.updateThemeToggle();

        // Listen for system theme changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', () => {
                if (this.currentTheme === 'auto') {
                    this.applyTheme('auto');
                }
            });
        }
    }

    toggleTheme() {
        // Cycle through themes: auto -> light -> dark -> auto
        const themes = ['auto', 'light', 'dark'];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;

        console.log(`Theme toggle: ${this.currentTheme} -> ${themes[nextIndex]}`);

        this.currentTheme = themes[nextIndex];
        this.applyTheme(this.currentTheme);
        this.updateThemeToggle();
        this.saveData();
    }

    applyTheme(theme) {
        const root = document.documentElement; // This targets :root (html element)

        // Remove existing theme classes
        root.classList.remove('theme-light', 'theme-dark');

        if (theme === 'light') {
            root.classList.add('theme-light');
        } else if (theme === 'dark') {
            root.classList.add('theme-dark');
        } else if (theme === 'auto') {
            // Use system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
                root.classList.add('theme-light');
            } else {
                root.classList.add('theme-dark');
            }
        }

        // Debug logging
        console.log(`Theme applied: ${theme}, effective theme: ${this.getEffectiveTheme()}, root classes:`, root.classList.toString());
    }

    updateThemeToggle() {
        if (!this.themeToggle) {
            console.error('Cannot update theme toggle - element not found');
            return;
        }

        const isLight = this.getEffectiveTheme() === 'light';
        this.themeToggle.classList.toggle('light', isLight);

        // Update ARIA label
        const themeNames = {
            'auto': 'system',
            'light': 'light',
            'dark': 'dark'
        };

        this.themeToggle.setAttribute('aria-label',
            `Current theme: ${themeNames[this.currentTheme]}. Click to switch theme.`);

        // Debug logging
        console.log(`Theme toggle updated: isLight=${isLight}, toggle classes:`, this.themeToggle.classList.toString());
    }

    getEffectiveTheme() {
        if (this.currentTheme === 'auto') {
            return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
        }
        return this.currentTheme;
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;

        this.timeDisplay.textContent =
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        this.currentModeDisplay.textContent = this.getModeDisplayText();

        // Update document title
        const status = this.isRunning ? '⏱️' : '⏸️';
        document.title = `${status} ${this.timeDisplay.textContent} - ${this.getModeDisplayText()}`;
    }

    updateProgressRing() {
        const totalTime = this.timerConfigs[this.currentMode];
        const progress = (totalTime - this.timeRemaining) / totalTime;
        const offset = this.progressRingCircumference * (1 - progress);

        this.progressRing.style.strokeDashoffset = offset;
    }

    getModeDisplayText() {
        const modeTexts = {
            pomodoro: 'Focus Session',
            short_break: 'Short Break',
            long_break: 'Long Break'
        };

        return modeTexts[this.currentMode];
    }

    getCompletionTitle() {
        const titles = {
            pomodoro: 'Session Complete!',
            short_break: 'Break Over!',
            long_break: 'Rest Complete!'
        };

        return titles[this.currentMode];
    }

    getCompletionMessage() {
        const messages = {
            pomodoro: 'Great work! Time for a well-deserved break.',
            short_break: 'Break time is over. Ready to focus again?',
            long_break: 'Long break completed. Let\'s get back to work!'
        };

        return messages[this.currentMode];
    }

    // Task Management Methods
    updateTaskDisplay() {
        if (this.currentTask) {
            this.taskDisplay.textContent = this.currentTask;
            this.taskDisplay.classList.add('has-task');
        } else {
            this.taskDisplay.textContent = 'Click to add a task';
            this.taskDisplay.classList.remove('has-task');
        }
    }

    editTask() {
        this.taskInput.value = this.currentTask;
        this.taskInput.style.display = 'block';
        this.taskDisplay.style.display = 'none';
        this.taskInput.focus();
        this.taskInput.select();
    }

    saveTask() {
        this.currentTask = this.taskInput.value.trim();
        this.taskInput.style.display = 'none';
        this.taskDisplay.style.display = 'flex';
        this.updateTaskDisplay();
        this.saveData();
    }

    cancelTaskEdit() {
        this.taskInput.style.display = 'none';
        this.taskDisplay.style.display = 'flex';
    }

    // Notification Methods
    showNotification(title, message) {
        this.toastTitle.textContent = title;
        this.toastMessage.textContent = message;
        this.notification.classList.add('show');

        // Clear existing timeout
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
        }

        // Auto-hide after 5 seconds
        this.notificationTimeout = setTimeout(() => {
            this.hideNotification();
        }, 5000);
    }

    hideNotification() {
        this.notification.classList.remove('show');
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
            this.notificationTimeout = null;
        }
    }

    playNotificationSound() {
        // Create a simple beep sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext || AudioContext)();
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
    const timer = new PomodoroTimer();

    // Add keyboard shortcuts info to console
    console.log('🍅 Focus Timer - Keyboard Shortcuts:');
    console.log('Space - Start/Pause timer');
    console.log('R - Reset timer');
    console.log('S - Skip session');
    console.log('T - Edit task');
    console.log('Theme will follow system preference unless manually changed');

    // Initialize stats display
    timer.updateStats();
});
