import {
  NBNZenkaku2hankaku,
  NBNParseExcelData,
  NBNconbineMatrixHorizon,
  NBNconbineMatrixVertical,
  NBNextracteMatrix,
  NBNrenderTable } from './NBNHelpers.js';

/*
 * registerKamoku.js
 * 科目の登録をする。
 */

class registerKamokuView extends HTMLElement {

  
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._matrix = null;
    this.tableHeader = [['年度', '科目ID', '科目名', '学年', '前期', '後期', '5段階', 'sortNo']];
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
      <h1>科目登録画面</h1><p>年度に1回科目を登録する。登録する情報は後の科目毎の担当や名簿情報で用いる。</p>
      <button id="paste-btn">ペースト</button>
      <button id="register-btn">登録</button>

      <table class="kamoku" id="kamokuTable">
      </table>
                                `;
  }

  /**
   * カスタム要素がページに追加されたときに呼ばれるコールバック
   */
  connectedCallback() {
    console.log("registerKamokuView connectedCallback");

    // 最初にヘッダーだけは表示
    const obj = this.shadowRoot.getElementById('kamokuTable');
    obj.innerHTML = NBNrenderTable( this.tableHeader );

    let pastebtn = this.shadowRoot.getElementById('paste-btn');
    pastebtn.addEventListener('click', async () => {
      try {
        // クリップボードからテキストを読み取る（ブラウザが許可を求めるポップアップを出します）
        const pastedText = await navigator.clipboard.readText();
 
        const obj = this.shadowRoot.getElementById('kamokuTable');

        this._matrix = NBNParseExcelData( NBNZenkaku2hankaku(pastedText));
        // ヘッダーと入力表をつけて表示
        obj.innerHTML = NBNrenderTable( NBNconbineMatrixVertical(this.tableHeader, this._matrix));

      } catch (err) {
        console.error("クリップボードの読み込みに失敗しました（権限が拒否されたなど）:", err);
      }
    });

    const registerbtn = this.shadowRoot.getElementById('register-btn');
    registerbtn.addEventListener('click', async () => {
      try {
        this._register(this._matrix);
      } catch (err) {
        console.error("登録に失敗しました（権限が拒否されたなど）:", err);
      }
    });
  }

  // フォーカスを上下に移動させるメソッド
  _register(matrix) {
    if (!matrix || matrix.length === 0) {
      return;
    }

    // 配列の配列（二次元配列）を、オブジェクトの配列へ「写像（マッピング）」する
    // matrixの中身: [['2026', 'M1', '数学Ⅰ', ...], ['2026', 'MA', '数学A', ...]]
    const kamokuList = matrix.map(row => {

      // 事前に安全にトリムした文字列を取得（データがない場合は空文字）
      const getRawStr = (idx) => (row[idx] ? String(row[idx]).trim() : '');

      return {
        // 数値への変換（Number()を使用。変換できない文字は 0 または null に安全に倒す）
        nendo:      getRawStr(0) ? Number(getRawStr(0)) : null, 
        kamokuId:   getRawStr(1), // 文字列のまま
        kamokuName: getRawStr(2), // 文字列のまま
        gakunen:    getRawStr(3) ? Number(getRawStr(3)) : null, 
        // 真偽値への変換（"1" なら true、それ以外はすべて false）
        zenki:      getRawStr(4) == '1', 
        kouki:      getRawStr(5) == '1', 
        godankai:   getRawStr(6) == '1', 
        // 数値への変換
        sortNo:     getRawStr(7) ? Number(getRawStr(7)) : null
      };
    });

    console.log("変換後のオブジェクト配列:", kamokuList)
  }


}
// 定義名は、全て小文字(a-z)で、ハイフンが1つ以上含まれないとダメ。
customElements.define('register-kamoku-view', registerKamokuView);
