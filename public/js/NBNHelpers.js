// UIに関係する処理で、幾つもの画面から使われるものをまとめる。
// モデルの操作は別モジュールとする。

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
 * @param {string} str 全角英数字を含むかもしれない文字列
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
 * @param {string} text TSV
 */
export function NBNParseExcelData(text) {
    // 改行コード（Windowsは\r\n、Macは\n両対応）で区切って行ごとの配列にする
    const rows = text.trim().split(/\r?\n/);

    // 各行を「タブ（\t）」で区切って、二次元配列を作る
    return rows.map(row => row.split('\t'));
}

/**
 * 二次元配列を横に結合するメソッド
 * @param {string[][]} matrixLeft 結合する表(左)
 * @param {string[][]} matrixRight 結合する表(右)
 */
export function NBNconbineMatrixHorizon(matrixLeft, matrixRight) {
  // 横に結合する
  const combined = matrixLeft.map((row, index) => {
    // matrixLeft の各行（row）に、matrixRight の同じ行（index番目）を合体させる
    return row.concat(matrixRight[index]);
  });
  return combined;
}

/**
 * 二次元配列を縦に結合するメソッド
 * @param {string[][]} matrixUpper 結合する表(上)
 * @param {string[][]} matrixLower 結合する表(下)
 */
export function NBNconbineMatrixVertical(matrixUpper, matrixLower) {
  // 下方向に結合する
  return matrixUpper.concat(matrixLower);
}

/**
 * 二次元配列のj列目からk列目までで、かつi行目以降を切り出すメソッド
 * @param {string[][]} matrix 切り出す元の表
 * @param {number} i 切り出す行(ここ以降) これ以降欲しい　(0スタート)
 * @param {number} j 切り出す列(start) ここから欲しい　(0スタート)
 * @param {number} k 切り出す列(end) ここまで欲しい　(0スタート)
 */
export function NBNextracteMatrix(matrix, i, j, k) {
  const extracted = matrix.map(row => {
    // 各行を、sliceを使って最初のn要素だけに切り詰める
    return row.slice(j, k+1);
  });
  return extracted.slice(i, matrix.length);
}

/**
 * 二次元配列をhtmlのtableへ変換する高度な共通関数
 * @param {Array} matrix 二次元配列
 * @param {Function} cellConfigFn 各セルの設定を決める関数
 * (row, col, value) => { isHeader   : true,           // <th> タグで出力する
 *                        colspan    : 11,
 *                        isEditable : false, 
 *                        className  : 'header-style' // 任意でクラスも指定可
 * @return {string} HTML文字列
 */
export function NBNrenderTable(matrix, cellConfigFn) {
  if (!matrix || matrix.length === 0) return '';

  let html = '<table>';
  matrix.forEach((row, rowIndex) => {
    
    // 行(tr)全体の判定: colIndex = -1 としてコールバックを一度呼び出して行用の設定を取る
    const rowConfig = cellConfigFn ? cellConfigFn(rowIndex, -1, null) : {};
    const trClassAttr = rowConfig.rowClassName ? ` class="${rowConfig.rowClassName}"` : '';

    html += `<tr${trClassAttr}>`;

    let skipCount = 0;

    row.forEach((cell, colIndex) => {
      // colspan による結合領域のセル描画をスキップ
      if (skipCount > 0) {
        skipCount--;
        return;
      }

      // 各セル(td/th)ごとの設定を取得
      const config = cellConfigFn ? cellConfigFn(rowIndex, colIndex, cell) : {};

      const isEditable = config.isEditable || false;
      const colspan = config.colspan || 1;

      // HTML属性の組み立て
      const colspanAttr = colspan > 1 ? ` colspan="${colspan}"` : '';
      
      if (colspan > 1) {
        skipCount = colspan - 1;
      }

      // セル側のクラス組み立て
      const classList = [];
      if (isEditable) classList.push('editable-cell');
      if (config.className) classList.push(config.className);
      
      const classAttr = classList.length > 0 ? ` class="${classList.join(' ')}"` : '';
      const contentEditable = isEditable ? ' contenteditable="true"' : '';

      // タグの判定と出力
      const tag = config.isHeader ? 'th' : 'td';
      html += `<${tag}${classAttr}${contentEditable}${colspanAttr}>${cell}</${tag}>`;
    });

    html += '</tr>';
  });
  html += '</table>';
  return html;
}


/**
 * 昨年、今年、来年のリストのHTLMを返す関数
 * @param {}
 */
export function NBNGetYearsList() {
  const today = new Date();  // 今日の日付データを作る
  const thisYear = today.getFullYear(); // 今年（4桁の西暦）を取得
  const lastYear = thisYear - 1; // 今年 - 1 で昨年を取得
  const nextYear = thisYear + 1; // 今年 + 1 で来年を取得

  let str = '<option value="' + String(lastYear) + '">' + String(lastYear) + '</option>';
  str += '<option value="' + String(thisYear) + '" selected>' + String(thisYear) + '</option>';
  str += '<option value="' + String(nextYear) + '">' + String(nextYear) + '</option>';
  return str;
}

