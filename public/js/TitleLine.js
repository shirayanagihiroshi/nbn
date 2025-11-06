/*
 * TitleLine.js
 *
 */

class TitleLine extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        div {
          position : absolute;
          left     : 30px;
          top      : 10px;
          background-color : red;
        }
        button {
          margin-right: 10px;
          padding: 8px 15px;
          cursor: pointer;
        }
      </style>
      <div>成績処理</div>
      <button id="homeButton">ホーム</button>
      <button id="settingsButton">設定</button>
    `;
    console.log("TitleLine constructor");
  }

  // カスタム要素がページに追加されたときに呼ばれるコールバック
  connectedCallback() {
    console.log("TitleLine connectedCallback");

    // ボタン要素を取得
    const homeButton = this.shadowRoot.querySelector('#homeButton');
    const settingsButton = this.shadowRoot.querySelector('#settingsButton');

    // ホームボタンがクリックされたときの処理
    homeButton.addEventListener('click', () => {
      this.dispatchChangeViewRequest('home');
    });

    // 設定ボタンがクリックされたときの処理
    settingsButton.addEventListener('click', () => {
      this.dispatchChangeViewRequest('settings');
    });
  }

  // 画面切り替えリクエストのカスタムイベントを発行するヘルパーメソッド
  dispatchChangeViewRequest(viewName) {
    // CustomEventを作成
    // detailプロパティで、イベントに付随するデータを渡す
    // bubbles: true でイベントがDOMツリーをバブリング（親要素へ伝播）するようにする
    // composed: true でShadow DOMの境界を越えてイベントが伝播するようにする
    const event = new CustomEvent('change-view-request', {
      bubbles: true,
      composed: true,
      detail: { view: viewName }
    });
    // イベントを発行
    this.dispatchEvent(event);
  }
}

customElements.define('title-line', TitleLine);
