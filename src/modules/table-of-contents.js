/**
 * 目次管理クラス
 * 目次モーダルの表示とページジャンプを制御する
 * 
 * @class TableOfContentsManager
 */
export class TableOfContentsManager {
    /**
     * @param {EventEmitter} eventBus - イベントバス
     */
    constructor(eventBus) {
        /** @type {EventEmitter} イベントバス */
        this.eventBus = eventBus;
        
        /** @type {HTMLElement} 目次モーダル要素 */
        this.modal = document.getElementById('tocModal');
        
        /** @type {HTMLElement} 目次リスト要素 */
        this.tocList = document.getElementById('tocList');
        
        /** @type {HTMLButtonElement} 目次ボタン */
        this.tocBtn = document.getElementById('tocBtn');
        
        /** @type {HTMLElement} 閉じるボタン */
        this.closeBtn = this.modal.querySelector('.modal-close');
        
        /** @type {Array<{page: number, title: string}>} 目次データ */
        this.tableOfContents = [];
        
        /** @type {number} 現在のページ番号 */
        this.currentPage = 1;
        
        this._setupEventListeners();
    }

    /**
     * イベントリスナーの設定
     * @private
     */
    _setupEventListeners() {
        // 目次ボタン
        this.tocBtn.addEventListener('click', () => this.open());
        
        // 閉じるボタン
        this.closeBtn.addEventListener('click', () => this.close());
        
        // 背景クリックで閉じる
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });
        
        // ESCキーで閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('show')) {
                this.close();
            }
        });
        
        // ページ変更を監視
        this.eventBus.on('pageRendered', ({ pageNum }) => {
            this.currentPage = pageNum;
            this._updateCurrentItem();
        });
    }

    /**
     * 目次データを設定
     * @param {Array<{page: number, title: string}>} toc - 目次データ
     */
    setTableOfContents(toc) {
        this.tableOfContents = toc;
        this._render();
        
        // 目次がない場合はボタンを無効化
        this.tocBtn.disabled = toc.length === 0;
    }

    /**
     * 目次モーダルを開く
     */
    open() {
        if (this.tableOfContents.length === 0) return;
        this._updateCurrentItem();
        this.modal.classList.add('show');
    }

    /**
     * 目次モーダルを閉じる
     */
    close() {
        this.modal.classList.remove('show');
    }

    /**
     * 目次をレンダリング
     * @private
     */
    _render() {
        this.tocList.innerHTML = '';
        
        if (this.tableOfContents.length === 0) {
            this.tocList.innerHTML = '<p style="color: #999; text-align: center;">目次情報がありません</p>';
            return;
        }
        
        this.tableOfContents.forEach(item => {
            const button = document.createElement('button');
            button.className = 'toc-item';
            button.dataset.page = item.page;
            
            const pageCircle = document.createElement('div');
            pageCircle.className = 'toc-item-page';
            pageCircle.textContent = item.page;
            
            const title = document.createElement('div');
            title.className = 'toc-item-title';
            title.textContent = item.title;
            
            button.appendChild(pageCircle);
            button.appendChild(title);
            
            button.addEventListener('click', () => {
                this.eventBus.emit('pageJumpRequested', { pageNum: item.page });
                this.close();
            });
            
            this.tocList.appendChild(button);
        });
    }

    /**
     * 現在のページの目次項目をハイライト
     * @private
     */
    _updateCurrentItem() {
        const items = this.tocList.querySelectorAll('.toc-item');
        items.forEach(item => {
            const page = parseInt(item.dataset.page);
            if (page === this.currentPage) {
                item.classList.add('current');
            } else {
                item.classList.remove('current');
            }
        });
    }
}
