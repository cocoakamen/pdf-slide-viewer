// PDFスライドビューワー - メインエントリーポイント
import './styles.css';
import { AppState } from './modules/app-state.js';

// ビューア設定を読み込む
async function loadViewerConfig() {
    try {
        const response = await fetch('viewer-config.json');
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        // 設定ファイルがない場合はデフォルト値を使用
    }
    return { slidesPath: null };
}

// URLパラメータからスライドフォルダを取得
async function getSlideFolder() {
    const params = new URLSearchParams(window.location.search);
    const slideId = params.get('slide') || '001';
    
    // 設定ファイルからパスを取得
    const config = await loadViewerConfig();
    if (config.slidesPath) {
        const basePath = config.slidesPath.endsWith('/') ? config.slidesPath : config.slidesPath + '/';
        return `${basePath}${slideId}/`;
    }
    
    // デフォルト: 開発環境と本番環境でパスを切り替え
    const isDev = import.meta.env.DEV;
    if (isDev) {
        return `slides/${slideId}/`;
    } else {
        return `../slides/${slideId}/`;
    }
}

// アプリケーション状態管理インスタンス（初期化は後で行う）
let appState;

// アプリケーション初期化
async function init() {
    try {
        // スライドフォルダのパスを取得
        const slideFolder = await getSlideFolder();
        
        // AppStateを初期化
        appState = new AppState(slideFolder);
        
        // AppState経由で初期化
        const result = await appState.initialize();
        
        // タイトルをページタイトルに設定
        document.title = result.title || 'PDFスライドビューワー';
        document.getElementById('loading').style.display = 'none';
        
        // URLパラメータでページ指定があれば、そのページに移動
        const params = new URLSearchParams(window.location.search);
        const pageNum = parseInt(params.get('page'));
        if (pageNum && pageNum > 0) {
            // navigationManagerを経由してページ移動
            appState.navigationManager.goToPage(pageNum);
        }
        
        // エラーイベントをリッスン
        appState.on('error', ({ error, phase }) => {
            console.error(`エラー [${phase}]:`, error);
        });
        
    } catch (error) {
        console.error('初期化エラー:', error);
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display = 'block';
        document.getElementById('error').textContent = `エラー: ${error.message}`;
    }
}

// アプリケーション起動
init();
