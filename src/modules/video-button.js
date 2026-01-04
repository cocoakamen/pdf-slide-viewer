/**
 * 設定ファイルベースの動画ボタン管理クラス
 * config.jsonに定義された動画を画面右下のボタンとして表示する
 * 
 * @class VideoButtonManager
 */
export class VideoButtonManager {
    /**
     * @param {HTMLElement} annotationLayer - ボタンを配置するレイヤー要素
     * @param {string} slideFolder - スライドフォルダのパス
     * @param {EventEmitter} eventBus - イベントバス
     */
    constructor(annotationLayer, slideFolder, eventBus) {
        /** @type {HTMLElement} ボタンコンテナを配置するレイヤー */
        this.annotationLayer = annotationLayer;
        
        /** @type {string} スライドフォルダのパス */
        this.slideFolder = slideFolder;
        
        /** @type {EventEmitter} イベントバス */
        this.eventBus = eventBus;
        
        this._setupEventListeners();
    }
    
    /**
     * イベントリスナーの設定
     * @private
     */
    _setupEventListeners() {
        // ページレンダリング完了時に動画ボタンを更新
        this.eventBus.on('videosForPageReady', ({ videos }) => {
            this.render(videos);
        });
    }

    /**
     * 動画ボタンをレンダリングして画面に表示
     * @param {Array<{title: string, path: string}>} videos - 動画情報の配列
     */
    render(videos) {
        // 既存のボタンをクリア
        const existingContainer = document.getElementById('videoButtons');
        if (existingContainer) {
            existingContainer.remove();
        }

        if (!videos || videos.length === 0) return;

        const container = document.createElement('div');
        container.id = 'videoButtons';
        container.className = 'video-buttons-container';

        videos.forEach((video, index) => {
            const button = this._createVideoButton(video, index);
            container.appendChild(button);
        });

        this.annotationLayer.appendChild(container);
    }

    /**
     * 個別の動画ボタン要素を作成
     * @private
     * @param {{title: string, path: string}} video - 動画情報
     * @param {number} index - ボタンのインデックス
     * @returns {HTMLButtonElement} 作成されたボタン要素
     */
    _createVideoButton(video, index) {
        const button = document.createElement('button');
        button.className = 'video-button';
        button.textContent = video.title || `動画 ${index + 1}`;

        // アイコンを追加
        const icon = document.createElement('span');
        icon.className = 'video-icon';
        icon.textContent = '▶';
        button.insertBefore(icon, button.firstChild);

        // クリックイベント
        button.addEventListener('click', () => {
            const videoUrl = this._resolveVideoUrl(video.path);
            this.eventBus.emit('videoRequested', { url: videoUrl });
        });

        return button;
    }

    /**
     * 動画パスを完全なURLに解決
     * @private
     * @param {string} path - 設定ファイル内のパス（相対 or 絶対URL）
     * @returns {string} 解決されたURL
     */
    _resolveVideoUrl(path) {
        // 外部URL（http/https）はそのまま
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }
        // 相対パスの場合はスライドフォルダからの相対パス
        return `${this.slideFolder}${path}`;
    }
}
