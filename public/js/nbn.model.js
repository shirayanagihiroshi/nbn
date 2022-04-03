/*
 * nbn.model.js
 * モデルモジュール
 */

nbn.model = (function () {
  'use strict';

  var initModule, login, logout, islogind, getAKey,
      initLocal, iskyouin, upload, //関数
      accessKey, userKind, name, documents;//モジュールスコープ変数

  initLocal = function () {
    accessKey   = {};
    userKind    = 0;
    name        = "";
  }

  initModule = function () {

    initLocal();

    nbn.data.initModule();

    nbn.data.registerReceive('loginResult', function (msg) {
      let eventName;
      // ログイン成功
      if ( msg.result == true ) {
        accessKey = { userId : msg.userId,
                      token  : msg.token};
        userKind  = msg.userKind;
        name      = msg.name;

        // ドキュメント情報を取っておく
        nbn.data.sendToServer('readyDocuments', {AKey : accessKey,
                                                 clientState : 'init'});
      // ログイン失敗
      } else {
        $.gevent.publish('loginFailure', [msg]);
      }
    });

    // ドキュメント情報　取得完了
    nbn.data.registerReceive('readyDocumentsResult', function (msg) {
      documents = msg.res;

      if (msg.clientState == 'init') {
        $.gevent.publish('loginSuccess', [{ name: name }]);
      }
    });

    nbn.data.registerReceive('logoutResult', function (msg) {
      let eventName;
      // ログアウト成功
      if ( msg.result == true ) {
        eventName = 'logoutSuccess';

        initLocal();
      // ログアウト失敗
      } else {
        // 失敗したとして、どうする？
        eventName = 'logoutFailure';
      }
      $.gevent.publish(eventName, [msg]);
    });

  };//initModule end


  login = function (queryObj) {
    nbn.data.sendToServer('tryLogin',queryObj);
  };

  logout = function () {
    console.log(accessKey);
    nbn.data.sendToServer('tryLogout',{userId : accessKey.userId,
                                       token  : accessKey.token});
  };

  islogind = function () {
    //accessKeyがtokenプロパティを持ち
    if ( Object.keys(accessKey).indexOf('token') !== -1 ) {
      //さらに空でない文字列が設定されていればログイン済
      if ( accessKey.token !== undefined ) {
        if (accessKey.token != "") {
          return true;
        }
      }
    }
    return false;
  };

  getAKey = function () {
    return accessKey;
  };

  // userKind : 教員   : 10
  //          : 保護者 : 20
  iskyouin = function () {
    // 仮
    return true;

    if (userKind == 10) {
      return true;
    } else {
      return false;
    }
  }

  upload = function(file, filename, dockind, gakunen){
    let fileReader  = new FileReader(),
      send_file     = file,
      send_filename = filename,
      data          = {};

    fileReader.readAsArrayBuffer(send_file);

    fileReader.onload = function(event) {
      data.file = event.target.result;
      data.name = send_filename;

      // ディレクトリが用意されていないと、ファイルが生成されない。
      nbn.data.sendToServer('upload',{AKey    : accessKey,
                                      data    : data,
                                      dockind : dockind,
                                      gakunen : gakunen});
    }
  }

  return { initModule      : initModule,
          login            : login,
          logout           : logout,
          islogind         : islogind,
          getAKey          : getAKey,
          iskyouin         : iskyouin,
          upload           : upload
        };
}());
