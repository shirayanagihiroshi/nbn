import { NBNDispatchEvent } from './NBNHelpers.js';

/*
 * settings.js
 * dummy
 */

class SettingsView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `<h1>設定画面</h1><p>各種設定を行います。</p>
      <textarea id="text1"> </textarea>
      <textarea id="text2"> </textarea>
      <button id="button">登録</button>`
  }

  connectedCallback() {
    console.log("SettingsView connectedCallback");
    // ボタン要素を取得
    const menuButton = this.shadowRoot.querySelector('#button');

    // ボタンがクリックされたときの処理
    menuButton.addEventListener('click', () => {
      let obj = { title   : 'setting画面からの確認',
                  message : 'hogehogehoge'};
      NBNDispatchEvent('confirmdialog', {detail : obj});
    });
  }

}
customElements.define('settings-view', SettingsView);
