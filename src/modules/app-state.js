/**
 * アプリケーション状態管理クラス
 * 全マネージャーのライフサイクルとイベントフローを統括する
 * 
 * @class AppState
 */

import { EventEmitter } from './event-emitter.js';
import { ConfigManager } from './config.js';
import { PDFRenderer } from './pdf-renderer.js';
import { AnnotationManager } from './annotation.js';
import { VideoButtonManager } from './video-button.js';
import { SlideButtonManager } from './slide-button.js';
import { VideoModalManager } from './video-modal.js';
import { NavigationManager } from './navigation.js';
import { TableOfContentsManager } from './table-of-contents.js';
import { TimerManager } from './timer.js';
import { PrintManager } from './print.js';

export class AppState {
    /**
     * @param {string} slideFolder - スライドフォルダのパス
     */
    constructor(slideFolder) {
        /** @type {string} スライドフォルダのパス */
        this.slideFolder = slideFolder;
        
        /** @type {EventEmitter} イベントバス */
        this.eventBus = new EventEmitter();
        
        /** @type {boolean} 初期化完了フラグ */
        this.isInitialized = false;
        
        /** @type {ConfigManager|null} 設定ファイル管理 */
        this.configManager = null;
        
        /** @type {PDFRenderer|null} PDFレンダラー */
        this.renderer = null;
        
        /** @type {AnnotationManager|null} アノテーション管理 */
        this.annotationManager = null;
        
        /** @type {VideoButtonManager|null} 動画ボタン管理 */
        this.videoButtonManager = null;
        
        /** @type {SlideButtonManager|null} スライドリンクボタン管理 */
        this.slideButtonManager = null;
        
        /** @type {VideoModalManager|null} 動画モーダル管理 */
        this.videoModalManager = null;
        
        /** @type {NavigationManager|null} ナビゲーション管理 */
        this.navigationManager = null;
        
        /** @type {TableOfContentsManager|null} 目次管理 */
        this.tocManager = null;
        
        /** @type {TimerManager|null} タイマー管理 */
        this.timerManager = null;
        
        /** @type {PrintManager|null} 印刷管理 */
        this.printManager = null;
    }

    /**
     * アプリケーション全体を初期化
     * @returns {Promise<{success: boolean, title: string}>} 初期化結果
     * @throws {Error} 初期化に失敗した場合
     */
    async initialize() {
        try {
            // PDF.js読み込み完了を待つ
            await this._waitForPdfjs();
            
            // マネージャー初期化
            this._initializeManagers();
            
            // 設定ファイル読み込み
            await this.configManager.load();
            
            // タイマーマネージャーを初期化（設定読み込み後）
            const timerUrl = this.configManager.getTimerUrl();
            this.timerManager = new TimerManager(timerUrl);
            
            // 印刷マネージャーを初期化
            this.printManager = new PrintManager(() => this.configManager.getPdfPath());
            
            // 目次を設定
            const toc = this.configManager.getTableOfContents();
            this.tocManager.setTableOfContents(toc);
            
            // PDF読み込み
            await this.renderer.loadPDF(this.configManager.getPdfPath());
            
            // イベントリスナー設定
            this._setupEventListeners();
            
            // 最初のページを表示
            await this.navigationManager.goToPage(1);
            
            this.isInitialized = true;
            this.eventBus.emit('initialized', { success: true });
            
            return {
                success: true,
                title: this.configManager.getTitle()
            };
            
        } catch (error) {
            console.error('初期化エラー:', error);
            this.eventBus.emit('error', { error, phase: 'initialization' });
            throw error;
        }
    }

