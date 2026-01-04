# PDF.js ライブラリ

このフォルダにPDF.jsのファイルを配置してください。

## 必要なファイル

1. `pdf.min.js` - PDF.jsメインライブラリ
2. `pdf.worker.min.js` - PDF.jsワーカースクリプト

## ダウンロード方法

### 方法1: 公式リリースから（推奨）

1. [PDF.js GitHubリリースページ](https://github.com/mozilla/pdf.js/releases)にアクセス
2. 最新の安定版（例: v3.11.174）をダウンロード
3. `pdfjs-x.x.xxx-dist.zip` をダウンロード
4. 解凍して `build/` フォルダ内の以下のファイルをコピー：
   - `pdf.min.js` → このフォルダに配置
   - `pdf.worker.min.js` → このフォルダに配置

### 方法2: CDNから直接ダウンロード

以下のURLから直接ダウンロード：

```
https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js
https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js
```

PowerShellでダウンロード：

```powershell
Invoke-WebRequest -Uri "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js" -OutFile "pdf.min.js"
Invoke-WebRequest -Uri "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js" -OutFile "pdf.worker.min.js"
```

### 方法3: npmでインストール（開発者向け）

```bash
npm install pdfjs-dist
```

その後、`node_modules/pdfjs-dist/build/` から必要なファイルをコピー

## 確認

ファイルが正しく配置されているか確認：

```
lib/pdfjs/
├── pdf.min.js
├── pdf.worker.min.js
└── README.md
```

## バージョン情報

現在の推奨バージョン: **v3.11.174**

新しいバージョンがリリースされたら、必要に応じて更新してください。
