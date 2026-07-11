/*
 * home.js
 * dummy
 */

class HomeView extends HTMLElement {

  
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `<h1>ホーム画面</h1><p>ようこそ！</p>
      <div class="name-field">高校3年生の成績入力は7/13～7/15です。</div>`;
  }
}
customElements.define('home-view', HomeView);
