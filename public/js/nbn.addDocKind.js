/*
 * nbn.addDocKind.js
 * ドキュメントの種別追加モジュール
 */
nbn.addDocKind = (function () {
  'use strict';

  //---モジュールスコープ変数---
  var configMap = {
        main_html : String()
          + '<div class="nbn-addDocKind-notice">アップロードする書類の種類(学校だより、学年だより・・・)を追加する</div>'
          + '<input type="text" class="nbn-addDocKind-text">'
          + '<button class="nbn-addDocKind-add">追加</button>',
        settable_map : {}
      },
      stateMap = {
        $container : null
      },
      jqueryMap = {},
      setJqueryMap, configModule, initModule, removeAddDocKind;

  //---DOMメソッド---
  setJqueryMap = function () {
    var $container = stateMap.$container;
    jqueryMap = {
      $container    : $container,
      $notice       : $container.find( '.nbn-addDocKind-notice' ),
      $text         : $container.find( '.nbn-addDocKind-text' ),
      $add          : $container.find( '.nbn-addDocKind-add' )
    };
  }

  //---イベントハンドラ---

  //---ユーティリティメソッド---

  //---パブリックメソッド---
  configModule = function ( input_map ) {
    nbn.util.setConfigMap({
      input_map : input_map,
      settable_map : configMap.settable_map,
      config_map : configMap
    });
    return true;
  }

  initModule = function ( $container ) {
    $container.html( configMap.main_html );
    stateMap.$container = $container;
    setJqueryMap();

    return true;
  }

  removeAddDocKind = function ( ) {
    //初期化と状態の解除
    if ( jqueryMap != null ) {
      if ( jqueryMap.$container ) {
        jqueryMap.$notice.remove();
        jqueryMap.$text.remove();
        jqueryMap.$add.remove();
      }
    }
    return true;
  }

  return {
    configModule     : configModule,
    initModule       : initModule,
    removeAddDocKind : removeAddDocKind
  };
}());
