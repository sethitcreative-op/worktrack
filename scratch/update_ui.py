import os

fpath = 'c:/xampp/htdocs/DTR/frontend/src/pages/DTR/AdminDtrPage.jsx'

with open(fpath, 'r', encoding='utf-8') as f:
    content = f.read()

old_ui = '''                            ) : (
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
                            )}'''

new_ui = '''                            ) : (
                              <>
                                <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                  <input type="checkbox" checked={pdfColumns.name} onChange={e => setPdfColumns({ ...pdfColumns, name: e.target.checked })} /> Name
                                </label>
                                <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                  <input type="checkbox" checked={pdfColumns.totalHrs} onChange={e => setPdfColumns({ ...pdfColumns, totalHrs: e.target.checked })} /> Total Hrs
                                </label>
                                <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                  <input type="checkbox" checked={pdfColumns.rate} onChange={e => setPdfColumns({ ...pdfColumns, rate: e.target.checked })} /> Rate
                                </label>
                                <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                  <input type="checkbox" checked={pdfColumns.earnings} onChange={e => setPdfColumns({ ...pdfColumns, earnings: e.target.checked })} /> Total Pay
                                </label>
                              </>
                            )}'''

if old_ui in content:
    content = content.replace(old_ui, new_ui)
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated UI checkboxes successfully!")
else:
    print("Could not find the UI block!")
