import {
  NBNZenkaku2hankaku,
  NBNParseExcelData,
  NBNconbineMatrixHorizon,
  NBNconbineMatrixVertical,
  NBNextracteMatrix,
  NBNrenderTable } from './NBNHelpers.js';

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

    const matrixA = [
  [2, 1, '田中'], // 1行目
  [2, 2, '佐藤'], // 2行目
  [2, 3, '鈴木']  // 3行目
];

    const matrixB = [
  [10, 20, 30, 40, 50, 60], // 1行目
  [11, 21, 31, 41, 51, 61], // 2行目
  [12, 22, 32, 42, 52, 62], // 3行目
  [13, 23, 33, 43, 53, 63]  // 3行目
];
    const conbined = NBNextracteMatrix(matrixB, 1, 3, 5);
    console.log(conbined);
    
    let pastebtn = this.shadowRoot.getElementById('paste-btn');
      pastebtn.addEventListener('click', async () => {
        try {
          // クリップボードからテキストを読み取る（ブラウザが許可を求めるポップアップを出します）
          const pastedText = await navigator.clipboard.readText();
 
          const obj = this.shadowRoot.getElementById('scoreTable');
          obj.innerHTML = NBNrenderTable( NBNParseExcelData( NBNZenkaku2hankaku(pastedText)),(rowIndex, colIndex, value) => {
            if (colIndex >= 2) {
              return { isEditable : true };
            } else {
              return { isEditable : false };
            }
          });

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
        this._moveFocus(currentCell, 1); // 1行下に移動する自作メソッド（後述）
      } 
      else if (key === 'ArrowUp') {
        // 上に移動する処理（上キーもついでに対応！）
        event.preventDefault();
        this._moveFocus(currentCell, -1); // 1行上に移動する自作メソッド（後述）
      }
      else if (key === 'ArrowRight') {
        if (this._isCaretAtEnd(currentCell)) {
          const nextCell = currentCell.nextElementSibling;
          if (nextCell && nextCell.classList.contains('editable-cell')) {
            event.preventDefault(); // セル移動するので、ブラウザ本来の右移動を止める
            nextCell.focus();
          }
        }
      }
      else if (key === 'ArrowLeft') {
        if (this._isCaretAtStart(currentCell)) {
          const prevCell = currentCell.previousElementSibling;
          if (prevCell && prevCell.classList.contains('editable-cell')) {
            event.preventDefault();
            prevCell.focus();

            // 補足：左のセルに移動した際、カーソルをそのセルの「一番後ろ」に持って行くおまけ処理
            this._moveCaretToEnd(prevCell);
          }
        }
      }
    });
  }

  // フォーカスを上下に移動させるメソッド
  _moveFocus(currentCell, direction) {
    // 1.今いる行（tr）を取得
    const currentRow = currentCell.parentElement;

    // 今いるセルが、行の中で「何番目のマス（td）か」のインデックス番号を取得する
    const currentCellIndex = Array.from(currentRow.children).indexOf(currentCell);

    // 2. 移動先の行（tr）を取得（1なら次の行、-1なら前の行）
    const targetRow = direction === 1 ? currentRow.nextElementSibling : currentRow.previousElementSibling;

    if (targetRow) {
      // 移動先の行の「子供たち（全td）」の中から、さっき覚えたのと同じ番号のマスをピンポイントで指名する
      const targetCell = targetRow.children[currentCellIndex];

      // 指名したマスが存在し、かつそれが編集可能なマス（editable-cell）であればフォーカスを当てる
      if (targetCell && targetCell.classList.contains('editable-cell')) {
        targetCell.focus();
      }
    }
  }

  // 今のカーソル（キャレット）がセルの「一番右端（末尾）」にあるかチェックする
  _isCaretAtEnd(element) {
    const selection = this.shadowRoot.getSelection();
    if (selection.rangeCount === 0) return false;

    // 今のカーソル位置（オフセット番号）を取得
    const offset = selection.focusOffset;
    // セルの中に入っている文字の全体の長さを取得
    const textLength = element.textContent.length;

    // カーソル位置が文字数と同じなら「右端にいる」と判定
    return offset === textLength;
  }

  // 今のカーソル（キャレット）がセルの「一番左端（先頭）」にあるかチェックする
  _isCaretAtStart(element) {
    const selection = this.shadowRoot.getSelection();
    if (selection.rangeCount === 0) return false;

    // カーソル位置が 0 なら「左端にいる」と判定
    return selection.focusOffset === 0;
  }

  // 左のセルに戻ったときに、カーソルを文字の最後に回り込ませる親切処理
  _moveCaretToEnd(element) {
    const range = document.createRange();
    const selection = this.shadowRoot.getSelection();
    range.selectNodeContents(element);
    range.collapse(false); // falseにすると末尾、trueにすると先頭に吸着
    selection.removeAllRanges();
    selection.addRange(range);
  }
}
// 定義名は、全て小文字(a-z)で、ハイフンが1つ以上含まれないとダメ。
customElements.define('select-input-target-view', selectInputTargetView);
