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
        <ul id="menuList">
          <!-- 一般用メニュー（全ユーザー共通） -->
          <li><a href="/home">home</a></li>
          <li><a href="/input-seiseki">成績入力</a></li>
          <li><a href="/input-syukketsu">出欠入力</a></li>
          <li><a href="/gakunen-summary">一覧表示</a></li>
          <!-- 管理者用メニューはJavaScriptでここに動的挿入されます
          <li><a href="/settings">管理設定(教務)</a></li>
          <li><a href="/register-kamoku">registerKamoku(教務)</a></li>
          <li><a href="/register-tantou">registerTantou(教務)</a></li> -->
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

    // 管理者メニューの動的挿入
    this._renderAdminMenu();

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
   * 管理者フラグ(kanri)をチェックし、メニューの表示を更新する
   */
  _renderAdminMenu() {
    const isKanri = sessionStorage.getItem('kanri') === 'true';
    const menuList = this.shadowRoot.getElementById('menuList');

    // 1. まず過去に挿入された管理者用メニュー（.admin-item）をすべて削除してクリーンにする
    const existingAdminItems = this.shadowRoot.querySelectorAll('.admin-item');
    existingAdminItems.forEach(el => el.remove());

    // 2. 管理者の場合のみ、再度メニューを挿入する
    if (isKanri) {
      const logoutLi = this.shadowRoot.getElementById('logout').parentElement;

      const adminMenuItems = [
        { href: '/settings', label: '管理設定(教務)' },
        { href: '/register-kamoku', label: 'registerKamoku(教務)' },
        { href: '/register-tantou', label: 'registerTantou(教務)' }
      ];

      adminMenuItems.forEach(item => {
        const li = document.createElement('li');
        li.className = 'admin-item'; // 削除時の目印用クラス
        li.innerHTML = `<a href="${item.href}">${item.label}</a>`;
        menuList.insertBefore(li, logoutLi);
      });
    }
  }

  /**
   * メインメニューを表示するためのメソッド
   */
  show(config) {
    // ログインユーザーの切替に対応するため、表示するタイミングで毎回権限チェック
    this._renderAdminMenu();
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
