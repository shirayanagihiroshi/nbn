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
router.post('/:resource', (req, response) => {

  const target = req.params.resource;

  console.log('*******************');
  console.log(target);
//  console.log(req.body.contents);

  switch (target) {
    case 'ks_kamoku':
      // この年度のデータをすべて削除してから登録する。
      db.deleteManyDocuments('ks_kamoku',
                             {nendo : req.body.nendo},
                             function (resp) {
                               db.insertManyDocuments('ks_kamoku',
                                                      req.body.contents,
                                                      function (res) {
                                                        response.json({ success: true, message: res });
                                                      });
                             });
    break;

    case 'ks_master':
      // この年度のデータをすべて削除してから登録する。
      db.deleteManyDocuments('ks_master', { nendo: req.body.nendo }, (deleteResp) => {
        db.insertManyDocuments('ks_master', req.body.contents, (insertRes) => {
          response.json({ success: true, message: "マスターを更新しました", data: insertRes });
        });
      });
    break;

    default:
    break;
  }

//  res.json({ success: true, message: "dummy" });
});

export default router;
