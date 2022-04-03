'use strict';

//------モジュールスコープ変数s--------
  var
    keys = require('./keys'),
    mongodb  = require('mongodb'),
    mongoClient = mongodb.MongoClient,
    connectOption = {useUnifiedTopology: true},
    insertDocument, insertManyDocuments, findManyDocuments, updateDocument,
    deleteManyDocuments,
    dbInConnectionPool; //コネクションはmongoClientが面倒見てくれるはず
                        // 参考 https://teratail.com/questions/296545
//------モジュールスコープ変数e--------

//------ユーティリティメソッドs--------


//------ユーティリティメソッドe--------


//------パブリックメソッドs--------
insertDocument = function (colName, insertObj, callback) {
  let collection = dbInConnectionPool.collection(colName);

  collection.insertOne(insertObj, function (err, result) {
    callback(result);
  });
}

insertManyDocuments = function (colName, insertObj, callback) {
  let collection = dbInConnectionPool.collection(colName);

  collection.insertMany(insertObj, function (err, result) {
    callback(result);
  });
}

findManyDocuments = function (colName, queryObj, outputFieldObj, callback) {
  let collection = dbInConnectionPool.collection(colName);

  // 第一引数に指定する条件の書き方例(ただし、指定するのはクライアントのモデル)
  // 演算子  意味　例
  // $lt     <    { age:{$lt:100} }
  // $lte    <=   { age:{$lte:100} }
  // $gt     >    { age:{$gt:100} }
  // $gte    >=   { age:{$gte:100} }
  // $ne	   !=   { name:{$ne:'mr.a'} }
  // $exists      db.mycol.find({ hoge:{$exists:false} })
  // $or     or   db.mycol.find({$or:[{loves:'apple'},{loves:'energon'}]})

  // 第三引数は結果に含めるカラムだが、 {_id:0} では動かない。
  // {projection:{_id:0}}とする必要がある。
  // また、
  // > https://www.w3schools.com/nodejs/nodejs_mongodb_find.asp
  // > 同じオブジェクトに0と1の両方の値を指定することはできません
  // > （フィールドの1つが_idフィールドである場合を除く）。
  // > 値が0のフィールドを指定すると、他のすべてのフィールドは値1を取得し、
  // > その逆も同様です。
  // > https://www.w3schools.com/nodejs/nodejs_mongodb_find.asp
  collection.find(queryObj, outputFieldObj).toArray(function (err, result) {

    callback(result);
    /*
    let doc;
    for (doc of result) {
      console.log(doc);
      //とりあえず、最初に見つかったのを送ってる。
      //callback(doc);
      break;
    }
    */
  });
}

updateDocument = function (colName, queryObj, updateObj, callback) {
  let collection = dbInConnectionPool.collection(colName);
  collection.updateOne(queryObj, updateObj, { upsert: true }, function (err, result) {
    callback(result);
  });
}

deleteManyDocuments = function (colName, queryObj, callback) {
  let collection = dbInConnectionPool.collection(colName);

  collection.deleteMany(queryObj, function (err, result) {
    callback(result);
  });
}


  module.exports = {
    insertDocument      : insertDocument,
    insertManyDocuments : insertManyDocuments,
    findManyDocuments   : findManyDocuments,
    updateDocument      : updateDocument,
    deleteManyDocuments : deleteManyDocuments
  };
//------パブリックメソッドe--------

//------モジュールの初期化s--------
// 予めDB接続をプールしておいて、アクセス時にはそこから使う。
mongoClient.connect(keys.dbAccessPath, connectOption, function (err, client) {
  dbInConnectionPool = client.db('myproject');
  console.log('db connection success');
});
//------モジュールの初期化e--------
