const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, '..', 'docs', 'LIFESYNC_PROPOSAL_FULL.md');
const outHtmlPath = path.join(__dirname, '..', 'docs', 'LifeSync_Proposal.html');

let mdContent = fs.readFileSync(mdPath, 'utf8');

// Strip the preamble before # เอกสารข้อเสนอ
const startIndex = mdContent.indexOf('# เอกสารข้อเสนอ');
const cleanMd = startIndex !== -1 ? mdContent.substring(startIndex) : mdContent;

const lines = cleanMd.split('\n');
let out = [];
let inList = false;

for (let line of lines) {
  let trimmed = line.trim();
  if (!trimmed) continue;

  if (trimmed.startsWith('# ')) {
    if (inList) { out.push('</ul>'); inList = false; }
    out.push('<h1 class="doc-title">' + trimmed.substring(2) + '</h1>');
  } else if (trimmed.startsWith('## ')) {
    if (inList) { out.push('</ul>'); inList = false; }
    out.push('<h2 class="section-title">' + trimmed.substring(3) + '</h2>');
  } else if (trimmed.startsWith('### ')) {
    if (inList) { out.push('</ul>'); inList = false; }
    out.push('<h3 class="sub-title">' + trimmed.substring(4) + '</h3>');
  } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
    if (!inList) { out.push('<ul>'); inList = true; }
    const itemText = trimmed.substring(2)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
    out.push('<li>' + itemText + '</li>');
  } else if (trimmed.startsWith('---')) {
    if (inList) { out.push('</ul>'); inList = false; }
    out.push('<hr class="divider" />');
  } else {
    if (inList) { out.push('</ul>'); inList = false; }
    const pText = trimmed
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
    out.push('<p>' + pText + '</p>');
  }
}
if (inList) out.push('</ul>');

const parsedBody = out.join('\n');

const fullHtml = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LifeSync - เอกสารข้อเสนอนวัตกรรมการสื่อสารสุขภาพ</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4;
      margin: 20mm 18mm 20mm 18mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 13.5pt;
      line-height: 1.65;
      color: #1e293b;
      background-color: #f1f5f9;
      margin: 0;
      padding: 0;
    }
    .page-container {
      max-width: 860px;
      margin: 30px auto;
      background: #ffffff;
      padding: 60px 70px;
      box-shadow: 0 4px 25px rgba(0,0,0,0.06);
      border-radius: 8px;
    }
    .print-bar {
      position: sticky;
      top: 0;
      background: #0f172a;
      color: white;
      padding: 14px 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 100;
      box-shadow: 0 2px 12px rgba(0,0,0,0.18);
    }
    .print-btn {
      background: #10b981;
      color: white;
      border: none;
      padding: 10px 22px;
      font-size: 15px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: background 0.2s;
    }
    .print-btn:hover {
      background: #059669;
    }
    .badge {
      display: inline-block;
      background: #ecfdf5;
      color: #059669;
      font-size: 11pt;
      font-weight: 600;
      padding: 4px 14px;
      border-radius: 20px;
      border: 1px solid #a7f3d0;
      margin-bottom: 14px;
    }
    h1.doc-title {
      font-size: 23pt;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.35;
      margin-top: 6px;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 3px solid #10b981;
    }
    h2.section-title {
      font-size: 16pt;
      font-weight: 700;
      color: #0f172a;
      margin-top: 36px;
      margin-bottom: 14px;
      padding-bottom: 6px;
      border-bottom: 1.5px solid #e2e8f0;
      page-break-after: avoid;
    }
    h3.sub-title {
      font-size: 14pt;
      font-weight: 600;
      color: #047857;
      margin-top: 24px;
      margin-bottom: 10px;
      page-break-after: avoid;
    }
    p {
      margin-top: 0;
      margin-bottom: 14px;
      text-align: justify;
    }
    ul {
      margin-top: 4px;
      margin-bottom: 16px;
      padding-left: 28px;
    }
    li {
      margin-bottom: 6px;
    }
    code {
      font-family: 'Plus Jakarta Sans', monospace;
      background: #f8fafc;
      color: #0284c7;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11.5pt;
      border: 1px solid #e2e8f0;
    }
    hr.divider {
      border: 0;
      border-top: 1px dashed #cbd5e1;
      margin: 28px 0;
    }
    strong {
      color: #0f172a;
    }
    @media print {
      body {
        background: white;
        font-size: 11.5pt;
      }
      .page-container {
        box-shadow: none;
        padding: 0;
        margin: 0;
        max-width: 100%;
      }
      .print-bar {
        display: none !important;
      }
      h2.section-title {
        page-break-after: avoid;
      }
      h3.sub-title {
        page-break-after: avoid;
      }
      ul, li {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <div>
      <strong>📄 เอกสารข้อเสนอนวัตกรรมการสื่อสารสุขภาพ (LifeSync)</strong>
      <span style="margin-left: 10px; opacity: 0.8; font-size: 13px;">พร้อมสำหรับบันทึกเป็น PDF</span>
    </div>
    <button class="print-btn" onclick="window.print()">
      🖨️ กดพิมพ์ / บันทึกเป็น PDF (Print to PDF)
    </button>
  </div>

  <div class="page-container">
    <div class="badge">Digital Health Communication Innovation • LifeSync 2026</div>
    ${parsedBody}
  </div>
</body>
</html>`;

fs.writeFileSync(outHtmlPath, fullHtml);
console.log('Generated docs/LifeSync_Proposal.html successfully!');
