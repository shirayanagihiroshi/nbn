import { NBNZenkaku2hankaku } from './NBNHelpers.js';

/*
 * settings.js
 * 教務システム設定画面（1ドキュメント完全同期版）
 */

class SettingsView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <h1>教務システム設定画面</h1>
      
      <h2>対象システム年度の設定</h2>
      <p>システムが対象とする西暦年度を入力してください：</p>
      <textarea id="targetNendoTextarea" rows="1" cols="10" style="font-size: 16px; resize: none;"></textarea>

      <h2>成績入力の可/不可 0:入力不可 1:入力可</h2>
      <table id="canInputsSeisekiTable" border="1"></table>

      <h2>出欠入力の可/不可 0:入力不可 1:入力可</h2>
      <table id="canInputsSyukketsuTable" border="1"></table>

      <h2>授業日数 日数を数値で入力</h2>
      <table id="jugyouNissuTable" border="1"></table>

      <p><button id="register_button">登録</button></p>
    `;
  }

  async connectedCallback() {
    console.log("SettingsView connectedCallback");

    // 1. 初回起動時にDBのマスター設定を読み込んで描画
    await this._loadSettings();

    // 2. 登録ボタンのイベント設定
    const regButton = this.shadowRoot.getElementById('register_button');
    regButton.addEventListener('click', () => this._saveSettings());
  }

  /**
   * 現在の設定値をDBから取得して画面に表示
   */
  async _loadSettings() {
    try {
      // 1ドキュメントのみを管理するためクエリパラメータは不要
      const res = await fetch('/api/fetch/ks_manage');
      const data = await res.json();

      if (!data.success) {
        alert('設定データの取得に失敗しました。');
        return;
      }

      // 画面の textarea に現在の設定年度を反映
      const nendoTextarea = this.shadowRoot.getElementById('targetNendoTextarea');
      nendoTextarea.value = data.nendo || new Date().getFullYear();

      const periods = data.periods || {};
      const syukketsuPeriods = data.syukketsuPeriods || {};
      const jugyouNissu = data.jugyouNissu || {};

      const gakunens = [
        { val: 4, label: '高1' },
        { val: 5, label: '高2' },
        { val: 6, label: '高3' }
      ];

      // A. 成績入力テーブルの生成
      const seisekiTable = this.shadowRoot.getElementById('canInputsSeisekiTable');
      let seisekiHtml = `<tr><th>学年</th><th>前期</th><th>後期</th><th>通年</th></tr>`;
      gakunens.forEach(g => {
        const p = periods[g.val] || { zenki: false, kouki: false, tsunen: false };
        seisekiHtml += `
          <tr data-gakunen="${g.val}">
            <td>${g.label}</td>
            <td><input type="text" class="zenki" size="3" value="${p.zenki ? 1 : 0}"></td>
            <td><input type="text" class="kouki" size="3" value="${p.kouki ? 1 : 0}"></td>
            <td><input type="text" class="tsunen" size="3" value="${p.tsunen ? 1 : 0}"></td>
          </tr>`;
      });
      seisekiTable.innerHTML = seisekiHtml;

      // B. 出欠入力テーブルの生成
      const syukketsuTable = this.shadowRoot.getElementById('canInputsSyukketsuTable');
      let syukketsuHtml = `<tr><th>学年</th><th>前期</th><th>後期</th></tr>`;
      gakunens.forEach(g => {
        const sp = syukketsuPeriods[g.val] || { zenki: false, kouki: false };
        syukketsuHtml += `
          <tr data-gakunen="${g.val}">
            <td>${g.label}</td>
            <td><input type="text" class="zenki" size="3" value="${sp.zenki ? 1 : 0}"></td>
            <td><input type="text" class="kouki" size="3" value="${sp.kouki ? 1 : 0}"></td>
          </tr>`;
      });
      syukketsuTable.innerHTML = syukketsuHtml;

      // C. 授業日数テーブルの生成
      const nissuTable = this.shadowRoot.getElementById('jugyouNissuTable');
      let nissuHtml = `<tr><th>学年</th><th>前期</th><th>後期</th></tr>`;
      gakunens.forEach(g => {
        const jn = jugyouNissu[g.val] || { zenki: 0, kouki: 0 };
        nissuHtml += `
          <tr data-gakunen="${g.val}">
            <td>${g.label}</td>
            <td><input type="text" class="zenki" size="5" value="${jn.zenki || 0}"></td>
            <td><input type="text" class="kouki" size="5" value="${jn.kouki || 0}"></td>
          </tr>`;
      });
      nissuTable.innerHTML = nissuHtml;

    } catch (err) {
      console.error('設定読み込みエラー:', err);
      alert('設定の読み込み中に通信エラーが発生しました。');
    }
  }

  /**
   * 画面の入力値を半角クレンジングした上で保存
   */
  async _saveSettings() {
    if (!confirm('設定情報を登録します。よろしいですか？')) return;

    // テキストエリアから年度を取得し、全角があれば半角に変換
    const nendoInput = this.shadowRoot.getElementById('targetNendoTextarea').value;
    const cleanNendo = Number(NBNZenkaku2hankaku(nendoInput.trim()));

    if (!cleanNendo || isNaN(cleanNendo)) {
      alert('年度を正しい数値で入力してください。');
      return;
    }

    const payload = {
      nendo: cleanNendo,
      periods: {},
      syukketsuPeriods: {},
      jugyouNissu: {}
    };

    // 各テーブルの入力文字列を半角変換して回収するヘルパー関数
    const collectData = (tableId, isBoolean) => {
      const result = {};
      const rows = this.shadowRoot.getElementById(tableId).querySelectorAll('tr');
      rows.forEach(row => {
        const gakunen = row.getAttribute('data-gakunen');
        if (!gakunen) return;

        // 全角文字を半角へクレンジングして数値化
        const getCleanNum = (el) => el ? Number(NBNZenkaku2hankaku(el.value.trim())) : 0;

        const zenkiNum = getCleanNum(row.querySelector('.zenki'));
        const koukiNum = getCleanNum(row.querySelector('.kouki'));
        const tsunenEl = row.querySelector('.tsunen');

        result[gakunen] = {
          zenki: isBoolean ? (zenkiNum === 1) : zenkiNum,
          kouki: isBoolean ? (koukiNum === 1) : koukiNum
        };
        
        if (tsunenEl) {
          const tsunenNum = getCleanNum(tsunenEl);
          result[gakunen].tsunen = isBoolean ? (tsunenNum === 1) : tsunenNum;
        }
      });
      return result;
    };

    payload.periods = collectData('canInputsSeisekiTable', true);
    payload.syukketsuPeriods = collectData('canInputsSyukketsuTable', true);
    payload.jugyouNissu = collectData('jugyouNissuTable', false);

    try {
      const res = await fetch('/api/store/ks_manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();
      if (resData.success) {
        alert('設定情報を正常に保存しました。');
      } else {
        throw new Error(resData.message || '保存エラー');
      }
    } catch (err) {
      console.error('設定保存失敗:', err);
      alert(`保存失敗: \n${err.message}`);
    }
  }
}

customElements.define('settings-view', SettingsView);
