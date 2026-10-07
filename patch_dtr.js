const fs = require('fs');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // 1. Update pdfColumns state
  content = content.replace(
    /const \[pdfColumns, setPdfColumns\] = useState\(\{[\s\S]*?earnings: true\s*\}\);/,
    `const [pdfColumns, setPdfColumns] = useState({
    name: true,
    amIn: true,
    amOut: true,
    pmIn: true,
    pmOut: true,
    totalHrs: true,
    rate: true,
    earnings: true,
    logInRecord: true,
    hours: true,
    status: true
  });`
  );

  // 2. Remove Advanced Settings toggle and state
  content = content.replace(/const \[showExportSettings, setShowExportSettings\] = useState\(false\);\n/, '');
  
  // 3. Update exportPDF to handle Fixed/Timed categories and be a proper daily report
  content = content.replace(
    /const exportPDF = \([^)]*\) => \{[\s\S]*?autoTable\(doc, \{/m,
    `const exportPDF = (customStart = startDate, customEnd = endDate, exportType = 'custom', usersToExport = customExportUsers, category = 'Timed') => {
    if (exportType === 'weekly') {
      exportWeeklySchedulePDF(customStart, customEnd, usersToExport);
      return;
    }

    let currentRecords = records;

    if (!usersToExport.includes('all')) {
      currentRecords = currentRecords.filter(r => usersToExport.includes(String(r.user_id)));
    }

    if (customStart) currentRecords = currentRecords.filter(r => r.date >= customStart);
    if (customEnd) currentRecords = currentRecords.filter(r => r.date <= customEnd);

    currentRecords.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA - dateB;
    });

    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(\`Payroll Report - \${category}\`, 148.5, 20, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);

    const formatMMDDYYYY = (dateStr) => {
      if (!dateStr) return 'All Time';
      const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
      return \`\${String(d.getMonth() + 1).padStart(2, '0')}-\${String(d.getDate()).padStart(2, '0')}-\${d.getFullYear()}\`;
    };
    const cycleStr = (customStart && customEnd) ? \`\${formatMMDDYYYY(customStart)} to \${formatMMDDYYYY(customEnd)}\` : "All Records";
    doc.text(\`Cycle: \${cycleStr}\`, 148.5, 28, { align: "center" });

    const tableColumn = [];
    const dataKeys = [];

    if (exportType === 'monthly' || exportType === 'yearly') {
      tableColumn.push("NAME", "TOTAL HRS", "TOTAL PAY");
      dataKeys.push("full_name", "total_hours", "earnings");
    } else {
      if (pdfColumns.name) { tableColumn.push("NAME"); dataKeys.push("full_name"); }
      tableColumn.push("DATE"); dataKeys.push("date");
      
      if (category === 'Fixed') {
        if (pdfColumns.logInRecord) { tableColumn.push("LOG IN RECORD"); dataKeys.push("log_in_record"); }
        if (pdfColumns.rate) { tableColumn.push("RATE"); dataKeys.push("hourly_rate"); }
        if (pdfColumns.hours) { tableColumn.push("HOURS"); dataKeys.push("total_hours"); }
        if (pdfColumns.status) { tableColumn.push("STATUS"); dataKeys.push("status"); }
      } else {
        if (pdfColumns.totalHrs) { tableColumn.push("TOTAL HRS"); dataKeys.push("total_hours"); }
        if (pdfColumns.rate) { tableColumn.push("RATE"); dataKeys.push("hourly_rate"); }
        if (pdfColumns.amIn) { tableColumn.push("AM IN"); dataKeys.push("am_in"); }
        if (pdfColumns.amOut) { tableColumn.push("AM OUT"); dataKeys.push("am_out"); }
        if (pdfColumns.pmIn) { tableColumn.push("PM IN"); dataKeys.push("pm_in"); }
        if (pdfColumns.pmOut) { tableColumn.push("PM OUT"); dataKeys.push("pm_out"); }
        if (pdfColumns.earnings) { tableColumn.push("TOTAL PAY"); dataKeys.push("earnings"); }
      }
    }

    let recordsToProcess = currentRecords;
    if (exportType === 'monthly' || exportType === 'yearly') {
      const grouped = {};
      currentRecords.forEach(r => {
        const uid = r.user_id;
        const empRate = parseFloat(employees.find(e => String(e.id) === String(uid))?.hourly_rate || r.hourly_rate || 0);
        if (!grouped[uid]) {
          grouped[uid] = { ...r, hourly_rate: empRate, total_hours: 0, status: 'Present', full_name: r.full_name || employees.find(e => String(e.id) === String(uid))?.full_name || user.full_name };
        } else {
          if (!grouped[uid].hourly_rate) grouped[uid].hourly_rate = empRate;
        }
        if (r.status !== 'Absent') {
          grouped[uid].total_hours += parseFloat(r.total_hours || 0);
        }
      });
      recordsToProcess = Object.values(grouped);
    }

    let grandTotalHrs = 0;
    let grandTotalEarnings = 0;

    const tableRows = [];
    recordsToProcess.forEach(record => {
      const rowData = [];
      const recordHrs = parseFloat(record.total_hours || 0);
      const recordRate = parseFloat(record.hourly_rate || employees.find(e => String(e.id) === String(record.user_id))?.hourly_rate || 0);
      const recordEarnings = recordHrs * recordRate;

      if (record.status !== 'Absent') {
        grandTotalHrs += recordHrs;
        grandTotalEarnings += recordEarnings;
      }

      dataKeys.forEach(key => {
        const isSpecialStatus = ['Absent', 'Leave', 'Holiday', 'Rescheduled'].includes(record.status);
        const displayStatus = record.status ? record.status.toUpperCase() : '';
        const isLeave = displayStatus === 'LEAVE' || displayStatus === 'APPROVED LEAVE';

        if (key === 'date') rowData.push(record.date);
        else if (key === 'status') rowData.push(displayStatus || 'PRESENT');
        else if (key === 'full_name') rowData.push(record.full_name);
        
        else if (key === 'log_in_record' || key === 'am_in') rowData.push(isSpecialStatus ? '---' : (record.am_in ? formatTime(record.am_in, record.date) : '--:--'));
        else if (key === 'am_out') rowData.push(isSpecialStatus ? '---' : (record.am_out ? formatTime(record.am_out, record.date) : '--:--'));
        else if (key === 'pm_in') rowData.push(isSpecialStatus ? '---' : (record.pm_in ? formatTime(record.pm_in, record.date) : '--:--'));
        else if (key === 'pm_out') rowData.push(isSpecialStatus ? '---' : (record.pm_out ? formatTime(record.pm_out, record.date) : '--:--'));
        
        else if (key === 'total_hours') rowData.push(isLeave ? '8h' : (isSpecialStatus ? '---' : (record.total_hours ? formatHoursDuration(record.total_hours) : '0h')));
        else if (key === 'hourly_rate') rowData.push(isSpecialStatus ? '' : \`$\${recordRate.toFixed(2)}\`);
        else if (key === 'earnings') rowData.push(isSpecialStatus ? '' : (recordEarnings > 0 ? \`$\${recordEarnings.toFixed(2)}\` : '-- -- --'));
      });
      tableRows.push(rowData);
    });

    const grandTotalRow = [];
    dataKeys.forEach((key, index) => {
      if (index === 0) grandTotalRow.push("GRAND TOTAL");
      else if (key === 'total_hours') grandTotalRow.push(formatHoursDuration(grandTotalHrs));
      else if (key === 'hourly_rate' || key === 'date' || key === 'status' || key === 'log_in_record' || key === 'am_in' || key === 'am_out' || key === 'pm_in' || key === 'pm_out') grandTotalRow.push("");
      else if (key === 'earnings') grandTotalRow.push(grandTotalEarnings > 0 ? \`$\${grandTotalEarnings.toFixed(2)}\` : '-- -- --');
      else grandTotalRow.push("");
    });
    tableRows.push(grandTotalRow);

    autoTable(doc, {`
  );

  // 4. Update handleFixedReportExport to use exportPDF
  content = content.replace(
    /exportFixedReportPDF\(start, end, fixedReportCategory, fixedReportDateType, fixedReportDateValue, fixedReportUsers\);/g,
    `exportPDF(start, end, 'custom', fixedReportUsers, fixedReportCategory);`
  );
  
  // 5. Inject checkboxes UI right before the button block in the Report Salary section
  const includeColumnsUI = `
                  <div style={{ width: '100%', marginTop: '16px' }}>
                    <h4 style={{ color: 'var(--text-main)', marginBottom: '8px', fontSize: '0.9rem' }}>Include Columns:</h4>
                    <div className="checkbox-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
                      <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                        <input type="checkbox" checked={pdfColumns.name} onChange={e => setPdfColumns({ ...pdfColumns, name: e.target.checked })} /> Name
                      </label>
                      {fixedReportCategory === 'Fixed' ? (
                        <>
                          <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                            <input type="checkbox" checked={pdfColumns.logInRecord} onChange={e => setPdfColumns({ ...pdfColumns, logInRecord: e.target.checked })} /> Log in Record
                          </label>
                          <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                            <input type="checkbox" checked={pdfColumns.rate} onChange={e => setPdfColumns({ ...pdfColumns, rate: e.target.checked })} /> Rate
                          </label>
                          <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                            <input type="checkbox" checked={pdfColumns.hours} onChange={e => setPdfColumns({ ...pdfColumns, hours: e.target.checked })} /> Hours
                          </label>
                          <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                            <input type="checkbox" checked={pdfColumns.status} onChange={e => setPdfColumns({ ...pdfColumns, status: e.target.checked })} /> Status
                          </label>
                        </>
                      ) : (
                        <>
                          <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                            <input type="checkbox" checked={pdfColumns.totalHrs} onChange={e => setPdfColumns({ ...pdfColumns, totalHrs: e.target.checked })} /> Total Hrs
                          </label>
                          <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                            <input type="checkbox" checked={pdfColumns.rate} onChange={e => setPdfColumns({ ...pdfColumns, rate: e.target.checked })} /> Rate
                          </label>
                          <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                            <input type="checkbox" checked={pdfColumns.amIn} onChange={e => setPdfColumns({ ...pdfColumns, amIn: e.target.checked })} /> AM In
                          </label>
                          <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                            <input type="checkbox" checked={pdfColumns.amOut} onChange={e => setPdfColumns({ ...pdfColumns, amOut: e.target.checked })} /> AM Out
                          </label>
                          <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                            <input type="checkbox" checked={pdfColumns.pmIn} onChange={e => setPdfColumns({ ...pdfColumns, pmIn: e.target.checked })} /> PM In
                          </label>
                          <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                            <input type="checkbox" checked={pdfColumns.pmOut} onChange={e => setPdfColumns({ ...pdfColumns, pmOut: e.target.checked })} /> PM Out
                          </label>
                          <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                            <input type="checkbox" checked={pdfColumns.earnings} onChange={e => setPdfColumns({ ...pdfColumns, earnings: e.target.checked })} /> Total Pay
                          </label>
                        </>
                      )}
                    </div>
                  </div>
`;
  // Add the Include Columns UI before the Export button.
  content = content.replace(
    /(<button className="btn btn-primary" style=\{\{ padding: '10px 24px', flexShrink: 0 \}\} onClick=\{handleFixedReportExport\}>)/,
    includeColumnsUI + '\n                    $1'
  );

  // 6. Remove the old "Show Advanced Settings" button and the entire advanced block
  // The block starts with <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
  // and ends before } from Render logic.
  content = content.replace(
    /<div style=\{\{ marginTop: '24px', display: 'flex', justifyContent: 'center' \}\}>[\s\S]*?<div className="export-settings"[\s\S]*?<h4 style=\{\{ color: 'var\(--text-main\)', marginBottom: '16px' \}\}>Include Columns:<\/h4>[\s\S]*?<\/div>\s*<\/div>\s*\)\}/,
    ''
  );
  
  fs.writeFileSync(filePath, content);
}

patchFile('c:/xampp/htdocs/DTR/frontend/src/pages/DTR/DtrPage.jsx');
patchFile('c:/xampp/htdocs/DTR/frontend/src/pages/DTR/FixedDtrPage.jsx');
