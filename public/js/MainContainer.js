import './home.js';
import './settings.js';

/**
 * メイン画面のモジュール
 * タイトル行を除く部分の枠である。
 */
class MainContainer extends HTMLElement {
  /**
   * コンストラクタ
   */
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `<div id="view-wrapper"></div>`; // コンテンツを入れるラッパーを用意
    console.log("MainContainer constructor");
  }

  /**
   * メイン画面を切り替えるためのメソッド
   * @param {string} viewName ??
   */
  changeView(viewName) {
    const viewWrapper = this.shadowRoot.querySelector('#view-wrapper');
    if (!viewWrapper) {
      return;
    }

    // ラッパーの中身を空にする
    viewWrapper.innerHTML = '';

    // 読み込んだコンポーネントのタグを生成
    const viewElement = document.createElement(`${viewName}-view`);

    // ラッパーに新しい画面を追加
    viewWrapper.appendChild(viewElement);
  }

  /**
   * カスタム要素がページに追加されたときに呼ばれるコールバック
   */
  connectedCallback() {
    console.log("MainContainer connectedCallback");
    // 初期画面として 'home' を表示する
    this.changeView('home');
  }
}

customElements.define('main-container', MainContainer);
