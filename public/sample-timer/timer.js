// タイマーアプリ
class Timer {
    constructor() {
        // DOM要素
        this.timerDisplay = document.getElementById('timerDisplay');
        this.minutesInput = document.getElementById('minutesInput');
        this.secondsInput = document.getElementById('secondsInput');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        
        // 状態
        this.totalSeconds = 0;
        this.remainingSeconds = 0;
        this.isRunning = false;
        this.intervalId = null;
        
        // 音声通知用
        this.audioContext = null;
        
        this._setupEventListeners();
        this._updateDisplay();
    }
    
    _setupEventListeners() {
        // ボタンイベント
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
        
        // 入力変更イベント
        this.minutesInput.addEventListener('change', () => this._updateFromInputs());
        this.secondsInput.addEventListener('change', () => this._updateFromInputs());
        
        // プリセットボタン
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const minutes = parseInt(e.target.dataset.minutes);
                this.minutesInput.value = minutes;
                this.secondsInput.value = 0;
                this._updateFromInputs();
            });
        });
        
        // Enterキーでスタート
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !this.isRunning) {
                this.start();
            }
        });
    }
    
    _updateFromInputs() {
        const minutes = parseInt(this.minutesInput.value) || 0;
        const seconds = parseInt(this.secondsInput.value) || 0;
        this.totalSeconds = minutes * 60 + seconds;
        this.remainingSeconds = this.totalSeconds;
        this._updateDisplay();
    }
    
    start() {
        if (this.isRunning) return;
        
        // 初回スタート時は入力値から設定
        if (this.remainingSeconds === 0) {
            this._updateFromInputs();
        }
        
        if (this.remainingSeconds === 0) {
            alert('時間を設定してください');
            return;
        }
        
        this.isRunning = true;
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
        this.minutesInput.disabled = true;
        this.secondsInput.disabled = true;
        
        this.intervalId = setInterval(() => {
            this.remainingSeconds--;
            this._updateDisplay();
            
            if (this.remainingSeconds <= 0) {
                this._finish();
            }
        }, 1000);
    }
    
    pause() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        
        clearInterval(this.intervalId);
    }
    
    reset() {
        this.pause();
        this.remainingSeconds = this.totalSeconds;
        this._updateDisplay();
        this.minutesInput.disabled = false;
        this.secondsInput.disabled = false;
        this.timerDisplay.classList.remove('warning');
    }
    
    _finish() {
        this.pause();
        this.remainingSeconds = 0;
        this._updateDisplay();
        this._playSound();
        this.minutesInput.disabled = false;
        this.secondsInput.disabled = false;
        
        // ブラウザ通知
        if (document.hidden) {
            this._showNotification();
        }
        
        alert('⏰ 時間です！');
    }
    
    _updateDisplay() {
        const minutes = Math.floor(this.remainingSeconds / 60);
        const seconds = this.remainingSeconds % 60;
        
        const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        this.timerDisplay.textContent = display;
        
        // 残り30秒以下で警告表示
        if (this.remainingSeconds <= 30 && this.remainingSeconds > 0) {
            this.timerDisplay.classList.add('warning');
        } else {
            this.timerDisplay.classList.remove('warning');
        }
        
        // タイトルにも表示
        document.title = `${display} - タイマー`;
    }
    
    _playSound() {
        // 簡易ビープ音
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('音声再生に失敗しました:', e);
        }
    }
    
    _showNotification() {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('タイマー', {
                body: '⏰ 時間です！',
                icon: '⏱️'
            });
        } else if ('Notification' in window && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    new Timer();
});
