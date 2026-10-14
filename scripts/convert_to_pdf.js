const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseMarkdown(mdText) {
  const lines = mdText.split(/\r?\n/);
  const htmlParts = [];

  let inCodeBlock = false;
  let codeLang = '';
  let codeLines = [];

  let inTable = false;
  let tableRows = [];

  let inList = false;
  let listType = ''; // 'ul' or 'ol'

  let inBlockquote = false;
  let blockquoteLines = [];

  function closeList() {
    if (inList) {
      htmlParts.push(`</${listType}>`);
      inList = false;
      listType = '';
    }
  }

  function closeTable() {
    if (inTable && tableRows.length > 0) {
      let tableHtml = '<table class="api-table">\n';
      tableRows.forEach((row, idx) => {
        const isHeader = idx === 0;
        const tag = isHeader ? 'th' : 'td';
        tableHtml += '  <tr>\n';
        row.forEach(cell => {
          let formattedCell = formatInline(cell);
          tableHtml += `    <${tag}>${formattedCell}</${tag}>\n`;
        });
        tableHtml += '  </tr>\n';
      });
      tableHtml += '</table>\n';
      htmlParts.push(tableHtml);
      inTable = false;
      tableRows = [];
    }
  }

  function closeBlockquote() {
    if (inBlockquote && blockquoteLines.length > 0) {
      htmlParts.push(`<blockquote class="callout">${formatInline(blockquoteLines.join(' '))}</blockquote>\n`);
      inBlockquote = false;
      blockquoteLines = [];
    }
  }

  function formatInline(text) {
    if (!text) return '';
    let res = text;
    // Inline code
    res = res.replace(/`([^`]+)`/g, (match, p1) => {
      const trimmed = p1.trim();
      if (['POST', 'GET', 'PUT', 'DELETE', 'PATCH'].includes(trimmed)) {
        return `<span class="method-badge method-${trimmed.toLowerCase()}">${trimmed}</span>`;
      }
      if (['200 OK', '201 Created'].includes(trimmed)) {
        return `<span class="status-badge status-success">${trimmed}</span>`;
      }
      if (trimmed.startsWith('400') || trimmed.startsWith('401') || trimmed.startsWith('403') || trimmed.startsWith('404') || trimmed.startsWith('409') || trimmed.startsWith('500')) {
        return `<span class="status-badge status-error">${trimmed}</span>`;
      }
      return `<code class="inline-code">${escapeHtml(p1)}</code>`;
    });
    // Bold
    res = res.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Italic
    res = res.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    // Links [text](url)
    res = res.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    return res;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Fenced Code Block
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        closeList();
        closeBlockquote();
        closeTable();
        htmlParts.push(`<pre class="code-block"><code class="lang-${codeLang}">${escapeHtml(codeLines.join('\n'))}</code></pre>\n`);
        inCodeBlock = false;
        codeLines = [];
        codeLang = '';
      } else {
        closeList();
        closeBlockquote();
        closeTable();
        inCodeBlock = true;
        codeLang = line.trim().slice(3).trim();
        codeLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Horizontal Rule
    if (/^(\s*[-*_]\s*){3,}$/.test(line.trim())) {
      closeList();
      closeBlockquote();
      closeTable();
      htmlParts.push('<hr class="divider" />\n');
      continue;
    }

    // Blockquote
    if (line.trim().startsWith('>')) {
      closeList();
      closeTable();
      inBlockquote = true;
      blockquoteLines.push(line.replace(/^>\s*/, ''));
      continue;
    } else if (inBlockquote) {
      closeBlockquote();
    }

    // Table Row
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      closeList();
      closeBlockquote();
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      // Check if separator row (e.g. |---|---|)
      const isSep = cells.every(c => /^[-:]+$/.test(c));
      if (!isSep) {
        inTable = true;
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      closeTable();
    }

    // Headings
    if (line.startsWith('#')) {
      closeList();
      closeBlockquote();
      closeTable();
      const match = line.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const text = formatInline(match[2]);
        const id = match[2].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        htmlParts.push(`<h${level} id="${id}" class="heading-${level}">${text}</h${level}>\n`);
        continue;
      }
    }

    // Unordered List
    if (/^\s*[*+-]\s+(.*)$/.test(line)) {
      closeBlockquote();
      closeTable();
      if (!inList || listType !== 'ul') {
        closeList();
        inList = true;
        listType = 'ul';
        htmlParts.push('<ul>\n');
      }
      const itemText = line.replace(/^\s*[*+-]\s+/, '');
      htmlParts.push(`  <li>${formatInline(itemText)}</li>\n`);
      continue;
    }

    // Ordered List
    if (/^\s*\d+\.\s+(.*)$/.test(line)) {
      closeBlockquote();
      closeTable();
      if (!inList || listType !== 'ol') {
        closeList();
        inList = true;
        listType = 'ol';
        htmlParts.push('<ol>\n');
      }
      const itemText = line.replace(/^\s*\d+\.\s+/, '');
      htmlParts.push(`  <li>${formatInline(itemText)}</li>\n`);
      continue;
    }

    // Empty line
    if (!line.trim()) {
      closeList();
      closeBlockquote();
      closeTable();
      continue;
    }

    // Regular paragraph
    closeList();
    closeBlockquote();
    closeTable();
    htmlParts.push(`<p>${formatInline(line)}</p>\n`);
  }

  closeList();
  closeBlockquote();
  closeTable();

  return htmlParts.join('\n');
}

function buildFullHtml(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <style>
    @page {
      size: A4;
      margin: 16mm 14mm 16mm 14mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.55;
      color: #1F2937;
      background-color: #FFFFFF;
      margin: 0;
      padding: 0;
    }
    
    /* Cover Page */
    .cover-page {
      page-break-after: always;
      text-align: center;
      padding-top: 100px;
      padding-bottom: 60px;
    }
    .cover-logo {
      font-size: 34pt;
      font-weight: 800;
      color: #7C3AED;
      letter-spacing: 4px;
      margin-bottom: 12px;
      text-transform: uppercase;
    }
    .cover-title {
      font-size: 24pt;
      font-weight: 700;
      color: #111827;
      line-height: 1.25;
      margin-top: 20px;
      margin-bottom: 14px;
    }
    .cover-subtitle {
      font-size: 13pt;
      color: #6B7280;
      max-width: 650px;
      margin: 0 auto 35px auto;
      line-height: 1.5;
    }
    .cover-meta-box {
      display: inline-block;
      text-align: left;
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      padding: 20px 30px;
      margin-top: 25px;
      font-size: 10.5pt;
    }
    .cover-meta-row {
      margin-bottom: 8px;
    }
    .cover-meta-label {
      font-weight: 700;
      color: #4B5563;
      display: inline-block;
      width: 170px;
    }
    .cover-meta-val {
      color: #111827;
    }

    /* Headings */
    h1.heading-1 {
      font-size: 20pt;
      font-weight: 800;
      color: #111827;
      border-bottom: 2px solid #7C3AED;
      padding-bottom: 8px;
      margin-top: 32px;
      margin-bottom: 16px;
      page-break-after: avoid;
    }
    h2.heading-2 {
      font-size: 15pt;
      font-weight: 700;
      color: #6D28D9;
      border-bottom: 1px solid #E5E7EB;
      padding-bottom: 6px;
      margin-top: 26px;
      margin-bottom: 12px;
      page-break-after: avoid;
    }
    h3.heading-3 {
      font-size: 12.5pt;
      font-weight: 700;
      color: #1F2937;
      margin-top: 20px;
      margin-bottom: 10px;
      page-break-after: avoid;
    }
    h4.heading-4 {
      font-size: 11pt;
      font-weight: 700;
      color: #374151;
      margin-top: 14px;
      margin-bottom: 6px;
      page-break-after: avoid;
    }

    p {
      margin-top: 0;
      margin-bottom: 10px;
    }
    a {
      color: #7C3AED;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    strong {
      color: #111827;
    }

    /* Lists */
    ul, ol {
      margin-top: 4px;
      margin-bottom: 12px;
      padding-left: 24px;
    }
    li {
      margin-bottom: 4px;
    }

    /* Divider */
    hr.divider {
      border: 0;
      height: 1px;
      background: #E5E7EB;
      margin: 24px 0;
    }

    /* Blockquotes */
    blockquote.callout {
      border-left: 4px solid #7C3AED;
      background: #F5F3FF;
      color: #4C1D95;
      padding: 10px 16px;
      margin: 12px 0;
      border-radius: 0 8px 8px 0;
      font-size: 10.5pt;
    }

    /* Inline Code */
    code.inline-code {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
      font-size: 9.5pt;
      background: #F3F4F6;
      color: #BE185D;
      padding: 2px 5px;
      border-radius: 4px;
      border: 1px solid #E5E7EB;
    }

    /* Code Blocks */
    pre.code-block {
      background: #0F172A;
      color: #F8FAFC;
      border-radius: 8px;
      padding: 12px 14px;
      overflow-x: auto;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
      font-size: 8.8pt;
      line-height: 1.45;
      margin: 10px 0 16px 0;
      page-break-inside: avoid;
      border: 1px solid #334155;
    }

    /* Tables */
    table.api-table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0 20px 0;
      font-size: 9.5pt;
      page-break-inside: avoid;
    }
    table.api-table th {
      background: #7C3AED;
      color: #FFFFFF;
      font-weight: 700;
      text-align: left;
      padding: 8px 10px;
      border: 1px solid #6D28D9;
    }
    table.api-table td {
      padding: 7px 10px;
      border: 1px solid #E5E7EB;
      vertical-align: top;
    }
    table.api-table tr:nth-child(even) td {
      background: #F9FAFB;
    }

    /* Method Badges */
    .method-badge {
      display: inline-block;
      font-family: -apple-system, sans-serif;
      font-weight: 800;
      font-size: 8pt;
      padding: 2px 7px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #FFFFFF;
    }
    .method-get { background: #2563EB; }
    .method-post { background: #059669; }
    .method-put { background: #D97706; }
    .method-delete { background: #DC2626; }
    .method-patch { background: #7C3AED; }

    /* Status Badges */
    .status-badge {
      display: inline-block;
      font-family: -apple-system, sans-serif;
      font-weight: 700;
      font-size: 8pt;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .status-success {
      background: #DEF7EC;
      color: #03543F;
      border: 1px solid #31C48D;
    }
    .status-error {
      background: #FDE8E8;
      color: #9B1C1C;
      border: 1px solid #F98080;
    }
  </style>
</head>
<body>

  <!-- Cover Page -->
  <div class="cover-page">
    <div class="cover-logo">✨ AMARA ✨</div>
    <div class="cover-title">Backend API Specification &amp; Integration Guide</div>
    <div class="cover-subtitle">Complete Production-Grade Contracts, Response Schemas, Database DDL &amp; SMTP Configuration</div>
    
    <div class="cover-meta-box">
      <div class="cover-meta-row"><span class="cover-meta-label">Document Version:</span><span class="cover-meta-val">3.2 (Production Release)</span></div>
      <div class="cover-meta-row"><span class="cover-meta-label">Date Generated:</span><span class="cover-meta-val">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
      <div class="cover-meta-row"><span class="cover-meta-label">Target Audience:</span><span class="cover-meta-val">Backend Developers, API Engineers, DBAs, QA</span></div>
      <div class="cover-meta-row"><span class="cover-meta-label">Client Application:</span><span class="cover-meta-val">AMARA React Native Client (iOS &amp; Android)</span></div>
      <div class="cover-meta-row"><span class="cover-meta-label">Primary Identity:</span><span class="cover-meta-val">Email Authentication (Gmail SMTP Verified)</span></div>
      <div class="cover-meta-row"><span class="cover-meta-label">Test Accounts:</span><span class="cover-meta-val">rahul@amara.com / ananya.roy@amara.com (Password@123)</span></div>
      <div class="cover-meta-row"><span class="cover-meta-label">Universal Test OTP:</span><span class="cover-meta-val">123456</span></div>
    </div>
  </div>

  <!-- Document Body -->
  <div class="document-content">
    ${bodyHtml}
  </div>

</body>
</html>
`;
}

