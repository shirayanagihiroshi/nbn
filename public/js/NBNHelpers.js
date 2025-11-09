/*
 * NBNHelpers.js
 * ヘルパー関数
 * UIに関係する処理で、幾つもの画面から使われるものをまとめる。
 * モデルの操作は別モジュールとする。
 */

export function NBNDispatchEvent(EventName, obj) {
  const event = new CustomEvent(EventName, obj); 
  /*
  const options = Object.assign({ bubbles: true }, obj);
  const event = new CustomEvent(EventName, options);
  */
  document.dispatchEvent(event);
}

