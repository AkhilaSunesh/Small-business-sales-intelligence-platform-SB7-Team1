const fs = require('fs');
const path = require('path');

const map = {
  Dashboard: { titleKey: 'dashboard', descKey: 'dashboardDesc' },
  BusinessOverview: { titleKey: 'business overview', descKey: 'businessOverviewDesc' },
  Reports: { titleKey: 'reportsTitle', descKey: 'reportsDesc' },
  Users: { titleKey: 'usersTitle', descKey: 'usersDesc' },
  CreateInvoice: { titleKey: 'create invoice', descKey: 'createInvoiceDesc' },
  InvoiceList: { titleKey: 'invoice list', descKey: 'invoiceListDesc' },
  CustomerInsights: { titleKey: 'customer insights', descKey: 'customerInsightsDesc' },
  Recommendations: { titleKey: 'recommendations', descKey: 'recommendationsDesc' },
  AnomalyAlerts: { titleKey: 'anomaly alerts', descKey: 'anomalyAlertsDesc' },
  ForecastReports: { titleKey: 'forecast reports', descKey: 'forecastReportsDesc' },
  ForecastVsActual: { titleKey: 'forecast vs actual', descKey: 'forecastVsActualDesc' },
  Inventory: { titleKey: 'inventoryView', descKey: 'inventoryDesc' },
  Upload: { titleKey: 'uploadCenter', descKey: 'uploadDesc' }
};

const dir = 'c:/Users/Akhila/Desktop/projects/Small-business-sales-intelligence-platform-SB7-Team1/Frontend/src/pages';

for (const [page, keys] of Object.entries(map)) {
  const file = path.join(dir, page, 'index.jsx');
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Add import if not exists
    if (!content.includes('useTranslation')) {
      content = content.replace(/(import .*?;[\r\n]+)/, "$1import { useTranslation } from 'react-i18next';\n");
    }
    
    // Add hook if not exists
    if (!content.includes('const { t } = useTranslation()')) {
      const functionMatch = content.match(/function [A-Za-z0-9_]+\s*\([^)]*\)\s*\{/);
      if (functionMatch) {
        content = content.replace(functionMatch[0], `${functionMatch[0]}\n  const { t } = useTranslation();\n`);
      } else {
        const arrowMatch = content.match(/const [A-Za-z0-9_]+\s*=\s*\([^)]*\)\s*=>\s*\{/);
        if (arrowMatch) {
          content = content.replace(arrowMatch[0], `${arrowMatch[0]}\n  const { t } = useTranslation();\n`);
        }
      }
    }
    
    // Replace h1
    content = content.replace(/<h1([^>]*)>.*?<\/h1>/, `<h1$1>{t('${keys.titleKey}')}</h1>`);
    
    // Replace p (the one right after h1 usually)
    content = content.replace(/<p([^>]*(mt-1\.5|text-sm text-slate-400|text-slate-400 mt-1)[^>]*)>.*?<\/p>/, `<p$1>{t('${keys.descKey}')}</p>`);

    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', page);
  }
}
