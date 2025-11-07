/*
 * home.js
 * dummy
 */

class HomeView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `<h1>ホーム画面</h1><p>ようこそ！</p>`;
  }
}
customElements.define('home-view', HomeView);
