// 全角の数字を半角の数字に変換。全角のハイフンも半角に
function toHalfWidth(str) {
  return str.replace(/[！-～]/g, function(s) {
    // 文字コードを 0xFEE0 分ずらすことで全角から半角に変換
    return String.fromCharCode(s.charCodeAt(0) - 0xfee0);
  }).replace(/－/g, "-")  // 全角ハイフン(マイナス)を半角に
    .replace(/ー/g, "-")  // 全角長音を半角に
    .replace(/—/g, "-")  // エムダッシュを半角に
    .replace(/[\u2212\u2010-\u2015\u30fc\uff0d]/g, "-")  //他の怪しいのも半角ハイフンに
    .trim();              // 前後の余計な空白を消す
}


// 読み込んだCSVデータを二次元配列に変換する
function convertCSVtoArray(str){ // 読み込んだCSVデータが文字列として渡される
  let result = [];
  // \r\n と \n の両方に対応して分割
  let tmp = str.split(/\r?\n/); 

  for(let i = 0; i < tmp.length; i++){
    // 各行をカンマで分けた後、各要素の " を消して空白をトリムする
    let row = tmp[i].split(',').map(item => {
      return item.replace(/"/g, '').trim(); // 全ての " を削除して前後を掃除
    });

    result.push(row);
  }
  return result;
}


// 選択授業の授業設定.csvを
// 2次元配列からjavascriptのオフジェクトの配列にする。
// { jyugyouID;"hoge",
//   teacher:["A先生", "B先生"],
//   class : "3-17", "3-17"} みたいなもののリスト
function makeSentakuList (arr) {
  let i, lst, objMakingFlg, obj;

  lst = [];

  objMakingFlg = false;

  for (i = 0; i < arr.length; i++) {
    if (arr[i][0] == "選択授業名" ) {
      obj = {'jyugyouID' : arr[i][1],
             'teacher'   : [],
             'class'     : []};

      objMakingFlg = true;

    } else if(objMakingFlg == true && arr[i][0] == "授業ID") { // ここはスルー

    } else if(objMakingFlg == true && obj.jyugyouID == arr[i][0]) {

      // ここでいう選択授業は、生徒が選択するかでなく、
      // 先生複数人や生徒複数集団にまたがるような授業のこと
      //
      // LHRの、担任- クラス　みたいに、使う意味があるもの(R8年のデータを見て書いてる)と
      // 3-16実英数みたいに、イデア的にクラスは入力されているけど
      // (クラスをまたいだ別の集団で授業をやるから)
      // ここでのクラスにあまり意味のないものもあるので注意

      obj.teacher.push(arr[i][2]); //先生名
      obj.class.push(arr[i][3]);   //クラス名

    } else {
      if (objMakingFlg == true) {
        lst.push(obj);
        objMakingFlg = false;
      }
    }
  }
  return lst;
}

module.exports = { toHalfWidth       : toHalfWidth,
                   convertCSVtoArray : convertCSVtoArray,
                   makeSentakuList   : makeSentakuList };
