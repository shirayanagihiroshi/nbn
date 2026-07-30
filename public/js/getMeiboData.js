import {
  NBNZenkaku2hankaku,
  NBNParseExcelData,
  NBNconbineMatrixHorizon,
  NBNconbineMatrixVertical,
  NBNextracteMatrix,
  NBNrenderTable,
  NBNGetYearsList,
  NBNGetTeacherIDFromRyakusyou,
  NBNGetClsInfoFromClsStr } from './NBNHelpers.js';

/*
 * getMeiboData.js
 * sktから名簿データを取得し、DBに登録する
 */

class getMeiboDataView extends HTMLElement {

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        .dangerzone {
          color : red;
          font-weight: bold;
        }
      </style>
      <p class="dangerzone">danger zone この設定を変更するとシステムが動かなくなる可能性があります</p>
      <h1>sktから名簿データを取得する</h1>
      <p>本システムはmongoDBを用いて動いている。先行して作ったskt(web上に公開しているSPA。大まかな構成は本システムと類似)にあるcollectionのいくつかと同じものを用いる。対象はclass、goudouMeibo、user collectionであるが、user collectionのデータのうちIDとパスワードのみを使っており時間割情報は使っていない。</p>
      <p>sktは年度単位で動く設計であり、本システムは年度を跨いで動く設計（にするつもり）であるから、単純なコピーでは済まない。以下のボタンを押下すると、対象年度の本システムのclassとgoudouMeibo collection、全てのuser collectionのデータを削除し、今sktにあるにclassとgoudouMeibo collectionを取得し、年度情報を付加して、本システムのDBに追記する。また、user collectionを追記する。</p>
      <p>
        登録対象年度：<select id="targetNendo"></select>
      </p>
      <button id="getdata-btn">SKTよりデータ取得</button>
                                `;
  }

  /**
   * カスタム要素がページに追加されたときに呼ばれるコールバック
   */
  async connectedCallback() {
    console.log("getMeiboDataView connectedCallback");

    const nendoObj = this.shadowRoot.getElementById('targetNendo');
    nendoObj.innerHTML = NBNGetYearsList();

    const btn = this.shadowRoot.getElementById('getdata-btn');
    btn.addEventListener('click', async () => {

      const dialog = this._findConfirmDialog();
      if (dialog) {
        const action = await dialog.show({
          title: '確認',
          message: 'SKTからデータを取得し登録します。よろしいですか？',
          buttons: [{ label: 'OK', onClickFunc: 'ok' }, { label: 'キャンセル', onClickFunc: 'cancel' }]
        });
        if (action !== 'ok') return;
      }

      try {
        const nendo = this.shadowRoot.getElementById('targetNendo');
        const res = await fetch('/api/fetch/getfromskt_meibo?nendo=' + nendo.value);

        const resData = await res.json();
        if (resData.success) {
          // データ更新処理はサーバでやる
          alert('データの取得、登録が完了しました');
        } else {
          throw new Error(resData.message || 'SKTからのデータ取得に失敗しました。');
        }

      } catch (err) {
        console.error("SKTからのデータ取得に失敗しました。:", err);
      }
    });
  }

  /**
   * どんなに深い Shadow DOM の中にいても confirm-dialog を探し出すヘルパーメソッド
   */
  _findConfirmDialog() {
    // 1. 直近の ShadowRoot または document を探す
    let root = this.getRootNode();
    while (root) {
      // 今の階層で confirm-dialog を探す
      const dialog = root.querySelector('confirm-dialog');
      if (dialog) return dialog;

      // もし見つからず、まだ上に親コンポーネント（host）があるなら、さらに上のルートへ登る
      if (root.host) {
        root = root.host.getRootNode();
      } else {
        break; // 一番外側の document まで到達したら終了
      }
    }
    return null;
  }
}
// 定義名は、全て小文字(a-z)で、ハイフンが1つ以上含まれないとダメ。
customElements.define('get-meibodata-view', getMeiboDataView);
