/*
 * nbn.shell.js
 * シェルモジュール
 */
nbn.shell = (function () {
  'use strict';

  //---モジュールスコープ変数---
  var configMap = {
    anchor_schema_map : {
      status : {dialog          : true,
                documentsList   : true,
                uploadDocument  : true, //従属変数なし
                addDocumentKind : true, //従属変数なし
                matiuke         : true  //従属変数なし
              },
      _status : {
        dialogKind : { login          : true,  // status : dialog のとき使用
                       logout         : true,  // status : dialog のとき使用
                       invalid        : true,  // status : dialog のとき使用
                       verify         : true,  // status : dialog のとき使用
                       menu           : true,  // status : dialog のとき使用
                       find           : true}, // status : dialog のとき使用
        mode      : true                // status : documentsListのとき使用
      }
      // アンカーマップとして許容される型を事前に指定するためのもの。
      // 例えば、color : {red : true, blue : true}
      // とすれば、キーcolorの値は'red'か'blue'のみ許容される。
      // 単にtrueとすれば、どんな値も許容される。従属キーに対しても同じ。
      // ここでキーとして挙げていないものをキーとして使用するのは許容されない。
    },
    main_html : String()
      + '<div class="nbn-shell-head">'
        + '<div class="nbn-shell-head-menu"></div>'
        + '<button class="nbn-shell-head-acct"></button>'
      + '</div>'
      + '<div class="nbn-shell-main">'
      + '</div>',
    menuStr : String()
      + '-',
    menuStrLogined : String()
      + '≡',
    },
    stateMap = {
      $container : null,
      anchor_map : {},
      skYear     : 0,
      skMonth    : 0,
      skDay      : 0,
      koma       : 0,
      jyugyouId  : 0,
      errStr     : "",   // エラーダイアログで表示する文言を一時的に保持。
                         // ここになきゃいけない情報でないので良い場所を見つけたら移す
      studentMemo : null,// 登録対象の生徒の様子メモ
                         // 出欠入力画面からも欠課入力画面からも遷移して
                         // 入力するので、代表して一時的にここで保持
      delMemo    : null  // 削除対象の生徒の様子メモ
                         // 削除も複数画面から行うから、代表して一時的にここで保持
    },
    jqueryMap = {},
    copyAnchorMap, changeAnchorPart, onHashchange, setModal,
    setJqueryMap, initModule, stateCtl, onMenuClick;

  //---DOMメソッド---
  setJqueryMap = function () {
    var $container = stateMap.$container;
    jqueryMap = {
      $container : $container,
      $menu      : $container.find( '.nbn-shell-head-menu' ),
      $acct      : $container.find( '.nbn-shell-head-acct' ),
      $main      : $container.find( '.nbn-shell-main' )
    };
  }

  //---イベントハンドラ---
  onHashchange = function ( event ) {
    var anchor_map_previous = copyAnchorMap(),
        anchor_map_proposed,
        _s_status_previous, _s_status_proposed;

    // アンカーの解析を試みる
    try {
      anchor_map_proposed = $.uriAnchor.makeAnchorMap();
    } catch ( error ) {
      $.uriAnchor.setAnchor( anchor_map_previous, null, true );
      return false;
    }
    stateMap.anchor_map = anchor_map_proposed;

    // makeAnchorMapは独立したキー毎に、'_s_キー'というのを作る。
    // 該当するキー値と、そのキーに従属したキー値が含まれる。
    // おそらくここの処理のように、変更の有無を調べやすくするためのもの。
    // spaの本には単に便利な変数と書いてあった。
    _s_status_previous = anchor_map_previous._s_status;
    _s_status_proposed = anchor_map_proposed._s_status;

    // 変更されている場合の処理
    if ( !anchor_map_previous || _s_status_previous !== _s_status_proposed ) {

      stateCtl(anchor_map_proposed);
    }

    return false;
  }

  // 真のイベントハンドラ
  // 状態管理 URLの変更を感知して各種処理を行う。
  // 履歴に残る操作は必ずここを通る。
  // なお、従属変数は'_s_キー'に入っている。
  stateCtl = function ( anchor_map ) {
    let clearMainContent = function () {
      nbn.dialog.removeDialog();
      nbn.dialogOkCancel.removeDialog();
      nbn.dialogSelect.removeDialog();
      nbn.dialogMenu.removeDialog();
    };

    // ダイアログの場合
    if ( anchor_map.status == 'dialog' ) {
      if ( anchor_map._status.dialogKind == 'login' ) {
        setModal(true);
        nbn.dialog.configModule({});
        nbn.dialog.initModule( jqueryMap.$container );
      } else if ( anchor_map._status.dialogKind == 'logout' ) {
        setModal(true);
        nbn.dialogOkCancel.configModule({showStr : 'ログアウトしますか？',
                                         okFunc  : nbn.model.logout});
        nbn.dialogOkCancel.initModule( jqueryMap.$container );
      } else if ( anchor_map._status.dialogKind == 'invalid' ) {
        setModal(true);
        nbn.dialogOkCancel.configModule({showStr : stateMap.errStr,
                                         // OKでもキャンセルと同じ動きをさせる
                                         okFunc  : nbn.dialogOkCancel.onClose});
        nbn.dialogOkCancel.initModule( jqueryMap.$container );
      } else if ( anchor_map._status.dialogKind == 'menu' ) {
        setModal(true);
        clearMainContent();
        nbn.dialogMenu.configModule({});
        nbn.dialogMenu.initModule( jqueryMap.$container );
      } else if ( anchor_map._status.dialogKind == 'find' ) {
        setModal(true);
        clearMainContent();
        nbn.dialogSelect.configModule({});
        nbn.dialogSelect.initModule( jqueryMap.$container );
      }

    // ドキュメント検索結果画面の場合
    } else if ( anchor_map.status == 'documentsList' ) {
      setModal(false);
      clearMainContent();

      nbn.documentsList.configModule({});
      nbn.documentsList.initModule( jqueryMap.$main );

    // 登録画面の場合
    } else if ( anchor_map.status == 'uploadDocument' ) {
      setModal(false);
      clearMainContent();

      nbn.uploadDocument.configModule({});
      nbn.uploadDocument.initModule( jqueryMap.$main );

    // ドキュメント種別追加の場合
    } else if ( anchor_map.status == 'addDocumentKind' ) {
      setModal(false);
      clearMainContent();

      nbn.addDocKind.configModule({});
      nbn.addDocKind.initModule( jqueryMap.$main );

    // 待ち受け画面の場合
    } else if ( anchor_map.status == 'matiuke' ) {
      setModal(false);
      nbn.dialog.removeDialog();
      nbn.dialogOkCancel.removeDialog();
      nbn.dialogSelect.removeDialog();
      nbn.dialogMenu.removeDialog();
    }
  }

  // ハンバーガーアイコン　クリック
  onMenuClick = function () {
    // ログイン済のときだけ反応する
    if (nbn.model.islogind()) {
      // 教員は検索するか、登録するか選ぶ
      if (nbn.model.iskyouin()) {
        changeAnchorPart({
          status : 'dialog',
          _status : {
            dialogKind : 'menu'
          }
        });
      // 保護者は検索する
      } else {
        changeAnchorPart({
          status : 'dialog',
          _status : {
            dialogKind : 'find'
          }
        });
      }
    }
  }

  //---ユーティリティメソッド---
  copyAnchorMap = function () {
    // $.extendはマージ。第2引数へ第3引数をマージする。
    // 第1引数のtrueはディープコピーを意味する。
    return $.extend( true, {}, stateMap.anchor_map );
  }

  // それ以前の履歴が残らないようにするには replace_flag を true にする。
  // option_map は null でよい。
  // 通常の使用では arg_map のみ渡せばよい。
  changeAnchorPart = function ( arg_map, option_map = null, replace_flag = false ) {
    var anchor_map_revise = copyAnchorMap(),
        bool_return = true,
        key_name, key_name_dep;

    // アンカーマップへ変更を統合
    KEYVAL:
    for ( key_name in arg_map ) {
      if ( arg_map.hasOwnProperty( key_name ) ) {
        // 反復中に従属キーを飛ばす
        if ( key_name.indexOf( '_' ) === 0 ) { continue KEYVAL; }

        // 独立キーを更新する
        anchor_map_revise[key_name] = arg_map[key_name];

        // 合致する独立キーを更新する
        key_name_dep = '_' + key_name;
        if ( arg_map[key_name_dep] ) {
          anchor_map_revise[key_name_dep] = arg_map[key_name_dep];
        } else {
          delete anchor_map_revise[key_name_dep];
          delete anchor_map_revise['_s' + key_name_dep];
        }
      }
    }

    //uriの更新開始。成功しなければ元に戻す
    try {
      $.uriAnchor.setAnchor( anchor_map_revise, option_map, replace_flag );
    } catch {
      // uriを既存の状態に置き換える
      $.uriAnchor.setAnchor( stateMap.anchor_map, null, true );
      bool_return = false;
    }

    return bool_return;
  }

  // flg:trueで呼ぶと、ダイアログ以外はタッチ無効
  // flg:falseで呼ぶと有効に戻る。
  setModal = function ( flg ) {
    let setModalconfig;

    if ( flg == true ) {
      setModalconfig = 'none';
    } else {
      setModalconfig = 'auto';
    }
    //クリックイベント等を有効化or無効化
    jqueryMap.$acct.css('pointer-events', setModalconfig);
    jqueryMap.$main.css('pointer-events', setModalconfig);
  }

  //---パブリックメソッド---
  initModule = function ( $container ) {

    stateMap.$container = $container; //ここで渡されるのはnbn全体
    $container.html( configMap.main_html );
    setJqueryMap();

    // 許容されるuriアンカーの型を指定
    $.uriAnchor.configModule ({
      schema_map : configMap.anchor_schema_map
    });

    // 以降、各種イベント処理の登録
    // ログインダイアログ表示
    $.gevent.subscribe( $container, 'tryLogin', function (event, msg_map) {
      changeAnchorPart({
        status : 'dialog',
        _status : {
          dialogKind : 'login'
        }
      });
    });

    // ダイアログ消去
    $.gevent.subscribe( $container, 'cancelDialog', function (event, msg_map) {
      changeAnchorPart({
        status : 'matiuke'
      });
    });

    // ログイン成功
    $.gevent.subscribe( $container, 'loginSuccess', function (event, msg_map) {

      // 設計上、これらはonHashchangeで処理すべきだが、そのためには
      // なぜダイアログを閉じたのかという情報が必要になり面倒。いい案を考える。
      nbn.acct.configModule({showStr : msg_map.name});
      nbn.acct.initModule( jqueryMap.$acct );
      jqueryMap.$menu.html( configMap.menuStrLogined );

      changeAnchorPart({
        status : 'documentsList'
      }, null, true); //ログイン前には戻したくないので、履歴を消去
    });

    // ログイン失敗
    $.gevent.subscribe( $container, 'loginFailure', function (event, msg_map) {
      //履歴には残さず、しれっとダイヤログを書き直してやり直しさせる。
      nbn.dialog.removeDialog();
      nbn.dialog.configModule({});
      nbn.dialog.initModule( jqueryMap.$container );
    });

    // ログアウトダイアログ表示
    $.gevent.subscribe( $container, 'tryLogout', function (event, msg_map) {
      changeAnchorPart({
        status : 'dialog',
        _status : {
          dialogKind : 'logout'
        }
      });
    });

    // ログアウト成功
    $.gevent.subscribe( $container, 'logoutSuccess', function (event, msg_map) {
      // 設計上、これらはonHashchangeで処理すべきだが、そのためには
      // なぜダイアログを閉じたのかという情報が必要になり面倒。いい案を考える。
      nbn.acct.configModule({showStr : "ログインする"});
      nbn.acct.initModule( jqueryMap.$acct );
      jqueryMap.$menu.html( configMap.menuStr );
      jqueryMap.$main.html( "" );


    changeAnchorPart({
      status : 'matiuke'
      }, null, true); //ログイン前には戻したくないので、履歴を消去
    });

    // ログアウト失敗
    $.gevent.subscribe( $container, 'logoutFailure', function (event, msg_map) {
      //どうする？
    });

    // 検索メニュー表示
    $.gevent.subscribe( $container, 'selectDocument', function (event, msg_map) {
      changeAnchorPart({
        status : 'dialog',
        _status : {
          dialogKind : 'find'
        }
      });
    });

    // 登録画面表示
    $.gevent.subscribe( $container, 'uploadDocument', function (event, msg_map) {
      changeAnchorPart({
        status : 'uploadDocument'
      });
    });

    // ドキュメント種別追加
    $.gevent.subscribe( $container, 'addDocumentKind', function (event, msg_map) {
      changeAnchorPart({
        status : 'addDocumentKind'
      });
    });

    jqueryMap.$menu.html( configMap.menuStr );

    nbn.acct.configModule({showStr : 'ログインする'});
    nbn.acct.initModule( jqueryMap.$acct );

    $(window)
      .bind( 'hashchange', onHashchange )
      .trigger( 'hashchange' );

    // shellでクリックイベントに対応するのは本来よろしくない。
    // 機能モジュールを用意してそちらで処理すべきだが
    // ちょっとした処理なのでここでやっちゃう
    jqueryMap.$menu
      .click( onMenuClick );
  }

  return { initModule : initModule };
}());
