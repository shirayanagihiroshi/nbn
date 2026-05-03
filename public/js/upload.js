/*
 * home.js
 * dummy
 */

class UploadView extends HTMLElement {

    // :host の:は疑似クラスを表す
    // 疑似クラスはその要素が、ある状態や特別な立場にあるときを指し示すために使われる
    // ::のように:が2つの疑似クラスもあるらしい

  
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `<h1>ホーム画面</h1><p>ようこそ！</p><div class="name-field">??田</div>`;
  }
}
customElements.define('home-view', HomeView);
