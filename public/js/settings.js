/*
 * settings.js
 * dummy
 */

class SettingsView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `<h1>設定画面</h1><p>各種設定を行います。</p>`;
  }
}
customElements.define('settings-view', SettingsView);
