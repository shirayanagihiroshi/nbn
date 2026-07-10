'use strict';

/**
 * routes/fetch.js
 * サーバ側のデータ取得処理
 * 
 */
import express from 'express';
const router = express.Router();
import db    from '../lib/database.js';

// ここでは '/api/fetch/:resource' ではなく、子パスの '/:resource' だけを書く
router.get('/:resource', async (req, resp) => {

  const target = req.params.resource;

//  console.log('*******************');
//  console.log(target);

  switch (target) {
    case 'ks_kamoku': {
      const nendo = parseInt(req.query.nendo);
      const gakunen = parseInt(req.query.gakunen);
      const res = await db.findManyDocuments('ks_kamoku',
                                             {nendo:nendo,gakunen:gakunen},
                                             {projection:{_id:0}});
      resp.json({ success: true, contents: res });
      break;
    }

    case 'ks_manage': {
      try {
        // 検索条件を空 {} にしてコレクション内の全件を取得（データは1件のみの想定）
        const configs = await db.findManyDocuments('ks_manage', {}, {});

        // まだデータベース上に一度も設定が無い（配列が空の）場合の初期モック値
        if (!configs || configs.length === 0) {
          return resp.json({
            success: true,
            nendo: 2026,
            periods: {
              4: { zenki: false, kouki: false, tsunen: false },
              5: { zenki: false, kouki: false, tsunen: false },
              6: { zenki: false, kouki: false, tsunen: false }
            },
            syukketsuPeriods: {
              4: { zenki: false, kouki: false },
              5: { zenki: false, kouki: false },
              6: { zenki: false, kouki: false }
            },
            jugyouNissu: {
              4: { zenki: 0, kouki: 0 },
              5: { zenki: 0, kouki: 0 },
              6: { zenki: 0, kouki: 0 }
            }
          });
        }

        // 配列の最初の1件を取り出す
        const config = configs[0];
        config.success = true;

        return resp.json(config);

      } catch (err) {
        console.error('設定取得エラー:', err);
        return resp.status(500).json({ success: false, message: 'サーバーエラーが発生しました。' });
      }
      break; 
    }

    case 'input-sheet':{

      const teacherId = req.query.teacherId;
      const nendo = parseInt(req.query.nendo);

      try {
        // 1. コールバックを使わず、直接 await で結果を受け取る！
        // 第3引数（outputFieldObj）にはプロジェクションを渡します
        const masterRecords = await db.findManyDocuments('ks_master', { teachers: teacherId, nendo: nendo }, { projection: { _id: 0 } });

        if (!masterRecords || masterRecords.length === 0) {
          return resp.json({ success: true, message: "担当科目がありません", data: [] });
        }

        // 各マスターレコードに対して非同期で名簿と成績を同期結合
        const results = await Promise.all(masterRecords.map(async (record) => {
          let rawStudents = [];

          // 入力画面の左側の科目の一覧で学年も表示したいので、科目に設定されている学年を調べる
          const targetkamoku = await db.findManyDocuments('ks_kamoku', { nendo: record.nendo, kamokuId: record.kamokuId }, { projection: { _id: 0 } });
          const gakunen = targetkamoku[0].gakunen;

          // 2. 名簿データの引き当て
          if (record.meiboInfo.kongoumeibo !== null) {
            // 混合名簿コレクションから検索
            const kongouDataList = await db.findManyDocuments('goudouMeibo', { kongouMeiboId: record.meiboInfo.kongoumeibo }, { projection: { _id: 0 } });
            const kongouData = kongouDataList[0]; // 配列の先頭を取得
            rawStudents = kongouData ? kongouData.students : [];
          } else {
            // 通常クラスコレクションから検索
            const classDataList = await db.findManyDocuments('class', { gakunen: record.meiboInfo.gakunen, cls: record.meiboInfo.cls }, { projection: { _id: 0 } });
            const classData = classDataList[0];
            rawStudents = classData ? classData.students : [];
          }

          // 3. 入力済みの成績データを取得
          let scoreQuery = { nendo: record.nendo, kamokuId: record.kamokuId };
          if (record.meiboInfo.kongoumeibo === null) {
            scoreQuery.gakunen = record.meiboInfo.gakunen;
            scoreQuery.cls = record.meiboInfo.cls;
          }

          // 綺麗に一発で成績配列が取れます
          const currentSavedScores = await db.findManyDocuments('ks_seiseki', scoreQuery, { projection: { _id: 0 } });

          // 4. 名簿と成績データを出席番号でガッチャンコ（ここは前回と同じ）
          const studentList = rawStudents.map(student => {
            const sGakunen = student.gakunen || record.meiboInfo.gakunen;
            const sCls = student.cls || record.meiboInfo.cls;

            const scoreRecord = currentSavedScores.find(s => 
              s.gakunen === sGakunen && 
              s.cls === sCls && 
              s.bangou === student.bangou
            );

            return {
              gakunen: sGakunen,
              cls: sCls,
              bangou: student.bangou,
              name: student.name,
              zenki: scoreRecord ? scoreRecord.zenki : { hyouka: null, kanten: [], kekka: 0 },
              kouki: scoreRecord ? scoreRecord.kouki : { hyouka: null, kanten: [], kekka: 0 },
              tsunen: scoreRecord ? scoreRecord.tsunen : { hyoutei: null }
            };
          });

          return {
            nendo: record.nendo,
            kamokuId: record.kamokuId,
            kamokuName: record.kamokuName,
            tanni: record.tanni,
            meiboInfo: record.meiboInfo,
            students: studentList,
            gakunen: gakunen,
          };
        }));
    
        //  5. フロントにまとめて返却
        resp.json({ success: true, data: results });
    
      } catch (error) {
        console.error("データ取得・整形エラー:", error);
        resp.status(500).json({ success: false, message: "データ処理に失敗しました" });
      }
      break;
    }

    case 'syukketsu-sheet':{

      const teacherId = req.query.teacherId;
      const nendo = parseInt(req.query.nendo);

      try {
        // 1. 担任しているクラス（classコレクション）を検索
        const classDataList = await db.findManyDocuments(
          'class', 
          { tannin: teacherId }, 
          { projection: { _id: 0 } }
        );

        // 担任クラスが見つからない場合
        if (!classDataList || classDataList.length === 0) {
          return resp.json({ 
            success: true, 
            message: "担当しているクラスが見つかりません", 
            classInfo: null, 
            students: [] 
          });
        }

        const classData = classDataList[0];
        const gakunen = classData.gakunen;
        const cls = classData.cls;
        const rawStudents = classData.students || [];

        // 2. 各生徒に対して非同期で ks_syukketsu コレクションから出欠データを取得（Promise.all）
        const studentList = await Promise.all(rawStudents.map(async (student) => {

          // 生徒特定クエリ（年度・学年・組・番号）
          const syukketsuQuery = {
            nendo: nendo,
            gakunen: gakunen,
            cls: cls,
            bangou: student.bangou
          };

          // 該当生徒の出欠データを取得
          const savedRecords = await db.findManyDocuments(
            'ks_syukketsu', 
            syukketsuQuery, 
            { projection: { _id: 0 } }
          );

          const syukketsuRecord = savedRecords && savedRecords.length > 0 ? savedRecords[0] : null;

          return {
            gakunen:gakunen,
            cls:cls,
            bangou: student.bangou,
            studentName: student.name,
            // 保存済みデータがあればそれを、無ければ初期値（空文字）をセット
            zenki: syukketsuRecord && syukketsuRecord.zenki ? syukketsuRecord.zenki : {
              syussekiTeishi: '',
              ryuugaku: '',
              kesseki: '',
              chikoku: '',
              soutai: ''
            },
            kouki: syukketsuRecord && syukketsuRecord.kouki ? syukketsuRecord.kouki : {
              syussekiTeishi: '',
              ryuugaku: '',
              kesseki: '',
              chikoku: '',
              soutai: ''
            }
          };
        }));

        // 3. フロントへ返却
        resp.json({
          success: true,
          classInfo: {
            gakunen: gakunen,
            cls: cls
          },
          students: studentList
        });
      } catch (error) {
        console.error("出欠データ取得・整形エラー:", error);
        resp.status(500).json({ success: false, message: "データ処理に失敗しました" });
      }
      break;
    }

    case 'gakunen-summary':{
      try {
        const nendo = Number(req.query.nendo);
        const gakunen = Number(req.query.gakunen); // DB内部値 (4, 5, 6など)

        // 1. 対象年度・学年の「科目一覧」を取得（sortNo順にソート）
        const kamokuList = await db.findManyDocuments('ks_kamoku', 
          { nendo, gakunen }, 
          { sort: { sortNo: 1 } }
        );

        // 2. 対象年度・学年の「全生徒の成績データ」を取得
        const seisekiList = await db.findManyDocuments('ks_seiseki', { nendo, gakunen });

        // 3. 対象年度・学年の「全生徒の出欠データ」を取得
        const syukketsuList = await db.findManyDocuments('ks_syukketsu', { nendo, gakunen });

        // ----------------------------------------------------
        // データの紐付け（マージ処理）
        // ----------------------------------------------------

        // 生徒ごとのユニークキーを作るヘルパー ("1_19" => 1組19番)
        const getStudentKey = (item) => `${item.cls}_${item.bangou}`;

        // A. 出欠データをベースに生徒マップを作成
        const studentMap = {};

        syukketsuList.forEach(syukketsu => {
          const key = getStudentKey(syukketsu);
          studentMap[key] = {
            cls: syukketsu.cls,
            bangou: syukketsu.bangou,
            studentName: syukketsu.studentName,
            syukketsu: {
              zenki: syukketsu.zenki,
              kouki: syukketsu.kouki
            },
            seisekiMap: {}, // 科目IDをキーにした成績マップ { 'h2001': { zenki: ..., tsunen: ... } }
            totalTani: 0    // 履修合計単位数
          };
        });

        // B. 成績データを生徒マップに紐付け ＆ 単位数の加算
        seisekiList.forEach(seiseki => {
          const key = getStudentKey(seiseki);

          // 出欠に生徒がいればそのマップを使用、なければ新規登録（安全対策）
          if (!studentMap[key]) {
            studentMap[key] = {
              cls: seiseki.cls,
              bangou: seiseki.bangou,
              studentName: seiseki.studentName,
              syukketsu: {},
              seisekiMap: {},
              totalTani: 0
            };
          }

          // 成績を科目IDキーで格納
          studentMap[key].seisekiMap[seiseki.kamokuId] = {
            zenki: seiseki.zenki,
            kouki: seiseki.kouki,
            tsunen: seiseki.tsunen
          };

          // 該当科目の単位数を特定して加算（履修チェック）
          // ※ 成績ドキュメントが存在する ＝ その科目を履修していると判定
          const targetKamoku = kamokuList.find(k => k.kamokuId === seiseki.kamokuId);
          if (targetKamoku && targetKamoku.tani) {
            studentMap[key].totalTani += Number(targetKamoku.tani) || 0;
          }
        });

        // C. 生徒一覧を クラス順 -> 番号順 にソートして配列化
        const studentSummaryList = Object.values(studentMap).sort((a, b) => {
          if (a.cls !== b.cls) return a.cls - b.cls;
          return a.bangou - b.bangou;
        });

        // レスポンス返却
        return resp.json({
          success: true,
          nendo,
          gakunen,
          kamokuHeader: kamokuList, // 列ヘッダー生成用科目リスト
          students: studentSummaryList
        });

      } catch (err) {
        console.error('学年サマリー取得エラー:', err);
        return resp.status(500).json({ success: false, message: 'サーバーエラーが発生しました。' });
      }
      break;
    }

    default:
    break;
  }

//  res.json({ success: true, message: "dummy" });
});

export default router;
