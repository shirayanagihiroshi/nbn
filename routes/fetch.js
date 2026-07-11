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

      const token = req.query.token;
      const nendo = parseInt(req.query.nendo, 10);

      try {
        // トークンから教員IDを検索
        if (!token) {
          return res.status(401).json({ success: false, message: "認証情報がありません" });
        }
        const users = await db.findManyDocuments('user', { token: token }, { projection: { _id: 0 } });
        if (!users || users.length === 0) {
          // トークンが一致しない＝ログアウト済み、または無効なトークン
          return res.status(401).json({ success: false, message: "セッションが切れています。再ログインしてください" });
        }
        // ログイン中の教員IDを取得
        const teacherId = users[0].userId;

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

      const token = req.query.token;
      const nendo = parseInt(req.query.nendo);

      try {
        // トークンから教員IDを検索
        if (!token) {
          return res.status(401).json({ success: false, message: "認証情報がありません" });
        }
        const users = await db.findManyDocuments('user', { token: token }, { projection: { _id: 0 } });
        if (!users || users.length === 0) {
          // トークンが一致しない＝ログアウト済み、または無効なトークン
          return res.status(401).json({ success: false, message: "セッションが切れています。再ログインしてください" });
        }
        // ログイン中の教員IDを取得
        const teacherId = users[0].userId;

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
    const targetGakki = req.query.gakki || 'zenki';

    // 1. 各種コレクションから該当年度・学年のデータを一斉に取得
    const [
      kamokuList,
      masterList,
      classList,
      goudouList,
      seisekiList,
      syukketsuList,
      manageList
    ] = await Promise.all([
      db.findManyDocuments('ks_kamoku', { nendo:nendo, gakunen:gakunen }, { projection: { _id: 0 } }),
      db.findManyDocuments('ks_master', { nendo:nendo }, { projection: { _id: 0 } }), // 単位数や名簿の紐付けマスター
      db.findManyDocuments('class', { gakunen:gakunen }, { projection: { _id: 0 } }), // 学年のクラス名簿
      db.findManyDocuments('goudouMeibo', { }, { projection: { _id: 0 } }), // 年度内の合同名簿
      db.findManyDocuments('ks_seiseki', { nendo:nendo, gakunen:gakunen }, { projection: { _id: 0 } }),
      db.findManyDocuments('ks_syukketsu', { nendo:nendo, gakunen:gakunen }, { projection: { _id: 0 } }),
      db.findManyDocuments('ks_manage', { systemConfigKey: 'MASTER_CONFIG' }, { projection: { _id: 0 } })
    ]);

    // 対象学年の期間許可設定を取得
    const manageDoc = manageList[0] || {};
    const currentGakunenPeriods = (manageDoc.periods && manageDoc.periods[String(gakunen)]) || { zenki: false, kouki: false, tsunen: false };

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

    const jugyouNissuConfig = (manageDoc.jugyouNissu && manageDoc.jugyouNissu[String(gakunen)]) || { zenki: 0, kouki: 0 };

    Object.values(studentMap).forEach(student => {
      ['zenki', 'kouki'].forEach(gKey => {
        const sData = student.syukketsu[gKey];
        
        // 1. 授業日数（出席すべき日数）を管理データ(ks_manage)からセット
        const syussekiSubeki = Number(jugyouNissuConfig[gKey]) || 0;
        sData.syussekiSubeki = syussekiSubeki;

        // 2. DBに入力されている値を数値として取得（未入力なら0として扱う）
        const teishi = Number(sData.syussekiTeishi) || 0;
        const ryuugaku = Number(sData.ryuugaku) || 0;
        const kesseki = Number(sData.kesseki) || 0;

        // 3. 計算式の適用
        // 要出席日数 = 授業日数 - 出停・忌引等 - 留学授業日数
        const youSyusseki = syussekiSubeki - teishi - ryuugaku;
        // 出席日数 = 要出席日数 - 欠席日数
        const syusseki = youSyusseki - kesseki;

        // 4. 計算結果をプロパティに割り当て
        sData.youSyusseki = youSyusseki;
        sData.syusseki = syusseki;
      });
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
    // C. 単位数（ks_master基準）の集計ロジック（総単位数 & 入力済単位数）
    // ----------------------------------------------------
    Object.values(studentMap).forEach(student => {
      let totalTaniSum = 0;     // 履修予定の総単位数
      let inputTaniSum = 0;     // 入力完了済みの単位数

      kamokuList.forEach(kamoku => {
        // 1. 選択中の時期（targetGakki）において、この科目が対象外ならスキップ
        const isTargetKamokuForPeriod = 
          (targetGakki === 'zenki' && kamoku.zenki === true) ||
          (targetGakki === 'kouki' && kamoku.kouki === true) ||
          (targetGakki === 'tsunen' && kamoku.godankai === true);

        if (!isTargetKamokuForPeriod) {
          return; // 対象外の科目のため、総単位数にも入力済単位数にも含めない
        }

        const matchingMasters = masterList.filter(m => m.kamokuId === kamoku.kamokuId);

        matchingMasters.forEach(master => {
          const info = master.meiboInfo || {};
          let isBelong = false;

          // --- 生徒の履修チェック ---
          if (info.kongoumeibo !== null && info.kongoumeibo !== undefined) {
            // パターン1: 合同名簿（混合名簿）の場合
            const targetGoudou = goudouList.find(g => g.goudouMeiboId === info.kongoumeibo);
            if (targetGoudou && Array.isArray(targetGoudou.students)) {
              const found = targetGoudou.students.some(s => 
                Number(s.gakunen) === gakunen && 
                Number(s.cls) === student.cls && 
                Number(s.bangou) === student.bangou
              );
              if (found) isBelong = true;
            }
          } else {
            // パターン2: 通常クラス割り当ての場合
            if (Number(info.gakunen) === gakunen && Number(info.cls) === student.cls) {
              isBelong = true;
            }
          }

          // --- 2. 単位数の加算および入力完了判定 ---
          if (isBelong) {
            const masterTanni = Number(master.tanni) || 0;
            
            // 対象科目＆履修生徒であるため、総単位数に加算
            totalTaniSum += masterTanni;

            const seiData = student.seisekiMap[kamoku.kamokuId];

            if (seiData) {
              let isCompleted = false;

              // 画面で「前期」表示時
              if (targetGakki === 'zenki') {
                const z = seiData.zenki;
                const isZenkiEntered = z && Array.isArray(z.kanten) && z.kanten.length > 0 &&
                                       z.hyouka !== null && z.hyouka !== "" &&
                                       z.kekka !== null && z.kekka !== "";

                if (currentGakunenPeriods.zenki && isZenkiEntered) {
                  isCompleted = true;
                }
              }
              
              // 画面で「後期」表示時
              else if (targetGakki === 'kouki') {
                const k = seiData.kouki;
                const isKoukiEntered = k && Array.isArray(k.kanten) && k.kanten.length > 0 &&
                                       k.hyouka !== null && k.hyouka !== "" &&
                                       k.kekka !== null && k.kekka !== "";

                if (currentGakunenPeriods.kouki && isKoukiEntered) {
                  isCompleted = true;
                }
              }

              // 画面で「通年」表示時
              else if (targetGakki === 'tsunen') {
                const t = seiData.tsunen;
                const isTsunenEntered = t && t.hyoutei !== null && t.hyoutei !== undefined && t.hyoutei !== "";

                if (currentGakunenPeriods.tsunen && isTsunenEntered) {
                  isCompleted = true;
                }
              }

              // 条件を満たしていれば入力済単位数にカウント
              if (isCompleted) {
                inputTaniSum += masterTanni;
              }
            }
          }
        });
      });

      student.inputTani = inputTaniSum;
      student.totalTani = totalTaniSum;
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
