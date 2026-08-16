const fs = require('fs');
const file = 'c:/Users/Akhila/Desktop/projects/Small-business-sales-intelligence-platform-SB7-Team1/Frontend/src/pages/InvoiceList/index.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. mapBackendInvoice
content = content.replace(
  /const method = inv\.payments && inv\.payments\.length > 0 \? inv\.payments\[0\]\.method : 'UPI';/,
  "const method = inv.payments && inv.payments.length > 0 ? inv.payments[0].method : 'UPI';\n  const reference = inv.payments && inv.payments.length > 0 ? inv.payments[0].reference : '';"
);
content = content.replace(
  /method,[\r\n\s]+tax: inv\.taxAmount \|\| 0,/,
  "method,\n    reference,\n    tax: inv.taxAmount || 0,"
);

// 2. PDF Download
content = content.replace(
  /doc\.text\(`Payment Method: \$\{invoice\.method\}`,\s*pageWidth\s*-\s*14,\s*y,\s*\{\s*align:\s*'right'\s*\}\);/,
  "doc.text(`Payment Method: ${invoice.method}`, pageWidth - 14, y, { align: 'right' });\n      if (invoice.reference && invoice.reference !== 'MANUAL_DASHBOARD') {\n        y += 8;\n        doc.text(`Ref/Txn ID: ${invoice.reference}`, pageWidth - 14, y, { align: 'right' });\n      }"
);

// 3. Print HTML
content = content.replace(
  /<div><strong>Method:<\/strong> \$\{invoice\.method\}<\/div>/,
  "<div><strong>Method:</strong> ${invoice.method}</div>\n            ${invoice.reference && invoice.reference !== 'MANUAL_DASHBOARD' ? `<div><strong>Ref/Txn ID:</strong> ${invoice.reference}</div>` : ''}"
);

// 4. Drawer UI
content = content.replace(
  /<span className="bg-white\/5 px-2 py-0\.5 rounded border border-white\/5 text-\[10px\]">\{viewInvoice\.method\}<\/span>\s*<\/div>/,
  "<span className=\"bg-white/5 px-2 py-0.5 rounded border border-white/5 text-[10px]\">{viewInvoice.method}</span>\n              </div>\n              {viewInvoice.reference && viewInvoice.reference !== 'MANUAL_DASHBOARD' && (\n                <div className=\"flex justify-between items-center\">\n                  <span className=\"text-slate-400\">Ref/Txn ID:</span>\n                  <span className=\"font-mono text-cyan-300 font-bold\">{viewInvoice.reference}</span>\n                </div>\n              )}"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Done mapping reference in InvoiceList/index.jsx');
