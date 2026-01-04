# ビルド・配布ガイド

このドキュメントでは、PDF Slide Viewer のビルドとローカル配布方法について説明します。

---

## 🏗️ ビルド

### 本番ビルドの実行

```bash
npm run build
```

**動作：**
- `dist/` フォルダが自動的にクリーンアップされます
- ビルド結果が `dist/viewer/` に出力されます
- 配布用ファイルが `dist/` 直下に生成されます

### ビルド結果の構成

```
dist/
├── viewer/              # ビューアアプリ本体（配布用）
│   ├── index.html       # エントリーポイント
│   ├── assets/          # バンドルされたCSS/JS
│   │   ├── main-xxxxx.css
│   │   └── main-xxxxx.js
│   ├── lib/             # PDF.jsライブラリ
│   │   └── pdfjs/
│   │       ├── pdf.min.js
│   │       └── pdf.worker.min.js
│   └── viewer-config.json  # 設定ファイル（viewer内用）
├── sample-timer/        # タイマーアプリのサンプル
│   ├── index.html
│   ├── timer.js
│   └── timer.css
├── slides-sample/       # スライドデータのサンプル
│   └── 001/
│       ├── config.json
│       └── slide.pdf
├── README.md            # スライド作成者向けガイド
└── viewer-config.json   # 設定ファイルサンプル（配布用）
```

### ビルドのカスタマイズ

`vite.config.js` でビルド設定を変更できます：

```javascript
export default defineConfig(({ mode }) => {
  return {
    build: {
      outDir: '../dist/viewer',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            // チャンク分割の設定
          }
        }
      },
      chunkSizeWarningLimit: 1000  // サイズ警告の閾値
    }
  };
});
```

---

## 📦 配布

### ZIP化して配布

#### Windows

```powershell
# PowerShellで圧縮
Compress-Archive -Path dist -DestinationPath pdf-slide-viewer.zip

# または手動で：右クリック → 送る → 圧縮(zip形式)フォルダー
```

#### macOS / Linux

```bash
# zipコマンド
zip -r pdf-slide-viewer.zip dist/

# またはtarで圧縮
tar -czf pdf-slide-viewer.tar.gz dist/
```

### 配布パッケージの内容

受け取った人がすぐに使えるように、以下が含まれています：

1. **viewer/** - ビューアアプリ本体
2. **README.md** - 使い方ガイド（スライド作成者向け）
3. **viewer-config.json** - 設定ファイルのサンプル
4. **sample-timer/** - タイマーアプリのサンプル
5. **slides-sample/** - スライドデータのサンプル

**受け取った人の使い方は [スライド作成者ガイド](creators-guide.md) を参照してください。**

---

## 🔧 トラブルシューティング

### 問題1: ビルドが失敗する

**原因:** Node.jsのバージョンが古い

**解決策:**
```bash
# Node.jsのバージョン確認
node --version

# v20以上にアップデート
# https://nodejs.org/
```

### 問題2: 動画が再生できない（ローカルファイル）

**原因:** ブラウザのセキュリティ制限

**解決策:**

簡易サーバーを起動してアクセス：

```bash
# Pythonがインストールされている場合
cd my-presentation
python -m http.server 8000

# ブラウザで http://localhost:8000/viewer/ にアクセス
```

### 問題3: PDFが表示されない

**原因:** パスの設定が間違っている

**解決策:**
- `viewer-config.json` の `slidesPath` を確認
- `viewer/` と `slides/` の配置を確認
- ブラウザのコンソールでエラーを確認

---

## 📊 最適化

### 1. PDF最適化

PDFファイルを圧縮してファイルサイズを削減：

```bash
# Ghostscriptを使用
gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 \
   -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH \
   -sOutputFile=output.pdf input.pdf
```

### 2. 動画最適化

動画ファイルを圧縮：

```bash
# ffmpeg
ffmpeg -i input.mp4 -vcodec libx264 -crf 23 output.mp4
```

### 3. 画像最適化

動画サムネイルや埋め込み画像を最適化：

```bash
# ImageMagick
convert input.jpg -quality 85 -resize 1920x1080 output.jpg
```

---

## 📝 配布前チェックリスト

- [ ] `npm run build` が成功する
- [ ] ビルド結果を直接開いて動作確認
- [ ] すべてのスライドが正しく表示される
- [ ] 動画が再生できる（簡易サーバー経由で確認）
- [ ] ナビゲーションが機能する
- [ ] モバイルで動作確認
- [ ] 異なるブラウザで動作確認（Chrome, Firefox, Safari）
- [ ] README.md の内容が最新
- [ ] サンプルスライドが含まれている
- [ ] viewer-config.json のサンプルが含まれている

---

## 📚 参考リンク

- [Vite: Building for Production](https://vitejs.dev/guide/build.html)
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)

---

Happy Building! 🎉
