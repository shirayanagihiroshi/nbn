'use strict';

//------モジュールスコープ変数s--------
  var
    setWatch,
    watchMap = {},
    fs       = require('fs');
//------モジュールスコープ変数e--------

//------ユーティリティメソッドs--------


//------ユーティリティメソッドe--------


//------パブリックメソッドs--------
  //.js .css更新通知のための処理
  // もともとSPAにあったロジック。app.jsが肥大しそうなので、切り分けた。
  setWatch = function ( url_path, file_type, callback ) {
    let hatena_index = url_path.indexOf('?'),
        url_path_inner;

    // spaの本には存在しないロジック
    // 本のままやってみたら、ファイル名の後に?_=1629339085103みたいなのがついて
    // うまく動かなかった(アクセスの嵐になった)ので、この部分は切り捨てる
    if (hatena_index >= 0) {
      url_path_inner = url_path.slice(0, hatena_index);
    }
    else {
      url_path_inner = url_path;
    }

    // console.log( 'setWatch called on ' + url_path_inner );

    if ( !watchMap[ url_path_inner ] ) {

      fs.watchFile(
        'public/' + url_path_inner.slice(1),
        {interval:25035}, // ターゲットへのポーリング間隔
                          // デフォルトは5007らしいが、負荷を考えて5倍にしておく
        function ( current, previous ) {
          // console.log('file accesed');
          if ( current.mtime !== previous.mtime ) {
            console.log('file changed');
            // ファイルに変更があった時の処理
            callback(url_path_inner);
          }
        }
      );
      watchMap[ url_path_inner ] = true;
    }
  };

  module.exports = {
    setWatch      : setWatch
  };
//------パブリックメソッドe--------

//------モジュールの初期化s--------

//------モジュールの初期化e--------
