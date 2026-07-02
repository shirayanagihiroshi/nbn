'use strict';

// routes/auth.js
import express from 'express';
const router = express.Router();

// ここでは '/api/auth/login' ではなく、子パスの '/login' だけを書く
router.post('/login', (req, res) => {

    const userid  = req.body.userid;
    const password = req.body.password;
    console.log('/api/login');
    console.log(userid);
    console.log(password);

  // ログイン処理
  res.json({ success: true, message: "ログイン成功" });
});

router.post('/logout', (req, res) => {
  // ログアウト処理
  res.json({ success: true });
});

export default router;
