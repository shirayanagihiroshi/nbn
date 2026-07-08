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
      resp.json({ success: true, nendo: 2026, period: "zenki" });
      break;
    }

    case 'input-sheet':{

      const teacherId = req.query.teacherId;
      const nendo = parseInt(req.query.nendo);

      try {
        let gakunen; //マスターにはないけど、表示したいので、学年を調べて返す。

        // 1. コールバックを使わず、直接 await で結果を受け取る！
        // 第3引数（outputFieldObj）にはプロジェクションを渡します
        const masterRecords = await db.findManyDocuments('ks_master', { teachers: teacherId, nendo: nendo }, { projection: { _id: 0 } });

        if (!masterRecords || masterRecords.length === 0) {
          return resp.json({ success: true, message: "担当科目がありません", data: [] });
        }

        // 各マスターレコードに対して非同期で名簿と成績を同期結合
        const results = await Promise.all(masterRecords.map(async (record) => {
          let rawStudents = [];

          // 2. 名簿データの引き当て
          if (record.meiboInfo.kongoumeibo !== null) {
            // 混合名簿コレクションから検索
            const kongouDataList = await db.findManyDocuments('goudouMeibo', { kongouMeiboId: record.meiboInfo.kongoumeibo }, { projection: { _id: 0 } });
            const kongouData = kongouDataList[0]; // 配列の先頭を取得
            rawStudents = kongouData ? kongouData.students : [];

            gakunen = kongouData ? kongouData.students[0].gakunen : 4; //4は高校1年。生徒が取れなかったときようのガード処理。
          } else {
            // 通常クラスコレクションから検索
            const classDataList = await db.findManyDocuments('class', { gakunen: record.meiboInfo.gakunen, cls: record.meiboInfo.cls }, { projection: { _id: 0 } });
            const classData = classDataList[0];
            rawStudents = classData ? classData.students : [];

            gakunen = record.meiboInfo.gakunen;
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

    default:
    break;
  }

//  res.json({ success: true, message: "dummy" });
});

export default router;