/**
 * 高校の学年のリストのHTLMを返す関数
 * @param {}
 */
export function NBNGetGakunenList() {
  let str = '<option value="4">高校1年</option>';
  str += '<option value="5">高校2年</option>';
  str += '<option value="6">高校3年</option>';
  return str;
}

/**
 * 略称から教員IDを返す
 * 担当が複数人いるときは/で区切る。outputは配列になる
 * @param {string[][]} matrix 略称が記載された表
 * @param {object[]}   list   teacherIDとryakusyouをもつオブジェクトの配列
 */
export function NBNGetTeacherIDFromRyakusyou(matrix, list) {
let i, j, templst;
  let OutputMatrix = [];

  for (i = 0; i < matrix.length; i++) {
    templst = [];
    for (j = 0; j < matrix[0].length; j++) {
      if (matrix[i][j] == null || matrix[i][j].length == 0) {
        templst.push("");
      } else {
        // 1. セルの文字列（例: "浜松A/浜松B"）を「/」で分解して配列にする ➡ ["浜松A", "浜松B"]
        // 担当が一人だけのときも、要素が一つの配列が返るので同じロジックでOK
        const ryakusyouArray = matrix[i][j].split('/');
        // 2. 分解したそれぞれの名前を、IDに変換する
        const idArray = ryakusyouArray.map(name => {
          // 前後の余計なスペース（全角半角）を削っておくお守り（trim）を入れておくと安全です
          const cleanName = name.trim(); 
          const t = list.find(obj => obj.ryakusyou == cleanName);
          return t ? t.teacherID : cleanName; // 変換リストにあればID、なければ元の名前
        });
        templst.push(idArray);
      }
    }
    OutputMatrix.push(templst);
  }
  return OutputMatrix;
}


/**
 * 名簿情報文字列をオブジェクトに変換する
 * 学年は中1:1,中2:2,中3:3,高1:4,高2:5,高3:6
 * 例："3-1"
 *      =>{  gakunen: 6,
 *           cls: 1,
 *           kongoumeibo: null
 *        }
 * 例：1
 *      =>{  gakunen: null,
 *           cls: null,
 *           kongoumeibo: 1
 *        }
 * @param {string[][]} matrix 名簿情報文字列が記載された表
 */
export function NBNGetClsInfoFromClsStr(matrix) {
  if (!matrix || matrix.length === 0) return [];

  let i, j;
  let templst = [];
  let OutputMatrix = [];

  for (i = 0; i < matrix.length; i++) {
    templst = [];
    for (j = 0; j < matrix[0].length; j++) {
      const cell = matrix[i][j];

      // 1. 基本となるすべて null のオブジェクトを用意
      let meiboObj = {
        gakunen: null,
        cls: null,
        kongoumeibo: null
      };

      // 2. セルが空（null, undefined, 空文字）の場合は、すべてnullのままプッシュ
      if (cell === null || cell === undefined || String(cell).trim() === "") {
        templst.push(meiboObj);
      } else {
        // 文字列かつハイフン「-」が含まれる場合は「通常のクラス（例: "3-1"）」
        if (typeof cell === 'string' && cell.includes('-')) {
          const parts = cell.split('-');
          const rawGakunen = parseInt(parts[0], 10); // 3
          const rawCls     = parseInt(parts[1], 10); // 1

          // 現状高校のみ対応（高1=4, 高2=5, 高3=6）
          meiboObj.gakunen = rawGakunen + 3; 
          meiboObj.cls = rawCls;
        } else {
          // ハイフンがない、または数値の場合は「混合名簿ID」とみなす
          meiboObj.kongoumeibo = Number(cell);
        }
        
        templst.push(meiboObj);
      }
    }
    OutputMatrix.push(templst);
  }
  return OutputMatrix;
}

/**
 * 出席番号で指定した生徒一人について、sktから取得した出欠情報を参照して数を数える
 * @param {object[]} skydata 1クラス分に絞りこまれた出欠データ
 */
