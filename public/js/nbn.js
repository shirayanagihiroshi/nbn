/*
 * nbn.js
 * ルート名前空間モジュール
 */

import { createTable, foo } from './tableModule.js';

window.onload = function () {
  const host = document.querySelector('#nbn');
  const shadow = host.attachShadow({ mode : 'open'});
  shadow.appendChild(createTable())
}
