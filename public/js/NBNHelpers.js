// UIに関係する処理で、幾つもの画面から使われるものをまとめる。
// モデルの操作は別モジュールとする。

/**
 * ログインダイアログを表示する関数
 */
/*
export function toLoginDialog() {
  NBNDispatchEvent('logindialog', {});
}
*/
/**
 * 確認ダイアログを表示する関数
 * 登録処理を行う前に、ユーザに確認をしてもらうためのもの。
 * パラメータのobjectの設定例は以下
 * { title   : '確認',
 *   message : '登録してよいですか？',
 *   buttons : [{ label: 'OK',         onClickFunc: () => {登録処理} },
 *              { label: 'キャンセル', onClickFunc: () => {} }]}
 * @param {object} objBefore 登録処理を行う前に表示するダイアログの情報
 * @param {object} objAfterSuccess 登録処理を行い、処理が成功したときに表示するダイアログの情報
 * @param {object} objAfterFailure 登録処理を行い、処理が失敗したときに表示するダイアログの情報
 */
/*
export function toConfirmDialog(objBefore, objAfterSuccess, objAfterFailure) {
  NBNDispatchEvent('confirmdialog',
                   {detail: {before       : objBefore,
                             afterSuccess : objAfterSuccess,
                             afterFailure : objAfterFailure}});
}
*/

/**
 * アプリ内イベントを送信する関数
 * @param {string} EventName イベント名
 * @param {object} obj イベント送信時に一緒に伝えたいデータ
 */
export function NBNDispatchEvent(EventName, obj) {
  const event = new CustomEvent(EventName, obj); 
  window.dispatchEvent(event);
}

/**
 * 全角英数字を半角に変換するメソッド
 * @param {string} str 全角英数字を含むかもしれない文字列
 */
export function NBNZenkaku2hankaku(str) {
  // 全角英数字を半角に変換
  str = str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
  });
  return str;
}

/**
 * Excelデータ（TSV）を二次元配列に変換するメソッド
 * @param {string} text TSV
 */
export function NBNParseExcelData(text) {
    // 改行コード（Windowsは\r\n、Macは\n両対応）で区切って行ごとの配列にする
    const rows = text.trim().split(/\r?\n/);

    // 各行を「タブ（\t）」で区切って、二次元配列を作る
    return rows.map(row => row.split('\t'));
}

/**
 * 二次元配列を横に結合するメソッド
 * @param {string[][]} matrixLeft 結合する表(左)
 * @param {string[][]} matrixRight 結合する表(右)
 */
export function NBNconbineMatrixHorizon(matrixLeft, matrixRight) {
  // 横に結合する
  const combined = matrixLeft.map((row, index) => {
    // matrixLeft の各行（row）に、matrixRight の同じ行（index番目）を合体させる
    return row.concat(matrixRight[index]);
  });
  return combined;
}

/**
 * 二次元配列を縦に結合するメソッド
 * @param {string[][]} matrixUpper 結合する表(上)
 * @param {string[][]} matrixLower 結合する表(下)
 */
export function NBNconbineMatrixVertical(matrixUpper, matrixLower) {
  // 下方向に結合する
  return matrixUpper.concat(matrixLower);
}

/**
 * 二次元配列のs列目からt列目までで、かつu行目以降を切り出すメソッド
 * @param {string[][]} matrix 切り出す元の表
 * @param {number} i 切り出す行(ここ以降) これ以降欲しい　(0スタート)
 * @param {number} j 切り出す列(start) ここから欲しい　(0スタート)
 * @param {number} k 切り出す列(end) ここまで欲しい　(0スタート)
 */
export function NBNextracteMatrix(matrix, i, j, k) {
  const extracted = matrix.map(row => {
    // 各行を、sliceを使って最初のn要素だけに切り詰める
    return row.slice(j, k+1);
  });
  return extracted.slice(i, matrix.length);
}

/**
 * 二次元配列をhtmlのtableへ変換する高度な共通関数
 * @param {Array} matrix 二次元配列
 * @param {Function} cellConfigFn 各セルの設定を決める関数 (row, col, value) => { isEditable: boolean }
 * @return {string} HTML文字列
 */
export function NBNrenderTable(matrix, cellConfigFn) {
  if (!matrix || matrix.length === 0) return '';

  let html = '<table>';
  matrix.forEach((row, rowIndex) => {
    html += '<tr>';
    row.forEach((cell, colIndex) => {
      if (rowIndex === 0) {
        html += `<th>${cell}</th>`;
      } else {
        // 与えられたルール関数に「現在の行・列・値」を投げて判断を仰ぐ。以下のように使う
        //
        // const html = NBNrenderTable(this.scoreData, (rowIndex, colIndex, value) => {
        //   「4列目（colIndex===3）かつ 管理期間内（canEdit）」というルールをその場で定義して渡す
        //    return {
        //      isEditable: (colIndex === 3 && canEdit)
        //    };
        // });
        const config = cellConfigFn ? cellConfigFn(rowIndex, colIndex, cell) : { isEditable: false };
        
        if (config.isEditable) {
          html += `<td class="editable-cell" contenteditable="true">${cell}</td>`;
        } else {
          html += `<td>${cell}</td>`;
        }
      }
    });
    
    html += '</tr>';
  });
  html += '</table>';
  return html;
}


/**
 * 昨年、今年、来年のリストのHTLMを返す関数
 * @param {}
 */
export function NBNGetYearsList() {
  const today = new Date();  // 今日の日付データを作る
  const thisYear = today.getFullYear(); // 今年（4桁の西暦）を取得
  const lastYear = thisYear - 1; // 今年 - 1 で昨年を取得
  const nextYear = thisYear + 1; // 今年 + 1 で来年を取得

  let str = '<option value="' + String(lastYear) + '">' + String(lastYear) + '</option>';
  str += '<option value="' + String(thisYear) + '" selected>' + String(thisYear) + '</option>';
  str += '<option value="' + String(nextYear) + '">' + String(nextYear) + '</option>';
  return str;
}

/**
 * 略称から教員IDを返す
 * 担当が複数人いるときは/で区切る。outputは配列になる
 * @param {}
 */
export function NBNGetTeacherIDFromRyakusyou(matrix, list) {
let i, j, templst;
  let OutputMatrix = [];

  for (i = 0; i < matrix.length; i++) {
    templst = [];
    for (j = 0; j < matrix[0].length; j++) {
      if (matrix[i][j] == null || matrix[i][j].length == 0) {
        templst.push("");
      } else {
        // 1. セルの文字列（例: "佐藤A/佐藤B"）を「/」で分解して配列にする ➡ ["佐藤A", "佐藤B"]
        // 担当が一人だけのときも、要素が一つの配列になるので同じロジックでOK
        const ryakusyouArray = matrix[i][j].split('/');
        // 2. 分解したそれぞれの名前を、IDに変換する
        const idArray = ryakusyouArray.map(name => {
          // 前後の余計なスペース（全角半角）を削っておくお守り（trim）を入れておくと安全です
          const cleanName = name.trim(); 
          const t = list.find(obj => obj.ryakusyou == cleanName);
          return t ? t.teacherID : cleanName; // マスタにあればID、なければ元の名前
        });
        templst.push(idArray);
      }
    }
    OutputMatrix.push(templst);
  }
  return OutputMatrix;
}

