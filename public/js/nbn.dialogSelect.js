/*
 * nbn.dialogSelect.js
 * ドキュメント検索ダイアログモジュール
 */
nbn.dialogSelect = (function () {
  'use strict';

  //---モジュールスコープ変数---
  var configMap = {
        main_html : String()
        + '<div class="nbn-dialogSelect">'
          + '<div class="nbn-dialogSelect-head">'
            + 'ドキュメントの検索'
            + '<div class="nbn-dialogSelect-head-closer">'
              + 'x'
            + '</div>'
          + '</div>'
          + '<div class="nbn-dialogSelect-main">'
            + '<div class="nbn-dialogSelect-main-docKind">検索する対象</div>'
            + '<select class="nbn-dialogSelect-main-docKind-list"></select>'
            + '<div class="nbn-dialogSelect-main-period">検索する期間</div>'
            + '<div class="nbn-dialogSelect-main-period2">～</div>'
            + '<select class="nbn-dialogSelect-main-start-month">'
              + '<option value="4">4月分</option>'
              + '<option value="5">5月分</option>'
              + '<option value="6">6月分</option>'
              + '<option value="7">7月分</option>'
              + '<option value="8">8月分</option>'
              + '<option value="9">9月分</option>'
              + '<option value="10">10月分</option>'
              + '<option value="11">11月分</option>'
              + '<option value="12">12月分</option>'
              + '<option value="1">1月分</option>'
              + '<option value="2">2月分</option>'
              + '<option value="3">3月分</option>'
            + '</select>'
            + '<select class="nbn-dialogSelect-main-end-month">'
              + '<option value="4">4月分</option>'
              + '<option value="5">5月分</option>'
              + '<option value="6">6月分</option>'
              + '<option value="7">7月分</option>'
              + '<option value="8">8月分</option>'
              + '<option value="9">9月分</option>'
              + '<option value="10">10月分</option>'
              + '<option value="11">11月分</option>'
              + '<option value="12">12月分</option>'
              + '<option value="1">1月分</option>'
              + '<option value="2">2月分</option>'
              + '<option value="3">3月分</option>'
            + '</select>'
            + '<button class="nbn-dialogSelect-main-ok">'
              + 'ok'
            + '</button>'
          + '</div>'
        + '<div>',
        settable_map : {},
      },
      stateMap = {
        $append_target : null
      },
      jqueryMap = {},
      setJqueryMap, configModule, initModule, removeDialog, onClose, onOK;

  //---DOMメソッド---
  setJqueryMap = function () {
    var $append_target = stateMap.$append_target,
        $dialog = $append_target.find( '.nbn-dialogSelect' );
    jqueryMap = {
      $dialog          : $dialog,
      $closer          : $dialog.find( '.nbn-dialogSelect-head-closer' ),
      $main            : $dialog.find( '.nbn-dialogSelect-main' ),
      $docKind         : $dialog.find( '.nbn-dialogSelect-main-docKind' ),
      $docKindlist     : $dialog.find( '.nbn-dialogSelect-main-docKind-list' ),
      $period          : $dialog.find( '.nbn-dialogSelect-main-period' ),
      $period2         : $dialog.find( '.nbn-dialogSelect-main-period2' ),
      $startMonth      : $dialog.find( '.nbn-dialogSelect-main-start-month' ),
      $endMonth        : $dialog.find( '.nbn-dialogSelect-main-end-month' ),
      $buttonOK        : $dialog.find( '.nbn-dialogInput-main-button-ok' )
    };
  }

  //---イベントハンドラ---
  onClose = function () {
    $.gevent.publish('cancelDialog', [{}]);
    return false;
  }

  onOK = function () {
    let memoStr = jqueryMap.$textbox.val();
    configMap.okFunc(memoStr);
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

    jqueryMap.$buttonOK
      .click( onOK );
    jqueryMap.$closer
      .click( onClose );

    return true;
  }

  return {
    configModule : configModule,
    initModule   : initModule,
    removeDialog : removeDialog
  };
}());
