/**
 * 動画再生モーダル管理クラス
 * 動画再生用のモーダルウィンドウの開閉を制御する
 * 
 * @class VideoModalManager
 */
export class VideoModalManager {
    /**
     * @param {EventEmitter} eventBus - イベントバス
     */
    constructor(eventBus) {
        /** @type {EventEmitter} イベントバス */
        this.eventBus = eventBus;
        
        /** @type {HTMLElement} モーダル要素 */
        this.modal = document.getElementById('videoModal');
        
        /** @type {HTMLIFrameElement} iframe要素 */
        this.iframe = document.getElementById('modalIframe');
        
        /** @type {HTMLVideoElement} video要素 */
        this.video = document.getElementById('modalVideo');
        
        /** @type {HTMLElement} 閉じるボタン */
        this.closeBtn = document.querySelector('.modal-close');
        
        this._setupEventListeners();
    }

    /**
     * イベントリスナーの設定
     * @private
     */
    _setupEventListeners() {
        // 動画再生リクエストを受け取る
        this.eventBus.on('videoRequested', ({ url }) => {
            this.open(url);
        });
        
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
    }

    /**
     * モーダルを開いて動画を表示
     * @param {string} url - 動画のURL
     */
    open(url) {
        // YouTubeのURLを埋め込み形式に変換
        const embedUrl = this._convertToEmbedUrl(url);
        
        // ローカル動画かどうかを判定
        const isLocalVideo = !url.startsWith('http://') && !url.startsWith('https://');
        
        if (isLocalVideo) {
            // ローカル動画の場合はvideoタグを使用
            this.iframe.style.display = 'none';
            this.video.style.display = 'block';
            this.video.src = embedUrl;
            // 自動再生
            this.video.play().catch(err => console.log('自動再生エラー:', err));
        } else {
            // YouTubeの場合はiframeを使用
            this.video.style.display = 'none';
            this.iframe.style.display = 'block';
            this.iframe.src = embedUrl;
        }
        
        this.modal.classList.add('show');
    }

    /**
     * モーダルを閉じて動画を停止
     */
    close() {
        this.modal.classList.remove('show');
        this.iframe.src = ''; // YouTube動画を停止
        this.video.src = ''; // ローカル動画を停止
        this.video.pause();
    }

    /**
     * YouTubeのURLを埋め込み形式に変換
     * @private
     * @param {string} url - 元のURL
     * @returns {string} 埋め込み用URL
     */
    _convertToEmbedUrl(url) {
        try {
            // 相対パスの場合（ローカル動画ファイル）はそのまま返す
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                return url;
            }
            
            const urlObj = new URL(url);
            
            // YouTube視聴URLの場合は埋め込み形式に変換
            if (urlObj.hostname.includes('youtube.com') && urlObj.pathname === '/watch') {
                const videoId = urlObj.searchParams.get('v');
                if (videoId) {
                    return `https://www.youtube.com/embed/${videoId}`;
                }
            }
            
            // youtu.be短縮URLの場合
            if (urlObj.hostname === 'youtu.be') {
                const videoId = urlObj.pathname.slice(1); // 先頭の / を除去
                if (videoId) {
                    return `https://www.youtube.com/embed/${videoId}`;
                }
            }
            
            // それ以外はそのまま返す（既に埋め込み形式、またはローカル動画）
            return url;
        } catch (error) {
            console.error('URL変換エラー:', error);
            return url;
        }
    }
}
