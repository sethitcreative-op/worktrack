import os
import re

fpath = 'c:/xampp/htdocs/DTR/frontend/src/pages/DTR/AdminDtrPage.jsx'

with open(fpath, 'r', encoding='utf-8') as f:
    content = f.read()

# We look for the block starting with "checked={pdfColumns.totalHrs}" and ending with "checked={pdfColumns.earnings}"
# We'll replace the entire ) : (\n <> ... </>\n )} block.

pattern = r'\) : \(\s*<>\s*<label[\s\S]*?checked={pdfColumns\.totalHrs}[\s\S]*?checked={pdfColumns\.earnings}[\s\S]*?<\/label>\s*<\/>\s*\)'

new_block = r''') : (
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
                            )'''

content = re.sub(pattern, new_block, content)

with open(fpath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated UI checkboxes successfully via regex!")
