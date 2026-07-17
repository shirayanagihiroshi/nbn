import { NBNDispatchEvent } from './NBNHelpers.js';

/**
 * LoginDialog.js
 * ログイン用ダイアログ
 * TitleLineのログインをクリックし表示される
 */
class LoginDialog extends HTMLElement {
  /**
   * コンストラクタ
   */
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
//    this._resolve = null;
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
        .dialog { background: white; padding: 20px; border-radius: 8px; min-width: 320px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
        h3 { margin-top: 0; }
        .input-group { margin-bottom: 15px; }
        .input-group label { display: block; font-size: 0.9em; margin-bottom: 5px; }
        .input-group input { width: 100%; padding: 8px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; }
        #button-container { margin-top: 20px; text-align: right; }
        button { padding: 8px 16px; cursor: pointer; }
        #login-btn { background-color: #007bff; color: white; border: none; border-radius: 4px; }
      </style>
      <div class="dialog">
        <h3 id="title">ログイン</h3>
        <div class="input-group">
          <label for="userid">ユーザーID</label>
          <input type="text" id="userid" autocomplete="username">
        </div>
        <div class="input-group">
          <label for="password">パスワード</label>
          <input type="password" id="password" autocomplete="current-password">
        </div>
        <div id="button-container">
          <button id="cancel-btn">キャンセル</button>
          <button id="login-btn">ログイン</button>
        </div>
      </div>
    `;

    this.shadowRoot.getElementById('login-btn').onclick  = () => this._submit();
    this.shadowRoot.getElementById('cancel-btn').onclick = () => this._cancel();
    // Enter keyでも送信できるように
    this.shadowRoot.addEventListener('keydown', (e) => {
      if(e.key === 'Enter') this._submit();
    });

    this.style.display = 'none'; // 初期状態は非表示
  }

  /**
   * カスタム要素がページに追加されたときに呼ばれるコールバック
   */
  connectedCallback() {
  }

  /**
   * ダイアログを表示するためのメソッド
   */
  show(config) {
    this.style.display = 'flex';
    // 入力欄をクリアしてフォーカスを当てる
    this.shadowRoot.querySelector('#userid').value   = '';
    this.shadowRoot.querySelector('#password').value = '';
    this.shadowRoot.querySelector('#userid').focus();
/*
    return new Promise((resolve) => {
      this._resolve = resolve;
    });
    */
    return;
  }

  async _submit() {
    const userid   = this.shadowRoot.querySelector('#userid').value;
    const password = this.shadowRoot.querySelector('#password').value;

    if (!userid || !password) {
      alert("ユーザIDとパスワードを両方入力してください");
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userid, password })
      });

      const data = await response.json();

      if (data.success) {
        // 成功：ブラウザの sessionStorage にトークンと名前、管理ユーザであるかどうかを保存
        sessionStorage.setItem('authToken', data.token);
        sessionStorage.setItem('userName', data.name);
        sessionStorage.setItem('userid', data.userid); // SKTからのデータ取得でのみ使用
        sessionStorage.setItem('kanri', data.kanri);

        // タイトルライン等に通知
        NBNDispatchEvent('app-login-success', {
          detail: { 
            username: data.name 
          }
        });

        this._close();
        navigation.navigate('/home');
      } else {
        alert('エラー: ' + data.message);
      }

    } catch (error) {
      console.error('通信に失敗しました', error);
      alert('通信に失敗しました。サーバーの状態を確認してください。');
    }
  }
  _cancel() {
    navigation.back();
//    this._close({ success: false });
  }

  close(result) {
    this._close();
  }

  _close(result) {
    this.style.display = 'none';
/*
    if (this._resolve) {
      this._resolve(result);
      this._resolve = null;
    }
*/
  }
}
customElements.define('login-dialog', LoginDialog);
