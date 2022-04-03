/*
 * nbn.js
 * ルート名前空間モジュール
 */
var nbn = (function () {
  'use strict';

  var initModule = function ( $container ) {
    nbn.model.initModule();
    nbn.shell.initModule($container);
  }

  return { initModule : initModule };
}());
