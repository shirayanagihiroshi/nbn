// データを操作する関数をまとめる。
// UI関連の操作は別モジュールとする。

/**
 * 成績データを取得する関数
 * 現状UIの作成を進めるためのダミーコード
 * @param {string} EventName イベント名
 * @param {object} obj イベント送信時に一緒に伝えたいデータ
 */
export function NBNGetSeiseki() {
  console.log("NBNGetSeiseki called");

  return new Promise( (resolve) => {
    setTimeout(() => {
      resolve({isSuccess : true,
               result : [{studenId : 'studen01',
                          nendo    : 2025,
                          seiseki  : 'A'},
                         {studenId : 'studen02',
                          nendo    : 2025,
                          seiseki  : 'B'}]});
    }, 500);
  });
}
