import { defineConfig } from 'vite';
import { resolve } from 'path';
import { existsSync, rmSync, cpSync, mkdirSync, writeFileSync } from 'fs';

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  // GitHub Pages用: 環境変数でbaseを制御（本番ビルド時は /pdf-slide-viewer/ を使用）
  const base = process.env.GITHUB_PAGES === 'true' ? '/pdf-slide-viewer/' : './';
  
  return {
    root: 'src',
    publicDir: isDev ? '../public' : false,  // 開発時のみpublicを使う
    base,  // 相対パスでアセットを参照（GitHub Pages時はサブパス）
    server: {
      port: 3000,
      open: true,
      fs: {
        // 開発時にslides/フォルダにアクセスできるようにする
        allow: [resolve(__dirname, '..')]
      }
    },
    build: {
      outDir: '../dist/viewer',  // viewer/フォルダに出力
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'src/index.html')
        }
      }
    },
  plugins: [
    {
      name: 'setup-distribution-package',
      buildStart() {
        // 本番ビルド時のみdist/フォルダ全体をクリーンアップ
        if (!isDev) {
          const distDir = resolve(__dirname, 'dist');
          if (existsSync(distDir)) {
            rmSync(distDir, { recursive: true, force: true });
            console.log('🧹 dist/ フォルダをクリーンアップしました');
          }
        }
      },
      closeBundle() {
        const distDir = resolve(__dirname, 'dist');
        const viewerDir = resolve(__dirname, 'dist/viewer');
        
        // public/lib/ を viewer/lib/ にコピー
        const libSrc = resolve(__dirname, 'public/lib');
        const libDest = resolve(viewerDir, 'lib');
        if (existsSync(libSrc)) {
          cpSync(libSrc, libDest, { recursive: true });
          console.log('✅ lib/ をコピーしました');
        }
        
        // public/sample-timer/ を sample-timer/ にコピー（サンプルとして配置）
        const timerSrc = resolve(__dirname, 'public/sample-timer');
        const timerDest = resolve(distDir, 'sample-timer');
        if (existsSync(timerSrc)) {
          cpSync(timerSrc, timerDest, { recursive: true });
          console.log('✅ sample-timer/ をコピーしました');
        }
        
        // README.mdをdist/にコピー（スライド作成者ガイド）
        const readmeSrc = resolve(__dirname, 'docs/creators-guide.md');
        const readmeDest = resolve(distDir, 'README.md');
        if (existsSync(readmeSrc)) {
          cpSync(readmeSrc, readmeDest);
          console.log('✅ README.md をコピーしました');
        }
        
        // viewer-config.jsonをviewer/に作成
        const configContent = {
          slidesPath: "../slides"
        };
        const viewerConfigPath = resolve(viewerDir, 'viewer-config.json');
        writeFileSync(viewerConfigPath, JSON.stringify(configContent, null, 2));
        console.log('✅ viewer-config.json を作成しました');
        
        // public/slides/ を slides/ にコピー
        const slidesSrc = resolve(__dirname, 'public/slides');
        const slidesDest = resolve(distDir, 'slides');
        if (existsSync(slidesSrc)) {
          cpSync(slidesSrc, slidesDest, { recursive: true });
          console.log('✅ slides/ をコピーしました');
        }
        
        console.log('✨ 配布パッケージの準備が完了しました！');
      }
    }
  ]
  };
});
