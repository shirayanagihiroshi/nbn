'use strict';

/**
 * routes/store.js
 * サーバ側のデータ保存処理
 * 
 */
import express from 'express';
const router = express.Router();
import db    from '../lib/database.js';

// ここでは '/api/store/:resource' ではなく、子パスの '/:resource' だけを書く
router.post('/:resource', async (req, response) => {

  const target = req.params.resource;

  console.log('*******************');
  console.log(target);
//  console.log(req.body.contents);

  switch (target) {
    case 'ks_kamoku':
      try {
        // 1. この年度のデータをすべて削除（結果を待つ）
        await db.deleteManyDocuments('ks_kamoku', { nendo: req.body.nendo });
        // 2. 新しいコンテンツを一括登録（結果を待つ）
        const insertRes = await db.insertManyDocuments('ks_kamoku', req.body.contents);
        // 3. 正常終了のレスポンスを返す
        response.json({ success: true, message: "科目を更新しました", data: insertRes });
      } catch (error) {
        // どこかでエラーが起きた場合の安全対策
        console.error("データ更新エラー:", error);
        response.status(500).json({ success: false, message: "データの更新に失敗しました" });
      }
    break;

    case 'ks_master':
      try {
        await db.deleteManyDocuments('ks_master', { nendo: req.body.nendo });
        const insertRes = await db.insertManyDocuments('ks_master', req.body.contents);
        response.json({ success: true, message: "マスターを更新しました", data: insertRes });
      } catch (error) {
        console.error("データ更新エラー:", error);
        response.status(500).json({ success: false, message: "データの更新に失敗しました" });
      }
    break;

    case 'ks_manage': {
      try {
        const { nendo, periods, syukketsuPeriods, jugyouNissu } = req.body;

        // コレクション内の唯一のドキュメントを特定するための固定キー
        const queryObj = { systemConfigKey: "MASTER_CONFIG" };

        // 保存・上書きする内容の定義
        const updateObj = {
          $set: {
            systemConfigKey: "MASTER_CONFIG",
            nendo: Number(nendo),
            periods,
            syukketsuPeriods,
            jugyouNissu,
            updatedAt: new Date()
          }
        };

        // 指定された共通関数 updateDocument を用いて一括 upsert 更新
        await db.updateDocument('ks_manage', queryObj, updateObj);

        return response.json({ success: true, message: '設定情報を保存しました。' });

      } catch (err) {
        console.error('設定保存エラー:', err);
        return response.status(500).json({ success: false, message: 'サーバーエラーが発生しました。' });
      }
      break;
    }

    case 'ks_seiseki':

      try {
        const contents = req.body.contents; // フロントから送られてきた生徒×成績の配列

        // 1件ずつループして「上書き または 追加」を実行
        for (const item of contents) {
          // 1. 検索条件（ピンポイントでこの生徒のこの科目を特定する）
          const query = {
            nendo: item.nendo,
            gakunen: item.gakunen,
            cls: item.cls,
            bangou: item.bangou,
            kamokuId: item.kamokuId
          };

          // 2. ピンポイントで上書き更新（存在しなければ新規作成）
          await db.updateDocument(
            'ks_seiseki',
            query,
            { $set: item } // $set を使うことで送られたデータで上書きします
          );
        }

        response.json({ success: true, message: "成績データを正常に保存・上書きしました" });

      } catch (error) {
        console.error("成績データ更新エラー:", error);
        response.status(500).json({ success: false, message: "データの更新に失敗しました" });
      }
    break;

    case 'ks_syukketsu':

      try {
        const { students } = req.body;

        if (!Array.isArray(students) || students.length === 0) {
          return resp.status(400).json({ success: false, message: '保存対象のデータがありません。' });
        }

        // 各生徒のデータを updateDocument を使って upsert 保存
        await Promise.all(students.map(async (student) => {
          // 検索条件（年度、学年、組、番号）
          const queryObj = {
            nendo: student.nendo,
            gakunen: student.gakunen,
            cls: student.cls,
            bangou: student.bangou
          };

          // 更新内容（$set）
          const updateObj = {
            $set: {
              nendo: student.nendo,
              gakunen: student.gakunen,
              cls: student.cls,
              bangou: student.bangou,
              studentName: student.studentName,
              zenki: student.zenki,
              kouki: student.kouki,
              updatedAt: new Date()
            }
          };

          // 共通関数 updateDocument の呼び出し (ks_syukketsu コレクション)
          await db.updateDocument('ks_syukketsu', queryObj, updateObj);
        }));

        return response.json({ success: true, message: '出欠データを正常に保存しました。' });

      } catch (err) {
        console.error('出欠保存エラー:', err);
        return response.status(500).json({ success: false, message: 'サーバーエラーが発生しました。' });
      }
    break;

    default:
    break;
  }

//  res.json({ success: true, message: "dummy" });
});

export default router;
