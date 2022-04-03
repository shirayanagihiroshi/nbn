/*
 * nbn.dialogMenu.js
 * メニューダイアログモジュール
 */
nbn.dialogMenu = (function () {
  'use strict';

  //---モジュールスコープ変数---
  var configMap = {
        main_html : String()
        + '<div class="nbn-dialogMenu">'
          + '<div class="nbn-dialogMenu-head">'
            + 'メニュー'
            + '<div class="nbn-dialogMenu-head-closer">'
              + 'x'
            + '</div>'
          + '</div>'
          + '<div class="nbn-dialogMenu-main">'
            + '<ul>'
              + '<li class="nbn-dialogMenu-find">ドキュメント検索</li>'
              + '<li class="nbn-dialogMenu-upload">ドキュメント登録</li>'
              + '<li class="nbn-dialogMenu-addkind">ドキュメント種別追加</li>'
            + '</ul>'
          + '</div>'
        + '<div>',
        settable_map : {}
      },
      stateMap = {
        $append_target : null
      },
      jqueryMap = {},
      setJqueryMap, configModule, initModule, removeDialog,
      onClose, onFind, onUpload, onAddkind;

  //---DOMメソッド---
  setJqueryMap = function () {
    var $append_target = stateMap.$append_target,
        $dialog = $append_target.find( '.nbn-dialogMenu' );
    jqueryMap = {
      $dialog          : $dialog,
      $closer          : $dialog.find( '.nbn-dialogMenu-head-closer' ),
      $main            : $dialog.find( '.nbn-dialogMenu-main' ),
      $find            : $dialog.find( '.nbn-dialogMenu-find' ),
      $upload          : $dialog.find( '.nbn-dialogMenu-upload' ),
      $addkind         : $dialog.find( '.nbn-dialogMenu-addkind' )
    };
  }

  //---イベントハンドラ---
  onClose = function () {
    $.gevent.publish('cancelDialog', [{}]);
    return false;
  }

  onFind = function() {
    $.gevent.publish('selectDocument', [{}]);
    return false;
  }

  onUpload = function() {
    $.gevent.publish('uploadDocument', [{}]);
    return false;
  }

  onAddkind = function() {
    $.gevent.publish('addDocumentKind', [{}]);
    return false;
  }

  //---パブリックメソッド---
  configModule = function ( input_map ) {
    nbn.util.setConfigMap({
      input_map : input_map,
      settable_map : configMap.settable_map,
      config_map : configMap
    });
    return true;
  }

  removeDialog = function ( ) {
    //初期化と状態の解除
    if ( jqueryMap != null ) {
      if ( jqueryMap.$dialog ) {
        jqueryMap.$dialog.remove();
        jqueryMap = null;
      }
    }
    stateMap.$append_target = null;
    return true;
  }

  initModule = function ( $append_target ) {
    // $container.html( configMap.main_html );
    // じゃなくて、appendするパターン
    // shellでコンテナを用意すると、dialog側を消してもコンテナが残っちゃう。
    $append_target.append( configMap.main_html );
    stateMap.$append_target = $append_target;
    setJqueryMap();

    jqueryMap.$closer
      .click( onClose );
    jqueryMap.$find
      .click( onFind );
    jqueryMap.$upload
      .click( onUpload );
    jqueryMap.$addkind
      .click( onAddkind );

    return true;
  }

  return {
    configModule : configModule,
    initModule   : initModule,
    removeDialog : removeDialog
  };
}());
