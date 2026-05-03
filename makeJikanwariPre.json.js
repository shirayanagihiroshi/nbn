/*
makeJikanwari.json.js のヘッダーを見よ
*/

const tools = require('./makeJikanwariTool.json.js');
const path  = require('path');
const fs    = require('fs');
// 日本語をうまく扱えないときはjavascriptのファイルの文字コードに注意。shiftjisだとダメだった。
const teacherFileName           = '先生名出力.csv';            // 入力 【手動でsktのIDの付与が必要！】
const sentakuFileName           = '選択授業の授業設定.csv';    // 入力
const jyugyouPerTeacherFileName = '先生の授業設定.csv';        // 入力
const jyugyouPerTeacherCSV      = '先生の授業設定_名簿付.csv'; // 出力

// csvファイルの読み取り
let source = path.join(__dirname, teacherFileName);
let teacherNameFile = fs.readFileSync(source, 'utf8');

source     = path.join(__dirname, sentakuFileName);
let sentakuFile     = fs.readFileSync(source, 'utf8');

source     = path.join(__dirname, jyugyouPerTeacherFileName);
let jyugyouPteacher = fs.readFileSync(source, 'utf8');

// BOM（\ufeff）があれば除去する
if (teacherNameFile.startsWith('\ufeff')) {
  teacherNameFile = teacherNameFile.slice(1);
}

if (sentakuFile.startsWith('\ufeff')) {
  sentakuFile     = sentakuFile.slice(1);
}

if (jyugyouPteacher.startsWith('\ufeff')) {
  jyugyouPteacher = jyugyouPteacher.slice(1);
}

// 全角の数字を半角の数字に変換。全角のハイフンも半角に
teacherNameFile = tools.toHalfWidth(teacherNameFile);
sentakuFile     = tools.toHalfWidth(sentakuFile);
jyugyouPteacher = tools.toHalfWidth(jyugyouPteacher);

// データを二次元配列に変換する
const teacherData         = tools.convertCSVtoArray(teacherNameFile);
const sentakuData         = tools.convertCSVtoArray(sentakuFile);
const jyugyouPteacherData = tools.convertCSVtoArray(jyugyouPteacher);


const teacherListForSkt = makeTeacherListForSkt(teacherData);
// イデアのユーザ名とsktのuserIDの対応表を作る
function makeTeacherListForSkt(arr) {
  let i, lst, obj;
  lst = [];

  for (i = 0; i < arr.length; i++) {

    obj = {'teacher'   : arr[i][0],  // 先頭の教員名を使う
           'sktUserID' : arr[i][4]}; // 5番目にsktのuserIDを手動で入れる

    lst.push(obj);
  }
  return lst;
}

function className2gakunenCls(str) {
  let temp, gakunen, cls;
  
  temp = str.split('-').map(item => item.trim());
  if ( temp[1] == 'A' ) {
    gakunen = temp[0];
    cls = 1;
  } else if ( temp[1] == 'B' ) {
    gakunen = temp[0];
    cls = 2;
  } else if ( temp[1] == 'C' ) {
    gakunen = temp[0];
    cls = 3;
  } else {
    gakunen = String(Number(temp[0]) + 3);
    cls     = temp[1];
  }
  return { gakunen : gakunen,
           cls     : cls };
}


// '選択授業の授業設定.csv' を
// 2次元配列からjavascriptのオフジェクトの配列にする。
const sentakuList = tools.makeSentakuList(sentakuData);

const str = makecsv(jyugyouPteacherData);

function makecsv(arr) {
  const startRow = 1; // ここから先生ごとの授業設定が始まる

  let f = function (str) {
    return function (target) {
      if ( target.jyugyouID == str ) {
        return true;
      }
    }
  };
  let f2 = function (str) {
    return function (target) {
      if ( target.teacher == str ) {
        return true;
      }
    }
  };

  let i, str, teacherName, sktuserId, obj, jyugyouId, makingFlg;

  str = "";
  makingFlg = false;

  // 先生名,
  // userId(sktの),
  // 授業ID(sktの),
  // name(sktの授業名の意。イデアの授業IDで 現代文 みたいなやつ。後で一覧から読み取るときに使う),
  // クラス名(3-1みたいなやつ。後で一覧から読み取るときに使う),
  // gakunen,
  // cls,
  // goudouMeiboId
  // が繰り返されるCSVを作る
  for (i = startRow; i < arr.length; i++) {

    if (arr[i][0] == "先生名" ) {

      jyugyouId = 1;

      teacherName = arr[i][1] ;
      obj = teacherListForSkt.find(f2(teacherName));
      if (obj === undefined) {
        sktuserId = "";
      } else {
        sktuserId = obj.sktUserID;
      }

      makingFlg = true;

    } else if (makingFlg == true) {
      if (arr[i][0] == "授業ID") { // do nothing

      } else if (arr[i][0] == "合計時間") {
        makingFlg = false;

      // CSV生成処理のメイン
      } else {
        let clsName, gakunen, cls;

        // 特殊な処理をする授業
        if (arr[i][0] == 'LHR') {
          let obj = sentakuList.find(f(arr[i][0]));
          if (obj === undefined) {
          } else {
            let idx = obj.teacher.indexOf(teacherName);
            // 見つかるはずの処理
            if (idx != -1) {
              clsName = obj.class[idx];
            }
            let setting = className2gakunenCls(clsName);
            if (setting.cls === undefined) {
            }
            gakunen = setting.gakunen;
            cls     = setting.cls;
          }
        } else {

          // 選択名簿になければ
          // クラス名が　3-1　みたいになっているはず。
          // これをsktの授業名としておく
          // ここから学年と組を抽出
          if (sentakuList.find(f(arr[i][0])) === undefined ) {
            clsName = arr[i][3];

            let setting = className2gakunenCls(clsName);
            gakunen = setting.gakunen;
            cls     = setting.cls;

          // 選択名簿にあれば、合同名簿のIDの設定が必要
          } else {
            clsName = "";
            gakunen = "";;
            cls     = "";
          }
        }

        goudouMeiboId = ""; //これはどこからも引き当てられない。後で手動で設定する

        str = str + teacherName + ',' + sktuserId + ',' + String(jyugyouId) + ','+ arr[i][0] + ',' + clsName + ',' + gakunen + ',' + cls + ',' + goudouMeiboId + '\n';
        jyugyouId++;
      }
    }
  }
  return str;
}

fs.writeFileSync(jyugyouPerTeacherCSV, str);
