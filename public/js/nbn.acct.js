/*
 * nbn.acct.js
 * アカウントモジュール
 */
nbn.acct = (function () {
  'use strict';

  //---モジュールスコープ変数---
  var configMap = {
        main_html : String()
          + '<div class="nbn-acct-name" style="padding:0.3em; color:#fff">'
          + '</div>',
        settable_map : {showStr : true},
        showStr : ""
      },
      stateMap = {
        $container : null,
      },
      jqueryMap = {},
      setJqueryMap, configModule, initModule, onClickAcct;

  //---DOMメソッド---
  setJqueryMap = function () {
    var $container = stateMap.$container;
    jqueryMap = {
      $container : $container,
      $nameStr   : $container.find( '.nbn-acct-name' )
    };
  };

  //---イベントハンドラ---
  onClickAcct = function () {
    console.log('onClickAcct');
    if ( nbn.model.islogind() == false ) {
      console.log('not login');
      $.gevent.publish('tryLogin', [{}]);
    } else {
      console.log('longind');
      $.gevent.publish('tryLogout', [{}]);
    }

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

  initModule = function ( $container ) {

    $container.html( configMap.main_html );
    stateMap.$container = $container;
    setJqueryMap();

    jqueryMap.$nameStr.html( configMap.showStr );

    jqueryMap.$container //setJqueryMap より前に呼ぶとjqueryMapの$containerが設定されておらずエラー
      .click( onClickAcct );

    return true;
  }

  return {
    configModule : configModule,
    initModule : initModule
  };
}());
