/**
 * タイマー管理クラス
 * タイマーアプリを別ウィンドウで開く
 * 
 * @class TimerManager
 */
export class TimerManager {
    /**
     * @param {string|null} timerUrl - タイマーアプリのURL
     */
    constructor(timerUrl) {
        /** @type {string|null} タイマーアプリのURL */
        this.timerUrl = timerUrl;
        
        /** @type {HTMLButtonElement} タイマーボタン */
        this.timerBtn = document.getElementById('timerBtn');
        
        /** @type {Window|null} 開いたポップアップウィンドウの参照 */
        this.popupWindow = null;
        
        this._setupEventListeners();
    }

    /**
     * イベントリスナーの設定
     * @private
     */
    _setupEventListeners() {
        // タイマーURLが設定されていない場合はボタンを非表示
        if (!this.timerUrl) {
            this.timerBtn.style.display = 'none';
            return;
        }

        // ボタンクリック
        this.timerBtn.addEventListener('click', () => this.openTimer());
    }

    /**
     * タイマーウィンドウを開く
     */
    openTimer() {
        if (!this.timerUrl) return;

        // 既存のウィンドウが開いていて、まだ閉じられていない場合はフォーカス
        if (this.popupWindow && !this.popupWindow.closed) {
            this.popupWindow.focus();
            return;
        }

        // ポップアップウィンドウを開く
        const width = 800;
        const height = 800;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;
        
        const features = `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no,status=no`;
        
        this.popupWindow = window.open(this.timerUrl, 'timer', features);
        
        if (!this.popupWindow) {
            alert('ポップアップがブロックされました。ブラウザの設定を確認してください。');
        }
    }
}
