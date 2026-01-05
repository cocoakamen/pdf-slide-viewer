/**
 * ナビゲーション管理クラス
 * ページ移動、キーボード操作、スワイプジェスチャーを制御する
 * 
 * @class NavigationManager
 */
export class NavigationManager {
    /**
     * @param {Function} onPageChange - ページ変更時のコールバック関数
     * @param {Function} getPageCount - 総ページ数を取得する関数
     */
    constructor(onPageChange, getPageCount) {
        /** @type {number} 現在のページ番号 */
        this.currentPage = 1;
        
        /** @type {Function} ページ変更時のコールバック */
        this.onPageChange = onPageChange;
        
        /** @type {Function} 総ページ数取得関数 */
        this.getPageCount = getPageCount;
        
        /** @type {HTMLButtonElement} 前へボタン */
        this.prevBtn = document.getElementById('prevBtn');
        
        /** @type {HTMLButtonElement} 次へボタン */
        this.nextBtn = document.getElementById('nextBtn');
        
        /** @type {HTMLElement} ページインディケーター要素 */
        this.pageIndicator = document.getElementById('pageIndicator');
        
        /** @type {number} タッチ開始位置のX座標 */
        this.touchStartX = 0;
        
        /** @type {number} タッチ終了位置のX座標 */
        this.touchEndX = 0;
        
        /** @type {boolean} ホイール操作中かどうか */
        this.isWheeling = false;
        
        this._setupEventListeners();
    }

