/**
 * PDF印刷管理クラス
 * PDFファイルの印刷機能を提供する
 * 
 * @class PrintManager
 */
export class PrintManager {
    /**
     * @param {Function} getPdfUrl - PDFのURLを取得する関数
     */
    constructor(getPdfUrl) {
        /** @type {Function} PDFのURLを取得する関数 */
        this.getPdfUrl = getPdfUrl;
        
        /** @type {HTMLButtonElement} 印刷ボタン */
        this.printBtn = document.getElementById('printBtn');
        
        this._setupEventListeners();
    }

    /**
     * イベントリスナーの設定
     * @private
     */
    _setupEventListeners() {
        // ボタンクリック
        this.printBtn.addEventListener('click', () => this.print());
    }

    /**
     * PDFを印刷
     */
    print() {
        const pdfUrl = this.getPdfUrl();
        if (!pdfUrl) {
            alert('PDFが読み込まれていません');
            return;
        }

        // PDFを新しいウィンドウで開いて印刷ダイアログを表示
        const printWindow = window.open(pdfUrl, '_blank');
        
        if (!printWindow) {
            alert('ポップアップがブロックされました。ブラウザの設定を確認してください。');
            return;
        }
        
        // PDFが読み込まれたら印刷ダイアログを自動表示
        printWindow.addEventListener('load', () => {
            printWindow.print();
        });
    }
}
