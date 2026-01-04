/**
 * スライドリンクボタン管理クラス
 * config.jsonに定義されたスライドリンクを画面右下のボタンとして表示する
 * 
 * @class SlideButtonManager
 */
export class SlideButtonManager {
    /**
     * @param {HTMLElement} annotationLayer - ボタンを配置するレイヤー要素
     * @param {EventEmitter} eventBus - イベントバス
     */
    constructor(annotationLayer, eventBus) {
        /** @type {HTMLElement} ボタンコンテナを配置するレイヤー */
        this.annotationLayer = annotationLayer;
        
        /** @type {EventEmitter} イベントバス */
        this.eventBus = eventBus;
        
        this._setupEventListeners();
    }
    
    /**
     * イベントリスナーの設定
     * @private
     */
    _setupEventListeners() {
        // ページレンダリング完了時にスライドリンクボタンを更新
        this.eventBus.on('linksForPageReady', ({ links }) => {
            this.render(links);
        });
    }

    /**
     * スライドリンクボタンをレンダリングして画面に表示
     * @param {Array<{title: string, slide: string}>} links - スライドリンク情報の配列
     */
    render(links) {
        // 既存のボタンをクリア
        const existingContainer = document.getElementById('slideButtons');
        if (existingContainer) {
            existingContainer.remove();
        }

        if (!links || links.length === 0) return;

        const container = document.createElement('div');
        container.id = 'slideButtons';
        container.className = 'slide-buttons-container';

        links.forEach((link, index) => {
            const button = this._createSlideButton(link, index);
            container.appendChild(button);
        });

        this.annotationLayer.appendChild(container);
    }

    /**
     * 個別のスライドリンクボタン要素を作成
     * @private
     * @param {{title: string, slide: string}} link - スライドリンク情報
     * @param {number} index - ボタンのインデックス
     * @returns {HTMLButtonElement} 作成されたボタン要素
     */
    _createSlideButton(link, index) {
        const button = document.createElement('button');
        button.className = 'slide-button';
        button.textContent = link.title || `スライド ${index + 1}`;

        // アイコンを追加
        const icon = document.createElement('span');
        icon.className = 'slide-icon';
        icon.textContent = '➡';
        button.insertBefore(icon, button.firstChild);

        // クリックイベント
        button.addEventListener('click', () => {
            const baseUrl = window.location.pathname;
            const newUrl = `${baseUrl}?slide=${link.slide}`;
            window.location.href = newUrl;
        });

        return button;
    }
}
