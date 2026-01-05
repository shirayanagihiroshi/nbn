/******************************************************************/
/* jsdocでREADME.mdとソースコード中のコメントからドキュメントを   */
/* 生成する際に、(README.md中の)mermaidの図が表示されなかったため */
/* jsdocが生成したindex.htmlを微調整する。                        */
/*                                                                */
/* [追加]                                                         */
/* マーメイドのライブラリの読み込み                               */
/* [変更]                                                         */
/* <pre class="prettyprint source lang-mermaid"><code>            */
/*   -> <div class="mermaid">                                     */
/* </code></pre>                                                  */
/*   -> </div>                                                    */
/* [削除]                                                         */
/* 不要なprettyPrint関連                                          */
/*                                                                */
/* このファイルのコードはgeminiに書いてもらった。                 */
/*                                           2026/1/5 shirayanagi */
/******************************************************************/
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'out', 'index.html');

fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  let modifiedData = data;

  // 1. Mermaidスクリプトの注入と変換・レンダリングスクリプトの注入
  const mermaidScript = `
<script src="https://unpkg.com/mermaid/dist/mermaid.min.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', function () {
    mermaid.initialize({ startOnLoad: false });

    const elements = document.querySelectorAll('.prettyprint.source.lang-mermaid');

    elements.forEach(function(preElement) {
      const codeElement = preElement.querySelector('code');
      if (codeElement) {
        const mermaidCode = codeElement.textContent;
        const mermaidDiv = document.createElement('div');
        mermaidDiv.className = 'mermaid';
        mermaidDiv.textContent = mermaidCode;
        preElement.parentNode.replaceChild(mermaidDiv, preElement);
      }
    });
    mermaid.run();
  });
</script>
`;
  modifiedData = modifiedData.replace('</body>', `${mermaidScript}</body>`);

  // 2. prettyPrint()呼び出しの削除
  modifiedData = modifiedData.replace(/<script> prettyPrint\(\); <\/script>/g, '');

  // 3. prettyprint.jsのscriptタグの削除
  modifiedData = modifiedData.replace(/<script src="scripts\/prettify\/prettify.js"> <\/script>/g, '');

  fs.writeFile(filePath, modifiedData, 'utf8', (err) => {
    if (err) {
      console.error('Error writing file:', err);
      return;
    }
    console.log('out/index.html modified successfully for Mermaid rendering.');
  });
});