    /**
     * イベントリスナーの設定
     * @private
     */
    _setupEventListeners() {
        // ボタンクリック
        this.prevBtn.addEventListener('click', () => this.prevPage());
        this.nextBtn.addEventListener('click', () => this.nextPage());

        // マウスホイール
        document.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            // 連続スクロール防止
            if (this.isWheeling) return;
            this.isWheeling = true;
            
            if (e.deltaY > 0) {
                this.nextPage();
            } else if (e.deltaY < 0) {
                this.prevPage();
            }
            
            // 300msの待機時間
            setTimeout(() => {
                this.isWheeling = false;
            }, 300);
        }, { passive: false });

        // キーボード
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
                e.preventDefault();
                this.prevPage();
            }
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') {
                e.preventDefault();
                this.nextPage();
            }
        });

        // スワイプジェスチャー
        document.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
        });

        document.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this._handleSwipe();
        });
    }

    /**
     * スワイプジェスチャーを処理
     * @private
     */
    _handleSwipe() {
        const swipeThreshold = 50;
        if (this.touchEndX < this.touchStartX - swipeThreshold) {
            this.nextPage();
        }
        if (this.touchEndX > this.touchStartX + swipeThreshold) {
            this.prevPage();
        }
    }

    /**
     * 前のページに移動
     */
    async prevPage() {
        if (this.currentPage <= 1) return;
        this.currentPage--;
        await this._changePage();
    }

    /**
     * 次のページに移動
     */
    async nextPage() {
        const pageCount = this.getPageCount();
        if (this.currentPage >= pageCount) return;
        this.currentPage++;
        await this._changePage();
    }

    /**
     * 指定したページに移動
     * @param {number} pageNum - 移動先のページ番号
     */
    async goToPage(pageNum) {
        const pageCount = this.getPageCount();
        if (pageNum < 1 || pageNum > pageCount) return;
        this.currentPage = pageNum;
        await this._changePage();
    }

    /**
     * ページ変更処理を実行
     * @private
     */
    async _changePage() {
        await this.onPageChange(this.currentPage);
        this.updateUI();
        this._updateURL();
    }

    /**
     * URLパラメータを更新（replaceStateで履歴を残さず更新）
     * @private
     */
    _updateURL() {
        const params = new URLSearchParams(window.location.search);
        params.set('page', this.currentPage);
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState(null, '', newUrl);
    }

    /**
     * ナビゲーションUIを更新（インディケーター表示、ボタンの有効/無効）
     * @param {Array<number>} [tocPages=[]] - 目次があるページ番号の配列
     */
    updateUI(tocPages = []) {
        const pageCount = this.getPageCount();
        
        // ボタンの有効/無効
        this.prevBtn.disabled = (this.currentPage <= 1);
        this.nextBtn.disabled = (this.currentPage >= pageCount);
        
        // インディケーターの更新
        this._updateIndicator(pageCount, tocPages);
    }
    
    /**
     * ページインディケーターを更新
     * @private
     * @param {number} pageCount - 総ページ数
     * @param {Array<number>} tocPages - 目次があるページ番号の配列
     */
    _updateIndicator(pageCount, tocPages) {
        // プログレスバーが未生成の場合は生成
        if (!this.pageIndicator.querySelector('.progress-bar')) {
            this._createProgressBar(pageCount, tocPages);
        } else {
            // 既存のバーを更新
            this._updateProgressBar(pageCount, tocPages);
        }
    }
    
    /**
     * プログレスバーを生成
     * @private
     * @param {number} pageCount - 総ページ数
     * @param {Array<number>} tocPages - 目次があるページ番号の配列
     */
    _createProgressBar(pageCount, tocPages) {
        this.pageIndicator.innerHTML = '';
        
        // 1ページしかない場合はプログレスバーを表示しない
        if (pageCount <= 1) {
            return;
        }
        
        // バーのコンテナ
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.title = `ページ ${this.currentPage} / ${pageCount}`;
        
        // 進捗の塗りつぶし
        const progressFill = document.createElement('div');
        progressFill.className = 'progress-fill';
        progressBar.appendChild(progressFill);
        
        // 現在位置のサム（つまみ）
        const progressThumb = document.createElement('div');
        progressThumb.className = 'progress-thumb';
        progressBar.appendChild(progressThumb);
        
        // 目次マーカー（位置計算を修正：1ページ目を0%、最終ページを100%に）
        tocPages.forEach(pageNum => {
            const marker = document.createElement('div');
            marker.className = 'toc-marker';
            // (pageNum - 1) / (pageCount - 1) で0%〜100%の範囲に正規化
            const position = ((pageNum - 1) / (pageCount - 1)) * 100;
            marker.style.left = `${position}%`;
            marker.title = `目次: ページ ${pageNum}`;
            progressBar.appendChild(marker);
        });
        
        // クリックでジャンプ
        progressBar.addEventListener('click', (e) => {
            const rect = progressBar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = clickX / rect.width;
            const targetPage = Math.max(1, Math.min(pageCount, Math.round(percentage * pageCount)));
            this.goToPage(targetPage);
        });
        
        this.pageIndicator.appendChild(progressBar);
        this._updateProgressBar(pageCount, tocPages);
    }
    
    /**
     * プログレスバーの表示を更新
     * @private
     * @param {number} pageCount - 総ページ数
     * @param {Array<number>} tocPages - 目次があるページ番号の配列
     */
    _updateProgressBar(pageCount, tocPages) {
        const progressBar = this.pageIndicator.querySelector('.progress-bar');
        if (!progressBar) return;
        
        const progressFill = progressBar.querySelector('.progress-fill');
        const progressThumb = progressBar.querySelector('.progress-thumb');
        
        // 進捗の割合を計算：1ページ目を0%、最終ページを100%にする
        // (currentPage - 1) / (pageCount - 1) で正規化
        const progress = pageCount > 1 ? ((this.currentPage - 1) / (pageCount - 1)) * 100 : 0;
        
        // 塗りつぶしとサムの位置を更新
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
        if (progressThumb) {
            progressThumb.style.left = `${progress}%`;
        }
        
        // ツールチップ更新
        progressBar.title = `ページ ${this.currentPage} / ${pageCount}`;
    }

    /**
     * 現在のページ番号を取得
     * @returns {number} 現在のページ番号
     */
    getCurrentPage() {
        return this.currentPage;
    }
}
