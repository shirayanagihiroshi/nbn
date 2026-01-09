import { toConfirmDialog } from './NBNHelpers.js';
import { NBNGetSeiseki } from './model.js';

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
      let objBefore, objAfterSuccess, objAfterFailure;

      objBefore = { title   : '確認',
                    message : '登録してよいですか？',
                    buttons : [{ label: 'OK',         onClickFunc: this.register },
                               { label: 'キャンセル', onClickFunc: null }]};
      objAfterSuccess = { title   : '処理成功',
                          message : '登録しました',
                          buttons : [{ label: 'OK',         onClickFunc: null }]};
      objAfterFailure = { title   : '警告',
                          message : '登録できませんでした',
                          buttons : [{ label: 'OK',         onClickFunc: null }]};
      toConfirmDialog(objBefore, objAfterSuccess, objAfterFailure);
    });
  }

  register() {
    console.log('register');
    const temp = NBNGetSeiseki();
    return temp;
  }
}
customElements.define('settings-view', SettingsView);
