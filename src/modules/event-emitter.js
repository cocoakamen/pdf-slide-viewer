/**
 * イベント駆動型アーキテクチャのためのEventEmitterクラス
 * Observer パターンを実装し、モジュール間の疎結合な通信を実現する
 * 
 * @class EventEmitter
 */
export class EventEmitter {
    constructor() {
        /** @type {Object.<string, Function[]>} イベント名とリスナー配列のマップ */
        this.events = {};
    }

    /**
     * イベントリスナーを登録
     * @param {string} event - イベント名
     * @param {Function} listener - コールバック関数
     */
    on(event, listener) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    }

    /**
     * イベントリスナーを削除
     * @param {string} event - イベント名
     * @param {Function} listener - 削除するコールバック関数
     */
    off(event, listener) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(l => l !== listener);
    }

    /**
     * イベントを発行し、登録されたすべてのリスナーを実行
     * @param {string} event - イベント名
     * @param {*} data - イベントデータ
     */
    emit(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(listener => {
            try {
                listener(data);
            } catch (error) {
                console.error(`イベント "${event}" のリスナーでエラー:`, error);
            }
        });
    }

    /**
     * 一度だけ実行されるイベントリスナーを登録
     * 実行後は自動的に登録が解除される
     * @param {string} event - イベント名
     * @param {Function} listener - コールバック関数
     */
    once(event, listener) {
        const onceWrapper = (data) => {
            listener(data);
            this.off(event, onceWrapper);
        };
        this.on(event, onceWrapper);
    }

    /**
     * 登録されているすべてのイベントリスナーをクリア
     */
    clear() {
        this.events = {};
    }
}
