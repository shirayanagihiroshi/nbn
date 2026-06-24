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
      <style>
        h1 { font-family: sans-serif; color: #333; }
        .seiseki { border-collapse: collapse; margin-top: 20px; width: 100%; }
        .seiseki th, .seiseki td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .seiseki tr:first-child { background-color: #f2f2f2; font-weight: bold; }
        
        /* 直接入力できる「評価（hyouka）」のセルを目立たせるためのスタイル */
        .editable-cell {
          background-color: #fffde7; /* ほんのり薄い黄色にして、入力できることをユーザーに伝える */
          cursor: text;             /* マウスカーソルをテキスト入力の形（ I ）にする */
        }
        /* 入力中のセルの枠線に色をつける（使いやすさの向上） */
        .editable-cell:focus {
          outline: 2px solid #2196F3;
          background-color: #fff;
        }
        
        #paste-btn { margin-top: 15px; padding: 8px 16px; cursor: pointer; }
      </style>
      <h1>ホーム画面</h1><p>ようこそ！</p>
      <table class="seiseki" id="scoreTable">
        <tr> <td>cls</td> <td>no</td> <td>name</td> <td>hyouka</td> </tr>
        <tr> <td>2</td> <td>1</td> <td>aaa</td> <td class="editable-cell" contenteditable="true"></td> </tr>
        <tr> <td>2</td> <td>2</td> <td>bbb</td> <td class="editable-cell" contenteditable="true"></td> </tr>
        <tr> <td>2</td> <td>3</td> <td>ccc</td> <td class="editable-cell" contenteditable="true"></td> </tr>
        <tr> <td>2</td> <td>4</td> <td>ddd</td> <td class="editable-cell" contenteditable="true"></td> </tr>
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

    // 矢印キーとEnterキーで上下移動する処理
    // テーブル全体（#scoreTable）の中で起きたキーボード入力を監視します
    const table = this.shadowRoot.getElementById('scoreTable');
  
    table.addEventListener('keydown', (event) => {
      // 今キーボードが叩かれたセルを取得
      const currentCell = event.target;
    
      // もし入力可能なセル（editable-cell）以外での入力なら何もしない
      if (!currentCell.classList.contains('editable-cell')) return;

      // 押されたキーの名前を取得
      const key = event.key;

      if (key === 'ArrowDown' || key === 'Enter') {
        // 下に移動する処理
        event.preventDefault(); // Enterキー本来の「セル内での改行」を防ぐ
        this.moveFocus(currentCell, 1); // 1行下に移動する自作メソッド（後述）
      } 
      else if (key === 'ArrowUp') {
        // 上に移動する処理（上キーもついでに対応！）
        event.preventDefault();
        this.moveFocus(currentCell, -1); // 1行上に移動する自作メソッド（後述）
      }
    });
  }

  // フォーカスを上下に移動させるメソッド
  moveFocus(currentCell, direction) {
    // 今いるセル（td）の親（tr）を取得
    const currentRow = currentCell.parentElement;
  
    // 移動先の行（tr）を取得（direction が 1 なら次の行、-1 なら前の行）
    const targetRow = direction === 1 ? currentRow.nextElementSibling : currentRow.previousElementSibling;

    if (targetRow) {
      // 移動先の行の中から、同じ「editable-cell」クラスを持つセルを探す
      const targetCell = targetRow.querySelector('.editable-cell');
      if (targetCell) {
        targetCell.focus(); // フォーカスを当てる！
      }
    }
  }
}
// 定義名は、全て小文字(a-z)で、ハイフンが1つ以上含まれないとダメ。
customElements.define('select-input-target-view', selectInputTargetView);
