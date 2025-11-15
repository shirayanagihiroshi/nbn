/*
 * MainMenu.js
 *
 */

class MainMenu extends HTMLElement {
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
          display : none;
        }
        .dialog { background: white; padding: 20px; border-radius: 5px; min-width: 300px;}
        button {
          position : absolute;
          left     : 200px;
          top      : 10px;
        }
      </style>
      <div class="dialog">
        <ul>
          <li><a href="/home">home</a></li>
          <li><a href="/settings">setting</a></li>
          <li><a href="/closemenu">メニューを閉じる</a></li>
        </ul>
      </div>
    `;
    console.log("MainMenu constructor");
  }

  // カスタム要素がページに追加されたときに呼ばれるコールバック
  connectedCallback() {
    console.log("TitleLine connectedCallback");
  }

  // ダイアログを表示するためのメソッド
  show(config) {
    this.style.display = 'flex';
  }

  // ダイアログを非表示にするためのメソッド
  hide(config) {
    this.style.display = 'none';
  }
}

customElements.define('main-menu', MainMenu);
