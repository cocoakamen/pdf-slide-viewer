/**
 * PDFアノテーション（リンク）管理クラス
 * PDFから抽出されたリンク情報を基に、クリック可能な要素を画面上に配置する
 * 
 * @class AnnotationManager
 */
export class AnnotationManager {
    /**
     * @param {HTMLElement} annotationLayer - アノテーションを配置するレイヤー要素
     * @param {EventEmitter} eventBus - イベントバス
     */
    constructor(annotationLayer, eventBus) {
        /** @type {HTMLElement} アノテーションレイヤー */
        this.annotationLayer = annotationLayer;
        
        /** @type {EventEmitter} イベントバス */
        this.eventBus = eventBus;
        
        /** @type {Array<Object>} PDFから抽出されたアノテーション配列 */
        this.annotations = [];
        
        /** @type {Object|null} 表示スケール情報 */
        this.displayScale = null;
        
        /** @type {Object|null} PDFドキュメントオブジェクト */
        this.pdfDoc = null;
        
        this._setupEventListeners();
    }

    /**
     * イベントリスナーの設定
     * @private
     */
    _setupEventListeners() {
        // ページレンダリング完了時にアノテーションを更新
        this.eventBus.on('pageRendered', ({ annotations, displayScale, pdfDoc }) => {
            this.annotations = annotations;
            this.displayScale = displayScale;
            this.pdfDoc = pdfDoc;
            this.render();
        });
        
        // ウィンドウリサイズ時に再レンダリング
        this.eventBus.on('windowResized', () => {
            if (this.annotations.length > 0 && this.displayScale) {
                this.render();
            }
        });
    }

    /**
     * アノテーションをレンダリングして画面に配置
     * @public
     */
    render() {
        if (!this.displayScale || !this.annotations) return;
        
        this.annotationLayer.innerHTML = '';
        
        const { scaleX, scaleY, displayWidth, displayHeight } = this.displayScale;
        this.annotationLayer.style.width = displayWidth + 'px';
        this.annotationLayer.style.height = displayHeight + 'px';

        const annotations = this.annotations;
        
        annotations.forEach(annotation => {
            const rect = annotation.rect;
            
            if (annotation.dest) {
                this._createInternalLink(annotation, rect, scaleX, scaleY);
            } else if (annotation.url) {
                this._createExternalLink(annotation, rect, scaleX, scaleY);
            }
        });
    }

    /**
     * 内部リンク（ページジャンプ）用の要素を作成
     * @private
     * @param {Object} annotation - アノテーション情報
     * @param {number[]} rect - リンク領域の座標 [x1, y1, x2, y2]
     * @param {number} scaleX - X軸スケール
     * @param {number} scaleY - Y軸スケール
     */
    _createInternalLink(annotation, rect, scaleX, scaleY) {
        const link = document.createElement('a');
        link.href = '#';
        this._setLinkStyle(link, rect, scaleX, scaleY);
        
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            const targetPage = await this._resolveDestination(annotation.dest);
            if (targetPage) {
                this.eventBus.emit('pageJumpRequested', { pageNum: targetPage });
            }
        });

        this._addHoverEffect(link, 'rgba(52, 152, 219, 0.3)');
        this.annotationLayer.appendChild(link);
    }

    /**
     * PDFのdestination（リンク先）を解決してページ番号を取得
     * @private
     * @param {Array|string} dest - PDFのdestination情報
     * @returns {Promise<number|null>} ページ番号（1始まり）、解決できない場合はnull
     */
    async _resolveDestination(dest) {
        try {
            if (!this.pdfDoc) return null;
            
            if (Array.isArray(dest) && dest.length > 0) {
                const pageRef = dest[0];
                const pageIndex = await this.pdfDoc.getPageIndex(pageRef);
                return pageIndex + 1;
            } else if (typeof dest === 'string') {
                const resolvedDest = await this.pdfDoc.getDestination(dest);
                if (resolvedDest && Array.isArray(resolvedDest) && resolvedDest.length > 0) {
                    const pageRef = resolvedDest[0];
                    const pageIndex = await this.pdfDoc.getPageIndex(pageRef);
                    return pageIndex + 1;
                }
            }
        } catch (error) {
            console.error('ページジャンプエラー:', error);
        }
        return null;
    }

    /**
     * 外部リンクの要素を作成（Webリンクとして処理）
     * @private
     * @param {Object} annotation - アノテーション情報
     * @param {number[]} rect - リンク領域の座標
     * @param {number} scaleX - X軸スケール
     * @param {number} scaleY - Y軸スケール
     */
    _createExternalLink(annotation, rect, scaleX, scaleY) {
        // PDF埋め込みリンクはすべて外部リンクとして処理
        // (ローカル動画はVideoButtonManagerの設定ファイルベースで管理)
        this._createWebLink(annotation.url, rect, scaleX, scaleY);
    }

    /**
     * 外部Webリンクの要素を作成
     * @private
     * @param {string} url - リンク先のURL
     * @param {number[]} rect - リンク領域の座標
     * @param {number} scaleX - X軸スケール
     * @param {number} scaleY - Y軸スケール
     */
    _createWebLink(url, rect, scaleX, scaleY) {
        const link = document.createElement('a');
        
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        this._setLinkStyle(link, rect, scaleX, scaleY);

        this._addHoverEffect(link, 'rgba(46, 204, 113, 0.3)');
        this.annotationLayer.appendChild(link);
    }

    /**
     * リンク要素のスタイルを設定（位置・サイズ）
     * @private
     * @param {HTMLElement} element - スタイルを設定する要素
     * @param {number[]} rect - リンク領域の座標 [x1, y1, x2, y2]
     * @param {number} scaleX - X軸スケール
     * @param {number} scaleY - Y軸スケール
     */
    _setLinkStyle(element, rect, scaleX, scaleY) {
        element.style.position = 'absolute';
        element.style.left = (Math.min(rect[0], rect[2]) * scaleX) + 'px';
        element.style.top = (Math.min(rect[1], rect[3]) * scaleY) + 'px';
        element.style.width = (Math.abs(rect[2] - rect[0]) * scaleX) + 'px';
        element.style.height = (Math.abs(rect[3] - rect[1]) * scaleY) + 'px';
        element.style.cursor = 'pointer';
        element.style.display = 'block';
        element.style.zIndex = '100';
    }

    /**
     * ホバーエフェクトを追加（マウスオーバーで色が変わる）
     * @private
     * @param {HTMLElement} element - エフェクトを追加する要素
     * @param {string} color - ホバー時の背景色（rgba形式推奨）
     */
    _addHoverEffect(element, color) {
        element.addEventListener('mouseenter', () => {
            element.style.backgroundColor = color;
        });
        element.addEventListener('mouseleave', () => {
            element.style.backgroundColor = 'transparent';
        });
    }
}
