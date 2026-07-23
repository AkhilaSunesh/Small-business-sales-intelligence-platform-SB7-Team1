import Papa from 'papaparse';
import { jsPDF } from 'jspdf';

/**
 * Exports current forecast table data as a downloadable CSV file.
 * Compatible with Microsoft Excel, Google Sheets, and LibreOffice.
 *
 * @param {Array} items - Array of forecast table rows
 * @param {string} filename - Download file name
 * @returns {Object} { success: boolean, message: string }
 */
export function exportCSV(items = [], filename = 'Forecast_Report.csv') {
  try {
    if (!items || items.length === 0) {
      return { success: false, message: 'No forecast data available to export.' };
    }

    const formattedData = items.map((item) => ({
      Month: item.month || item.period || '',
      'Predicted Sales': item.predictedSales ?? 0,
      Revenue: typeof item.revenue === 'number' ? `$${item.revenue.toLocaleString()}` : item.revenue || '$0',
      'Growth %': item.growth || '0%',
    }));

    const csvContent = Papa.unparse(formattedData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, message: 'CSV exported successfully.' };
  } catch (error) {
    console.error('CSV Export Error:', error);
    return { success: false, message: 'Failed to export CSV. Please try again.' };
  }
}

/**
 * Exports forecast report as a professional PDF document using jsPDF.
 * Includes Project Title, Generated Date, Forecast Summary metrics, and Table.
 *
 * @param {Object} summary - Summary cards metrics (predictedSales, expectedRevenue, etc.)
 * @param {Array} items - Array of forecast items
 * @param {string} filename - Download PDF filename
 * @returns {Object} { success: boolean, message: string }
 */
export function exportPDF(summary = {}, items = [], filename = 'Forecast_Report.pdf') {
  try {
    if (!items || items.length === 0) {
      return { success: false, message: 'No forecast data available to export.' };
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 42, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('MarketMind AI', 14, 18);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('Forecast Report', 14, 28);

    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    doc.setFontSize(10);
    doc.setTextColor(203, 213, 225);
    doc.text(`Generated: ${currentDate}`, pageWidth - 14, 28, { align: 'right' });

    // 2. Summary Section Title
    let y = 54;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Forecast Summary', 14, y);

    y += 4;
    doc.setLineWidth(0.5);
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(14, y, pageWidth - 14, y);

    // Summary Cards Content Grid
    y += 12;
    const kpis = [
      { label: 'Predicted Sales', val: summary.predictedSales || 'N/A' },
      { label: 'Expected Revenue', val: summary.expectedRevenue || 'N/A' },
      { label: 'Forecast Growth', val: summary.forecastGrowth || 'N/A' },
      { label: 'Prediction Accuracy', val: summary.predictionAccuracy || 'N/A' },
    ];

    const colWidth = (pageWidth - 28) / 2;
    kpis.forEach((kpi, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const posX = 14 + col * colWidth;
      const posY = y + row * 16;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(`${kpi.label}:`, posX, posY);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(String(kpi.val), posX + 42, posY);
    });

    y += 38;

    // 3. Forecast Table Section Title
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Forecast Data Table', 14, y);

    y += 4;
    doc.line(14, y, pageWidth - 14, y);

    y += 8;

    // Table Column Headers
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(14, y, pageWidth - 28, 10, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);

    const headers = ['Month / Period', 'Predicted Sales', 'Revenue ($)', 'Growth %'];
    const colX = [18, 65, 115, 160];

    headers.forEach((headerText, i) => {
      doc.text(headerText, colX[i], y + 6.5);
    });

    y += 10;

    // Table Data Rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);

    items.forEach((item, index) => {
      // Row Background
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y, pageWidth - 28, 9, 'F');
      }

      const revFormatted =
        typeof item.revenue === 'number'
          ? `$${item.revenue.toLocaleString()}`
          : item.revenue || '$0';

      doc.text(String(item.month || item.period || ''), colX[0], y + 6);
      doc.text(String(item.predictedSales ?? 0), colX[1], y + 6);
      doc.text(String(revFormatted), colX[2], y + 6);

      // Growth color highlight
      const growthStr = String(item.growth || '0%');
      if (growthStr.startsWith('+')) {
        doc.setTextColor(16, 185, 129); // emerald-600
      } else if (growthStr.startsWith('-')) {
        doc.setTextColor(225, 29, 72); // rose-600
      } else {
        doc.setTextColor(15, 23, 42);
      }
      doc.text(growthStr, colX[3], y + 6);
      doc.setTextColor(15, 23, 42); // Reset color

      y += 9;

      // New Page check if table exceeds page height
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    // 4. Footer Note
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(148, 163, 184);
    doc.text('Report generated by MarketMind AI Sales Intelligence Platform.', 14, 285);

    doc.save(filename);
    return { success: true, message: 'PDF exported successfully.' };
  } catch (error) {
    console.error('PDF Export Error:', error);
    return { success: false, message: 'Failed to export PDF. Please try again.' };
  }
}
