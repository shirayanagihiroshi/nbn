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
router.get('/:resource', (req, resp) => {

  const target = req.params.resource;

//  console.log('*******************');
//  console.log(target);

  switch (target) {
    case 'ks_kamoku':
      const nendo = parseInt(req.query.nendo);
      const gakunen = parseInt(req.query.gakunen);
      db.findManyDocuments('ks_kamoku',
                           {nendo:nendo,gakunen:gakunen},
                           {projection:{_id:0}},
                           function (res) {
                             resp.json({ success: true, contents: res });
                           });
    break;

    default:
    break;
  }

//  res.json({ success: true, message: "dummy" });
});

export default router;
