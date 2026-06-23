/*import { createTable, foo } from './tableModule.js';*/
import './TitleLine.js';
import './MainContainer.js';
import './MainMenu.js';
import './ConfirmDialog.js';
import './LoginDialog.js';


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
      <login-dialog></login-dialog>
      <confirm-dialog></confirm-dialog>
    `;

    // 状態遷移の入口はここに統合された
    navigation.addEventListener('navigate', navigateEvent => {

      // 外部サイトへの移動やダウンロードは無視する
      if (!navigateEvent.canIntercept || navigateEvent.hashChange || navigateEvent.downloadRequest) return;

      const url = new URL(navigateEvent.destination.url);

      navigateEvent.intercept({
        handler : async () => await this.changeState(url.pathname)
      });

    });

    console.log("NBNShell constructor end");
  }

  /**
   * アプリケーションの状態遷移をする関数
   * @param {string} path URLの一部に表示される部分。これがアプリケーションの状態も表す。
   */
  async changeState(path){
    const mainmenu    = this.shadowRoot.querySelector('main-menu');
    const logindialog = this.shadowRoot.querySelector('login-dialog');

    console.log("changeState : ", path, ",historyLength : ", history.length);

    // いくつかの特別な遷移
    if (path == '/login') { // ログインダイアログを表示
      logindialog.show();
      return;

    } else if (path == '/mainmenu') { // メインメニューを表示

      mainmenu.show('');
      return;
    }

    // 特別でない遷移
    // ダイアログなどは消して
    mainmenu.hide();
    logindialog.close();
    // メインコンテナを入れ替える
    this.changeMainContainer(path);
    // 履歴の操作
    // history.replaceState({ nbnstate : path }, '', path);
  }

  /**
   * カスタム要素がページに追加されたときに呼ばれるコールバック
   */
  connectedCallback() {
    /*
    const logindialog = this.shadowRoot.querySelector('login-dialog');

    // ログイン処理をするためのダイアログ
    // これは特殊画面遷移
    // 他はリンクをクリックするなどしてchangeStateで遷移するが、
    // 様々なダイアログの設定をする関係で、確認ダイアログのケースのみイベント送信により
    // 画面遷移を行う。また、状態を積まず、awaitして同期的に待つ。
    document.addEventListener('logindialog', async (event) => {
      const onClickFunc = await logindialog.show();

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
    });
    const confirmdialog = this.shadowRoot.querySelector('confirm-dialog');

    // 登録などをする際にユーザに確認を行うための汎用ダイアログ
    // これは特殊画面遷移
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
*/

    console.log("NBNShell connectedCallback");
  }

  /**
   * main-containerに表示するモジュールを切り替える関数
   */
  changeMainContainer(path) {
    const mainContainer = this.shadowRoot.querySelector('main-container');
    // pathは"/setting"のような文字列で、substring(1)は先頭の"/"より後の文字列の意味。
    const viewName = path.substring(1);
    mainContainer.changeView(viewName);
  }
}

customElements.define('nbn-shell', NBNShell);
