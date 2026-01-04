# 開発ガイド

このガイドでは、PDF Slide Viewer の開発方法、新機能の追加、デバッグ、テストについて説明します。

---

## 🚀 セットアップ

### 前提条件

- Node.js (v20以上推奨)
- npm
- Git

### 初期セットアップ

```bash
# リポジトリをクローン
git clone <repository-url>
cd pdf-slide-viewer

# 依存関係をインストール
npm install

# 開発サーバー起動
npm run dev
```

ブラウザで http://localhost:3000/ にアクセス

### ビルド

```bash
# 本番用ビルド（dist/フォルダがクリーンアップされてからビルド）
npm run build
```

**ビルド結果**

```
dist/
├── viewer/              # ビューアアプリ本体（配布用）
│   ├── index.html
│   ├── assets/
│   ├── lib/           # PDF.jsライブラリ
│   └── sample-timer/  # タイマーアプリ
├── README.md            # スライド作成者向けガイド
├── viewer-config.json   # 設定ファイルサンプル
└── slides-sample/       # サンプルスライド
    └── 001/
```

**注意**
- 開発環境（`npm run dev`）では`dist/`のクリーンアップは実行されません
- 本番ビルド時のみ自動クリーンアップされます

---

## 📁 プロジェクト構造

```
pdf-slide-viewer/
├── src/                        # 開発用ソースコード
│   ├── main.js                 # エントリーポイント
│   ├── styles.css              # スタイル
│   ├── index.html              # HTMLテンプレート
│   └── modules/                # モジュール群
│       ├── app-state.js        # 状態管理
│       ├── event-emitter.js    # イベントバス
│       ├── config.js           # 設定管理
│       ├── pdf-renderer.js     # PDFレンダリング
│       ├── annotation.js       # アノテーション処理
│       ├── video-modal.js      # 動画モーダル
│       ├── video-button.js     # 動画ボタン
│       ├── slide-button.js     # スライドリンクボタン
│       ├── toc-modal.js        # 目次モーダル
│       ├── navigation.js       # ナビゲーション
│       ├── timer.js            # タイマー
│       └── print.js            # 印刷
├── public/                     # 開発環境用公開ファイル
│   ├── lib/pdfjs/              # PDF.jsライブラリ
│   ├── sample-timer/           # タイマーアプリ
│   └── slides/                 # 開発用スライドデータ
│       └── 001/
│           ├── config.json
│           └── slide.pdf
├── docs/                       # ドキュメント
│   ├── development.md
│   ├── architecture.md
│   ├── build-guide.md
│   └── creators-guide.md
├── package.json
└── vite.config.js              # Vite設定（ビルド設定）
```

---

## 🆕 新機能の追加

### 1. 新しいマネージャーの追加

**例: AnalyticsManager を追加する**

#### ステップ1: マネージャークラスを作成

`src/modules/analytics.js` を作成：

```javascript
// アナリティクス管理

export class AnalyticsManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.pageViews = new Map();
        this.startTime = Date.now();
        
        this._setupEventListeners();
    }

    _setupEventListeners() {
        // ページレンダリング時にトラッキング
        this.eventBus.on('pageRendered', ({ pageNum }) => {
            this.trackPageView(pageNum);
        });
        
        // 動画再生時にトラッキング
        this.eventBus.on('videoRequested', ({ url }) => {
            this.trackVideoPlay(url);
        });
    }

    trackPageView(pageNum) {
        const count = this.pageViews.get(pageNum) || 0;
        this.pageViews.set(pageNum, count + 1);
        console.log(`📊 ページ ${pageNum} 閲覧回数: ${count + 1}`);
    }

    trackVideoPlay(url) {
        console.log(`📊 動画再生: ${url}`);
    }

    getStats() {
        return {
            pageViews: Object.fromEntries(this.pageViews),
            sessionDuration: Date.now() - this.startTime
        };
    }
}
```

#### ステップ2: AppStateに登録

`src/modules/app-state.js` を編集：

```javascript
// import追加
import { AnalyticsManager } from './analytics.js';

export class AppState {
    constructor(slideFolder) {
        // ...
        this.analyticsManager = null; // 追加
    }

    _initializeManagers() {
        // 既存のマネージャー初期化...
        
        // 新しいマネージャーを追加
        this.analyticsManager = new AnalyticsManager(this.eventBus);
    }
}
```

#### ステップ3: 動作確認

```javascript
// ブラウザコンソールで確認
window.appState.analyticsManager.getStats();
```

---

### 2. 新しいイベントの追加

**例: スライドショーモードのイベント**

#### ステップ1: イベントを定義

イベント名: `slideshowStarted`, `slideshowStopped`

#### ステップ2: 発行側を実装

