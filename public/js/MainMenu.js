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
        div {
          position : absolute;
          left     : 30px;
          top      : 10px;
          background-color : red;
        }
        button {
          position : absolute;
          left     : 200px;
          top      : 10px;
        }
      </style>
      <div>成績処理</div><button>aa</button>
    `;
    console.log("TitleLine constructor");
  }

  // カスタム要素がページに追加されたときに呼ばれるコールバック
  connectedCallback() {
    console.log("TitleLine connectedCallback");
  }
}

customElements.define('main-menu', MainMenu);
