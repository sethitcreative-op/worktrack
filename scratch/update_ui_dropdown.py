import os
import re

fpath = 'c:/xampp/htdocs/DTR/frontend/src/pages/DTR/AdminDtrPage.jsx'

with open(fpath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update the employee dropdown options
old_dropdown = '''<div className="premium-select-group" style={{ flex: 1, minWidth: '150px' }}>
                        <label>Employee</label>
                        <MultiSelectDropdown
                          options={employees}
                          selected={fixedReportUsers}
                          onChange={setFixedReportUsers}
                        />
                      </div>'''

new_dropdown = '''<div className="premium-select-group" style={{ flex: 1, minWidth: '150px' }}>
                        <label>Employee</label>
                        <MultiSelectDropdown
                          options={employees.filter(e => (e.employee_type || 'Timed') === fixedReportCategory)}
                          selected={fixedReportUsers}
                          onChange={setFixedReportUsers}
                        />
                      </div>'''

content = content.replace(old_dropdown, new_dropdown)

# 2. Fix the duplicate Name checkbox
old_checkboxes = '''                            ) : (
                                <>
                                  <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                    <input type="checkbox" checked={pdfColumns.name} onChange={e => setPdfColumns({ ...pdfColumns, name: e.target.checked })} /> Name
                                  </label>
                                  <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                    <input type="checkbox" checked={pdfColumns.totalHrs} onChange={e => setPdfColumns({ ...pdfColumns, totalHrs: e.target.checked })} /> Total Hrs
                                  </label>'''

new_checkboxes = '''                            ) : (
                                <>
                                  <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                    <input type="checkbox" checked={pdfColumns.totalHrs} onChange={e => setPdfColumns({ ...pdfColumns, totalHrs: e.target.checked })} /> Total Hrs
                                  </label>'''

content = content.replace(old_checkboxes, new_checkboxes)

with open(fpath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated employee dropdown and removed duplicate Name checkbox!")

