const keys     = require('./lib/keys');
const fs       = require('fs');
const express  = require('express');
const app      = express();
const http     = require('https').createServer({
                   key  : fs.readFileSync(keys.privkeyFilePath),
                   cert : fs.readFileSync(keys.certFilePath)
                 }, app );
const db       = require('./lib/database');
const utils    = require('./lib/util_s');
const port     = 4001;

// JSON形式のボディを解析するためのミドルウェア
app.use( express.json() );

app.use( express.static( __dirname + '/public' ) ); // ややはまった。これがsetwatchの設定の前にあるとだめ

app.get('/', function ( request, response ) {
  console.log('request.url');
  console.log(request.url);

  response.sendFile( __dirname +'/public/nbn.html' );
});


app.post('/api/login', (req, res) => {
  // fetchのbodyで送ったデータが req.body に入る
  const { userid, password } = req.body;

  console.log(`ログイン試行: ${userid}`);

  // 本来はここでデータベース照合などを行う
  if (userid === 'admin' && password === '1234') {
    res.json({ 
      success: true, 
      message: 'ログイン成功！',
      user: { name: '管理者' }
    });
  } else {
    // 認証失敗時は 401(Unauthorized) などのステータスコードを返すとより丁寧
    res.status(401).json({ 
      success: false, 
      message: 'IDまたはパスワードが違います' 
    });
  }
});

http.listen(port, () => console.log('Server running on port ', port));
