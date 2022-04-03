/*
 * nbn.uploadDocument.js
 * ドキュメントの登録部モジュール
 */
nbn.uploadDocument = (function () {
  'use strict';

  //---モジュールスコープ変数---
  var configMap = {
        main_html : String()
          + '<div class="nbn-uploadDocument-notice">エクセルやワードはダメです。PDFを指定してください。</div>'
          + '<div class="nbn-uploadDocument-gakunen-title">'
            + '対象学年'
          + '</div>'
          + '<div class="nbn-uploadDocument-docKind-title"></div>'
          + '<select class="nbn-uploadDocument-docKind-list"></select>'
          + '<select class="nbn-uploadDocument-gakunen-list">'
            + '<option value="10">中学全体</option>'
            + '<option value="1">中学1年</option>'
            + '<option value="2">中学2年</option>'
            + '<option value="3">中学3年</option>'
          + '</select>'
          + '<form action="/" method="POST" enctype="multipart/form-data">'
          + '<input class="nbn-uploadDocument-file" type="file" id="fileInput">'
          + '</form>'
          + '<button class="nbn-uploadDocument-upload">アップロード</button>',
        settable_map : {}
      },
      stateMap = {
        $container : null,
        upfile : null
      },
      jqueryMap = {},
      setJqueryMap, configModule, initModule, removeUploadDocument,
      onUpload;

  //---DOMメソッド---
  setJqueryMap = function () {
    var $container = stateMap.$container;
    jqueryMap = {
      $container    : $container,
      $notice       : $container.find( '.nbn-documentsList-notice' ),
      $gakunenTitle : $container.find( '.nbn-uploadDocument-gakunen-title' ),
      $gakunenList  : $container.find( '.nbn-uploadDocument-gakunen-list' ),
      $docKindTitle : $container.find( '.nbn-uploadDocument-docKind-title' ),
      $docKindList  : $container.find( '.nbn-uploadDocument-docKind-list' ),
      $docKindFile  : $container.find( '.nbn-uploadDocument-file' ),
      $uploadButton : $container.find( '.nbn-uploadDocument-upload' )
    };
  }

  //---イベントハンドラ---
  onUpload = function () {
    //console.log(jqueryMap.$docKindFile.prop('files')[0].name);

    nbn.model.upload(stateMap.upfile,
                     jqueryMap.$docKindFile.prop('files')[0].name,
                     1,
                     1);
    return false;
  }

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

    jqueryMap.$uploadButton
      .click( onUpload );

    // ファイルが選択された時に保持しておく
    jqueryMap.$docKindFile.change(function(event){
      stateMap.upfile = event.target.files[0];
    });

    return true;
  }

  removeUploadDocument = function ( ) {
    //初期化と状態の解除
    if ( jqueryMap != null ) {
      if ( jqueryMap.$container ) {
        jqueryMap.$notice.remove();
        jqueryMap.$gakunenTitle.remove();
        jqueryMap.$gakunenList.remove();
        jqueryMap.$docKindFile.remove();
        jqueryMap.$uploadButton.remove();
      }
    }
    return true;
  }

  return {
    configModule         : configModule,
    initModule           : initModule,
    removeUploadDocument : removeUploadDocument
  };
}());
