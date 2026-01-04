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
     * @param {number} [scale=2.0] - レンダリングスケール（高解像度化）
     */
    constructor(canvas, annotationLayer, scale = 2.0) {
        /** @type {HTMLCanvasElement} canvas要素 */
        this.canvas = canvas;
        
        /** @type {CanvasRenderingContext2D} 2Dコンテキスト */
        this.ctx = canvas.getContext('2d');
        
        /** @type {HTMLElement} アノテーションレイヤー */
        this.annotationLayer = annotationLayer;
        
        /** @type {number} レンダリングスケール */
        this.scale = scale;
        
        /** @type {Object|null} PDFドキュメントオブジェクト */
        this.pdfDoc = null;
        
        /** @type {boolean} レンダリング中フラグ */
        this.pageRendering = false;
        
        /** @type {number|null} 保留中のページ番号 */
        this.pageNumPending = null;
        
        /** @type {Array<Object>} 現在のページのアノテーション */
        this.currentAnnotations = [];
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
        const page = await this.pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: this.scale });
        
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

        // アノテーション情報を保存
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
}
