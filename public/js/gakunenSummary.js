import {
  NBNconbineMatrixHorizon,
  NBNconbineMatrixVertical,
  NBNrenderTable,
  NBNGetGakunenList 
} from './NBNHelpers.js';

/*
 * gakunenSummary.js
 * 学年ごとの成績・出欠・総単位数一覧を表示する
 */

class gakunenSummaryView extends HTMLElement {

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 16px;
          font-family: sans-serif;
        }
        .controls {
          margin-bottom: 16px;
        }
        .controls select, .controls button {
          font-size: 14px;
          padding: 4px 8px;
          margin-right: 8px;
        }
        table {
          border-collapse: collapse;
          width: 100%;
          font-size: 13px;
        }
        th, td {
          border: 1px solid #ccc;
          padding: 6px 8px;
          text-align: center;
          white-space: nowrap;
        }
        th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #fafafa;
        }
        .text-left {
          text-align: left;
        }
        .header-basic { background-color: #e6e6e6; }
        .header-kamoku { background-color: #e6f3ff; }
        .header-syukketsu { background-color: #fff0f0; }
        .header-tani { background-color: #e6ffe6; }
      </style>
      <h1>学年毎の一覧</h1>
      <div class="controls">
        表示対象：
        <select id="targetGakunen"></select>
        学期：
        <select id="targetGakki">
          <option value="zenki" selected>前期</option>
          <option value="kouki">後期</option>
          <option value="tsunen">通年</option>
        </select>
        <button id="show-btn">表示</button>
      </div>
      <div id="tableContainer">
        <table id="summaryTable"></table>
      </div>
    `;

    this.targetNendo = new Date().getFullYear();
  }

  connectedCallback() {
    console.log("gakunenSummaryView connectedCallback");

    const gakunenList = this.shadowRoot.getElementById('targetGakunen');
    gakunenList.innerHTML = NBNGetGakunenList();

    const btn = this.shadowRoot.getElementById('show-btn');
    btn.addEventListener('click', () => this._fetchAndRenderData());
  }

  async _fetchAndRenderData() {
    const gakunenSelect = this.shadowRoot.getElementById('targetGakunen');
    const gakkiSelect = this.shadowRoot.getElementById('targetGakki');
    
    const targetGakunen = gakunenSelect.value;
    const targetGakki = gakkiSelect.value; // 'zenki' | 'kouki' | 'tsunen'

    try {
      const res = await fetch(`/api/fetch/gakunen-summary?nendo=${this.targetNendo}&gakunen=${targetGakunen}&gakki=${targetGakki}`);
      const data = await res.json();

      if (!data.success) {
        alert(data.message || 'データ取得に失敗しました。');
        return;
      }

      // 二次元配列（マトリクス）の組み立て
      const matrix = this._createMatrix(data.kamokuHeader, data.students, targetGakki);

      // NBNrenderTable で描画
      const tableHtml = NBNrenderTable(matrix, (rowIndex, colIndex, value) => {
        if (rowIndex === 0) {
          return { isHeader: true };
        }
        if (colIndex === 2) {
          return { isHeader: false, className: 'text-left' };
        }
        return { isHeader: false };
      });

      const tableEl = this.shadowRoot.getElementById('summaryTable');
      tableEl.outerHTML = tableHtml;
      const newTable = this.shadowRoot.querySelector('table');
      if (newTable) newTable.id = 'summaryTable';

    } catch (err) {
      console.error('一覧表示エラー:', err);
      alert('通信エラーが発生しました。');
    }
  }

  /**
   * 学期（前期/後期/通年）に応じた二次元配列を作成する
   */
  _createMatrix(kamokuHeader, students, gakki) {
    // --------------------------------------------------
    // 1. 基本情報列 (組, 番号, 氏名)
    // --------------------------------------------------
    const basicHeader = ['組', '番号', '氏名'];
    const basicRows = students.map(s => [
      String(s.cls),
      String(s.bangou),
      s.studentName || ''
    ]);
    let basicMatrix = NBNconbineMatrixVertical([basicHeader], basicRows);

    // --------------------------------------------------
    // 2. 成績列 (科目ごとの評価・欠課)
    // --------------------------------------------------
    const seisekiHeader = [];
    kamokuHeader.forEach(k => {
      if (gakki === 'tsunen') {
        seisekiHeader.push(`${k.kamokuName}\n5段階`);
      } else {
        // 前期・後期のときは観点別・10段階評価・欠課時数
        seisekiHeader.push(`${k.kamokuName}\n観点`);
        seisekiHeader.push(`${k.kamokuName}\n評価`);
        seisekiHeader.push(`${k.kamokuName}\n欠課`);
      }
    });

    const seisekiRows = students.map(s => {
      const row = [];
      kamokuHeader.forEach(k => {
        const score = s.seisekiMap ? s.seisekiMap[k.kamokuId] : null;

        if (gakki === 'tsunen') {
          // 通年：5段階評定 (tsunen.hyoutei)
          row.push(score?.tsunen?.hyoutei ?? '-');
        } else {
          // 前期・後期：観点配列, 10段階評価, 欠課(kekka)
          const gData = score ? score[gakki] : null;
          const kantenStr = gData?.kanten ? gData.kanten.join('') : '';
          const hyouka = gData?.hyouka ?? '';
          const kekka = gData?.kekka ?? '';

          row.push(kantenStr, hyouka, kekka);
        }
      });
      return row;
    });
    let seisekiMatrix = NBNconbineMatrixVertical([seisekiHeader], seisekiRows);

    // --------------------------------------------------
    // 3. 出欠列
    // --------------------------------------------------
    const syukketsuHeader = [
      '出席すべき日数',
      '出停・忌引等',
      '留学授業日数',
      '要出席日数',
      '欠席日数',
      '出席日数',
      '遅刻',
      '早退'
    ];

    const syukketsuRows = students.map(s => {
      const z = s.syukketsu?.zenki || {};
      const k = s.syukketsu?.kouki || {};

      // 通年の場合は前後期の合計を計算するヘルパー
      const getVal = (field) => {
        if (gakki === 'zenki') return z[field] ?? '';
        if (gakki === 'kouki') return k[field] ?? '';
        
        // 通年（合計）
        const valZ = Number(z[field]) || 0;
        const valK = Number(k[field]) || 0;
        // 両方とも未入力（null/undefined）なら空文字を返す
        if (z[field] == null && k[field] == null) return '';
        return valZ + valK;
      };

      return [
        getVal('syussekiSubeki'),  // 出席すべき日数
        getVal('syussekiTeishi'),  // 出停・忌引等
        getVal('ryuugaku'),        // 留学授業日数
        getVal('youSyusseki'),     // 出席しなければならない日数(要出席)
        getVal('kesseki'),         // 欠席日数
        getVal('syusseki'),        // 出席日数
        getVal('chikoku'),         // 遅刻
        getVal('soutai')           // 早退
      ];
    });
    let syukketsuMatrix = NBNconbineMatrixVertical([syukketsuHeader], syukketsuRows);

    // --------------------------------------------------
    // 4. 総単位数列
    // --------------------------------------------------
    const taniHeader = ['単位数'];
    const taniRows = students.map(s => [
      `${s.inputTani ?? 0} / ${s.totalTani ?? 0}`
    ]);
    let taniMatrix = NBNconbineMatrixVertical([taniHeader], taniRows);

    // --------------------------------------------------
    // 5. NBNconbineMatrixHorizon で横に一括結合
    // --------------------------------------------------
    let combined = NBNconbineMatrixHorizon(basicMatrix, seisekiMatrix);
    combined = NBNconbineMatrixHorizon(combined, syukketsuMatrix);
    combined = NBNconbineMatrixHorizon(combined, taniMatrix);

    return combined;
  }

}

customElements.define('gakunen-summary-view', gakunenSummaryView);
