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

    default:
    break;
  }

//  res.json({ success: true, message: "dummy" });
});

export default router;
