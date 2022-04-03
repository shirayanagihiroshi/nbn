'use strict';
// サーバで直接ユーザ登録、削除などをする用
// 本番環境でうっかり使うと大惨事が起きるので注意

// 使い方
// readyData　の中の必要な部分のコメントアウトを外しnodeで実行する。
//
// 注意
// JSON.parse は単一引用符を許容しない
// JSON.parse 中ではコメントが許されないっぽい
//
//------モジュールスコープ変数s--------
  var
    readyData, emitter, nextstep,
    fs        = require('fs'),
    crypt     = require('./lib/crypt'),
    db        = require('./lib/database'),
    events    = require('events'),
    stage     = 0,

//    addUser,
//    addUserList,// = JSON.parse(fs.readFileSync('./data2DB/user.json', 'utf8')),
//    addUserListTemp,
    addDocKindList = JSON.parse(fs.readFileSync('./data2DB/documentkind.json', 'utf8')),
    addDocKind,
    addDocList = JSON.parse(fs.readFileSync('./data2DB/documents.json', 'utf8')),
    addDoc;

// excelでutf-8のjsonを出力して、読み込もうとしたが、
// excelはBOM付きの UTF8を出力するらしいので、JSON.parseに
// Unexpected token ﻿ in JSON at position 0
// と怒られる。
// 先頭を無視するとうまく動く様子
/*
addUserListTemp = fs.readFileSync('./data2DB/user.json',  'utf8');
if (addUserListTemp.charCodeAt(0) === 0xFEFF) {
  addUserListTemp = addUserListTemp.substr(1);
}
addUserList = JSON.parse(addUserListTemp);
*/

//------モジュールスコープ変数e--------

//------ユーティリティメソッドs--------
readyData = function () {
  stage++;

  // 前の処理が終えたら次をやっていく
  // 処理したくないところはtrueをfalseにして飛ばす
  switch (stage) {
    case 1:
      if (false) {
        db.deleteManyDocuments('user', {}, function (res) { nextstep();} );
      } else { nextstep(); }
      break;
    case 2:
      if (false) {
        addUser(addUserList);
      } else { nextstep(); }
      break;
    case 3:
      if (true) {
        db.deleteManyDocuments('documentkind', {}, function (res) { nextstep();} );
      } else { nextstep(); }
      break;
    case 4:
      if (true) {
        addDocKind(addDocKindList);
      } else { nextstep(); }
      break;
    case 5:
      if (true) {
        db.deleteManyDocuments('documents', {}, function (res) { nextstep();} );
      } else { nextstep(); }
      break;
    case 6:
      if (true) {
        addDoc(addDocList);
      } else { nextstep(); }
      break;
    case 7:
      process.exit(0);
      break;
  }
  //console.log('readyData called stage ' + stage);
}

nextstep = function () {
  emitter.emit('nextstep');
};
/*
addUser = function (userList) {
  const listnum = userList.length;
  let i, complete_num, addUserInner;

  //登録完了数を設定
  complete_num = 0;

  //このように一件つづ登録するなら、ハッシュのコールバックの中でユーザIDを使う関係で
  //ユーザIDが関数の引数として存在しなければならない。
  //そのためのaddUserInner
  addUserInner = function (userIdStr, userKindStr, nameStr, passWordStr) {
    crypt.hash(passWordStr,function (hashstr) {
      let insertObj = {userId   : userIdStr,
                       userKind : userKindStr,
                       name     : nameStr,
                       token    : "",
                       passWord : hashstr};
      db.insertDocument('user', insertObj, function (result) {
        complete_num++;
        if (complete_num == listnum) {
            console.log('addUser done');
            nextstep();
        }
      });
    });
  };

  for ( i = 0; i < listnum; i++) {
    addUserInner(userList[i].userId,
                 userList[i].userKind,
                 userList[i].name,
                 userList[i].passWord);
  }
}
*/

addDocKind = function (addDocKindList) {
  db.insertManyDocuments('documentkind', addDocKindList, function ( result ) {
    console.log("addDocKind done");
    nextstep();
  });
}

addDoc = function (addDocList) {
  db.insertManyDocuments('documents', addDocList, function ( result ) {
    console.log("addDoc done");
    nextstep();
  });
}

//------ユーティリティメソッドe--------

//------設定s--------
emitter = new events.EventEmitter();
emitter.on('nextstep', readyData);

// mongoDBの接続完了を待つため、適当に待ってから開始
// うっかり実行してしまうのを防ぐため、引数に true が指定されたときのみ開始
if (process.argv[2] == 'true') {
  setTimeout(function () {nextstep();}, 200);
} else {
  console.log('do nothing');
  console.log('実行したければ、「node readyData.js true」として実行してください');
  process.exit(0);
}
//------設定e--------
