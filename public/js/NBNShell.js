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

  // アプリケーションの状態遷移
  // path        :
  // howToChange : 'push'    履歴スタックに追加する
  //             : 'replace' 履歴スタックの一番上を交換する
  changeState(path, howToChange){
    // 画面の変更
    


    // 履歴の操作
    if (howToChange == 'push') {
       history.pushState({ nbnstate : path }, '', path);
    } else {
     history.replaceState({ nbnstate : path }, '', path);
    }
  }


  // 要素が文書に追加されるたびに呼び出される
  connectedCallback() {
    const mainmenu = this.shadowRoot.querySelector('main-menu');

    // アプリケーションのどこかから 'mainmenu' イベントが発行されたらダイアログを表示
    document.addEventListener('mainmenu', (event) => {
      history.pushState({ nbnstate : 'mainmenu' }, '', '/mainmenu');
      mainmenu.show(event.detail);
    });

    // リンクを辿る操作をアプリケーションがカスタマイズする処理
    this.shadowRoot.addEventListener('click', (event) => {
      // クリックされたのが <a> タグで、同じオリジン内のリンクか確認
      // event.target の代わりに event.composedPath()[0] を使う
      // event.composedPath() メソッドはイベントが伝播してきた経路（DOMノードの配列）
      // を返す。この配列の最初の要素が実際にイベントを発生させた要素
      const target = event.composedPath()[0];

      // location.origin は現在表示されているWebページのURLから、
      // スキーム（プロトコル）、ホスト名、ポート番号を組み合わせた文字列を返します。
      // 例えば、現在のページのURLが https://www.example.com:8080/path/to/page?query=value#hash の場合、
      // location.origin は https://www.example.com:8080 を返します。
      // パス (/path/to/page)、クエリパラメータ (?query=value)、ハッシュ (#hash) は含まれません。
      if (target.tagName === 'A' && target.href.startsWith(location.origin)) {
        event.preventDefault();
        const path = new URL(target.href).pathname; // リンクのpathだけを取り出す

        // URLが現在のパスと同じでなければ、履歴を追加して画面を更新
        if (path !== location.pathname) {
          if (path == '/closemenu') {
            history.back();
          }
// pushするかreplaceStateするか　イベントで通知すればいいんじゃないか
mainmenu.hide();
          history.pushState({ nbnstate : path }, '', path);
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
  // handleNavigation(path)
  changeMainContainer(path) {
    const mainContainer = this.shadowRoot.querySelector('main-container');
    const viewName = path.substring(1) || 'home';
    console.log(`Navigating to: ${viewName}`);
    mainContainer.changeView(viewName);
  }
}

customElements.define('nbn-shell', NBNShell);
