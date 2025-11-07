/*
 * NBNHelpers.js
 * ヘルパー関数
 * モデルの操作は別モジュール
 */

export function NBNDispatchEvent() {
  const event = new CustomEvent('show-confirm', {
    bubbles: true,
    composed: true,
    detail: {
      config: { // show()メソッドに渡す設定オブジェクト
        title: '実行確認',
        message: 'この操作を実行してもよろしいですか？',
        buttons: [
          { label: 'はい', value: 'yes' },
          { label: 'いいえ', value: 'no' }
        ]
      },
      onComplete: (result) => {
        if (result === 'yes') {
          console.log('はい が選択されました。');
        }
      }
    }
  });
  this.dispatchEvent(event);
}

