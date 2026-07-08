import {
  NBNZenkaku2hankaku,
  NBNParseExcelData,
  NBNconbineMatrixHorizon,
  NBNconbineMatrixVertical,
  NBNextracteMatrix,
  NBNrenderTable } from './NBNHelpers.js';

class inputSeisekiView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }

        /* 左右分割のレイアウト */
        .container {
          display: flex;
          gap: 20px;
          padding: 10px;
          align-items: flex-start; /* 左メニューと右テーブルの上が揃うように */
        }

        /* 左：科目リストのスタイル */
        .sidebar {
          width: 220px;
          flex-shrink: 0;
          border-right: 2px solid #ccc;
          padding-right: 15px;
        }
        .sidebar h3 {
          margin-top: 0;
          font-size: 16px;
          border-bottom: 2px solid #333;
          padding-bottom: 5px;
        }
        .kamoku-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .kamoku-item {
          padding: 10px 12px;
          margin-bottom: 8px;
          background-color: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .kamoku-item:hover {
          background-color: #e0e0e0;
        }
        /* 選択中の科目を強調表示 */
        .kamoku-item.selected {
          background-color: #007bff;
          color: white;
          font-weight: bold;
          border-color: #0056b3;
        }

        /* 右：成績テーブル表示エリア */
        .main-content {
          flex-grow: 1;
          overflow-x: auto;
        }

        h1 { font-family: sans-serif; color: #333; margin-top: 0; margin-bottom: 5px; }
        .info-bar { margin-bottom: 15px; color: #555; font-size: 14px; }
        .seiseki { border-collapse: collapse; margin-top: 15px; width: 100%; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .seiseki th, .seiseki td { border: 1px solid #ddd; padding: 8px; text-align: center; }

        /* 科目タイトル行（0行目） */
        .seiseki th.table-title-cell {
          background-color: #2c3e50;
          color: white;
          font-size: 16px;
          font-weight: bold;
          text-align: left;
          padding: 10px;
        }
        /* ==========================================
         * セル背景色（しましま ＆ 編集可/不可の掛け合わせ）
         * ========================================== */
        /* 1. 通常グループ（白グループ）：編集不能セル */
        .seiseki td {
          background-color: #ffffff;
        }
        /* 2. 通常グループ（白グループ）：編集可能セル */
        .seiseki td.editable-cell {
          background-color: #fffde7; /* 淡いクリーム色 */
          cursor: text;
        }
        /* 3. 縞グループ（5行ごとのグレーグループ）：編集不能セル */
        .seiseki tr.stripe-group td {
          background-color: #f2f4f7; /* うすいグレー */
        }
        /* 4. 縞グループ（5行ごとのグレーグループ）：編集可能セル */
        .seiseki tr.stripe-group td.editable-cell {
          background-color: #fef9c3; /* 少し濃いクリーム色 */
        }
        /* 5. フォーカス（入力中）時の強調（共通） */
        .seiseki .editable-cell:focus {
          outline: 2px solid #2196F3;
          background-color: #ffffff !important; /* 入力中のマスは真っ白にして視認性を高める */
        }

        .btn-container { margin-top: 15px; }
        button { padding: 8px 16px; cursor: pointer; font-weight: bold; border-radius: 4px; border: 1px solid #ccc; margin-right: 10px; }
        #register-btn { background-color: #4CAF50; color: white; border: none; }
        #register-btn:hover { background-color: #45a049; }
        #paste-btn { background-color: #2196F3; color: white; border: none; }
        #paste-btn:hover { background-color: #0b7dda; }
      </style>
      <div class="container">
        <div class="sidebar">
          <h3>担当科目一覧</h3>
          <ul id="kamokuList" class="kamoku-list"></ul>
        </div>

        <div class="main-content">
          <h1>成績入力画面</h1>
          <div class="info-bar" id="infoBar">データを読み込み中...</div>
          <div class="btn-container">
            <button id="paste-btn">Excelからペースト</button>
            <button id="register-btn">登録（サーバーへ保存）</button>
          </div>
          <table class="seiseki" id="scoreTable"></table>
        </div>
      </div>
    `;

    // 内部で管理する状態
    this.currentUserId = "teacher001"; // 本来はログインセッション等から取得
    this.targetNendo = null;          // 管理コレクションから取得する年度
    this.allowedPeriod = null;        // 管理コレクションから取得する期間 ("zenki", "kouki", "tsunen")
    this.myKamokuList = [];           // 担当する全科目のリスト
    this.currentKamokuData = null;    // 現在画面に表示している講座・生徒の生データ
    this.scoreTableHeaherNum = 2;     // 成績入力の表におけるヘッダの行数
  }

  async connectedCallback() {
    console.log("inputSeisekiView connectedCallback");

    // 1. 初期データ（管理情報 ＆ 講座・成績データ）をサーバーから一括取得
    await this._loadInitialData();

    // ペーストボタン処理
    let pastebtn = this.shadowRoot.getElementById('paste-btn');
    pastebtn.addEventListener('click', async () => {
      try {
        // 1. 共通確認ダイアログを取得
        const dialog = this._findConfirmDialog();

        if (dialog) {
          // 2. 注意を促すダイアログを表示
          const action = await dialog.show({
            title: '貼り付け前の確認',
            message: 'クリップボードの内容を、現在表示されている入力枠に上書き貼り付けします。\n既存の入力内容は書き換わりますが、よろしいですか？',
            buttons: [
              { label: 'OK', onClickFunc: 'ok' },
              { label: 'キャンセル', onClickFunc: 'cancel' }
            ]
          });

          // ユーザーが「OK」を押さなかった（キャンセルや閉じた）場合は処理を中断
          if (action !== 'ok') {
            return;
          }
        }

        const pastedText = await navigator.clipboard.readText();
        const parsedMatrix = NBNParseExcelData(NBNZenkaku2hankaku(pastedText));
        
        // ※ Excelコピペ時はヘッダー行が含まれない「数字だけの2次元配列」を想定
        // 既存のHTMLテーブルに値を流し込む、または再レンダリングする
        this._applyPastedData(parsedMatrix);
      } catch (err) {
        console.error("クリップボードの読み込みに失敗しました:", err);
      }
    });

    // 2. 登録ボタン押下時の処理
    let registerbtn = this.shadowRoot.getElementById('register-btn');
    registerbtn.addEventListener('click', async () => {
      await this._onClickSaveButton();
    });

    // キーボードによるセル移動処理（既存のロジックをそのまま活用）
    const table = this.shadowRoot.getElementById('scoreTable');
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
          const nextCell = currentCell.nextElementSibling;
          if (nextCell && nextCell.classList.contains('editable-cell')) {
            event.preventDefault();
            nextCell.focus();
          }
        }
      } else if (key === 'ArrowLeft') {
        if (this._isCaretAtStart(currentCell)) {
          const prevCell = currentCell.previousElementSibling;
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
   * サーバーから管理情報と成績データを取得して画面を初期描画する
   */
  async _loadInitialData() {
    try {
      // 1. 再読み込み前に「現在選択している科目のID」を記憶しておく
      const currentSelectedId = this.currentKamokuData ? this.currentKamokuData.kamokuId : null;

      // 本来は管理コレクションの設定を返すAPI
      // 例: { nendo: 2026, period: "zenki" } が返ってくるとする
      const configRes = await fetch('/api/fetch/ks_manage'); // 指定なしのときは method: 'GET'
      const config = await configRes.json();
      this.targetNendo = config.nendo;
      this.allowedPeriod = config.period; // "zenki" | "kouki" | "tsunen"

      // 「教員IDに紐づく生徒・成績一覧」をGET
      const dataRes = await fetch(`/api/fetch/input-sheet?teacherId=${this.currentUserId}&nendo=${this.targetNendo}`);
      const result = await dataRes.json();

      if (result.success && result.data.length > 0) {

        // 全科目リストを保持し、サイドバーを描画する
        this.myKamokuList = result.data;

        // 2. 直前に選択していた科目が新しいデータ一覧の中に存在するか探す
        let matchedKamoku = null;
        if (currentSelectedId) {
          matchedKamoku = this.myKamokuList.find(k => k.kamokuId === currentSelectedId);
        }

        // 3. 見つかればその科目を維持、見つからなければ（初回表示時など）1件目を初期選択にする
        this.currentKamokuData = matchedKamoku ? matchedKamoku : this.myKamokuList[0];

        this._renderKamokuList(); // サイドバーの描画

        this.shadowRoot.getElementById('infoBar').innerText = 
          `【${this.targetNendo}年度】担当科目: ${this.currentKamokuData.kamokuName} | 入力可能期間: ${this._getPeriodLabel(this.allowedPeriod)}`;
        
        // 画面（HTMLテーブル）のレンダリング
        this._renderScoreTable();
      } else {
        this.shadowRoot.getElementById('infoBar').innerText = "担当する科目、または名簿データが見つかりませんでした。";
      }
    } catch (err) {
      console.error("初期データの読み込みに失敗しました:", err);
      this.shadowRoot.getElementById('infoBar').innerText = "通信エラーが発生しました。";
    }
  }

  /**
   * サーバーから得た共通構造オブジェクトを NBNrenderTable 用の2次元配列に直して描画
   */
  _renderScoreTable() {
    // 1. NBNrenderTableに渡すための「綺麗な行列（matrix）」を手作業で組み立てる
    const matrix = [];

    // 表の1行目に科目名を表示する
    const titleText = `${this.currentKamokuData.gakunen ? this.currentKamokuData.gakunen + '年 ' : ''}${this.currentKamokuData.kamokuName}`;
    // 1行目: 科目名タイトル（11列分のセルを持つ配列）
    matrix.push([titleText, "", "", "", "", "", "", "", "", "", ""]);

    // ヘッダー行
    matrix.push(["学年", "組", "番号", "氏名", "前期観点", "前期評価(10段階)", "前期欠課", "後期観点", "後期評価(10段階)", "後期欠課", "通年評定(5段階)"]);

    // 生徒データの流し込み
    this.currentKamokuData.students.forEach(s => {
      matrix.push([
//        s.gakunen - 3, // 表示だけデータベース内部の値を見慣れた形に直す
        s.gakunen,
        s.cls,
        s.bangou,
        s.name,
        s.zenki?.kanten?.join('') ?? "", // 4: 前期観点
        s.zenki?.hyouka ?? "",           // 5: 前期評価(10段階)
        s.zenki?.kekka ?? 0,             // 6: 前期欠課
        s.kouki?.kanten?.join('') ?? "", // 7: 後期観点
        s.kouki?.hyouka ?? "",           // 8: 後期評価(10段階)
        s.kouki?.kekka ?? 0,             // 9: 後期欠課
        s.tsunen?.hyoutei ?? ""          // 10: 通年評定(5段階)
      ]);
    });

    const tableObj = this.shadowRoot.getElementById('scoreTable');
    
    // 2. レンダリング関数を実行。ここで「管理期間」による入力可否を完全に制御！
    tableObj.innerHTML = NBNrenderTable(matrix, (rowIndex, colIndex, value) => {

      // -------------------------------------------------------------
      // 1. 行（tr）全体の判定（colIndex === -1 のときに処理）
      // -------------------------------------------------------------
      if (colIndex === -1) {
        if (rowIndex < this.scoreTableHeaherNum) {
          return { rowClassName: '' }; // ヘッダー行にはしましまクラスを付けない
        }
        const studentIndex = rowIndex - this.scoreTableHeaherNum;
        const isStripeRow = Math.floor(studentIndex / 5) % 2 === 1;
        return { rowClassName: isStripeRow ? 'stripe-group' : '' };
      }

      // -------------------------------------------------------------
      // 2. 各セル（td / th）ごとの判定
      // -------------------------------------------------------------

      // 0行目：科目名タイトル
      if (rowIndex === 0) {
        return {
          isHeader: true,
          isEditable: false,
          colspan: 11,
          className: 'table-title-cell'
        };
      }

      // 1行目：表の見出し
      if (rowIndex === 1) {
        return { isEditable: false, isHeader: true ,className: 'table-title-cell' };
      }

      // 2行目以降（生徒データ行）：編集可能セルの判定
      let canEdit = false;
      if (this.allowedPeriod === "zenki" && (colIndex === 4 || colIndex === 5 || colIndex === 6)) canEdit = true;
      if (this.allowedPeriod === "kouki" && (colIndex === 7 || colIndex === 8 || colIndex === 9)) canEdit = true;
      if (this.allowedPeriod === "tsunen" && colIndex === 10) canEdit = true;

      return {
        isEditable: canEdit
      };
    });
  }

  /**
   * Excelからコピペされたデータを、現在表示されているテーブルの「editableなセル」だけに流し込む親切関数
   */
  _applyPastedData(pastedMatrix) {
    const table = this.shadowRoot.getElementById('scoreTable');
    const rows = Array.from(table.querySelectorAll('tr')).slice(this.scoreTableHeaherNum);

    rows.forEach((row, rIdx) => {
      if (!pastedMatrix[rIdx]) return;
      
      // その行の中にある「編集可能なセル」だけを抽出
      const editableCells = row.querySelectorAll('.editable-cell');
      editableCells.forEach((cell, cIdx) => {
        if (pastedMatrix[rIdx][cIdx] !== undefined) {
          cell.innerText = pastedMatrix[rIdx][cIdx];
        }
      });
    });
  }

  /**
   * 登録ボタンが押された時、現在のHTMLテーブルからデータを集計してサーバーにPOST送信する
   */
  async _onClickSaveButton() {

    // 自分が属するルート（inputSeisekiのShadowRoot）を取得
    const myRoot = this.getRootNode();

    // 親のShadow DOM（NBNShellのShadowRoot）または document を取得
    let dialog = null;

    // 画面全体（あらゆるShadow DOM）から confirm-dialog を探す確実な関数
    dialog = this._findConfirmDialog();
    
    if (!dialog) {
      console.error("confirm-dialog が見つかりませんでした。");
      return;
    }

    // -------------------------------------------------------------
    // Step 1: 入力妥当性チェック（バリデーション）
    // -------------------------------------------------------------
    const validationErrors = this._validateInputData();

    // 不備が見つかった場合
    if (validationErrors.length > 0) {
      const errorMsg = "以下の入力内容に不備があります。修正してください。\n\n・" + validationErrors.join("\n・");
      // OKボタンのみのダイアログを表示
      await dialog.show({
        title: '入力エラー',
        message: errorMsg,
        buttons: [
          { label: 'OK', onClickFunc: 'ok' }
        ]
      });
      return; // 登録処理に進まずここで中断
    }

    // -------------------------------------------------------------
    // Step 2: 適正な場合の確認ダイアログ表示
    // -------------------------------------------------------------
    const action = await dialog.show({
      title: '登録確認',
      message: '入力された内容で成績データを登録（上書き）します。よろしいですか？',
      buttons: [
        { label: 'OK', onClickFunc: 'ok' },
        { label: 'キャンセル', onClickFunc: 'cancel' }
      ]
    });

    // キャンセルが押された、またはダイアログが閉じられた場合は処理中断
    if (action !== 'ok') {
      return;
    }

    // -------------------------------------------------------------
    // Step 3: 実際の登録（POST）処理を実行
    // -------------------------------------------------------------
    await this._saveSeisekiData();
  }

  /**
   * どんなに深い Shadow DOM の中にいても confirm-dialog を探し出すヘルパーメソッド
   */
  _findConfirmDialog() {
    // 1. 直近の ShadowRoot または document を探す
    let root = this.getRootNode();
    while (root) {
      // 今の階層で confirm-dialog を探す
      const dialog = root.querySelector('confirm-dialog');
      if (dialog) return dialog;

      // もし見つからず、まだ上に親コンポーネント（host）があるなら、さらに上のルートへ登る
      if (root.host) {
        root = root.host.getRootNode();
      } else {
        break; // 一番外側の document まで到達したら終了
      }
    }
    return null;
  }
  
  /**
   * データチェック関数
   */
  _validateInputData() {
    const errors = [];
    const table = this.shadowRoot.getElementById('scoreTable');
    const rows = Array.from(table.querySelectorAll('tr')).slice(this.scoreTableHeaherNum);

    const regexABC = /^[ABC]{3}$/; // AかBかCからなる3文字

    rows.forEach((row, index) => {
      const cells = row.children;
      const name = cells[3].innerText;

      // 観点文字のチェック（A, B, C, C' などの許可文字以外が含まれていないか）
      const zenkiKantenStr = cells[4].innerText.trim();
      if (zenkiKantenStr !== "" && !regexABC.test(zenkiKantenStr)) {
        errors.push(`${name} さんの前期観点（${zenkiKantenStr}）に不正な文字が含まれています。`);
      }
      const koukiKantenStr = cells[7].innerText.trim();
      if (koukiKantenStr !== "" && !regexABC.test(koukiKantenStr)) {
        errors.push(`${name} さんの後期期観点（${koukiKantenStr}）に不正な文字が含まれています。`);
      }

      // 評価の範囲チェック（1〜10など学校の基準に合わせる）
      const zenkiHyoukaStr = cells[5].innerText.trim();
      if (zenkiHyoukaStr !== "") {
        const val = parseInt(NBNZenkaku2hankaku(zenkiHyoukaStr), 10);
        if (val === null || val < 1 || val > 10) {
          if (!(val == 'A' || val == 'B' || val == 'C')) { //総合はABCで評価するので、それも可とする
            errors.push(`${name} さんの前期評価（${zenkiHyoukaStr}）は 1から10 の範囲で入力してください。`);
          }
        }
      }
      const koukiHyoukaStr = cells[8].innerText.trim();
      if (koukiHyoukaStr !== "") {
        const val = parseInt(NBNZenkaku2hankaku(koukiHyoukaStr), 10);
        if (val === null || val < 1 || val > 10) {
          if (!(val == 'A' || val == 'B' || val == 'C')) { //総合はABCで評価するので、それも可とする
            errors.push(`${name} さんの後期評価（${koukiHyoukaStr}）は 1から10 の範囲で入力してください。`);
          }
        }
      }
      // 欠課時数がマイナスでないか
      const zenkiKekkaStr = cells[6].innerText.trim();
      if (zenkiKekkaStr !== "") {
        const val = parseInt(NBNZenkaku2hankaku(zenkiKekkaStr), 10);
        if (val < 0) {
          errors.push(`${name} さんの欠課時数に正しい数値を入力してください。`);
        }
      }
      const koukiKekkaStr = cells[9].innerText.trim();
      if (koukiKekkaStr !== "") {
        const val = parseInt(NBNZenkaku2hankaku(koukiKekkaStr), 10);
        if (val < 0) {
          errors.push(`${name} さんの欠課時数に正しい数値を入力してください。`);
        }
      }

      // 通年評定のチェック
      const tuunenStr = cells[10].innerText.trim();
      if (tuunenStr !== "") {
        const val = parseInt(NBNZenkaku2hankaku(tuunenStr), 10);
        if (val === null || val < 1 || val > 5) {
          errors.push(`${name} さんの通年評定（${tuunenStr}）1から5 の範囲で入力してください。`);
        }
      }
    });
    return errors;
  }

  /**
   * 登録ボタンが押された時、現在のHTMLテーブルからデータを集計してサーバーにPOST送信する
   */
  async _saveSeisekiData() {
    const table = this.shadowRoot.getElementById('scoreTable');
    const rows = Array.from(table.querySelectorAll('tr')).slice(this.scoreTableHeaherNum);

    const updateContents = [];

    rows.forEach((row) => {
      const cells = row.children;
      
      // HTMLテーブルの並び順（matrixの構造）から正確にデータを逆引き集計する
      const gakunen = parseInt(cells[0].innerText, 10); // parseIntの第2引数は基数の設定
      const cls     = parseInt(cells[1].innerText, 10);
      const bangou  = parseInt(cells[2].innerText, 10);
      const name    = cells[3].innerText;

      // 1人分の新しい成績オブジェクトを組み立てる
      const studentRecord = {
        nendo: this.targetNendo,
        gakunen: gakunen,
        cls: cls,
        bangou: bangou,
        studentName: name,
        kamokuId: this.currentKamokuData.kamokuId,
        kamokuName: this.currentKamokuData.kamokuName,
        
        // 編集されなかった期間のデータは、初期読み込み時の既存の値を引き継ぐ（上書き破壊を防ぐ）
        zenki: {
          kanten: cells[4].innerText !== "" ? NBNZenkaku2hankaku(cells[4].innerText).split('') : [],
          hyouka: cells[5].innerText !== "" ? parseInt(NBNZenkaku2hankaku(cells[5].innerText), 10) : null,
          kekka:  cells[6].innerText !== "" ? parseInt(NBNZenkaku2hankaku(cells[6].innerText), 10) : 0
        },
        kouki: {
          kanten: cells[7].innerText !== "" ? NBNZenkaku2hankaku(cells[7].innerText).split('') : [],
          hyouka: cells[8].innerText !== "" ? parseInt(NBNZenkaku2hankaku(cells[8].innerText), 10) : null,
          kekka:  cells[9].innerText !== "" ? parseInt(NBNZenkaku2hankaku(cells[9].innerText), 10) : 0
        },
        tsunen: {
          hyoutei: cells[10].innerText !== "" ? parseInt(NBNZenkaku2hankaku(cells[10].innerText), 10) : null
        }
      };

      updateContents.push(studentRecord);
    });

    try {
      // サーバー側のPOST用保存APIを叩く
      const response = await fetch('/api/store/ks_seiseki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: updateContents })
      });

      const resResult = await response.json();
      if (resResult.success) {
        alert("成績データを正常に登録しました！");
        // 状態を最新にするために再読み込み
        this._loadInitialData();
      } else {
        alert("登録に失敗しました: " + resResult.message);
      }
    } catch (err) {
      console.error("保存通信エラー:", err);
      alert("サーバーとの通信に失敗しました。");
    }
  }

  _getPeriodLabel(period) {
    if (period === "zenki") return "前期成績";
    if (period === "kouki") return "後期成績";
    if (period === "tsunen") return "通年評定";
    return "期間外";
  }

  // 担当科目一覧をサイドバーに描画する処理
  _renderKamokuList() {
    const listEl = this.shadowRoot.getElementById('kamokuList');
    listEl.innerHTML = '';

    this.myKamokuList.forEach((kamoku, index) => {
      const li = document.createElement('li');
      li.className = 'kamoku-item';

      // 最初にリストを表示する際、1つ目の科目をデフォルト選択にする
      if (this.currentKamokuData && this.currentKamokuData.kamokuId === kamoku.kamokuId) {
        li.classList.add('selected');
      }

//      li.textContent = `${kamoku.gakunen-3}年 ${kamoku.kamokuName}`; //学年は見た目だけ、データベース内部の値を見慣れた形に直す
      li.textContent = `${kamoku.gakunen}年 ${kamoku.kamokuName}`;

      // 科目をクリックしたときの切り替えイベント
      li.addEventListener('click', () => {
        this._selectKamoku(kamoku);
      });

      listEl.appendChild(li);
    });
  }

  // 科目を切り替えるメソッド
  _selectKamoku(selectedKamoku) {
    this.currentKamokuData = selectedKamoku;

    // サイドバーの見た目（selectedクラス）を更新
    this._renderKamokuList();

    // 右側のテーブルを選択された科目のデータで再描画
    this._renderScoreTable();
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

customElements.define('input-seiseki-view', inputSeisekiView);
