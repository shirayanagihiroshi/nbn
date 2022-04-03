# 簡易ドキュメント共有webアプリ
## 概要

簡易的にドキュメント共有をするwebアプリである。


「シングルページWebアプリケーション
――Node.js、MongoDBを活用したJavaScript SPA」
Michael S. Mikowski、Josh C. Powell　著、佐藤 直生　監訳、木下 哲也　訳

を参考に作ってあり、サーバ側では認証、データの保持をする。その他の処理は主にクライアントのブラウザで行う。

## 環境
サーバ側はnode.jsとmongodbが必要。クライアントはブラウザで該当URLにアクセスすれば良い。mongodがあらかじめ動いている必要があり、DBにある程度の情報が登録されている必要がある。

### バージョン
- node.js : v12.18.3
- mongodb : v4.4.2

## 実行
- サーバ側 : このリポジトリをcloneし、`npm install`そして、`node app.js`
する。ただし、`lib/keys.js`にあるhttpsの鍵、mongodbのユーザは相応に変更が必要。

### 設計
別ファイル参照。
