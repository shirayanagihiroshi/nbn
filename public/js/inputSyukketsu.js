import { NBNZenkaku2hankaku,
         NBNParseExcelData,
         NBNrenderTable } from './NBNHelpers.js';

export class InputSyukketsuView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // 状態管理
    this.currentUserId = null;     // ログイン中の教員ID
    this.targetNendo = null;       // 対象年度
    this.myClassInfo = null;       // 担任クラス情報（{ gakunen: 4, cls: 1 } など）
    this.allowedPeriods = {};      // 学年ごとの入力許可期間 { "4": { zenki: true, kouki: false }, ... }
    this.jugyouNissuConfig = {};   // 学年ごとの授業日数 { "4": { zenki: 100, kouki: 105 }, ... }
    this.syukketsuDataList = [];   // 生徒ごとの出欠データ一覧
    this.headerNum = 2;            // ヘッダー行数（タイトル行 + 見出し行）
  }

  connectedCallback() {
    this.currentUserId = "teacher010"; // dummy
    this._renderBaseLayout();
    this._bindEvents();
    this._loadInitialData();
  }

  /**
   * 基本レイアウトのレンダリング（成績入力画面と見た目を統一）
   */
  _renderBaseLayout() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }

        .container {
          display: flex;
          gap: 20px;
          padding: 10px;
          align-items: flex-start;
        }

        .main-content {
          flex-grow: 1;
          overflow-x: auto;
        }

        h1 { font-family: sans-serif; color: #333; margin-top: 0; margin-bottom: 5px; font-size: 20px; }
        .info-bar { margin-bottom: 15px; color: #555; font-size: 14px; font-weight: bold; }
        
        .btn-container { margin-top: 15px; margin-bottom: 10px; display: flex; gap: 10px; }
        button { 
          padding: 8px 16px; 
          cursor: pointer; 
          font-weight: bold; 
          border-radius: 4px; 
          border: 1px solid #ccc; 
        }
        #register-btn { background-color: #4CAF50; color: white; border: none; }
        #register-btn:hover { background-color: #45a049; }
        #paste-btn { background-color: #2196F3; color: white; border: none; }
        #paste-btn:hover { background-color: #0b7dda; }

        /* テーブルスタイル */
        .syukketsu-table { 
          border-collapse: collapse; 
          margin-top: 15px; 
          width: 100%; 
          box-shadow: 0 2px 5px rgba(0,0,0,0.1); 
        }
        .syukketsu-table th, .syukketsu-table td { 
          border: 1px solid #ddd; 
          padding: 8px; 
          text-align: center; 
          font-size: 13px;
        }

        /* 科目・クラスタイトル行（0行目） */
        .syukketsu-table th.table-title-cell {
          background-color: #2c3e50;
          color: white;
          font-size: 16px;
          font-weight: bold;
          text-align: left;
          padding: 10px;
        }

        /* 見出し行（1行目） */
        .syukketsu-table th {
          background-color: #f2f2f2;
          color: #333;
          font-weight: bold;
        }

        /* ==========================================
         * セル背景色（しましま ＆ 編集可/不可の掛け合わせ）
         * ========================================== */
        /* 1. 通常グループ（白グループ）：編集不能セル */
        .syukketsu-table td {
          background-color: #ffffff;
        }

        /* 2. 通常グループ（白グループ）：編集可能セル */
        .syukketsu-table td.editable-cell {
          background-color: #fffde7; /* 淡いクリーム色 */
          cursor: text;
        }

        /* 3. 縞グループ（5行ごとのグレーグループ）：編集不能セル */
        .syukketsu-table tr.stripe-group td {
          background-color: #f2f4f7; /* うすいグレー */
        }

        /* 4. 縞グループ（5行ごとのグレーグループ）：編集可能セル */
        .syukketsu-table tr.stripe-group td.editable-cell {
          background-color: #fef9c3; /* 少し濃いクリーム色 */
        }

        /* 5. 自動計算・固定値セル（グレー固定） */
        .syukketsu-table td.calc-cell {
          background-color: #e9ecef !important;
          font-weight: bold;
          color: #2c3e50;
        }

        /* 6. フォーカス（入力中）時の強調（共通） */
        .syukketsu-table .editable-cell:focus {
          outline: 2px solid #2196F3;
          background-color: #ffffff !important; /* 入力中のマスは真っ白にして視認性を高める */
        }
      </style>

      <div class="container">
        <div class="main-content">
          <h1>出欠情報入力</h1>
          <div class="info-bar" id="infoBar">データを読み込み中...</div>

          <div class="btn-container">
            <button id="paste-btn">Excelからペースト</button>
            <button id="register-btn">登録（サーバーへ保存）</button>
          </div>

          <table class="syukketsu-table" id="syukketsuTable"></table>
        </div>
      </div>
    `;
  }

  /**
   * 初期データの読み込み（担任クラス、管理設定、出欠データ）
   */
  async _loadInitialData() {
    try {
      // 1. 管理設定（年度、学年別期間、学年別授業日数）の取得
      const configRes = await fetch('/api/fetch/ks_manage');
      const config = await configRes.json();
      this.targetNendo = config.nendo;
      this.allowedPeriods = config.syukketsuPeriods;    // 例: { "4": { zenki: true, kouki: false } }
      this.jugyouNissuConfig = config.jugyouNissu;      // 例: { "4": { zenki: 100, kouki: 105 } }

      // 2. ログイン教員の担任クラス情報と生徒の出欠データを取得
      const dataRes = await fetch(`/api/fetch/syukketsu-sheet?teacherId=${this.currentUserId}&nendo=${this.targetNendo}`);
      const result = await dataRes.json();

      if (result.success && result.classInfo) {
        this.myClassInfo = result.classInfo; // { gakunen: 4, cls: 1 }
        this.syukketsuDataList = result.students || [];

        const gakunen = this.myClassInfo.gakunen;
        const cls = this.myClassInfo.cls;

        this.shadowRoot.getElementById('infoBar').innerText = 
          `【${this.targetNendo}年度】担当: ${gakunen-3}年${cls}組 | 入力可能: ${this._getPeriodLabel(gakunen)}`;

        // テーブルの描画
        this._renderSyukketsuTable();
      } else {
        this.shadowRoot.getElementById('infoBar').innerText = "担任クラス情報、または生徒名簿データが見つかりませんでした。";
      }
    } catch (err) {
      console.error("初期データの読み込みに失敗しました:", err);
      this.shadowRoot.getElementById('infoBar').innerText = "通信エラーが発生しました。";
    }
  }

  /**
   * イベントハンドラの設定
   */
  _bindEvents() {
    // 保存ボタン
    this.shadowRoot.getElementById('register-btn').addEventListener('click', () => this._saveData());

    // ペーストボタン
    this.shadowRoot.getElementById('paste-btn').addEventListener('click', async () => {
      const dialog = this._findConfirmDialog();
      if (dialog) {
        const action = await dialog.show({
          title: 'ペースト前の確認',
          message: 'クリップボードの内容を、現在表示されている入力枠に上書き貼り付けします。\nよろしいですか？',
          buttons: [{ label: 'OK', onClickFunc: 'ok' }, { label: 'キャンセル', onClickFunc: 'cancel' }]
        });
        if (action !== 'ok') return;
      }

      try {
        const pastedText = await navigator.clipboard.readText();
        if (!pastedText.trim()) return;

        const parsedMatrix = NBNParseExcelData(NBNZenkaku2hankaku(pastedText));
        this._applyPastedData(parsedMatrix);
      } catch (err) {
        console.error("クリップボード読み込み失敗:", err);
      }
    });

    // セル直接編集時の動的計算（inputイベント）
    const tableEl = this.shadowRoot.getElementById('syukketsuTable');
    tableEl.addEventListener('input', (e) => {
      if (e.target.tagName === 'TD' && e.target.isContentEditable) {
        this._recalculateRow(e.target.parentElement);
      }
    });

    // キーボード操作（上下左右・Enter移動）の追加
    const table = this.shadowRoot.getElementById('syukketsuTable');
    table.addEventListener('keydown', (event) => {
      const currentCell = event.target;
      if (!currentCell.classList.contains('editable-cell')) return;

      const key = event.key;
      if (key === 'ArrowDown' || key === 'Enter') {
        event.preventDefault();
        this._moveFocus(currentCell, 1);
      } else if (key === 'ArrowUp') {
        event.preventDefault();
        this._moveFocus(currentCell, -1);
      } else if (key === 'ArrowRight') {
        if (this._isCaretAtEnd(currentCell)) {
          // 🚀 改善: 右側の編集可能セルを探索して移動
          let nextCell = currentCell.nextElementSibling;
          while (nextCell && !nextCell.classList.contains('editable-cell')) {
            nextCell = nextCell.nextElementSibling;
          }
          if (nextCell && nextCell.classList.contains('editable-cell')) {
            event.preventDefault();
            nextCell.focus();
          }
        }
      } else if (key === 'ArrowLeft') {
        if (this._isCaretAtStart(currentCell)) {
          // 🚀 改善: 左側の編集可能セルを探索して移動
          let prevCell = currentCell.previousElementSibling;
          while (prevCell && !prevCell.classList.contains('editable-cell')) {
            prevCell = prevCell.previousElementSibling;
          }
          if (prevCell && prevCell.classList.contains('editable-cell')) {
            event.preventDefault();
            prevCell.focus();
            this._moveCaretToEnd(prevCell);
          }
        }
      }
    });
  }

  /**
   * 出欠テーブルの描画
   */
  _renderSyukketsuTable() {
    if (!this.myClassInfo) return;

    const gakunen = this.myClassInfo.gakunen;
    const periodConfig = this.allowedPeriods?.[gakunen] || { zenki: false, kouki: false };
    const jugyouNissu = this.jugyouNissuConfig?.[gakunen] || { zenki: 0, kouki: 0 };

    // 1. Matrix（2次元配列）の構築
    const matrix = [];

    // 0行目: タイトル行
    matrix.push([`クラス出欠入力表 (${gakunen-3}年${this.myClassInfo.cls}組)`]);

    // 1行目: ヘッダー見出し（全18列）
    matrix.push([
      '出席番号', '氏名', 
      '前期 授業日数', '前期 停・忌等', '前期 留学', '前期 要出席日数', '前期 欠席', '前期 出席日数', '前期 遅刻', '前期 早退',
      '後期 授業日数', '後期 停・忌等', '後期 留学', '後期 要出席日数', '後期 欠席', '後期 出席日数', '後期 遅刻', '後期 早退'
    ]);

    // 2行目以降: 生徒データ行
    this.syukketsuDataList.forEach(s => {
      const z = s.zenki || {};
      const k = s.kouki || {};

      // 前期の計算
      const zTeishi = Number(z.syussekiTeishi) || 0;
      const zRyuugaku = Number(z.ryuugaku) || 0;
      const zKesseki = Number(z.kesseki) || 0;
      const zYouSyusseki = jugyouNissu.zenki - zTeishi - zRyuugaku; // 出席しなければならない日数
      const zSyusseki = zYouSyusseki - zKesseki;                   // 出席日数

      // 後期の計算
      const kTeishi = Number(k.syussekiTeishi) || 0;
      const kRyuugaku = Number(k.ryuugaku) || 0;
      const kKesseki = Number(k.kesseki) || 0;
      const kYouSyusseki = jugyouNissu.kouki - kTeishi - kRyuugaku;
      const kSyusseki = kYouSyusseki - kKesseki;

      matrix.push([
        s.bangou, s.studentName,
        jugyouNissu.zenki, z.syussekiTeishi ?? '', z.ryuugaku ?? '', zYouSyusseki, z.kesseki ?? '', zSyusseki, z.chikoku ?? '', z.soutai ?? '',
        jugyouNissu.kouki, k.syussekiTeishi ?? '', k.ryuugaku ?? '', kYouSyusseki, k.kesseki ?? '', kSyusseki, k.chikoku ?? '', k.soutai ?? ''
      ]);
    });

    // 2. NBNrenderTable で描画
    const tableObj = this.shadowRoot.getElementById('syukketsuTable');
    tableObj.innerHTML = NBNrenderTable(matrix, (rowIndex, colIndex, value) => {

      // 行（tr）単位のしましま指定（5行単位）
      if (colIndex === -1) {
        if (rowIndex < this.headerNum) return { rowClassName: '' };
        const studentIndex = rowIndex - this.headerNum;
        return { rowClassName: Math.floor(studentIndex / 5) % 2 === 1 ? 'stripe-group' : '' };
      }

      // 0行目: タイトル
      if (rowIndex === 0) {
        return { isHeader: true, isEditable: false, colspan: 18, className: 'table-title-cell' };
      }

      // 1行目: 見出し
      if (rowIndex === 1) {
        return { isHeader: true, isEditable: false };
      }

      // 2行目以降: 列ごとの編集権限とスタイルの設定
      let canEdit = false;
      let isCalcCell = false;

      // 前期入力権限 (列 3, 4, 6, 8, 9 が入力対象)
      if (periodConfig.zenki) {
        if (colIndex === 3 || colIndex === 4 || colIndex === 6 || colIndex === 8 || colIndex === 9) canEdit = true;
      }

      // 後期入力権限 (列 11, 12, 14, 16, 17 が入力対象)
      if (periodConfig.kouki) {
        if (colIndex === 11 || colIndex === 12 || colIndex === 14 || colIndex === 16 || colIndex === 17) canEdit = true;
      }

      // 自動計算・固定値セル (授業日数, 要出席日数, 出席日数)
      if ([2, 5, 7, 10, 13, 15].includes(colIndex)) {
        isCalcCell = true;
      }

      return {
        isEditable: canEdit,
        className: isCalcCell ? 'calc-cell' : ''
      };
    });
  }

  /**
   * セル編集時に、その行の「要出席日数」と「出席日数」を動的に再計算する
   */
  _recalculateRow(trEl) {
    const gakunen = this.myClassInfo.gakunen;
    const jugyouNissu = this.jugyouNissuConfig?.[gakunen] || { zenki: 0, kouki: 0 };
    const cells = trEl.querySelectorAll('td');

    if (cells.length < 18) return;

    // 前期の再計算
    const zTeishi = Number(cells[3].innerText) || 0;
    const zRyuugaku = Number(cells[4].innerText) || 0;
    const zKesseki = Number(cells[6].innerText) || 0;
    const zYouSyusseki = jugyouNissu.zenki - zTeishi - zRyuugaku;
    const zSyusseki = zYouSyusseki - zKesseki;

    cells[5].innerText = zYouSyusseki;
    cells[7].innerText = zSyusseki;

    // 後期の再計算
    const kTeishi = Number(cells[11].innerText) || 0;
    const kRyuugaku = Number(cells[12].innerText) || 0;
    const kKesseki = Number(cells[14].innerText) || 0;
    const kYouSyusseki = jugyouNissu.kouki - kTeishi - kRyuugaku;
    const kSyusseki = kYouSyusseki - kKesseki;

    cells[13].innerText = kYouSyusseki;
    cells[15].innerText = kSyusseki;
  }

  /**
   * Excelペーストデータの適用
   */
  _applyPastedData(parsedMatrix) {
    const tableEl = this.shadowRoot.getElementById('syukketsuTable');
    const rows = tableEl.querySelectorAll('tr');

    parsedMatrix.forEach((pRow, pRowIdx) => {
      const targetRowIdx = pRowIdx + this.headerNum;
      if (targetRowIdx >= rows.length) return;

      const cells = rows[targetRowIdx].querySelectorAll('td, th');

      // 編集可能セル（editable-cell）のみ順番に値を流し込む
      let pColIdx = 0;
      cells.forEach(cell => {
        if (cell.classList.contains('editable-cell') && pColIdx < pRow.length) {
          cell.innerText = pRow[pColIdx];
          pColIdx++;
        }
      });

      // 行全体の再計算を実行
      this._recalculateRow(rows[targetRowIdx]);
    });
  }

  /**
   * サーバーへのデータ保存処理
   */
  async _saveData() {
    const tableEl = this.shadowRoot.getElementById('syukketsuTable');
    const trList = Array.from(tableEl.querySelectorAll('tr')).slice(this.headerNum);

    const payloadStudents = trList.map((tr, index) => {
      const cells = tr.querySelectorAll('td');
      const originalStudent = this.syukketsuDataList[index];

      return {
        studentId: originalStudent.studentId,
        bangou: Number(cells[0].innerText),
        studentName: cells[1].innerText,
        zenki: {
          syussekiTeishi: cells[3].innerText,
          ryuugaku: cells[4].innerText,
          kesseki: cells[6].innerText,
          chikoku: cells[8].innerText,
          soutai: cells[9].innerText,
        },
        kouki: {
          syussekiTeishi: cells[11].innerText,
          ryuugaku: cells[12].innerText,
          kesseki: cells[14].innerText,
          chikoku: cells[16].innerText,
          soutai: cells[17].innerText,
        }
      };
    });

    const dialog = this._findConfirmDialog();

    try {
      const res = await fetch('/api/save/syukketsu-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nendo: this.targetNendo,
          gakunen: this.myClassInfo.gakunen,
          cls: this.myClassInfo.cls,
          students: payloadStudents
        })
      });

      const resData = await res.json();
      if (resData.success) {
        if (dialog) await dialog.show({ title: '完了', message: '出欠データを正常に保存しました。', buttons: [{ label: 'OK', onClickFunc: 'ok' }] });
      } else {
        throw new Error(resData.message || '保存エラー');
      }
    } catch (err) {
      console.error("保存失敗:", err);
      if (dialog) await dialog.show({ title: 'エラー', message: '保存に失敗しました。', buttons: [{ label: 'OK', onClickFunc: 'ok' }] });
    }
  }

  _getPeriodLabel(gakunen) {
    const config = this.allowedPeriods?.[gakunen];
    if (!config) return "期間外";
    const active = [];
    if (config.zenki) active.push("前期");
    if (config.kouki) active.push("後期");
    return active.length > 0 ? active.join("・") + "出欠入力可" : "出欠入力期間外";
  }

  _findConfirmDialog() {
    return document.querySelector('confirm-dialog') || this.shadowRoot.querySelector('confirm-dialog');
  }

  // キー操作関数群 ///////////////////////////////////////////////////////////////////////////////////
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

customElements.define('input-syukketsu-view', InputSyukketsuView);