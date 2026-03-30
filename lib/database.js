'use strict';

//------モジュールスコープ変数s--------
  var
    keys = require('./keys'),
    { MongoClient } = require('mongodb'),
    dbName = 'myproject',
    insertDocument, insertManyDocuments, findManyDocuments, updateDocument,
    deleteManyDocuments;

  const client = new MongoClient(keys.dbAccessPath + dbName);

//------モジュールスコープ変数e--------

//------ユーティリティメソッドs--------


//------ユーティリティメソッドe--------


//------パブリックメソッドs--------
insertDocument = async function (colName, insertObj, callback) {
  const database = client.db(dbName);
  const collection = database.collection(colName);

  const result = await collection.insertOne(insertObj);
  callback(result);
}

insertManyDocuments = async function (colName, insertObj, callback) {
  const database = client.db(dbName);
  const collection = database.collection(colName);

  const result = await collection.insertMany(insertObj);
  callback(result);
}

findManyDocuments = async function (colName, queryObj, outputFieldObj, callback) {
  const database = client.db(dbName);
  const collection = database.collection(colName);

  // 第一引数に指定する条件の書き方例(ただし、指定するのはクライアントのモデル)
  // 演算子  意味　例
  // $lt     <    { age:{$lt:100} }
  // $lte    <=   { age:{$lte:100} }
  // $gt     >    { age:{$gt:100} }
  // $gte    >=   { age:{$gte:100} }
  // $ne	   !=   { name:{$ne:'mr.a'} }
  // $exists      db.mycol.find({ hoge:{$exists:false} })
  // $or     or   db.mycol.find({$or:[{loves:'apple'},{loves:'energon'}]})

  // 第ニ引数は結果に含めるカラムだが、 {_id:0} では動かない。
  // {projection:{_id:0}}とする必要がある。
  // また、
  // > https://www.w3schools.com/nodejs/nodejs_mongodb_find.asp
  // > 同じオブジェクトに0と1の両方の値を指定することはできません
  // > （フィールドの1つが_idフィールドである場合を除く）。
  // > 値が0のフィールドを指定すると、他のすべてのフィールドは値1を取得し、
  // > その逆も同様です。
  // > https://www.w3schools.com/nodejs/nodejs_mongodb_find.asp

  // findが返すのはプロミスではないのか？
  const result = await collection.find(queryObj, outputFieldObj).toArray();
  callback(result);
}

updateDocument = async function (colName, queryObj, updateObj, callback) {
  const database = client.db(dbName);
  const collection = database.collection(colName);

  const result = await collection.updateOne(queryObj, updateObj, { upsert: true });
  callback(result);
}

deleteManyDocuments = async function (colName, queryObj, callback) {
  const database = client.db(dbName);
  const collection = database.collection(colName);

  const result = await collection.deleteMany(queryObj);
  callback(result);
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
// コネクションプールは自動的に作成されるはず

//------モジュールの初期化e--------
