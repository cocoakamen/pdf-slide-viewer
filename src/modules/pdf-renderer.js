/**
 * PDFレンダリング管理クラス
 * PDF.jsを使用してPDFをcanvasにレンダリングし、アノテーション情報を抽出する
 * 
 * @class PDFRenderer
 */
export class PDFRenderer {
    /**
     * @param {HTMLCanvasElement} canvas - レンダリング先のcanvas要素
     * @param {HTMLElement} annotationLayer - アノテーションレイヤー要素
     * @param {number} [baseScale=2.0] - 基準レンダリングスケール（高解像度化の倍率）
     */
    constructor(canvas, annotationLayer, baseScale = 2.0) {
        /** @type {HTMLCanvasElement} canvas要素 */
        this.canvas = canvas;
        
        /** @type {CanvasRenderingContext2D} 2Dコンテキスト */
        this.ctx = canvas.getContext('2d');
        
        /** @type {HTMLElement} アノテーションレイヤー */
        this.annotationLayer = annotationLayer;
        
        /** @type {number} 基準スケール（画面サイズに対する高解像度化の倍率） */
        this.baseScale = baseScale;
        
        /** @type {Object|null} PDFドキュメントオブジェクト */
        this.pdfDoc = null;
        
        /** @type {boolean} レンダリング中フラグ */
        this.pageRendering = false;
        
        /** @type {number|null} 保留中のページ番号 */
        this.pageNumPending = null;
        
        /** @type {Array<Object>} 現在のページのアノテーション */
        this.currentAnnotations = [];
        
        /** @type {number|null} 現在表示中のページ番号 */
        this.currentPageNum = null;
    }

    /**
     * PDFファイルを読み込む
     * @param {string} pdfPath - PDFファイルのパス
     * @returns {Promise<Object>} PDFドキュメントオブジェクト
     */
    async loadPDF(pdfPath) {
        const loadingTask = pdfjsLib.getDocument(pdfPath);
        this.pdfDoc = await loadingTask.promise;
        return this.pdfDoc;
    }

    /**
     * PDFの総ページ数を取得
     * @returns {number} 総ページ数
     */
    getPageCount() {
        return this.pdfDoc?.numPages || 0;
    }

    /**
     * 指定ページをレンダリングしてアノテーション情報を抽出
     * @param {number} pageNum - レンダリングするページ番号（1始まり）
     * @returns {Promise<{annotations: Array<Object>}>} アノテーション情報
     */
    async renderPage(pageNum) {
        this.pageRendering = true;
        this.currentPageNum = pageNum;
        
        const page = await this.pdfDoc.getPage(pageNum);
        
        // 画面サイズに合わせた最適なスケールを計算
        const scale = this._calculateOptimalScale(page);
        
        const viewport = page.getViewport({ scale });
        
        // canvasの実際の描画サイズを設定（高解像度レンダリング用）
        this.canvas.height = viewport.height;
        this.canvas.width = viewport.width;

        const renderContext = {
            canvasContext: this.ctx,
            viewport: viewport
        };

        await page.render(renderContext).promise;

        this.pageRendering = false;
        if (this.pageNumPending !== null) {
            const pending = this.pageNumPending;
            this.pageNumPending = null;
            await this.renderPage(pending);
        }

        // アノテーション情報を保存（スケール変換済み座標）
        const annotations = await page.getAnnotations();
        this.currentAnnotations = annotations
            .filter(a => a.subtype === 'Link')
            .map(a => ({
                url: a.url,
                dest: a.dest,
                rect: viewport.convertToViewportRectangle(a.rect)
            }));

        return { annotations: this.currentAnnotations };
    }

    /**
     * ページレンダリングをキューに追加（レンダリング中の場合）
     * @param {number} pageNum - レンダリングするページ番号
     * @returns {Promise<Object>|undefined} レンダリング結果（すぐに実行された場合）
     */
    queueRenderPage(pageNum) {
        if (this.pageRendering) {
            this.pageNumPending = pageNum;
        } else {
            return this.renderPage(pageNum);
        }
    }

    /**
     * 表示スケール情報を取得（canvas実サイズと表示サイズの比率）
     * @returns {{scaleX: number, scaleY: number, displayWidth: number, displayHeight: number}} スケール情報
     */
    getDisplayScale() {
        const displayWidth = this.canvas.offsetWidth;
        const displayHeight = this.canvas.offsetHeight;
        return {
            scaleX: displayWidth / this.canvas.width,
            scaleY: displayHeight / this.canvas.height,
            displayWidth,
            displayHeight
        };
    }

    /**
     * 現在のページのアノテーション情報を取得
     * @returns {Array<Object>} アノテーション配列
     */
    getCurrentAnnotations() {
        return this.currentAnnotations;
    }

    /**
     * 画面サイズに合わせた最適なスケールを計算
     * PDFのアスペクト比を保ちつつ、画面いっぱいに表示されるスケールを算出する
     * @private
     * @param {Object} page - PDFページオブジェクト
     * @returns {number} 計算された最適スケール
     */
    _calculateOptimalScale(page) {
        // PDFページの元サイズを取得（スケール1.0での寸法）
        const originalViewport = page.getViewport({ scale: 1.0 });
        const pdfWidth = originalViewport.width;
        const pdfHeight = originalViewport.height;

        // 表示可能な領域のサイズを取得
        // slide-containerのサイズを使用（実際にPDFが表示される領域）
        const slideContainer = this.canvas.closest('.slide-container');
        const containerWidth = slideContainer ? slideContainer.clientWidth : window.innerWidth;
        const containerHeight = slideContainer ? slideContainer.clientHeight : window.innerHeight - 80;

        // 横方向と縦方向、それぞれの拡大率を計算
        const scaleX = containerWidth / pdfWidth;
        const scaleY = containerHeight / pdfHeight;

        // アスペクト比を保ちつつ画面に収まるように、小さい方のスケールを採用
        // さらにbaseScaleとdevicePixelRatioを掛けて高解像度化
        const fitScale = Math.min(scaleX, scaleY);
        const pixelRatio = window.devicePixelRatio || 1;
        const finalScale = fitScale * this.baseScale * pixelRatio;

        return finalScale;
    }

    /**
     * 現在表示中のページを再レンダリング
     * ウィンドウリサイズ時などに、同じページを新しいスケールで描画し直す
     * @returns {Promise<{annotations: Array<Object>}>} アノテーション情報
     */
    async reRenderCurrentPage() {
        if (!this.currentPageNum || !this.pdfDoc) {
            return { annotations: [] };
        }
        
        // 現在のページ番号で再レンダリングを実行
        return await this.renderPage(this.currentPageNum);
    }
}
