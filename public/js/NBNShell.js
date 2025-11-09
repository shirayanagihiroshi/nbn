/*
 * nbnShell.js
 * shell（外骨格）モジュール
 */

/*import { createTable, foo } from './tableModule.js';*/
import './TitleLine.js';
import './MainContainer.js';
import './MainMenu.js';
import './ConfirmDialog.js';

class NBNShell extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        title-line {
          position : absolute;
          left     : 0;
          top      : 0;
          width    : 100%;
          height   : 50px;
          background-color : rgb(255,200,200);
        }
        main-container {
          position : absolute;
          top      : 50px;
          left     : 0;
          width    : 100%;
          height   : 100%;
          background-color : yellow;
        }
      </style>
      <title-line></title-line>
      <main-container></main-container>
      <main-menu></main-menu>
      <confirm-dialog></confirm-dialog>
    `;
    console.log("NBNShell constructor");
  }

  connectedCallback() {
    const mainmenu = this.shadowRoot.querySelector('main-menu');

    // アプリケーションのどこかから 'mainmenu' イベントが発行されたらダイアログを表示
    document.addEventListener('mainmenu', (event) => {
      mainmenu.show(event.detail);
    });

    // リンクを辿る操作をアプリケーションがカスタマイズする処理
    this.shadowRoot.addEventListener('click', (event) => {
      // クリックされたのが <a> タグで、同じオリジン内のリンクか確認
      // event.target の代わりに event.composedPath()[0] を使う
      // event.composedPath() メソッドはイベントが伝播してきた経路（DOMノードの配列）
      // を返す。この配列の最初の要素が実際にイベントを発生させた要素
      const target = event.composedPath()[0];

      if (target.tagName === 'A' && target.href.startsWith(location.origin)) {
        event.preventDefault();
        const path = new URL(target.href).pathname;

        // URLが現在のパスと同じでなければ、履歴を追加して画面を更新
        if (path !== location.pathname) {
          history.pushState({ path }, '', path);
          this.handleNavigation(path);
        }
      }
    });

    // ブラウザの「戻る/進む」ボタンが押されたときの処理
    window.addEventListener('popstate', (event) => {
      this.handleNavigation(location.pathname);
    });

    // 初期表示時の処理
    this.handleNavigation(location.pathname);

    console.log("NBNShell connectedCallback");
  }

  // URLのパスに応じて画面を切り替えるハンドラ
  handleNavigation(path) {
    const mainContainer = this.shadowRoot.querySelector('main-container');
    const viewName = path.substring(1) || 'home';
    console.log(`Navigating to: ${viewName}`);
    mainContainer.changeView(viewName);
  }
}

customElements.define('nbn-shell', NBNShell);
