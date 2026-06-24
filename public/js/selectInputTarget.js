import {NBNZenkaku2hankaku, NBNParseExcelData, NBNrenderTable} from './NBNHelpers.js';

/*
 * selectInputTarget.js
 * 入力対象の試験を選択する
 */

class selectInputTargetView extends HTMLElement {

  
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <h1>ホーム画面</h1><p>ようこそ！</p>
        <table id="seiseki">
          <tr> <td>cls</td> <td>no</td> <td>name</td> <td>hyouka</td> </tr>
          <tr> <td>2</td> <td>1</td> <td>aaa</td> <td></td> </tr>
          <tr> <td>2</td> <td>2</td> <td>bbb</td> <td></td> </tr>
          <tr> <td>2</td> <td>3</td> <td>ccc</td> <td></td> </tr>
          <tr> <td>2</td> <td>4</td> <td>ddd</td> <td></td> </tr>
        </table>
        <button id="paste-btn">ペースト</button>
                                `;
  }

  /**
   * カスタム要素がページに追加されたときに呼ばれるコールバック
   */
  connectedCallback() {
    console.log("MainMenu connectedCallback");

    let pastebtn = this.shadowRoot.getElementById('paste-btn');
      pastebtn.addEventListener('click', async () => {
        try {
          // クリップボードからテキストを読み取る（ブラウザが許可を求めるポップアップを出します）
          const pastedText = await navigator.clipboard.readText();
 
          const obj = this.shadowRoot.getElementById('seiseki');
          obj.innerHTML = NBNrenderTable( NBNParseExcelData( NBNZenkaku2hankaku(pastedText) ) );

        } catch (err) {
          console.error("クリップボードの読み込みに失敗しました（権限が拒否されたなど）:", err);
        }
    });
  }

}
// 定義名は、全て小文字(a-z)で、ハイフンが1つ以上含まれないとダメ。
customElements.define('select-input-target-view', selectInputTargetView);