    /**
     * 各マネージャーを初期化してインスタンスを作成
     * @private
     */
    _initializeManagers() {
        const canvas = document.getElementById('pdfCanvas');
        const annotationLayer = document.getElementById('annotationLayer');
        
        this.configManager = new ConfigManager(this.slideFolder);
        this.videoModalManager = new VideoModalManager(this.eventBus);
        this.tocManager = new TableOfContentsManager(this.eventBus);
        this.renderer = new PDFRenderer(canvas, annotationLayer);
        this.annotationManager = new AnnotationManager(
            annotationLayer,
            this.eventBus
        );
        this.videoButtonManager = new VideoButtonManager(
            annotationLayer,
            this.slideFolder,
            this.eventBus
        );
        this.slideButtonManager = new SlideButtonManager(
            annotationLayer,
            this.eventBus
        );
        this.navigationManager = new NavigationManager(
            (pageNum) => this._onPageChange(pageNum),
            () => this.renderer.getPageCount()
        );
        
        // タイマーは設定読み込み後に初期化（getTimerUrl()を使うため）
        // this.timerManagerはinit()内で設定します
    }

    /**
     * アプリケーション全体のイベントリスナーを設定
     * @private
     */
    _setupEventListeners() {
        // ページジャンプリクエスト
        this.eventBus.on('pageJumpRequested', ({ pageNum }) => {
            this.navigationManager.goToPage(pageNum);
        });
        
        // ページレンダリング完了時
        this.eventBus.on('pageRendered', ({ pageNum }) => {
            // 動画ボタン用のデータを準備
            const videos = this.configManager.getVideosForPage(pageNum);
            this.eventBus.emit('videosForPageReady', { videos });
            
            // スライドリンクボタン用のデータを準備
            const links = this.configManager.getLinksForPage(pageNum);
            this.eventBus.emit('linksForPageReady', { links });
            
            // ナビゲーションUI更新（目次ページ情報も渡す）
            const tocPages = this.configManager.getTableOfContents().map(item => item.page);
            this.navigationManager.updateUI(tocPages);
        });
        
        // リサイズイベント
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.eventBus.emit('windowResized');
            }, 100);
        });
    }

    /**
     * ページ変更時のハンドラ（NavigationManagerから呼ばれる）
     * @private
     * @param {number} pageNum - 変更先のページ番号
     */
    async _onPageChange(pageNum) {
        try {
            const result = await this.renderer.renderPage(pageNum);
            
            // アノテーション情報を含めてイベント発行
            this.eventBus.emit('pageRendered', {
                pageNum,
                annotations: result.annotations,
                displayScale: this.renderer.getDisplayScale(),
                pdfDoc: this.renderer.pdfDoc
            });
        } catch (error) {
            console.error('ページレンダリングエラー:', error);
            this.eventBus.emit('error', { error, phase: 'rendering', pageNum });
        }
    }

    /**
     * PDF.jsライブラリの読み込み完了を待機
     * @private
     * @returns {Promise<Object>} PDF.jsライブラリオブジェクト
     */
    async _waitForPdfjs() {
        return new Promise((resolve) => {
            if (window.pdfjsLib) {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = './lib/pdfjs/pdf.worker.min.js';
                resolve(window.pdfjsLib);
            } else {
                const checkInterval = setInterval(() => {
                    if (window.pdfjsLib) {
                        clearInterval(checkInterval);
                        window.pdfjsLib.GlobalWorkerOptions.workerSrc = './lib/pdfjs/pdf.worker.min.js';
                        resolve(window.pdfjsLib);
                    }
                }, 50);
            }
        });
    }

    /**
     * EventBusにイベントリスナーを登録
     * @param {string} event - イベント名
     * @param {Function} listener - リスナー関数
     */
    on(event, listener) {
        this.eventBus.on(event, listener);
    }

    /**
     * EventBusにイベントを発行
     * @param {string} event - イベント名
     * @param {*} data - イベントデータ
     */
    emit(event, data) {
        this.eventBus.emit(event, data);
    }

    /**
     * クリーンアップ処理（全イベントリスナーをクリア）
     */
    destroy() {
        this.eventBus.clear();
    }
}