function convert(inputFile, outputPdf) {
  console.log(`Reading ${inputFile}...`);
  const mdContent = fs.readFileSync(inputFile, 'utf8');
  console.log(`Parsing markdown (${mdContent.length} chars)...`);
  const bodyHtml = parseMarkdown(mdContent);
  const fullHtml = buildFullHtml('AMARA Dating App — Backend API Specification', bodyHtml);
  
  const tempHtmlPath = path.resolve(__dirname, `temp_${path.basename(outputPdf, '.pdf')}.html`);
  fs.writeFileSync(tempHtmlPath, fullHtml, 'utf8');
  console.log(`Wrote temporary HTML to ${tempHtmlPath}`);

  console.log(`Generating PDF via wkhtmltopdf to ${outputPdf}...`);
  const wkCommand = `wkhtmltopdf \
    --page-size A4 \
    --margin-top 16mm \
    --margin-bottom 18mm \
    --margin-left 14mm \
    --margin-right 14mm \
    --enable-local-file-access \
    "${tempHtmlPath}" "${outputPdf}"`;

  execSync(wkCommand, { stdio: 'inherit' });
  console.log(`PDF created successfully at ${outputPdf}!`);

  if (fs.existsSync(tempHtmlPath)) {
    fs.unlinkSync(tempHtmlPath);
  }
}

// Convert docs/BACKEND_API_SPECIFICATION.md
const backendSpecInput = path.resolve(__dirname, '../docs/BACKEND_API_SPECIFICATION.md');
const backendSpecPdf = path.resolve(__dirname, '../AMARA_Backend_API_Specification.pdf');
convert(backendSpecInput, backendSpecPdf);

// Convert API_SPECIFICATION.md
const apiSpecInput = path.resolve(__dirname, '../API_SPECIFICATION.md');
const apiSpecPdf = path.resolve(__dirname, '../AMARA_Complete_API_Specification.pdf');
convert(apiSpecInput, apiSpecPdf);
