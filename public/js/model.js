// データを操作する関数をまとめる。
// UI関連の操作は別モジュールとする。

/**
 * 成績データを取得する関数
 * 現状UIの作成を進めるためのダミーコード
 * @param {string} EventName イベント名
 * @param {object} obj イベント送信時に一緒に伝えたいデータ
 */
export async function NBNGetSeiseki() {

  return new Promise( (resolve) => {
    setTimeout(() => {
      resolve({studenId : 'studen01',
               nendo    : 2025,
               seiseki  : A});
    }, 500);
  });
}
