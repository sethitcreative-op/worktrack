import os
import re

fpath = 'c:/xampp/htdocs/DTR/frontend/src/pages/DTR/AdminDtrPage.jsx'

with open(fpath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update periodStr in exportFixedReportPDF
old_period = '''    let periodStr = "";
    if (dateType === 'month') {
      const [y, m] = dateValue.split('-');
      const d = new Date(y, m - 1);
      periodStr = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    } else if (dateType === 'week') {
      periodStr = Week of ;
    } else {
      periodStr = formatMMDDYYYY(startStr);
    }'''

new_period = '''    let periodStr = ${formatMMDDYYYY(startStr)} to ;'''

content = content.replace(old_period, new_period)

# 2. Update emps filtering by category
old_emps = '''    // Group by employee
    const grouped = {};
    let emps = employees;
    if (!usersToExport.includes('all')) {
      emps = employees.filter(e => usersToExport.includes(String(e.id)));
    }

    emps.forEach(emp => {'''

new_emps = '''    // Group by employee
    const grouped = {};
    let emps = employees;
    if (!usersToExport.includes('all')) {
      emps = employees.filter(e => usersToExport.includes(String(e.id)));
    }
    
    // Filter by Category (Fixed vs Timed)
    emps = emps.filter(e => {
      const empType = e.employee_type || 'Timed';
      return empType === category;
    });

    emps.forEach(emp => {'''

content = content.replace(old_emps, new_emps)

with open(fpath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated period string and category filtering!")

