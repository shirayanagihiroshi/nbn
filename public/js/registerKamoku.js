import {
  NBNZenkaku2hankaku,
  NBNParseExcelData,
  NBNconbineMatrixHorizon,
  NBNconbineMatrixVertical,
  NBNextracteMatrix,
  NBNrenderTable,
  NBNGetYearsList } from './NBNHelpers.js';

/*
 * registerKamoku.js
 * 科目の登録をする。
 */

class registerKamokuView extends HTMLElement {

  
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._matrix = null; //下記のヘッダー以外のデータ部を保持
    this._tableHeader = [['科目ID', '科目名', '学年', '前期', '後期', '5段階', 'sortNo']];
    this.shadowRoot.innerHTML = `
      <style>
      </style>
      <h1>科目を登録する</h1>
      <p>ユーザが入力する準備の手順その1。登録対象年度を選び、内容をペーストする。</p>
      <p>学年は中1:1, 中2:2, 中3:3, 高1:4, 高2:5, 高3:6 とする</p>
      <p>前期、後期、5段階は入力が必要なところには1、そうでなければ0を入力すること。</p>
      <p>登録すると、DBのks_kamokuコレクションの該当年度のデータをすべて削除してからペーストしたデータを保存する。</p>
      <p>登録対象年度：<select id="targetNendo"></select></p>
      <button id="paste-btn">ペースト</button>
      <button id="register-btn">登録</button>

      <table id="kamokuTable" border="1px">
      </table>
                                `;
  }

  /**
   * カスタム要素がページに追加されたときに呼ばれるコールバック
   */
  async connectedCallback() {
    console.log("registerKamokuView connectedCallback");

    const nendoObj = this.shadowRoot.getElementById('targetNendo');
    nendoObj.innerHTML = NBNGetYearsList();

    // 最初にヘッダーだけは表示
    const tableObj = this.shadowRoot.getElementById('kamokuTable');
    tableObj.innerHTML = NBNrenderTable( this._tableHeader );

    const pastebtn = this.shadowRoot.getElementById('paste-btn');
    pastebtn.addEventListener('click', async () => {
      try {
        // クリップボードからテキストを読み取る（ブラウザが許可を求めるポップアップを出します）
        const pastedText = await navigator.clipboard.readText();
 
        this._matrix = NBNParseExcelData( NBNZenkaku2hankaku(pastedText));
        // ヘッダーと入力表をつけて表示
        tableObj.innerHTML = NBNrenderTable( NBNconbineMatrixVertical(this._tableHeader, this._matrix));

      } catch (err) {
        console.error("クリップボードの読み込みに失敗しました（権限が拒否されたなど）:", err);
      }
    });

    const registerbtn = this.shadowRoot.getElementById('register-btn');
    registerbtn.addEventListener('click', async () => {
      try {
        const nendo = this.shadowRoot.getElementById('targetNendo');
        this._register(parseInt(nendo.value), this._matrix);
      } catch (err) {
        console.error("登録に失敗しました（権限が拒否されたなど）:", err);
      }
    });
  }

  // 登録処理
  async _register(nendo, matrix) {
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
        nendo:      nendo,
        kamokuId:   getRawStr(0), // 文字列のまま
        kamokuName: getRawStr(1), // 文字列のまま
        gakunen:    getRawStr(2) ? Number(getRawStr(2)) : null, 
        // 真偽値への変換（"1" なら true、それ以外はすべて false）
        zenki:      getRawStr(3) == '1', 
        kouki:      getRawStr(4) == '1', 
        godankai:   getRawStr(5) == '1', 
        // 数値への変換
        sortNo:     getRawStr(6) ? Number(getRawStr(6)) : null
      };
    });

    try {
      // fetchの実行
      const response = await fetch('/api/store/ks_kamoku', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json' // JSONを送ることを明示
        },
        body: JSON.stringify({ nendo    : nendo, // kamokuListにもnendoはあるが、この年度のデータを全て削除してから登録するので分かりやすく渡す。
                               contents : kamokuList
                             })
      });

      // レスポンスを解析
      const data = await response.json();
      console.log("通信後:", data)

    } catch (error) {
      // 通信エラー（サーバーダウン、オフラインなど）の処理
      console.error('通信に失敗しました', error);
    }
  }

}
// 定義名は、全て小文字(a-z)で、ハイフンが1つ以上含まれないとダメ。
customElements.define('register-kamoku-view', registerKamokuView);
