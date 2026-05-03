/*

*/

const tools = require('./makeJikanwariTool.json.js');
const path  = require('path');
const fs    = require('fs');
// 日本語をうまく扱えないときはjavascriptのファイルの文字コードに注意。shiftjisだとダメだった。
const itiranFileName            = 'nameCheck.csv';           // 入力
const OutputFileName            = 'nameCheck.json';           // 出力

const sentakuFileName           = '選択授業の授業設定.csv'; // 入力
const jyugyouPerTeacherFileName = '先生の授業設定.csv';     // 入力
const jyugyouPerTeacherExFName  = '先生の授業設定_名簿付.csv';  // 入力　合同名簿IDの追記ができるとよい

const teacherFile               = 'jhkteacher.json.js';     // 出力
const jikanwariFile             = 'jhkjikanwari.json.js';   // 出力
const jyugyouIDsFile            = 'jhkjyugyous.json.js';    // 出力

const jikanwariPerTeacher       = 'jikanwariPerTeacher.json'; // 出力　for SKT

// csvファイルの読み取り
source          = path.join(__dirname, itiranFileName);
let itiranFile  = fs.readFileSync(source, 'utf8');

// BOM（\ufeff）があれば除去する
if (itiranFile.startsWith('\ufeff')) {
  itiranFile = itiranFile.slice(1);
}

// 全角の数字を半角の数字に変換。全角のハイフンも半角に
itiranFile       = toHalfWidth(itiranFile);

function toHalfWidth(str) {
  return str.replace(/[！-～]/g, function(s) {
    // 文字コードを 0xFEE0 分ずらすことで全角から半角に変換
    return String.fromCharCode(s.charCodeAt(0) - 0xfee0);
  }).replace(/－/g, "-")  // 全角ハイフン(マイナス)を半角に
    .replace(/ー/g, "-")  // 全角長音を半角に
    .replace(/[\u2212\u2010-\u2015\u30fc\uff0d]/g, "-")  //他の怪しいのも半角ハイフンに
    .trim();              // 前後の余計な空白を消す
}


