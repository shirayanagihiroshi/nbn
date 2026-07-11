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
      <a id="tomenu"  href="/mainmenu">メニュー</a>
      <a id="tologin" href="/login">ログイン</a>
    `;
    console.log("TitleLine constructor");
  }

  /**
   * カスタム要素がページに追加されたときに呼ばれるコールバック
   */
  connectedCallback() {
    console.log("TitleLine connectedCallback");
    // ログイン成功イベントを待ち受ける
    window.addEventListener('app-login-success', (event) => {
      this._logined(event.detail.username);
    });

    window.addEventListener('app-logout-success', (event) => {
      this._logouted();
    });

    const tomenu = this.shadowRoot.querySelector('#tomenu');
    const tologin = this.shadowRoot.querySelector('#tologin');
    tomenu.style.display = 'none';
  }

  /**
   * ログインするリンクをメニューへのリンクにする
   */
  _logined(userName) {
    const tomenu = this.shadowRoot.querySelector('#tomenu');
    const tologin = this.shadowRoot.querySelector('#tologin');
    tologin.style.display = 'none';
    tomenu.style.display = 'block';

    const titlestr = this.shadowRoot.getElementById('title');
    titlestr.innerText = 
      `成績処理　ようこそ　${userName} 先生`;
  }

  /**
   * メニューをログインにする
   */
  _logouted() {
    const tomenu = this.shadowRoot.querySelector('#tomenu');
    const tologin = this.shadowRoot.querySelector('#tologin');
    tologin.style.display = 'block';
    tomenu.style.display = 'none';

    const titlestr = this.shadowRoot.getElementById('title');
    titlestr.innerText = 
      `成績処理`;

  }
}

customElements.define('title-line', TitleLine);
