import { NBNDispatchEvent } from './NBNHelpers.js';

/**
 * メインメニュー(常に画面右上にあるメニューボタンを押して表示される)
 * 表示用クラス
 */
class MainMenu extends HTMLElement {
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
          <li><a href="/input-seiseki">成績入力</a></li>
          <li><a href="/input-syukketsu">出欠入力</a></li>
          <li><a href="/gakunen-summary">一覧表示</a></li>
          <li><a href="/settings">管理設定(教務)</a></li>
          <li><a href="/register-kamoku">registerKamoku(教務)</a></li>
          <li><a href="/register-tantou">registerTantou(教務)</a></li>
          <li><a id="logout" href="/logout">ログアウト</a></li>
          <li><a id="closemenu" href="/closemenu">メニューを閉じる</a></li>
        </ul>
      </div>
    `;
    console.log("MainMenu constructor");
  }

  /**
   * カスタム要素がページに追加されたときに呼ばれるコールバック
   */
  connectedCallback() {
    console.log("MainMenu connectedCallback");

    let logoutmenu = this.shadowRoot.getElementById('logout');
      logoutmenu.addEventListener('click', (e) => {
      e.preventDefault();
      this._logout();
    });

    let closemenu = this.shadowRoot.getElementById('closemenu');
      closemenu.addEventListener('click',  (e) => {
      e.preventDefault();
      navigation.back();
    });
  }

  /**
   * ログアウト処理
   */
  async _logout() {
    const token = sessionStorage.getItem('authToken');

    if (token) {
      try {
        // 1. サーバー側にログアウト通知（DBのトークン消去）
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: token })
        });
      } catch (error) {
        console.error('ログアウト通信エラー:', error);
      }
    }

    // 2. ブラウザ側のセッション情報を消去
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('userName');

    // 3. ログアウト成功イベントの発行（タイトルバーの表示切り替え等）
    NBNDispatchEvent('app-logout-success', {});

    // 4. ログイン画面またはトップページへ遷移
    navigation.navigate('/home');
  }

  /**
   * メインメニューを表示するためのメソッド
   */
  show(config) {
    this.style.display = 'flex';
  }

  /**
   * メインメニューを非表示にするためのメソッド
   */
  hide(config) {
    this.style.display = 'none';
  }
}

customElements.define('main-menu', MainMenu);
