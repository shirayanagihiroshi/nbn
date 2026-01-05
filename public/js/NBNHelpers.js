// UIに関係する処理で、幾つもの画面から使われるものをまとめる。
// モデルの操作は別モジュールとする。

/**
 * アプリ内イベントを送信する関数
 * @param {string} EventName イベント名
 * @param {object} obj イベント送信時に一緒に伝えたいデータ
 */
export function NBNDispatchEvent(EventName, obj) {
  const event = new CustomEvent(EventName, obj); 
  /*
  const options = Object.assign({ bubbles: true }, obj);
  const event = new CustomEvent(EventName, options);
  */
  document.dispatchEvent(event);
}

