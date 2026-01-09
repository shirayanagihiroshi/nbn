/*import { createTable, foo } from './tableModule.js';*/
import './TitleLine.js';
import './MainContainer.js';
import './MainMenu.js';
import './ConfirmDialog.js';

/**
 * shell（外骨格）モジュール
 * 本モジュールそのものはUIを持たない。
 * UIを持つモジュールを配置して画面を作り上げるためのモジュール。
 * main-container、main-menu は枠のみであり、その中身を個々のモジュールで
 * 定義する。
 * 本モジュールは画面の切り替えのコントロールも行う。
 */
class NBNShell extends HTMLElement {
  /**
   * コンストラクタ
   */
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

  /**
   * アプリケーションの状態遷移をする関数
   * @param {string} path URLの一部に表示される部分。これがアプリケーションの状態も表す。
   * @param {string} howToChange どのように履歴を積むかを指定する。
   * 'push':履歴スタックに追加する。
   * 'replace':履歴スタックの一番上を交換する。
   */
  changeState(path){
    const mainmenu = this.shadowRoot.querySelector('main-menu');

    console.log("changeState : ", path, ",historyLength : ", history.length);
    // いくつかの特別な遷移
    if (path == '/mainmenu') { // メインメニューを表示

      mainmenu.show('');
      history.pushState({ nbnstate : path }, '', path);
      return;
    } else if (path == '/closemenu') { // メインメニューを閉じる
      history.back();
      return;
    }

    // 特別でない遷移
    // ダイアログなどは消して
    mainmenu.hide();
    // メインコンテナを入れ替える
    this.changeMainContainer(path);
    // 履歴の操作
    history.replaceState({ nbnstate : path }, '', path);
  }

  /**
   * カスタム要素がページに追加されたときに呼ばれるコールバック
   */
  connectedCallback() {
    const confirmdialog = this.shadowRoot.querySelector('confirm-dialog');

    // この画面遷移のみ特殊
    // 他はリンクをクリックするなどしてchangeStateで遷移するが、
    // 様々なダイアログの設定をする関係で、確認ダイアログのケースのみイベント送信により
    // 画面遷移を行う。また、状態を積まず、awaitして同期的に待つ。
    document.addEventListener('confirmdialog', async (event) => {
      if (event.detail.before != null) {
        const onClickFunc = await confirmdialog.show(event.detail.before);

        if (onClickFunc != null) {
          // 登録関係の処理は本来非同期だが、awaitして同期で処理する
          const ret = await onClickFunc();

          // 登録等の処理に成功したら
          if (ret.isSuccess == true) {
            if (event.detail.afterSuccess != null) {
              const temp = await confirmdialog.show(event.detail.afterSuccess);
            }
          // 登録等の処理に成功したら 判定の仕方は後で更新する
          } else {
            if (event.detail.afterFailure != null) {
              const temp = await confirmdialog.show(event.detail.afterFailure);
            }
          }
        }
      }
    });

    // リンクをクリックすることで画面遷移をするために
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
      // つまりここでは、外部へのリンクでないなら、という判定
      if (target.tagName == 'A' && target.href.startsWith(location.origin)) {
        //ブラウザに通常通りのアクションを行うべきでないとつたえる。
        event.preventDefault();
        // リンクのpathだけを取り出す
        const path = new URL(target.href).pathname;

        // URLが現在のパスと同じでなければ、履歴を追加して画面を更新
        if (path != location.pathname) {
          this.changeState(path);
        }
      }
    });

    // ブラウザの「戻る/進む」ボタンが押されたときの処理
    window.addEventListener('popstate', (event) => {
      this.changeState(location.pathname)
    });

    // 初期表示の処理
    this.changeState('/home')

    console.log("NBNShell connectedCallback");
  }

  /**
   * main-containerに表示するモジュールを切り替える関数
   */
  changeMainContainer(path) {
    const mainContainer = this.shadowRoot.querySelector('main-container');
    // pathは"/setting"のような文字列で、substring(1)は先頭の"/"より後の文字列の意味。
    // ||しているのは、pathが偽（falsy）な値だったら右側の値を採用する。
    // つまりデフォルト値を設定している。
    const viewName = path.substring(1) || 'home';
    mainContainer.changeView(viewName);
  }
}

customElements.define('nbn-shell', NBNShell);
