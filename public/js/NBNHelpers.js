// UIに関係する処理で、幾つもの画面から使われるものをまとめる。
// モデルの操作は別モジュールとする。

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
export function toConfirmDialog(objBefore, objAfterSuccess, objAfterFailure) {
  NBNDispatchEvent('confirmdialog',
                   {detail: {before       : objBefore,
                             afterSuccess : objAfterSuccess,
                             afterFailure : objAfterFailure}});
}

/**
 * アプリ内イベントを送信する関数
 * @param {string} EventName イベント名
 * @param {object} obj イベント送信時に一緒に伝えたいデータ
 */
function NBNDispatchEvent(EventName, obj) {
  const event = new CustomEvent(EventName, obj); 
  document.dispatchEvent(event);
}

