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
      //この設定はdummy DBから取って返すようにする。
      resp.json({ success: true,
                  nendo: 2026,
                  periods:{ // 成績入力の可/不可
                   4: { zenki: true,  kouki: false, tsunen: false }, // 高1
                   5: { zenki: true,  kouki: false, tsunen: false }, // 高2
                   6: { zenki: false, kouki: true,  tsunen: true  }  // 高3
                  },
                  syukketsuPeriods:{ // 出欠入力の可/不可
                   4: { zenki: false,  kouki: false }, // 高1
                   5: { zenki: true,  kouki: false }, // 高2
                   6: { zenki: false, kouki: true  }  // 高3
                  },
                  jugyouNissu:{ // 授業日数
                   4: { zenki: 100,  kouki: 110 }, // 高1
                   5: { zenki: 101,  kouki: 111 },  // 高2
                   6: { zenki: 102,  kouki: 123  }  // 高3
                  }
                });
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

    default:
    break;
  }

//  res.json({ success: true, message: "dummy" });
});

export default router;
