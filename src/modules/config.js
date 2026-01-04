/**
 * 設定ファイル管理クラス
 * スライドフォルダのconfig.jsonを読み込み、設定情報を提供する
 * 
 * @class ConfigManager
 */
export class ConfigManager {
    /**
     * @param {string} slideFolder - スライドフォルダのパス
     */
    constructor(slideFolder) {
        /** @type {string} スライドフォルダのパス */
        this.slideFolder = slideFolder;
        
        /** @type {Object|null} 読み込んだ設定データ */
        this.config = null;
    }

    /**
     * 設定ファイルを読み込む
     * @returns {Promise<Object>} 読み込んだ設定オブジェクト
     * @throws {Error} 設定ファイルの読み込みに失敗した場合
     */
    async load() {
        const configPath = `${this.slideFolder}config.json`;
        const response = await fetch(configPath);
        if (!response.ok) {
            throw new Error(`設定ファイルの読み込みに失敗: ${configPath}`);
        }
        this.config = await response.json();
        return this.config;
    }

    /**
     * スライドのタイトルを取得
     * @returns {string} タイトル
     */
    getTitle() {
        return this.config?.title || '';
    }

    /**
     * PDFファイルの完全なパスを取得
     * @returns {string} PDFファイルのパス
     */
    getPdfPath() {
        return `${this.slideFolder}${this.config?.pdfPath}`;
    }

    /**
     * 指定ページの動画情報を取得
     * @param {number} pageNum - ページ番号
     * @returns {Array<{title: string, path: string}>} 動画情報の配列
     */
    getVideosForPage(pageNum) {
        if (!this.config?.slides) return [];
        const slideConfig = this.config.slides.find(s => s.page === pageNum);
        return slideConfig?.videos || [];
    }
    
    /**
     * 指定ページのスライドリンク情報を取得
     * @param {number} pageNum - ページ番号
     * @returns {Array<{title: string, slide: string}>} スライドリンク情報の配列
     */
    getLinksForPage(pageNum) {
        if (!this.config?.slides) return [];
        const slideConfig = this.config.slides.find(s => s.page === pageNum);
        return slideConfig?.links || [];
    }

    /**
     * 目次情報を取得（titleが設定されているページのみ）
     * @returns {Array<{page: number, title: string}>} 目次項目の配列
     */
    getTableOfContents() {
        if (!this.config?.slides) return [];
        return this.config.slides
            .filter(s => s.title)
            .map(s => ({ page: s.page, title: s.title }))
            .sort((a, b) => a.page - b.page);
    }

    /**
     * タイマーURLを取得（相対パスの場合はスライドフォルダベースで解決）
     * @returns {string|null} タイマーのURL
     */
    getTimerUrl() {
        if (!this.config?.timerUrl) return null;
        
        const url = this.config.timerUrl;
        // 完全URL（http/https）の場合はそのまま返す
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        // 相対パスの場合はスライドフォルダベースで解決
        if (url.startsWith('/')) {
            return url;
        }
        return `${this.slideFolder}${url}`;
    }
}
