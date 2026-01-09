import { toLoginDialog } from './NBNHelpers.js';

/**
 * タイトル行表示用クラス
 */
class TitleLine extends HTMLElement {
  /**
   * コンストラクタ
   */
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        #title {
          position : absolute;
          left     : 30px;
          top      : 10px;
          background-color : red;
        }
        #tomenu {
          position : absolute;
          right    : 30px;
          top      : 10px;
        }
        #tologin {
          position : absolute;
          right    : 30px;
          top      : 10px;
        }
      </style>
      <div id="title">成績処理</div>
      <a id="tomenu" href="/mainmenu">メニュー</a>
      <button id="tologin">ログイン</button>
    `;
    console.log("TitleLine constructor");
  }

  /**
   * カスタム要素がページに追加されたときに呼ばれるコールバック
   */
  connectedCallback() {
    console.log("TitleLine connectedCallback");

    const tomenu = this.shadowRoot.querySelector('#tomenu');
    tomenu.style.display = 'none';

    // ボタン要素を取得
    const tologin = this.shadowRoot.querySelector('#tologin');

    // ボタンがクリックされたときの処理
    tologin.addEventListener('click', () => {
      toLoginDialog();
    });

/*
    const tologin = this.shadowRoot.querySelector('#tologin');
    tologin.style.display = 'none';
*/
    const tomenu = this.shadowRoot.querySelector('#tomenu');
    tomenu.style.display = 'none';

  }
}

customElements.define('title-line', TitleLine);
