import {
  NBNZenkaku2hankaku,
  NBNParseExcelData,
  NBNconbineMatrixHorizon,
  NBNconbineMatrixVertical,
  NBNextracteMatrix,
  NBNrenderTable,
  NBNGetYearsList } from './NBNHelpers.js';

/*
 * registerTantou.js
 * 科目に対して、教科担当の教員、単位の登録をする。
 */

class registerTantouView extends HTMLElement {

  
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._sortedKamokuList = null;
    this._matrix = null;
    this.tableHeader = [['年度', '科目ID', '科目名', '学年', '前期', '後期', '5段階', 'sortNo']];
    this.shadowRoot.innerHTML = `
      <style>
      </style>
      <h1>科目に対して担当教員と単位を登録する</h1>
      <p>手順その2。手順その1で登録した科目たちに対して設定を行う。</p>
      <p>登録対象年度：<select id="targetNendo"></select>
        登録対象学年：
        <select id="targetGakunen">
          <option value="4">高校1年</option> // 中1:1, 中2:2, 中3:3, 高1:4, 高2:5, 高3:6 とする
          <option value="5">高校2年</option>
          <option value="6">高校3年</option>
        </select>
      </p>
      <button id="paste-btn-tantou">ペースト(担当)</button>
      <button id="paste-btn-tanni">ペースト(単位)</button>
      <button id="register-btn">登録</button>

      <table id="kamokuTantouTable" border="1px">
      </table>
      <table id="kamokuTanniTable" border="1px">
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

    const gakunenObj = this.shadowRoot.getElementById('targetGakunen');

    nendoObj.addEventListener('change', (event) => {
      const nendo = parseInt(nendoObj.value);
      const gakunen = parseInt(gakunenObj.value);
      
      this._AddTableHeader(nendo, gakunen);
    });

    gakunenObj.addEventListener('change', (event) => {
      const nendo = parseInt(nendoObj.value);
      const gakunen = parseInt(gakunenObj.value);
      
      this._AddTableHeader(nendo, gakunen);
    });

  }

  // テーブルにヘッダを追記
  async _AddTableHeader(nendo, gakunen){
    const url = '/api/fetch/ks_kamoku?nendo=' + String(nendo) + '&gakunen=' + String(gakunen);

    try {
      // fetchの実行
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json' // JSONを送ることを明示
        }
      });

      // レスポンスを解析
      const data = await response.json();
//      console.log("通信後:", data)

      // sortNoの順に並び替えたオブジェクトの配列を保持
      this._sortedKamokuList = data.contents.sort((a, b) => {
        return a.sortNo - b.sortNo; // 昇順（小さい順）に並び替え
      });

      // オブジェクトの配列から値の配列へ
      const kamokuNamelist = this._sortedKamokuList.map(kamoku => kamoku.kamokuName);

      const objTantou = this.shadowRoot.getElementById('kamokuTantouTable');
      objTantou.innerHTML = NBNrenderTable( [kamokuNamelist] ); // 配列をさらに配列にして2次元配列へ

      const objTanni = this.shadowRoot.getElementById('kamokuTanniTable');
      objTanni.innerHTML = NBNrenderTable( [kamokuNamelist] );


    } catch (error) {
      // 通信エラー（サーバーダウン、オフラインなど）の処理
      console.error('通信に失敗しました', error);
    }

  }

    
  // 登録処理
  async _register(matrix) {
  }


}
// 定義名は、全て小文字(a-z)で、ハイフンが1つ以上含まれないとダメ。
customElements.define('register-tantou-view', registerTantouView);
