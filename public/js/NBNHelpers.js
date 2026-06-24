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
 * @param {str} 全角英数字を含むかもしれない文字列
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
 * @param {text} TSV
 */
export function NBNParseExcelData(text) {
    // 改行コード（Windowsは\r\n、Macは\n両対応）で区切って行ごとの配列にする
    const rows = text.trim().split(/\r?\n/);

    // 各行を「タブ（\t）」で区切って、二次元配列を作る
    return rows.map(row => row.split('\t'));
}

/**
 * 二次元配列をhtmlのtableへ変換するメソッド
 * @param {matrix} 二次元配列
 */
export function NBNrenderTable(matrix) {

  if (matrix.length === 0) return;

  let html = '<table>';
  matrix.forEach((row, rowIndex) => {
    html += '<tr>';
    row.forEach(cell => {
      // 最初の行はヘッダー（th）にする
      html += rowIndex === 0 ? `<th>${cell}</th>` : `<td>${cell}</td>`;
    });
    html += '</tr>';
  });
  html += '</table>';

  return html;
}
