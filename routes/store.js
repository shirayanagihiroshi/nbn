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
router.post('/:resource', (req, resp) => {

  const target = req.params.resource;

  console.log('*******************');
  console.log(target);
//  console.log(req.body);

  db.insertManyDocuments('hnk_kamoku',
                        req.body,
                        function (res) {
                          resp.json({ success: true, message: "dummy" });
                        });

//  res.json({ success: true, message: "dummy" });
});

export default router;
