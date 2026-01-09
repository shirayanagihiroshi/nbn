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
      </style>
      <div id="title">成績処理</div>
      <a id="tomenu" href="/mainmenu">メニュー</a>
    `;
    console.log("TitleLine constructor");
  }

  /**
   * カスタム要素がページに追加されたときに呼ばれるコールバック
   */
  connectedCallback() {
    console.log("TitleLine connectedCallback");
  }
}

customElements.define('title-line', TitleLine);
