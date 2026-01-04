# スライド作成者向けガイド

このドキュメントは、スライド作成者のための説明書です。  
Node.jsやビルドツールは一切使わず、**viewer/フォルダ**だけで完結します💖

## 📦 受け取るもの

開発者から**viewer/**フォルダを受け取ります（ZIPファイルなど）。

## 🎯 全体の構成

```
your-presentation/       # あなたのプロジェクトフォルダ
├── viewer/              # ビューアアプリ（開発者が配布）
│   └── index.html
└── slides/              # スライドデータ（あなたが作る）
    ├── 001/             # 最初のプレゼン
    │   ├── config.json
    │   ├── slide.pdf
    │   └── video.mp4
    └── 002/             # 2番目のプレゼン
        ├── config.json
        └── slide.pdf
```

**デフォルトでは** `viewer/`と`slides/`を同じ階層に配置します（`viewer-config.json`で変更可能）。

## 🎯 スライドの作り方

### ステップ1: slides/フォルダを作る

基本的には`viewer/`と同じ場所に`slides/`フォルダを作ります。

```
your-presentation/
├── viewer/    # ← 開発者から受け取ったもの
└── slides/    # ← これを作る！
```

### ステップ2: プレゼンフォルダを作る

`slides/`の中にプレゼンごとのフォルダを作ります。

```
slides/
├── 001/  # 最初のプレゼン
├── 002/  # 2番目のプレゼン
└── 003/  # 3番目のプレゼン
```

**注意！** フォルダ名は**半角英数字のみ**使用してください（日本語やスペースは禁止）。

### ステップ3: ファイルを配置

プレゼンフォルダの中に以下を入れます：

```
slides/001/
├── config.json      # 設定ファイル（後で説明）
├── my-slide.pdf     # PDFファイル
├── demo.mp4         # 動画ファイル（直下でもOK）
└── videos/          # サブフォルダでもOK
    └── explain.mp4
```

**ファイルパス:** PDF・動画ファイルは`config.json`からの相対パスで指定できます。

### ステップ4: config.jsonを書く

メモ帳やVS Codeで`config.json`を作ります。

```json
{
  "title": "私のプレゼン",
  "pdfPath": "my-slide.pdf",
  "timerUrl": "https://example.com/timer",
  "slides": [
    {
      "page": 1,
      "links": [
        {
          "title": "第2章へ",
          "slide": "002"
        },
        {
          "title": "付録へ",
          "slide": "appendix"
        }
      ]
    },
    {
      "page": 2,
      "videos": [
        {
          "title": "デモ動画",
          "path": "demo.mp4"
        }
      ]
    },
    {
      "page": 5,
      "videos": [
        {
          "title": "詳しい解説",
          "path": "explain.mp4"
        },
        {
          "title": "YouTube解説",
          "path": "https://www.youtube.com/watch?v=xxxxx"
        }
      ]
    }
  ]
}
```

#### 各項目の説明

- **title**: プレゼンのタイトル（何でもOK）
- **pdfPath**: PDFファイルのパス（例: "slide.pdf" または "docs/slide.pdf"）
- **timerUrl**: タイマーアプリのURL（オプション、設定すると「⏱ タイマー」ボタンが表示されます）
- **slides**: 動画やリンクを配置するページの設定
  - **page**: ボタンを表示するページ番号
  - **videos**: そのページに表示する動画のリスト
    - **title**: ボタンに表示する動画の名前
    - **path**: 動画ファイルのパス（例: "demo.mp4" または "videos/demo.mp4"）、またはYouTube URL
  - **links**: そのページに表示するスライドリンクのリスト
    - **title**: ボタンに表示するリンクの名前
    - **slide**: リンク先のスライドフォルダ名（例: "002", "appendix"）

### ステップ5: 確認する

ローカルサーバーを起動してブラウザで確認します。

#### 推奨方法: VS Code Live Server

1. VS Codeでプロジェクトフォルダを開く
2. 拡張機能「Live Server」をインストール（まだの場合）
3. `viewer/index.html`を右クリック → 「Open with Live Server」
4. ブラウザで自動的に開きます

デフォルトで`../slides/001/`のスライドが表示されます。

#### 別の方法: Python サーバー

Pythonが入っている場合：

```bash
cd your-presentation
python -m http.server 8000
```

ブラウザで`http://localhost:8000/viewer/index.html`を開く

#### 別のスライドを表示するには

URLにパラメータを追加：

```
http://localhost:5500/viewer/index.html?slide=002   # slides/002/を表示
http://localhost:5500/viewer/index.html?slide=003   # slides/003/を表示
```

#### 特定のページから開始するには

URLに`page`パラメータを追加すると、指定したページから開始できます：

```
http://localhost:5500/viewer/index.html?slide=001&page=5   # slides/001/の5ページ目から表示
http://localhost:5500/viewer/index.html?slide=002&page=10  # slides/002/の10ページ目から表示
```

**使い道の例：**
- プレゼンの途中から開始したい
- 特定のページをURLで共有したい
- ブックマークで目的のページをすぐに開きたい

#### スライドの場所を変更したい場合

デフォルトでは`viewer/`の隣の`slides/`フォルダを参照します。
別の場所にある場合は`viewer-config.json`で設定してください（詳しくは開発者に確認）。

## 🔄 ビューアの更新方法

**これがめっちゃ便利なポイント！✨**

1. `viewer/viewer-config.json`をカスタマイズしている場合は、別の場所にバックアップ
2. 開発者から新しい`viewer/`フォルダをダウンロード
3. 古い`viewer/`フォルダを削除
4. 新しい`viewer/`フォルダを配置
5. バックアップした`viewer-config.json`を`viewer/`フォルダ内に戻す（カスタマイズしている場合）
6. **slides/**はそのまま！何も変更不要！

```
your-presentation/
├── viewer/          # ← これだけ差し替え
└── slides/          # ← これはそのまま！
    └── 001/
```

##  ヒント

### 動画ファイルのサイズに注意

- 動画ファイルが大きいと読み込みが遅くなります
- 可能なら動画を圧縮しましょう
- YouTubeにアップロードしてURLを使うのもアリ！

### 複数のスライドを管理

```
slides/
├── 001-introduction/    # わかりやすい名前
├── 002-demo/
└── 003-conclusion/
```

フォルダ名を工夫すると管理しやすいです💪

### 別のスライドへのリンクを作る

config.jsonでスライドリンクボタンを設定できます✨

```json
{
  "slides": [
    {
      "page": 1,
      "links": [
        {
          "title": "第2章へ",
          "slide": "002"
        }
      ]
    }
  ]
}
```

このように設定すると、1ページ目の右下に紫色の「第2章へ ➡」ボタンが表示されます。  
クリックすると`slides/002/`のスライドに移動します💕

## ❓ トラブルシューティング

### Q: 動画が表示されない

A: 以下を確認してください：

- `config.json`の`path`が正しいか（相対パスが合っているか）
- 動画ファイルが指定した場所に存在するか
- ファイル名に全角文字やスペースがないか

### Q: PDFが表示されない

A: 以下を確認してください：

- `config.json`の`pdfPath`が正しいか
- PDFファイルが壊れていないか
- ファイル名が正しいか
- `viewer-config.json`のパス設定が正しいか（設定している場合）

### Q: YouTubeが再生できない

A: URLの形式を確認してください：

- ✅ OK: `https://www.youtube.com/watch?v=xxxxx`
- ❌ NG: `https://youtu.be/xxxxx`

動画ページのURLをそのままコピペすればOKです！

### Q: ファイル構造がよくわからない

A: こうなっていればOK：

```
your-presentation/
├── viewer/
│   └── index.html  ← これがある
└── slides/
    └── 001/
        └── config.json  ← これがある
```

`viewer/index.html`から見て`../slides/001/`でアクセスできる位置です。

## 📞 サポート

困ったことがあれば、開発者に連絡してください！

---

楽しいプレゼンライフを〜✨
