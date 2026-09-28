/**
 * PromptDialog.js
 * 数値入力専用ダイアログ
 */
class PromptDialog extends HTMLElement {
/*
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
          z-index: 2;
        }
        .dialog { background: white; padding: 20px; border-radius: 5px; min-width: 320px; }
        .input-container { margin: 15px 0; }
        input[type="number"] { width: 100%; padding: 8px; box-sizing: border-box; font-size: 16px; }
        #button-container { text-align: right; margin-top: 15px; }
        #button-container button { margin-left: 10px; padding: 6px 12px; }
      </style>
      <div class="dialog">
        <h3 id="title"></h3>
        <p id="message"></p>
        <div class="input-container">
          <input type="number" id="input-number" />
        </div>
        <div id="button-container">
          <button id="ok-btn">OK</button>
          <button id="cancel-btn">キャンセル</button>
        </div>
      </div>
    `;
  }

  connectedCallback() {
    this.hide();
  }
*/
  /**
   * ダイアログを表示して入力を待つ
   * @returns {Promise<number|null>} OKなら数値、キャンセルならnull
   */
/*
  show(config) {
    const { title = '入力', message = '', defaultValue = '', min = '', max = '' } = config || {};

    this.shadowRoot.querySelector('#title').textContent = title;
    this.shadowRoot.querySelector('#message').textContent = message;

    const input = this.shadowRoot.querySelector('#input-number');
    input.value = defaultValue;
    if (min !== '') input.min = min;
    if (max !== '') input.max = max;

    this.style.display = 'flex';
    setTimeout(() => input.focus(), 50); // フォーカスを当てる

    return new Promise((resolve) => {
      const okBtn = this.shadowRoot.querySelector('#ok-btn');
      const cancelBtn = this.shadowRoot.querySelector('#cancel-btn');

      // クリーンアップ処理付きのイベントハンドラ
      const handleOk = () => {
        const val = input.value.trim();
        cleanup();
        this.hide();
        resolve(val !== '' ? Number(val) : null);
      };

      const handleCancel = () => {
        cleanup();
        this.hide();
        resolve(null);
      };

      const cleanup = () => {
        okBtn.removeEventListener('click', handleOk);
        cancelBtn.removeEventListener('click', handleCancel);
      };

      okBtn.addEventListener('click', handleOk);
      cancelBtn.addEventListener('click', handleCancel);
    });
  }

  hide() {
    this.style.display = 'none';
  }
*/
}

customElements.define('prompt-dialog', PromptDialog);