// CSVデータを二次元配列に変換する
const itiranData   = tools.convertCSVtoArray(itiranFile);

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
// ここまで！
/*
const teacherList = makeTeacherList(teacherData);

function makeTeacherList(arr) {
  let i, lst, obj, objforSKT;

  lst = [];

  for (i = 0; i < arr.length; i++) {
    obj = {'teacher' : arr[i][0],  // 先頭の教員名を使う
           'kyouka'  : arr[i][3]}; // 4番目に教科名がある。（イデアが吐いてくるものが変わったら変更する）

    // イデアが吐いてくるものと、jhkに使うものの帳尻を合わせる。
    // 歴公 -> 社会
    if (obj.kyouka == "歴公") {
      obj.kyouka = "社会";

    // 変更なし
    } else if ( obj.kyouka == "国語" || obj.kyouka == "数学" || obj.kyouka == "理科" || obj.kyouka == "理科" || obj.kyouka == "英語" || obj.kyouka == "体育"){

    // その他はこれに
    } else {
      obj.kyouka = "その他";
    }

    lst.push(obj);
  }

  // 養護教諭も追記しておく
  obj = {'teacher' : "鳥居",
         'kyouka'  : "その他"};
  lst.push(obj);
  
  return lst;
}


// 2次元配列からjavascriptのオフジェクトの配列にする。
// { jyugyouID;"hoge",
//   teacher:["A先生", "B先生"],
//   class : "3-17", "3-17"} みたいなもののリスト
const sentakuList = tools.makeSentakuList(sentakuData);

// この授業のリストはjhk用のデータ。
// 学校全体でどんな授業があるかの一覧
let jyugyouList = [];
function makeJyugyou(jyugyou, cls) {
  let f = function (str) {
    return function (target) {
      if ( target.jyugyou == str ) {
        return true;
      }
    }
  };

  // jyugyou ""のときはクラス名をjyugyouとする
  if (jyugyou == "") {
    // なければ追加
    if (jyugyouList.find(f(cls)) === undefined) {
      jyugyouList.push({'jyugyou' : cls,
                        'cls'     : [cls]
      });
    }

  } else {
    // なければ追加
    if (jyugyouList.find(f(jyugyou)) === undefined) {
      // clsがもともと配列なら
      if (Array.isArray(cls)) {
        jyugyouList.push({'jyugyou' : jyugyou,
                          'cls'     : cls
        });
      } else {
        jyugyouList.push({'jyugyou' : jyugyou,
                          'cls'     : [cls]
        });
      }
    }
  }
}


// 先生の授業設定_名簿付.csv の以下をjavascriptの配列にする
// 先生名,
// userId(sktの),
// 授業ID(sktの),
// name(sktの授業名の意。イデアの授業IDで 現代文 みたいなやつ。後で一覧から読み取るときに使う),
// クラス名(3-1みたいなやつ。後で一覧から読み取るときに使う),
// gakunen,
// cls,
// goudouMeiboId
let jyugyouPerTeacherList = makejyugyouPerTeacherList(jyugyouPteacherData);

function makejyugyouPerTeacherList(arr) {
  let i, teacher ;
  let lst = [];

  function getJyugyouObj(arr) {
    // クラス名があれば
    if (arr[4].length > 0) {
      return { jyugyouId : Number(arr[2]),
               gakunen   : Number(arr[5]),
               cls       : Number(arr[6]),
               name      : arr[3],
               clsName   : arr[4]
             };
    } else {
      return { jyugyouId : Number(arr[2]),
               name      : arr[3],
               clsName   : arr[4]
             };
    }
  }

  for (i = 0; i < arr.length; i++) {
    if (i == 0) {
      teacher = { teacherName : arr[i][0],
                  userId    : arr[i][1],
                  jyugyou   : [],
                  jikanwari : [] };
      teacher.jyugyou.push(getJyugyouObj(arr[i]));

    // ユーザが切り替わったら
    } else if (i != 0 && arr[i][1] != arr[i - 1][1]) {

      lst.push(teacher);

      teacher = { teacherName : arr[i][0],
                  userId    : arr[i][1],
                  jyugyou   : [],
                  jikanwari : [] };
      teacher.jyugyou.push(getJyugyouObj(arr[i]));

    } else {
      teacher.jyugyou.push(getJyugyouObj(arr[i]));
    }
  }

  return lst;
}


const itiranList = makeItiranList(itiranData);
function makeItiranList(arr) {
  const startRow = 3; // ここから先生ごとの時間割が始まる

  let searchTeacher = function (str) {
    return function (target) {
      if ( target.teacherName == str ) {
        return true;
      }
    }
  };
  function addjyugyou(teacher, jyugyouname, clsname, nikka, youbi, koma) {
    let i;

    if (teacher != null) {
      let jId = 0;

      // 不毛な処理をしている気がするが
      // 授業名とクラス名から授業IDを引き当てる
      // まず、授業名とクラス名が両方一致するものを探す
      // クラス単位の授業はここで見つかるはず
      for (i = 0; i < teacher.jyugyou.length; i++) {
        if ( teacher.jyugyou[i].name == jyugyouname &&
             teacher.jyugyou[i].clsName == clsname) {
          jId = teacher.jyugyou[i].jyugyouId;
        }
      }
      // 次に、授業名だけでさがず
      // 選択授業はここでみつかるはず
      if (jId == 0) {
        for (i = 0; i < teacher.jyugyou.length; i++) {
          if ( teacher.jyugyou[i].name == jyugyouname ) {
            jId = teacher.jyugyou[i].jyugyouId;
          }
        }
      }

      teacher.jikanwari.push({ nikka     : nikka,
                               youbi     : youbi,
                               koma      : koma,
                               jyugyouId : jId
                             });
    }
  }

  // 特定の授業IDが選択授業のリストにあるかどうかチェックし、
  // クラスの設定を返す
  // あと、授業のリストを作る。clsStrは授業のリストを作るのにしか使ってない。
  // jyugyouIDStrとclsStrは　先生一覧.csv　における上と下
  function inSentaku (teacherStr, jyugyouIDStr, clsStr) {
    let f = function (str) {
      return function (target) {
        if ( target.jyugyouID == str ) {
          return true;
        }
      }
    };

    // イデアの選択授業の設定のうち、参照する価値のあるものはそれをつかう。
    // つまり特別な処理をする対象の授業IDたちを挙げる
    if (jyugyouIDStr == 'LHR') {
      let obj = sentakuList.find(f(jyugyouIDStr));
      if (obj === undefined) {
        // ないはず
      } else {
        let idx = obj.teacher.indexOf(teacherStr);
        // 見つかるはずの処理
        if (idx != -1) {

          makeJyugyou("", obj.class[idx]);

          return obj.class[idx];
        }
      }

    // 特別な処理をしない授業IDたち　つまり　普通の処理
    // 複数のクラスが混ざる授業は、イデアの選択授業の設定のクラスでは解決しないので
    // 複数のクラスをそのまま設定しておく。
    } else {
      let obj = sentakuList.find(f(jyugyouIDStr));
      // イデアでいう選択授業でないときは　clsStrは　3-1　みたいなものであるはず
      if (obj === undefined) {

        makeJyugyou("", clsStr);

        return "";

      // イデアでいう選択授業であるとき　clsStrは　3-1、3-2、3-3　みたいなものかもしれないし
      // 3-1みたいなものかもしれない
      } else {

        // クラスの連結をばらす。もともと連結されていないデータは単独のリストとなる
        makeJyugyou(jyugyouIDStr, clsStr.split(/[、,]/).map(item => item.trim()) );

        return jyugyouIDStr;
      }
    }
  }

  let lst, i, j, str, jyugyou, nikka, youbi, koma;

  lst = [];

  // 先生ごとの繰り返し
  // イデアから先生一人当たり2行で出力したものを参照する
  // 1行目は授業ID、2行目はクラス。クラスのほうはあてにならない時があるので注意
  for (i = startRow; i < arr.length; i = i + 2) {

    let obj = jyugyouPerTeacherList.find(searchTeacher(arr[i][0]));

    // A週月曜から土曜、B週月曜から金曜の11日×7
    for (j = 1; j <= 77; j++) {

      if (arr[i][j].length > 0) {
        str = inSentaku(arr[i][0], arr[i][j], arr[i + 1][j]);
        // 授業IDが選択授業リストにあるものなら、それをつかう
        if (str != "") {
          jyugyou = str;

        // そうでなければ、次の行のクラス名を使う
        } else {
          jyugyou = arr[i + 1][j];
        }

        if (1 <= j && j <= 7) {
          nikka = 'A';
          youbi = 1;
          koma  = j;
        } else if (8 <= j && j <= 14){
          nikka = 'A';
          youbi = 2;
          koma  = j - 7;
        } else if (15 <= j && j <= 21){
          nikka = 'A';
          youbi = 3;
          koma  = j - 14;
        } else if (22 <= j && j <= 28){
          nikka = 'A';
          youbi = 4;
          koma  = j - 21;
        } else if (29 <= j && j <= 35){
          nikka = 'A';
          youbi = 5;
          koma  = j - 28;
        } else if (36 <= j && j <= 42){
          nikka = 'A';
          youbi = 6;
          koma  = j - 35;
        } else if (43 <= j && j <= 49){
          nikka = 'B';
          youbi = 1;
          koma  = j - 42;
        } else if (50 <= j && j <= 56){
          nikka = 'B';
          youbi = 2;
          koma  = j - 49;
        } else if (57 <= j && j <= 63){
          nikka = 'B';
          youbi = 3;
          koma  = j - 56;
        } else if (64 <= j && j <= 70){
          nikka = 'B';
          youbi = 4;
          koma  = j - 63;
        } else if (71 <= j && j <= 77){
          nikka = 'B';
          youbi = 5;
          koma  = j - 70;
        }
        lst.push({'nikka'   : nikka,
                  'teacher' : arr[i][0],
                  'youbi'   : youbi,
                  'koma'    : koma,
                  'jyugyou' : jyugyou
        });

        addjyugyou(obj, arr[i][j], arr[i + 1][j], nikka, youbi, koma);
      }
    }
    // 一部はクラス名を授業名に差し替える
    // これをしないと、sktの授業名は　数学　みたいな感じ
    // clsNameは現行システムでは未使用
    let idx;
    if (obj != null && obj.jyugyou != null) {
      for (idx = 0; idx < obj.jyugyou.length; idx++) {
        if (obj.jyugyou[idx].name != 'LHR' && obj.jyugyou[idx].clsName != "") {
          obj.jyugyou[idx].name = obj.jyugyou[idx].clsName;
        }
      }
    }
        console.log(obj);

  }

  return lst;
}
*/
let json = JSON.stringify(itiranData);
//fs.writeFileSync(OutputFileName, 'let jhkJikanwari = ' + json);
fs.writeFileSync(OutputFileName, json);

