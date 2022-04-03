/*
 * nbn.util.js
 * 汎用javascriptユーティリティ
 *
 * Michael S. Mikowski - mmikowski at gmail dot com
 * これらは、webからひらめきを得て、
 * 1998年から作成、コンパイル、アップデートを行ってきたルーチン。
 *
 * MITライセンス
 *
 * makeErrorとsetConfigMapは上記
 * 以降は追加したもの。
 */

nbn.util = (function () {
  'use strict';

  var makeError, setConfigMap, isEmpty, makeDateStr, getWeek,
      getDayOfCalendar, getPreviousBusinessDay, getNextBusinessDay,
      daySelectf, komaSelectf, komaSelectFromDayf, jyugyouSelectf,
      studentSelectf, sortCalendarf, sortKekkaf,
      kekkaStudentSelectf, clsSelectf, dayAndStudentSelectf,
      nengappiAndJyugyouIdSelect, getStyleSheetValue;

  // パブリックコンストラクタ/makeError/
  makeError = function ( name_text, msg_text, data ) {
    var error     = new Error();
    error.name    = name_text;
    error.message = msg_text;

    if ( data ){ error.data = data; }

    return error;
  };

  // パブリックメソッド/setConfigMap/
  setConfigMap = function ( arg_map ){
    var
      input_map    = arg_map.input_map,
      settable_map = arg_map.settable_map,
      config_map   = arg_map.config_map,
      key_name, error;

    for ( key_name in input_map ){
      if ( input_map.hasOwnProperty( key_name ) ){
        if ( settable_map.hasOwnProperty( key_name ) ){
          config_map[key_name] = input_map[key_name];
        }
        else {
          error = makeError( 'Bad Input',
            'Setting config key |' + key_name + '| is not supported'
          );
          throw error;
        }
      }
    }
  };

  // オブジェクトが空かどうか判定
  isEmpty = function (obj) {
    return !Object.keys(obj).length;
  }

  // 日付を文字列で生成
  // dayOffsetは指定日からどれだけずらすかを指定する
  // 1 なら翌日
  // -1 なら前日
  makeDateStr = function (y, m, d, dayOffset=0) {
    let today,
        dayOfWeek = ['日','月','火','水','木','金','土'];

    if ( y === undefined || m === undefined || d === undefined ) {
      today = new Date();
    } else {
      today = new Date(y, m, d);
    }

    if ( dayOffset !=  0 ) {
      today.setDate(today.getDate() + dayOffset);
    }

    return (today.getMonth() + 1) + '/' + //月だけ0始まり
            today.getDate() +
            '(' + dayOfWeek[today.getDay()] + ')';
  }

  // 指定の日を含む一週間のリスト(日曜始まり)を生成
  // weekOffsetは指定日からどれだけずらすかを指定する
  // 1 なら翌週
  // -1 なら先週
  getWeek = function (y, m, d, weekOffset=0) {
    let today, i, startSunday, retList = [];

    if ( y === undefined || m === undefined || d === undefined ) {
      today = new Date();
    } else {
      today = new Date(y, m, d);
    }

    if ( weekOffset !=  0 ) {
      today.setDate(today.getDate() + weekOffset*7 );
    }

    // 週の始まりの日曜を取得
    startSunday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    startSunday.setDate(today.getDate() - today.getDay());

    for (i = 0; i < 7; i++) {
      retList.push({
        year  : startSunday.getFullYear(),
        month : startSunday.getMonth() + 1, //月だけ0始まり
        day   : startSunday.getDate()
      })

      startSunday.setDate(startSunday.getDate() + 1);
    }
    return retList;
  }

  // 指定日が営業日かどうか判定する。
  // カレンダー情報
  // [{"year":2021, "month":10, "day":1, "nikka":"A"}
  //  ,{"year":2021, "month":10, "day":2, "nikka":"A"}・・・
  // が必要。
  //
  // 戻り値 はオフジェクト
  // result : treu   営業日
  //        : false  営業日でない
  // nikka  : A or B
  // gyouji : 行事(あれば)
  getDayOfCalendar = function (y, m, d, calendar) {
    if (calendar != null) {
      let day = calendar.find(daySelectf(y,m,d));

      if (day != undefined) {
        day.result = true;
        return day;
      }
    }
    return {result:false};
  }

  daySelectf = function (y, m, d) {
    return function ( target ) {
      if ((target.year == y) && (target.month == m) && (target.day == d)) {
        return true;
      }
    };
  }

  komaSelectf = function (nikka, youbi, koma) {
    return function (target) {
      if (youbi == 6) { //土曜日は日課を見ない
        if (target.youbi == youbi && target.koma == koma) {
          return true;
        }
      } else {
        if (target.nikka == nikka && target.youbi == youbi && target.koma == koma) {
          return true;
        }
      }
    }
  }

  komaSelectFromDayf = function (year, month, day, koma) {
    return function (target) {
      if (target.year == year && target.month == month && target.day == day && target.koma == koma) {
        return true;
      }
    }
  }

  jyugyouSelectf = function (jyugyouId) {
    return function (target) {
      if (target.jyugyouId == jyugyouId) {
        return true;
      }
    }
  }

  studentSelectf = function (gakunen, cls, bangou) {
    return function (target) {
      if ( (target.gakunen == gakunen) && (target.cls == cls) && (target.bangou == bangou)) {
        return true;
      }
    }
  }

  kekkaStudentSelectf = function (gakunen, cls, bangou, jyugyouId) {
    return function (target) {
      if ( (target.contents.length != 0) &&
           (target.jyugyouId == jyugyouId) &&
           (target.contents.findIndex(studentSelectf(gakunen, cls, bangou)) != -1) ){
        return true;
      } else {
        return false;
      }
    }
  }

  clsSelectf = function (gakunen, cls) {
    return function (target) {
      if ( (target.gakunen == gakunen) && (target.cls == cls) ) {
      return true;
      }
    }
  }

  dayAndStudentSelectf = function (year, month, day, gakunen, cls, bangou) {
    return function (target) {
      if ( (target.year    == year)    && (target.month == month) && (target.day    == day)  &&
           (target.gakunen == gakunen) && (target.cls   == cls)   && (target.bangou == bangou) ) {
        return true;
      }
    }
  }

  // カレンダーをソートするときの比較関数
  sortCalendarf = function (a, b) {
    if (a.year < b.year) {
      return -1;
    } else if (a.year == b.year) {
      if (a.month < b.month) {
        return -1;
      } else if (a.month == b.month) {
        if (a.day < b.day) {
          return -1;
        } else if (a.day == b.day) {
          return 0;
        } else if (a.day > b.day) {
          return 1;
        }
      } else if (a.month > b.month) {
        return 1;
      }
    } else if (a.year > b.year) {
      return 1;
    }
  }

  // 欠課データをソートするときの比較関数
  sortKekkaf = function (a, b) {
    if (a.year < b.year) {
      return -1;
    } else if (a.year == b.year) {
      if (a.month < b.month) {
        return -1;
      } else if (a.month == b.month) {
        if (a.day < b.day) {
          return -1;
        } else if (a.day == b.day) {
          if (a.koma < b.koma) {         // カレンダーのソートと大体同じだけど
            return -1;                   // 日付が同じなら、〇時間目で比較する。
          } else if (a.koma == b.koma) { // つまりこのへんだけ追加。
            return 0;                    //
          } else {                       //
            return 1;                    //
          }                              //
        } else if (a.day > b.day) {
          return 1;
        }
      } else if (a.month > b.month) {
        return 1;
      }
    } else if (a.year > b.year) {
      return 1;
    }
  }

  // 開始日から終了日までに含まれるデータをフィルターする。開始や終了日は含める。
  nengappiAndJyugyouIdSelect = function (startY, startM, startD, endY, endM, endD, jyugyouId) {
    return function (target) {
      let startPeriod = new Date(startY, startM, startD),
        endPeriod   = new Date(endY, endM, endD),
        tartgetPeriod = new Date(target.year, target.month, target.day),
        tartgetP = tartgetPeriod.getTime();

      if ( (startPeriod.getTime() <= tartgetP) && (tartgetP <= endPeriod.getTime()) && (target.jyugyouId == jyugyouId) ) {
        return true;
      } else {
        return false;
      }
    }
  }

  // 指定日の前の営業日を返す。
  // カレンダーを必要とし、さらに、カレンダーは日付順にソートされいてる前提。
  getPreviousBusinessDay = function (year, month, day, calendar) {
    let i, calendarDay,
        obj = { year : year, month : month, day : day},
        shiteibi = new Date(year, month - 1, day);

    if (calendar != null) {
      for (i=0; i < calendar.length; i++) {
        calendarDay = new Date(calendar[i].year,
                               calendar[i].month - 1,
                               calendar[i].day);
        if (shiteibi.getTime() <= calendarDay.getTime()) {
          break;
        }
      }
      if (i == 0) {
        obj.year  = calendar[0].year;
        obj.month = calendar[0].month;
        obj.day   = calendar[0].day;
        obj.nikka = calendar[0].nikka;
      } else {
        obj.year  = calendar[i-1].year;
        obj.month = calendar[i-1].month;
        obj.day   = calendar[i-1].day;
        obj.nikka = calendar[i-1].nikka;
      }
    }
    return obj;
  }

  getNextBusinessDay = function (year, month, day, calendar) {
    let i, calendarDay,
        obj = { year : year, month : month, day : day},
        shiteibi = new Date(year, month - 1, day);

    if (calendar != null && calendar.length > 0) {
      for (i=calendar.length - 1; 0 <= i ; i--) {
        calendarDay = new Date(calendar[i].year,
                               calendar[i].month - 1,
                               calendar[i].day);
        if (shiteibi.getTime() >= calendarDay.getTime()) {
          break;
        }
      }
      if (i == calendar.length - 1) {
        obj.year  = calendar[calendar.length - 1].year;
        obj.month = calendar[calendar.length - 1].month;
        obj.day   = calendar[calendar.length - 1].day;
        obj.nikka = calendar[calendar.length - 1].nikka;
      } else {
        obj.year  = calendar[i+1].year;
        obj.month = calendar[i+1].month;
        obj.day   = calendar[i+1].day;
        obj.nikka = calendar[i+1].nikka;
      }
    }
    return obj;
  }

  // クラス名とプロパティ名を指定して、外部CSSで設定してある値を参照する。
  getStyleSheetValue = function (clsName, propertyName) {
    let retValue = null;

    if (clsName != "" && propertyName != "") {
      let container, style;

      container = document.querySelector(clsName);

      if (container != null) {
        style = window.getComputedStyle(container);
        retValue = style.getPropertyValue(propertyName);
      }
    }

    return retValue;
  }

  return {
    makeError    : makeError,
    setConfigMap : setConfigMap,
    isEmpty      : isEmpty,
    makeDateStr  : makeDateStr,
    getWeek      : getWeek,
    getDayOfCalendar       : getDayOfCalendar,
    getPreviousBusinessDay : getPreviousBusinessDay,
    getNextBusinessDay     : getNextBusinessDay,
    sortCalendarf          : sortCalendarf,
    daySelectf             : daySelectf,
    komaSelectf            : komaSelectf,
    komaSelectFromDayf     : komaSelectFromDayf,
    jyugyouSelectf         : jyugyouSelectf,
    studentSelectf         : studentSelectf,
    kekkaStudentSelectf    : kekkaStudentSelectf,
    clsSelectf             : clsSelectf,
    dayAndStudentSelectf   : dayAndStudentSelectf,
    sortKekkaf             : sortKekkaf,
    nengappiAndJyugyouIdSelect : nengappiAndJyugyouIdSelect,
    getStyleSheetValue     : getStyleSheetValue
  };
}());
