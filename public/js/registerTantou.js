import {
  NBNZenkaku2hankaku,
  NBNParseExcelData,
  NBNconbineMatrixHorizon,
  NBNconbineMatrixVertical,
  NBNextracteMatrix,
  NBNrenderTable,
  NBNGetYearsList,
  NBNGetTeacherIDFromRyakusyou,
  NBNGetClsInfoFromClsStr } from './NBNHelpers.js';

import {
  name2TeacherID } from './name2teacherID.js';

/*
 * registerTantou.js
 * 科目に対して、教科担当の教員、単位の登録をする。
 */

class registerTantouView extends HTMLElement {

  
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._sortedKamokuList = null;
    this._matrixTantou = null;
    this._matrixMeibo = null;
    this._matrixTanni = null;
    this._tableHeader = null; 
    this.shadowRoot.innerHTML = `
      <style>
      </style>
      <h1>科目に対して担当教員と名簿情報、単位を登録する</h1>
      <p>これは手順その2である。手順その1で登録した科目たちに対して設定を行う。</p>
      <p>縦の列（科目）毎に、3つの表の同じ位置の値を紐づけてマスターデータを作成する。</p>
      <p>担当教員：名前からIDを引き当てる。複数人いるときは/でつなげる</p>
      <p>名簿情報：クラスは3-1,3-2・・・とし、クラスか混合名簿IDのどちらか1つだけをかく。</p>
      <p>登録対象年度：<select id="targetNendo"></select>
        登録対象学年：
        <select id="targetGakunen">
          <option value="4">高校1年</option> // 中1:1, 中2:2, 中3:3, 高1:4, 高2:5, 高3:6 とする
          <option value="5">高校2年</option>
          <option value="6">高校3年</option>
        </select>
      </p>
      <button id="paste-btn-tantou">ペースト(担当)</button>
      <button id="paste-btn-meibo">ペースト(名簿)</button>
      <button id="paste-btn-tanni">ペースト(単位)</button>
      <button id="register-btn">登録</button>

      <table id="kamokuTantouTable" border="1px">
      </table>
      <table id="kamokuMeiboTable" border="1px">
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

    // 年度か学年が変わったらテーブルへヘッダ（科目）を設定しなおす
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

    const registerbtn = this.shadowRoot.getElementById('register-btn');
    registerbtn.addEventListener('click', async () => {
      try {
        this._register(this._sortedKamokuList,
                       this._matrixTantou,
                       this._matrixMeibo,
                       this._matrixTanni);
      } catch (err) {
        console.error("登録に失敗しました（権限が拒否されたなど）:", err);
      }
    });

    // ペーストのボタンは３つ。似たようなテーブルへの追記処理の登録を3回繰り返す
    const pastebtnTantou = this.shadowRoot.getElementById('paste-btn-tantou');
    pastebtnTantou.addEventListener('click', async () => {
      try {
        // クリップボードからテキストを読み取る（ブラウザが許可を求めるポップアップを出します）
        const pastedText = await navigator.clipboard.readText(); 
        const objTantou = this.shadowRoot.getElementById('kamokuTantouTable');
        this._matrixTantou = NBNParseExcelData( NBNZenkaku2hankaku(pastedText));
        // 担当だけ、入力値そのままでなく、入力値の略称から教員IDに変換する　担当教員の一覧を作成するオペレーションを含め要検討
        this._matrixTantou = NBNGetTeacherIDFromRyakusyou(this._matrixTantou, name2TeacherID)
        // ヘッダーと入力表をつけて表示
        objTantou.innerHTML = NBNrenderTable( NBNconbineMatrixVertical(this._tableHeader, this._matrixTantou));

      } catch (err) {
        console.error("クリップボードの読み込みに失敗しました（権限が拒否されたなど）:", err);
      }
    });
    const pastebtnMeibo = this.shadowRoot.getElementById('paste-btn-meibo');
    pastebtnMeibo.addEventListener('click', async () => {
      try {
        // クリップボードからテキストを読み取る（ブラウザが許可を求めるポップアップを出します）
        const pastedText = await navigator.clipboard.readText();
        const objMeibo = this.shadowRoot.getElementById('kamokuMeiboTable');
        this._matrixMeibo = NBNParseExcelData( NBNZenkaku2hankaku(pastedText));
        // ヘッダーと入力表をつけて表示
        objMeibo.innerHTML = NBNrenderTable( NBNconbineMatrixVertical(this._tableHeader, this._matrixMeibo));

      } catch (err) {
        console.error("クリップボードの読み込みに失敗しました（権限が拒否されたなど）:", err);
      }
    });
    const pastebtnTanni = this.shadowRoot.getElementById('paste-btn-tanni');
    pastebtnTanni.addEventListener('click', async () => {
      try {
        // クリップボードからテキストを読み取る（ブラウザが許可を求めるポップアップを出します）
        const pastedText = await navigator.clipboard.readText();
        const objTanni = this.shadowRoot.getElementById('kamokuTanniTable');
        this._matrixTanni = NBNParseExcelData( NBNZenkaku2hankaku(pastedText));
        // ヘッダーと入力表をつけて表示
        objTanni.innerHTML = NBNrenderTable( NBNconbineMatrixVertical(this._tableHeader, this._matrixTanni));

      } catch (err) {
        console.error("クリップボードの読み込みに失敗しました（権限が拒否されたなど）:", err);
      }
    });
  }

  // テーブルにヘッダを追記
  // 該当年度、該当学年の科目データを取得して表示
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

      // オブジェクトの配列から科目名の配列へ　さらにその配列にして2次元配列へ
      this._tableHeader = [this._sortedKamokuList.map(kamoku => kamoku.kamokuName)];

      const objTantou = this.shadowRoot.getElementById('kamokuTantouTable');
      objTantou.innerHTML = NBNrenderTable( this._tableHeader );

      const objMeibo = this.shadowRoot.getElementById('kamokuMeiboTable');
      objMeibo.innerHTML = NBNrenderTable( this._tableHeader );

      const objTanni = this.shadowRoot.getElementById('kamokuTanniTable');
      objTanni.innerHTML = NBNrenderTable( this._tableHeader );


    } catch (error) {
      // 通信エラー（サーバーダウン、オフラインなど）の処理
      console.error('通信に失敗しました', error);
    }

  }

  /**
   * マスターデータを登録・更新する関数
   * @param {Array} kamokuList - 科目オブジェクトの配列（sortNo順にソート済みを想定）
   * @param {Array} matrixTantou - 縦:教員 / 横:科目の2次元配列（中身は教員IDの配列）
   * @param {Array} matrixMeibo - 縦:クラス / 横:科目の2次元配列（中身はクラス名文字列、または混合名簿ID）
   * @param {Array} matrixTanni - 縦:単位数 / 横:科目の2次元配列（中身は数値または数値文字列）
   */
  async _register(kamokuList, matrixTantou, matrixMeibo, matrixTanni) {
    try {
      // 事前に名簿マトリクスをオブジェクト形式の2次元配列に一括変換する！
      const formattedMeiboMatrix = NBNGetClsInfoFromClsStr(matrixMeibo);
      // 最終的にMongoDBに保存するマスターデータの配列
      const masterRecords = [];
  
      // 入力マトリクスの「行（縦）」の数を取得（どれも同じ行数である想定）
      const rowCount = matrixTantou.length;
      // 「列（横 = 科目の数）」を取得
      const colCount = kamokuList.length;
  
      // 1行ずつループ（縦方向）
      for (let i = 0; i < rowCount; i++) {
        // 1列ずつループ（横方向 = 科目ごと）
        for (let j = 0; j < colCount; j++) {
          
          // 現在のセルに対応する「科目情報」をリストから取得
          const currentKamoku = kamokuList[j];
          
          // 3つのマトリクスから、同じ位置（行i、列j）のデータをピンポイントで抽出
          const teachers = matrixTantou[i][j]; // 教員IDの配列
          const meiboObj = formattedMeiboMatrix[i][j];   // クラス名（"3-1"など）または 混合名簿ID
          const tanni    = matrixTanni[i][j];   // 単位数

          // 担当教員の指定を信じる。そこが未入力ならスキップ（登録しない）
          const isTeachersEmpty = !teachers || teachers.length === 0 || teachers[0] === "";
          //const isMeiboEmpty = !meiboObj.gakunen && !meiboObj.cls && !meiboObj.kongoumeibo;
          //const isTanniEmpty = tanni === null || tanni === undefined || tanni === "";

          if (isTeachersEmpty /*&& isMeiboEmpty && isTanniEmpty*/) {
            continue;
          }
  
          // マスターデータの「1行分（1ドキュメント）」を組み立てる
          const record = {
            nendo: currentKamoku.nendo,             // 科目マスタから年度を引き継ぐ
            kamokuId: currentKamoku.kamokuId,       // 科目ID
            kamokuName: currentKamoku.kamokuName,   // 科目名（画面表示等で便利なので持たせる）
            teachers: Array.isArray(teachers) ? teachers : [teachers], // 確実に教員IDの配列にする
            meiboInfo: meiboObj,                    // 名簿情報オブジェクトをそのまま格納
            tanni: tanni !== "" ? Number(tanni) : 0 // 単位数は数値型にキャストしておく
          };

          masterRecords.push(record);
        }
      }

      console.log(`組み立て完了: ${masterRecords.length} 件のマスターデータを登録します。`);
      console.log(masterRecords);

      const currentNendo = kamokuList[0]?.nendo;
      const response = await fetch('/api/store/ks_master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nendo: currentNendo,
          contents: masterRecords // サーバー側はこの contents を insertMany するだけ
        })
      });

      const result = await response.json();
      console.log("マスター登録結果:", result);

    } catch (error) {
      console.error("マスター登録処理でエラーが発生しました:", error);
    }
  }

}
// 定義名は、全て小文字(a-z)で、ハイフンが1つ以上含まれないとダメ。
customElements.define('register-tantou-view', registerTantouView);
