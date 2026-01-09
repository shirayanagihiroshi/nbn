/**
 * LoginDialog.js
 * ログイン用ダイアログ
 * NBNHelpers.js の toLoginDialog で表示される
 */
class LoginDialog extends HTMLElement {
  /**
   * コンストラクタ
   */
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
        <h3 id="title">ログインする？</h3>
        <p id="message"></p>
        <div id="button-container"></div>
      </div>
    `;
  }

  /**
   * カスタム要素がページに追加されたときに呼ばれるコールバック
   */
  connectedCallback() {
    this.hide();
  }

  /**
   * ダイアログを表示するためのメソッド
   */
  show(config) {
    // デフォルト設定
    const defaultConfig = {
      title: '確認',
      message: '',
      buttons: [
        { label: 'OK', onClickFunc: null },
        { label: 'キャンセル', onClickFunc: null }
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

      button.addEventListener('click', () => {
        // ダイアログは消して
        this.hide();
        // ボタンに登録された関数を返す
        if (this.resolve) {
          this.resolve(buttonConfig.onClickFunc);
        }
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

  /**
   * ダイアログを非表示にするためのメソッド
   */
  hide() {
    this.style.display = 'none';
  }
}
customElements.define('confirm-dialog', ConfirmDialog);
