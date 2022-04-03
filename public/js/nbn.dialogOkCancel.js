/*
 * nbn.dialogOkCancel.js
 * OK Cancel ダイアログ部モジュール
 */
nbn.dialogOkCancel = (function () {
  'use strict';

  //---モジュールスコープ変数---
  var configMap = {
        main_html : String()
        + '<div class="nbn-dialogOkCancel">'
          + '<div class="nbn-dialogOkCancel-main">'
            + '<div class="nbn-dialogOkCancel-main-title">'
            + '</div>'
            + '<button class="nbn-dialogOkCancel-main-button-ok">'
              + '<p>ok</p>'
            + '</button>'
            + '<button class="nbn-dialogOkCancel-main-button-cancel">'
              + '<p>cancel</p>'
            + '</button>'
          + '</div>'
        + '<div>',
        settable_map : {showStr : true,
                        okFunc  : true},
        showStr : "",
        okFunc  : function () {}
      },
      stateMap = {
        $append_target : null
      },
      jqueryMap = {},
      setJqueryMap, configModule, initModule, removeDialog, onClose, onOK;

  //---DOMメソッド---
  setJqueryMap = function () {
    var $append_target = stateMap.$append_target,
        $dialog = $append_target.find( '.nbn-dialogOkCancel' );
    jqueryMap = {
      $dialog          : $dialog,
      $title           : $dialog.find( '.nbn-dialogOkCancel-main-title' ),
      $buttonOK        : $dialog.find( '.nbn-dialogOkCancel-main-button-ok' ),
      $buttonCancel    : $dialog.find( '.nbn-dialogOkCancel-main-button-cancel' )
    };
  }

  //---イベントハンドラ---
  onClose = function () {
    $.gevent.publish('cancelDialog', [{}]);
    return false;
  }

  onOK = function () {
    //いろいろな受け持つので、configModuleで指定しておく
    configMap.okFunc();
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

    jqueryMap.$title.html( configMap.showStr );

    jqueryMap.$buttonOK
      .click( onOK );
    jqueryMap.$buttonCancel
      .click( onClose );

    return true;
  }

  return {
    configModule : configModule,
    initModule   : initModule,
    removeDialog : removeDialog,
    onClose      : onClose
  };
}());