export function NBNSyukketsuCountPerStudent(bangou, sktdata, startYear, startMonth, startDay, endYear, endMonth, endDay) {
    const skReasons = ['reason1', 'reason2', 'reason3', 'reason4' , 'reason5', 'reason6', 'reason7', 'reason8', 'reason9'],
      skReasonStr = ['頭痛'   , '腹痛'   , '通院'   , '体調不良', '発熱'   , '感染'   , '受験'   , '不注意' , 'その他'];

      // sktのskCountPerPersonと基本的に同じ実装で不要な部分だけコメントアウトしてある。
      let totalPerKind, syutteiStr, byouketsuStr, jikoketsuStr, tikokuStr, soutaiStr, kouketsuStr,
        retDetail = "",
        selectBangou = function ( bangou ) {
          return function ( target ) {
            if (target.bangou == bangou) {
              return true;
            }
          };
        },
        resetCounter = function (target) {
          let i;
          for (i = 0; i < skReasons.length; i++) {
            target[skReasons[i]] = 0;
          }
        },
        countUp = function (target,reason) {
          target[skReasons[reason-1]]++; //targetのメンバであるreason1のうち、該当するものをカウントアップする。
        },
        countTotalPerKind = function (target) {
          let i, tempSum = 0;
          for (i = 0; i < skReasons.length; i++) {
            tempSum += target[skReasons[i]];
          }
          return tempSum; //targetのメンバであるreason1,reason2・・・たちの和を返す。
        },
        showReason = function (target) {
          let i, retStr = "";
          for (i = 0; i < skReasons.length; i++) {
            if (target[skReasons[i]] != 0) {
              retStr += skReasonStr[i] + String(target[skReasons[i]]) + ','
            }
          }
          if (retStr != "" ) { retStr = retStr.slice(0, -1); }//最後の ',' は邪魔なので削除
          return retStr;
        },
        daycheck = function (y, m, d, sy, sm, sd, ey, em, ed) {
          let targetDate = new Date(y, m - 1, d),
            targett   = targetDate.getTime(),
            startDate = new Date(sy, sm - 1, sd),
            endDate   = new Date(ey, em - 1, ed);

          if (startDate.getTime() <= targett && targett <= endDate.getTime()) {
            return true;
          } else {
            return false;
          }
        },
        cKind1 = {},
        cKind2 = {},
        cKind3 = {},
        cKind4 = {},
        cKind5 = {},
        cKind6 = 0; // 公欠は理由を求めないので特別扱い

    if ( sktdata != null && sktdata.length != 0 ) {

      resetCounter(cKind1);
      resetCounter(cKind2);
      resetCounter(cKind3);
      resetCounter(cKind4);
      resetCounter(cKind5);
      cKind6 = 0; // 公欠は理由を求めないので特別扱い

      // 日毎の繰り返し
      sktdata.forEach( function ( target ) {
        // 対象外の日時なら飛ばす
        if (daycheck(target.year, target.month, target.day, startYear, startMonth, startDay, endYear, endMonth, endDay)) {
          // 欠席者等がいて
          if ( target.member != null && target.member.length != 0 ) {
            let p = target.member.find(selectBangou(bangou));
            // それがこの人だったときは集計
            if ( p != null ) {
              if ( (p.kind & 1) == 1) {
                countUp( cKind1, p.reason );
              }
              if ( (p.kind & 2) == 2 ) {
                countUp( cKind2, p.reason );
              }
              if ( (p.kind & 4) == 4 ) {
                countUp( cKind3, p.reason );
              }
              if ( (p.kind & 8) == 8 ) {
                countUp( cKind4, p.reason );
              }
              if ( (p.kind & 16) == 16 ) {
                countUp( cKind5, p.reason );
              }
              if ( (p.kind & 32) == 32 ) {
                cKind6++;// 公欠は理由を求めないので特別扱い
              }

              // 集計ついでに詳細も追記してゆく
              //retDetail += String(target.month) + '/'+ String(target.day) + rnObj2Htm(bangou, [p], "") + ' ';
            }
          }
        }
      });
      // 数え終えたので、それを表示
      /*
      totalPerKind = countTotalPerKind(cKind1);
      if ( totalPerKind != 0 ) {
        syutteiStr   = String(totalPerKind) + '(' + showReason(cKind1) + ')' ;
      }
      totalPerKind = countTotalPerKind(cKind2);
      if ( totalPerKind != 0 ) {
        byouketsuStr = String(totalPerKind) + '(' + showReason(cKind2) + ')';
      }
      totalPerKind = countTotalPerKind(cKind3);
      if ( totalPerKind != 0 ) {
        jikoketsuStr = String(totalPerKind) + '(' + showReason(cKind3) + ')';
      }
      totalPerKind = countTotalPerKind(cKind4);
      if ( totalPerKind != 0 ) {
        tikokuStr    = String(totalPerKind) + '(' + showReason(cKind4) + ')';
      }
      totalPerKind = countTotalPerKind(cKind5);
      if ( totalPerKind != 0 ) {
        soutaiStr    = String(totalPerKind) + '(' + showReason(cKind5) + ')';
      }
      if ( cKind6 != 0 ) {
        kouketsuStr  = String(cKind6);
      }
      */
    }
    /*
    return { syuttei   : syutteiStr,
             byouketsu : byouketsuStr,
             jikoketsu : jikoketsuStr,
             tikoku    : tikokuStr,
             soutai    : soutaiStr,
             kouketsu  : kouketsuStr,
             detail    : retDetail };
    */

  return { syussekiTeishi : countTotalPerKind(cKind1),
           ryuugaku : 0,
           kesseki : countTotalPerKind(cKind2) + countTotalPerKind(cKind3),
           chikoku : countTotalPerKind(cKind4),
           soutai : countTotalPerKind(cKind5)};
}
