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

  // カスタム要素がページに追加されたときに呼ばれるコールバック
  connectedCallback() {
    const titleLine = this.shadowRoot.querySelector('title-line');
    const mainContainer = this.shadowRoot.querySelector('main-container');

    // titleLineのボタンがクリックされたら、mainContainerの表示を切り替える
    // (titleLine側でイベントを発行し、ここで補足する必要があります)
    mainContainer.addEventListener('change-view-request', function (event) {
      const viewName = event.detail.view; // イベント経由でビュー名を受け取る
      mainContainer.changeView(viewName);
    });

    console.log("NBNShell connectedCallback");
  }
}

customElements.define('nbn-shell', NBNShell);
