'use strict';

/**
 * routes/fetch.js
 * サーバ側の認証処理
 * 
 */
import crypto from 'crypto'; // ランダムなトークンの生成
import bcrypt from 'bcrypt'; // パスワードのハッシュ化・照合

import express from 'express';
const router = express.Router();
import db    from '../lib/database.js';

// ここでは '/api/fetch/:resource' ではなく、子パスの '/:resource' だけを書く
router.post('/login', async (req, res) => {
  const userid   = req.body.userid;
  const password = req.body.password;

  try {
    // 1. user コレクションから userId で検索
    // ※ 1件取得するDB共通関数（findOne等）があればそちらに差し替えてください
    const users = await db.findManyDocuments('user', { userId: userid });
    
    if (!users || users.length === 0) {
      return res.json({ success: false, message: "ユーザーIDまたはパスワードが違います" });
    }
    
    const user = users[0];

    // 2. パスワードのハッシュ値照合
    // bcrypt のハッシュ値（文字列）の中には、saltの情報もすべて最初から埋め込まれています。
    // $2b$  08$  W3lKbIkUTs1Krc2VkXeYn.  6Lq1dUBUxQr.FGDvem9RulIAzRp0Wte
    // [アルゴ] [Cost] [      salt (22文字)     ] [        暗号化されたハッシュ本体        ]
    // そのため、bcrypt.compare() を実行したとき、ライブラリ側がハッシュ文字列の中から
    // 自動的に salt を読み取り、同じ条件で比較してくれます。
    // こちらで salt を別途保持したり、指定したりする必要はありません。
    // 別システムと同じアルゴリズム（bcrypt）で照合されるため、
    // ユーザーは別システムで設定したパスワードと同じもので問題なくログイン可能です！
    const isMatch = await bcrypt.compare(password, user.passWord);
    if (!isMatch) {
      return res.json({ success: false, message: "ユーザーIDまたはパスワードが違います" });
    }

    // 3. ランダムなトークンを生成 (例: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d)
    const token = crypto.randomUUID();

    // 4. DBの該当ユーザーにトークンを書き込む
    await db.updateDocument('user', { userId: user.userId }, { $set: { token: token } });

    // 特定のユーザに管理画面を見せる
    let kanri = false;
    if (user.userId == "teacher001" || user.userId == "teacher002") {
      kanri = true;
      console.log("login kanri");
    } else  {
      console.log("login not kanri");
    }
    
    // 5. フロントに トークン と 先生の名前 を返す
    res.json({
      success: true,
      message: "ログイン成功",
      token: token,
      name: user.name,
      kanri:kanri
    });

  } catch (error) {
    console.error("ログイン処理エラー:", error);
    res.status(500).json({ success: false, message: "サーバーエラーが発生しました" });
  }
});

router.post('/logout', async (req, res) => {
  const token = req.body.token;

  if (!token) {
    return res.json({ success: true, message: "トークンがありません" });
  }

  try {
    // DB上の該当ユーザーの token フィールドをクリア（空文字に更新）
    await db.updateDocument('user', { token: token }, { $set: { token: "" } });

    res.json({
      success: true,
      message: "ログアウトしました"
    });

  } catch (error) {
    console.error("ログアウト処理エラー:", error);
    res.status(500).json({ success: false, message: "ログアウト処理中にエラーが発生しました" });
  }
});

export default router;
