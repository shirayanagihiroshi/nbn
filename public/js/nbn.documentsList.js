/*
 * nbn.documentsList.js
 * ドキュメントのリスト部モジュール
 */
nbn.documentsList = (function () {
  'use strict';

  //---モジュールスコープ変数---
  var configMap = {
        main_html : String()
          + '<div class="nbn-documentsList-notice"></div>'
          + '<table class="nbn-documentsList-main"></table>',
        settable_map : {}
      },
      stateMap = {
        $container : null
      },
      jqueryMap = {},
      setJqueryMap, configModule, initModule, removeDocumentsList,
      createTable;

  //---DOMメソッド---
  setJqueryMap = function () {
    var $container = stateMap.$container;
    jqueryMap = {
      $container : $container,
      $notice    : $container.find( '.nbn-documentsList-notice' ),
      $main      : $container.find( '.nbn-documentsList-main' )
    };
  }

  //---イベントハンドラ---

  //---ユーティリティメソッド---
  createTable = function () {
    let str = "";

    str += '<tr>';
    str += '<td>';
    str += 'aa'
    str += '</td>';
    str += '</tr>';

    jqueryMap.$main.append(str);
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

  initModule = function ( $container ) {
    $container.html( configMap.main_html );
    stateMap.$container = $container;
    setJqueryMap();

    createTable();

    return true;
  }

  removeDocumentsList = function ( ) {
    //初期化と状態の解除
    if ( jqueryMap != null ) {
      if ( jqueryMap.$container ) {
        jqueryMap.$notice.remove();
        jqueryMap.$main.remove();
      }
    }
    return true;
  }

  return {
    configModule        : configModule,
    initModule          : initModule,
    removeDocumentsList : removeDocumentsList
  };
}());
