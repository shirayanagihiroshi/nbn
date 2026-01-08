/*
 * ConfirmDialog.js
 * 汎用確認ダイアログ
 */

class ConfirmDialog extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          background-color: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .dialog { background: white; padding: 20px; border-radius: 5px; min-width: 300px; }
        #button-container { margin-top: 20px; text-align: right; }
        #button-container button { margin-left: 10px; }
      </style>
      <div class="dialog">
        <h3 id="title"></h3>
        <p id="message"></p>
        <div id="button-container"></div>
      </div>
    `;
  }

  connectedCallback() {
    //this.shadowRoot.querySelector('#okButton').addEventListener('click', () => this.hide(true));
    //this.shadowRoot.querySelector('#cancelButton').addEventListener('click', () => this.hide(false));
    this.hide(true);
  }

  // ダイアログを表示するためのメソッドを拡張
  show(config) {
    // デフォルト設定
    const defaultConfig = {
      title: '確認',
      message: '',
      buttons: [
        { label: 'OK', value: true, variant: 'primary' },
        { label: 'キャンセル', value: false, variant: 'secondary' }
      ]
    };
    // 呼び出し元からの設定とデフォルトをマージ
    const finalConfig = { ...defaultConfig, ...config };

    // タイトルとメッセージを設定
    this.shadowRoot.querySelector('#title').textContent = finalConfig.title;
    this.shadowRoot.querySelector('#message').textContent = finalConfig.message;

    // ボタンを動的に生成
    const buttonContainer = this.shadowRoot.querySelector('#button-container');
    buttonContainer.innerHTML = ''; // 既存のボタンをクリア

    finalConfig.buttons.forEach(buttonConfig => {
      const button = document.createElement('button');
      button.textContent = buttonConfig.label;
      // (オプション) ボタンの見た目を切り替えるための属性などを設定
      button.dataset.variant = buttonConfig.variant;

      button.addEventListener('click', () => {
        this.hide(buttonConfig.value); // ボタン固有の値を返す
      });
      buttonContainer.appendChild(button);
    });

    this.style.display = 'flex';

    // Promiseのパラメータをfunctionにしてはいけない。
    // thisが指すものが変わってしまうから。
    return new Promise( (resolve) => {
      // Promiseを作る関数(エグゼキュータ)は同期的に処理されることに注意。
      // 後で(ユーザ操作を受けて)解決するためにthisのメンバに保持しておく。
      this.resolve = resolve;
    });
  }

  hide(result) {
    this.style.display = 'none';
    if (this.resolve) {
      this.resolve(result);
    }
  }
}
customElements.define('confirm-dialog', ConfirmDialog);
