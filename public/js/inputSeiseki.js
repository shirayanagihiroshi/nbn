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
        h1 { font-family: sans-serif; color: #333; margin-bottom: 5px; }
        .info-bar { margin-bottom: 15px; color: #555; font-size: 14px; }
        .seiseki { border-collapse: collapse; margin-top: 20px; width: 100%; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .seiseki th, .seiseki td { border: 1px solid #ddd; padding: 8px; text-align: center; }
        .seiseki tr:first-child, .seiseki tr:nth-child(2) { background-color: #f2f2f2; font-weight: bold; }
        
        .editable-cell {
          background-color: #fffde7;
          cursor: text;
        }
        .editable-cell:focus {
          outline: 2px solid #2196F3;
          background-color: #fff;
        }
        
        .btn-container { margin-top: 15px; }
        button { padding: 8px 16px; cursor: pointer; font-weight: bold; border-radius: 4px; border: 1px solid #ccc; margin-right: 10px; }
        #register-btn { background-color: #4CAF50; color: white; border: none; }
        #register-btn:hover { background-color: #45a049; }
        #paste-btn { background-color: #2196F3; color: white; border: none; }
        #paste-btn:hover { background-color: #0b7dda; }
      </style>
      <h1>成績入力画面</h1>
      <div class="info-bar" id="infoBar">データを読み込み中...</div>
      <div class="btn-container">
        <button id="paste-btn">Excelからペースト</button>
        <button id="register-btn">登録（サーバーへ保存）</button>
      </div>
      <table class="seiseki" id="scoreTable"></table>
    `;

    // 内部で管理する状態
    this.currentUserId = "teacher001"; // 本来はログインセッション等から取得
    this.targetNendo = null;          // 管理コレクションから取得する年度
    this.allowedPeriod = null;        // 管理コレクションから取得する期間 ("zenki", "kouki", "tsunen")
    this.currentKamokuData = null;    // 現在画面に表示している講座・生徒の生データ
  }

  async connectedCallback() {
    console.log("inputSeisekiView connectedCallback");

    // 1. 初期データ（管理情報 ＆ 講座・成績データ）をサーバーから一括取得
    await this._loadInitialData();

    // ペーストボタン処理
    let pastebtn = this.shadowRoot.getElementById('paste-btn');
    pastebtn.addEventListener('click', async () => {
      try {
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
      await this._saveSeisekiData();
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
        // 今回はデモとして、該当教員の「最初の担当講座(j=0)」をターゲットにします
        this.currentKamokuData = result.data[0]; 
        
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
    
    // ヘッダー行1（2段組用）
    matrix.push(["学年", "組", "番号", "氏名", "前期評価", "前期観点", "前期欠課", "後期評価", "後期観点", "後期欠課", "通年評定"]);
    
    // 生徒データの流し込み
    this.currentKamokuData.students.forEach(s => {
      matrix.push([
        s.gakunen,
        s.cls,
        s.bangou,
        s.name,
        s.zenki.hyouka ?? "",
        s.zenki.kanten.join('') ?? "", // 配列を文字列（"AAA"等）に戻す
        s.zenki.kekka ?? 0,
        s.kouki.hyouka ?? "",
        s.kouki.kanten.join('') ?? "",
        s.kouki.kekka ?? 0,
        s.tsunen.hyoutei ?? ""
      ]);
    });

    const tableObj = this.shadowRoot.getElementById('scoreTable');
    
    // 2. レンダリング関数を実行。ここで「管理期間」による入力可否を完全に制御！
    tableObj.innerHTML = NBNrenderTable(matrix, (rowIndex, colIndex, value) => {
      // ヘッダー行（0行目）は絶対に編集不可
      if (rowIndex === 0) return { isEditable: false };

      // 管理コレクションから得た「期間（period）」に合致する列だけをeditableにする
      if (this.allowedPeriod === "zenki" && (colIndex === 4 || colIndex === 5 || colIndex === 6)) {
        return { isEditable: true }; // 前期の期間なら、前期評価・観点・欠課列のみ許可
      }
      if (this.allowedPeriod === "kouki" && (colIndex === 7 || colIndex === 8 || colIndex === 9)) {
        return { isEditable: true }; // 後期の期間なら、後期列のみ許可
      }
      if (this.allowedPeriod === "tsunen" && colIndex === 10) {
        return { isEditable: true }; // 通年の期間なら、通年評定列のみ許可
      }

      return { isEditable: false };
    });
  }

  /**
   * Excelからコピペされたデータを、現在表示されているテーブルの「editableなセル」だけに流し込む親切関数
   */
  _applyPastedData(pastedMatrix) {
    const table = this.shadowRoot.getElementById('scoreTable');
    const rows = Array.from(table.querySelectorAll('tr')).slice(1); // ヘッダーを除く

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
  async _saveSeisekiData() {
    const table = this.shadowRoot.getElementById('scoreTable');
    const rows = Array.from(table.querySelectorAll('tr')).slice(1); // ヘッダー行（0行目）を除く

    const updateContents = [];

    rows.forEach((row) => {
      const cells = row.children;
      
      // HTMLテーブルの並び順（matrixの構造）から正確にデータを逆引き集計する
      const gakunen = parseInt(cells[0].innerText, 10);
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
          hyouka: cells[4].innerText !== "" ? parseInt(cells[4].innerText, 10) : null,
          kanten: cells[5].innerText !== "" ? cells[5].innerText.split('') : [],
          kekka: cells[6].innerText !== "" ? parseInt(cells[6].innerText, 10) : 0
        },
        kouki: {
          hyouka: cells[7].innerText !== "" ? parseInt(cells[7].innerText, 10) : null,
          kanten: cells[8].innerText !== "" ? cells[8].innerText.split('') : [],
          kekka: cells[9].innerText !== "" ? parseInt(cells[9].innerText, 10) : 0
        },
        tsunen: {
          hyoutei: cells[10].innerText !== "" ? parseInt(cells[10].innerText, 10) : null
        }
      };

      updateContents.push(studentRecord);
    });

    try {
      // サーバー側のPOST用保存APIを叩く
      const response = await fetch('/api/seiseki/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: updateContents })
      });

      const resResult = await response.json();
      if (resResult.success) {
        alert("成績データを正常に登録しました！これで再読み込み時の動作確認も行えます。");
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

  // 以下、フォーカス移動系の各種内部メソッド (_moveFocus, _isCaretAtEnd 等) はご提示いただいたものをそのまま内包
  _moveFocus(currentCell, direction) { /* 省略（提示コード通り） */ }
  _isCaretAtEnd(element) { /* 省略（提示コード通り） */ }
  _isCaretAtStart(element) { /* 省略（提示コード通り） */ }
  _moveCaretToEnd(element) { /* 省略（提示コード通り） */ }
}

customElements.define('input-seiseki-view', inputSeisekiView);
