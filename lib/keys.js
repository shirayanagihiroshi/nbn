'use strict';

    // 本ファイルの設定は各環境に応じて書き換える必要がある。
    // 以下で設定してあるのはローカル開発環境のもの。
    // また本番環境用のキーは機密情報であるから、githubにpushしてはいけない。
  const
    // httpsのプライベートキー、証明書
    privkeyFilePath = 'private.key',
    certFilePath    = 'server.pem',
    // mongoDBのユーザやパスワード
    dbAccessPath    = 'mongodb://testuser1:hogehoge@localhost:27018',
    // 別システムから情報を取得する際のURLとAPIkey
    URLGetFromSKT   = 'https://localhost:3001',
    xapikey         = 'thisIsAPIKeyForTest';

  export default {
    privkeyFilePath : privkeyFilePath,
    certFilePath    : certFilePath,
    dbAccessPath    : dbAccessPath,
    URLGetFromSKT   : URLGetFromSKT,
    xapikey         : xapikey
  };
