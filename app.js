'use strict';

//------モジュールスコープ変数s--------
// ライブラリのインポート
import fs from 'fs';                 // ファイルシステム操作用の標準ライブラリ
import path from 'path';             // パス操作用の標準ライブラリ
import { fileURLToPath } from 'url'; // URL変換用の関数
import express from 'express';
import { createServer } from 'https';

// 自作ライブラリのインポート
import keys  from './lib/keys.js';
import crypt from './lib/crypt.js';
import utils from './lib/util_s.js';

// expressルーターの設定
import authRouter  from './routes/auth.js';
import storeRouter from './routes/store.js';
import fetchRouter from './routes/fetch.js';

// ESMモードで「__dirname」を再現するための設定
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 各種初期化設定
const app = express();
const port = 4001;

// HTTPSサーバーの作成
const http = createServer({
  key  : fs.readFileSync(keys.privkeyFilePath),
  cert : fs.readFileSync(keys.certFilePath)
}, app);

//------モジュールスコープ変数e--------
//------ユーティリティメソッドs--------
//------ユーティリティメソッドe--------

//------サーバ構成s--------
  app.use( express.json() ); //bodyParseだったやつ
  app.use('/api/auth',  authRouter);
  app.use('/api/store', storeRouter);
  app.use('/api/fetch', fetchRouter);

  // publicフォルダ内のファイルをブラウザが自動で読み込めるようにする
  app.use( express.static(path.join(__dirname, 'public')));

  app.get('/', function ( request, response ) {
    console.log('request.url : ', request.url);

    response.sendFile(path.join(__dirname, 'public', 'nbn.html'));
  });

//------サーバ構成e--------
//------サーバ起動s--------
  http.listen( port, function () {
    console.log(
      'express server listening on port %d in %s mode',
      port, app.settings.env)
  });

//------サーバ起動e--------
