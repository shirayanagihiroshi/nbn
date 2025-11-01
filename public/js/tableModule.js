/*
 * lib.js
 * ライブラリ
 */

export function createTable(){
  let i, j, td, tr, table;

  table = document.createElement('table');

  for (j = 0; j < 40;j++) {

    tr = document.createElement('tr');

    for (i = 0; i < 100;i++) {
      td = document.createElement('td');
      td.textContent = 9;
      tr.appendChild(td);
    }

    table.appendChild(tr);
  }

  return table;
}

export function foo(){
  return 'foo';
}
