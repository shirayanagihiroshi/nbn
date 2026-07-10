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
      const nendo = parseInt(req.query.nendo, 10);

      try {
        const masterRecords = await db.findManyDocuments('ks_master', { teachers: teacherId, nendo: nendo }, { projection: { _id: 0 } });

        if (!masterRecords || masterRecords.length === 0) {
          return resp.json({ success: true, message: "担当科目がありません", data: [] });
        }

        // 各マスターレコードに対して非同期で名簿と成績を同期結合
        const results = await Promise.all(masterRecords.map(async (record) => {
          let rawStudents = [];

          // 科目に設定されている学年を調べる
          const targetkamoku = await db.findManyDocuments('ks_kamoku', { nendo: record.nendo, kamokuId: record.kamokuId }, { projection: { _id: 0 } });
          const gakunen = targetkamoku && targetkamoku[0] ? targetkamoku[0].gakunen : null;

          // 2. 名簿データの引き当て
          if (record.meiboInfo.kongoumeibo !== null && record.meiboInfo.kongoumeibo !== undefined) {
            
            // 修正：キー名をテストデータに合わせて 'goudouMeiboId' に変更
            // 念のため、検索するIDの値を数値型（Number）にキャスト
            const targetId = Number(record.meiboInfo.kongoumeibo);
            const kongouDataList = await db.findManyDocuments('goudouMeibo', { goudouMeiboId: targetId }, { projection: { _id: 0 } });
            
            const kongouData = kongouDataList[0];
            rawStudents = kongouData ? kongouData.students : [];
          } else {
            // 通常クラスコレクションから検索
            const classDataList = await db.findManyDocuments('class', { gakunen: record.meiboInfo.gakunen, cls: record.meiboInfo.cls }, { projection: { _id: 0 } });
            const classData = classDataList[0];
            rawStudents = classData ? classData.students : [];
          }

          // 3. 入力済みの成績データを取得
          let scoreQuery = { nendo: record.nendo, kamokuId: record.kamokuId };
          if (record.meiboInfo.kongoumeibo === null || record.meiboInfo.kongoumeibo === undefined) {
            scoreQuery.gakunen = record.meiboInfo.gakunen;
            scoreQuery.cls = record.meiboInfo.cls;
          }

          const currentSavedScores = await db.findManyDocuments('ks_seiseki', scoreQuery, { projection: { _id: 0 } });

          // 4. 名簿と成績データを出席番号でガッチャンコ
          const studentList = rawStudents.map(student => {
            // 合同名簿（生徒ごとに所属が違う）と通常名簿の両方に対応できるよう、値を安全に取得
            const sGakunen = student.gakunen ? Number(student.gakunen) : Number(record.meiboInfo.gakunen || gakunen);
            const sCls = student.cls ? Number(student.cls) : Number(record.meiboInfo.cls);

            const scoreRecord = currentSavedScores.find(s => 
              Number(s.gakunen) === sGakunen && 
              Number(s.cls) === sCls && 
              Number(s.bangou) === Number(student.bangou)
            );

            return {
              gakunen: sGakunen,
              cls: sCls,
              bangou: Number(student.bangou),
              name: student.name,
              zenki: scoreRecord ? scoreRecord.zenki : { hyouka: null, kanten: [], kekka: 0 },
              kouki: scoreRecord ? scoreRecord.kouki : { hyouka: null, kanten: [], kekka: 0 },
              tsunen: scoreRecord ? scoreRecord.tsunen : { hyoutei: null }
            };
          });

          // フロントで並び順が崩れないようにクラス・番号でソート
          studentList.sort((a, b) => {
            if (a.cls !== b.cls) return a.cls - b.cls;
            return a.bangou - b.bangou;
          });

          return {
            nendo: record.nendo,
            kamokuId: record.kamokuId,
            kamokuName: record.kamokuName,
            tanni: record.tanni,
            meiboInfo: record.meiboInfo,
            students: studentList,
            gakunen: gakunen, // これがフロント側での「何年成績」かの期間ロック解除判定に使われます
            zenki: targetkamoku && targetkamoku[0] ? targetkamoku[0].zenki : false,
            kouki: targetkamoku && targetkamoku[0] ? targetkamoku[0].kouki : false,
            godankai: targetkamoku && targetkamoku[0] ? targetkamoku[0].godankai : false
          };
        }));
    
        // 5. フロントにまとめて返却
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
    const gakunen = Number(req.query.gakunen);

    // 1. 各種コレクションから該当年度・学年のデータを一斉に取得
    const [
      kamokuList,
      masterList,
      classList,
      goudouList,
      seisekiList,
      syukketsuList
    ] = await Promise.all([
      db.findManyDocuments('ks_kamoku', { nendo:nendo, gakunen:gakunen }, { projection: { _id: 0 } }),
      db.findManyDocuments('ks_master', { nendo:nendo }, { projection: { _id: 0 } }), // 単位数や名簿の紐付けマスター
      db.findManyDocuments('class', { gakunen:gakunen }, { projection: { _id: 0 } }), // 学年のクラス名簿
      db.findManyDocuments('goudouMeibo', { }, { projection: { _id: 0 } }), // 年度内の合同名簿
      db.findManyDocuments('ks_seiseki', { nendo:nendo, gakunen:gakunen }, { projection: { _id: 0 } }),
      db.findManyDocuments('ks_syukketsu', { nendo:nendo, gakunen:gakunen }, { projection: { _id: 0 } })
    ]);

    // 生徒用ユニークキー作成ヘルパー ("クラス_番号")
    const getStudentKey = (c, b) => `${c}_${b}`;

    // ----------------------------------------------------
    // A. 行ベースの作成（出欠ではなく、クラス名簿を主軸にする）
    // ----------------------------------------------------
    const studentMap = {};

    classList.forEach(clsDoc => {
      const clsNum = clsDoc.cls;
      if (!Array.isArray(clsDoc.students)) return;

      clsDoc.students.forEach(st => {
        const key = getStudentKey(clsNum, st.bangou);
        studentMap[key] = {
          cls: clsNum,
          bangou: st.bangou,
          studentName: st.name,
          syukketsu: { zenki: {}, kouki: {} }, // デフォルト空オブジェクト
          seisekiMap: {},
          totalTani: 0
        };
      });
    });

    // ----------------------------------------------------
    // B. 出欠データと成績データのマッピング
    // ----------------------------------------------------
    syukketsuList.forEach(syu => {
      const key = getStudentKey(syu.cls, syu.bangou);
      if (studentMap[key]) {
        studentMap[key].syukketsu = {
          zenki: syu.zenki || {},
          kouki: syu.kouki || {}
        };
      }
    });

    seisekiList.forEach(sei => {
      const key = getStudentKey(sei.cls, sei.bangou);
      if (studentMap[key]) {
        studentMap[key].seisekiMap[sei.kamokuId] = {
          zenki: sei.zenki || {},
          kouki: sei.kouki || {},
          tsunen: sei.tsunen || {}
        };
      }
    });

    // ----------------------------------------------------
    // C. 単位数（ks_master基準）の集計ロジック
    // ----------------------------------------------------
    // 各生徒をループし、ks_master と合致する科目の単位数を足し合わせる
    Object.values(studentMap).forEach(student => {
      let taniSum = 0;

      kamokuList.forEach(kamoku => {
        // この科目に紐付くマスター情報を抽出
        const matchingMasters = masterList.filter(m => m.kamokuId === kamoku.kamokuId);

        matchingMasters.forEach(master => {
          const info = master.meiboInfo || {};
          let isBelong = false;

          if (info.kongoumeibo !== null && info.kongoumeibo !== undefined) {
            // パターン1: 合同名簿（混合名簿）の場合
            const targetGoudou = goudouList.find(g => g.goudouMeiboId === info.kongoumeibo );
            if (targetGoudou && Array.isArray(targetGoudou.students)) {
              // 合同名簿の生徒配列の中に、対象生徒（学年、クラス、番号が一致）がいるかチェック
              const found = targetGoudou.students.some(s => 
                Number(s.gakunen) === gakunen && 
                Number(s.cls) === student.cls && 
                Number(s.bangou) === student.bangou
              );
              if (found) isBelong = true;
            }else {
              // IDが一致する合同名簿が見つからなかった場合に確認するためのデバッグログ
              console.log(`[警告] 一致する合同名簿IDが見つかりません。探したID: ${targetGoudouId}`);
            }
          } else {
            // パターン2: 通常クラス割り当ての場合（学年とクラスが一致するか）
            if (Number(info.gakunen) === gakunen && Number(info.cls) === student.cls) {
              isBelong = true;
            }
          }

          // 履修が確認できたら、このマスターに設定されている単位数を加算
          if (isBelong) {
            taniSum += Number(master.tanni) || 0;
          }
        });
      });

      student.totalTani = taniSum;
    });

    // ----------------------------------------------------
    // D. クラス順 -> 番号順 にソートして配列化
    // ----------------------------------------------------
    const studentSummaryList = Object.values(studentMap).sort((a, b) => {
      if (a.cls !== b.cls) return a.cls - b.cls;
      return a.bangou - b.bangou;
    });

    return resp.json({
      success: true,
      nendo,
      gakunen,
      kamokuHeader: kamokuList, // 表示する科目の列（sortNo順）
      students: studentSummaryList
    });

  } catch (err) {
    console.error('学年サマリー構築エラー:', err);
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