```javascript
// modules/slideshow.js
export class SlideshowManager {
    constructor(eventBus, navigationManager) {
        this.eventBus = eventBus;
        this.navigationManager = navigationManager;
        this.isPlaying = false;
        this.interval = null;
    }

    start(intervalMs = 5000) {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.eventBus.emit('slideshowStarted', { intervalMs });
        
        this.interval = setInterval(() => {
            this.navigationManager.nextPage();
        }, intervalMs);
    }

    stop() {
        if (!this.isPlaying) return;
        
        this.isPlaying = false;
        clearInterval(this.interval);
        this.eventBus.emit('slideshowStopped', {});
    }
}
```

#### ステップ3: サブスクライバーを実装

```javascript
// どこかのマネージャーで購読
this.eventBus.on('slideshowStarted', ({ intervalMs }) => {
    console.log(`スライドショー開始: ${intervalMs}ms間隔`);
    // UIを更新するなど
});

this.eventBus.on('slideshowStopped', () => {
    console.log('スライドショー停止');
});
```

---


## 🎨 スタイリング

### CSS変数の活用

主要な色やサイズはCSS変数で管理：

```css
:root {
    --primary-color: #3498db;
    --secondary-color: #2ecc71;
    --danger-color: #e74c3c;
    --background-color: #2c3e50;
    --text-color: #ecf0f1;
    
    --button-size: 50px;
    --modal-padding: 20px;
}
```

### レスポンシブデザイン

```css
/* モバイル対応 */
@media (max-width: 768px) {
    .controls {
        flex-direction: column;
    }
    
    .video-button {
        font-size: 14px;
        padding: 8px 16px;
    }
}
```

---

## 📦 ビルドと配布

### ビルド構成

`vite.config.js` でビルド時の処理を設定：

```javascript
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  
  return {
    root: 'src',
    publicDir: isDev ? '../public' : false,  // 開発時のみpublicを使う
    build: {
      outDir: '../dist/viewer',  // viewer/フォルダに出力
      emptyOutDir: true
    },
    plugins: [
      {
        name: 'setup-distribution-package',
        buildStart() {
          // 本番ビルド時のみdist/をクリーンアップ
          if (!isDev) {
            // クリーンアップ処理
          }
        },
        closeBundle() {
          // 必要なファイルをdist/にコピー
          // - public/lib/ → dist/viewer/lib/
          // - public/sample-timer/ → dist/sample-timer/
          // - docs/creators-guide.md → dist/README.md
          // - viewer-config.json を生成
          // - public/slides/001/ → dist/slides-sample/001/
        }
      }
    ]
  };
});
```

### viewer-config.json

スライドの場所を設定するファイル（オプション）

```json
{
  "slidesPath": "../slides"
}
```

**使い方**
1. `viewer-config.json`を`viewer/`フォルダにコピー
2. `slidesPath`を編集してスライドの場所を指定
3. 設定がない場合はデフォルトで`../slides/`を参照

**優先順位**
1. `viewer-config.json`の`slidesPath`
2. デフォルト：`../slides/`

### ビルド最適化

`vite.config.js`:

```javascript
export default {
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'pdf': ['pdfjs-dist']
                }
            }
        },
        chunkSizeWarningLimit: 1000
    }
}
```

### 配布方法

#### ローカル配布

```bash
# ビルド
npm run build

# dist/フォルダをZIP化
zip -r pdf-slide-viewer.zip dist/

# または手動で圧縮（Windows: 右クリック → 圧縮）
```

**配布内容**
```
dist/
├── viewer/              # ビューアアプリ（これを配布）
├── sample-timer/        # タイマーサンプル
├── slides-sample/       # スライドサンプル
├── README.md            # 使い方ガイド
└── viewer-config.json   # 設定サンプル
```

#### Web公開

詳しくは [build-guide.md](./build-guide.md) を参照

---

## 💡 ベストプラクティス

### 1. モジュール設計

- **単一責任**: 1つのモジュールは1つの役割のみ
- **疎結合**: EventBus経由で通信
- **小さく保つ**: 200行以下を目安に

### 2. イベント設計

- **命名**: 具体的で明確な名前を使用
- **データ**: 必要最小限のデータのみ送信
- **エラー処理**: リスナー内でtry-catchを使用

### 3. コードスタイル

```javascript
// ✅ Good
async function loadPDF(path) {
    try {
        const doc = await pdfjsLib.getDocument(path).promise;
        return doc;
    } catch (error) {
        console.error('PDF読み込みエラー:', error);
        throw error;
    }
}

// ❌ Bad
function loadPDF(path) {
    pdfjsLib.getDocument(path).promise.then(doc => {
        return doc;
    });
}
```

---

## 📚 参考リソース

### 公式ドキュメント

- [PDF.js API Documentation](https://mozilla.github.io/pdf.js/api/)
- [Vite Documentation](https://vitejs.dev/)
- [MDN Web Docs](https://developer.mozilla.org/)



Happy Coding! 🚀
