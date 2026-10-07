import os
import re

fpath = 'c:/xampp/htdocs/DTR/frontend/src/pages/DTR/AdminDtrPage.jsx'

with open(fpath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace tableColumn logic
old_col = '''    } else {
      tableColumn = ["NAME", "CATEGORY", "WORKED", "RATE", "DEDUCTION", "TOTAL PAY"];
    }'''

new_col = '''    } else {
      if (pdfColumns.name !== false) tableColumn.push("NAME");
      tableColumn.push("CATEGORY");
      if (pdfColumns.totalHrs !== false) tableColumn.push("WORKED");
      if (pdfColumns.rate !== false) tableColumn.push("RATE");
      tableColumn.push("DEDUCTION");
      if (pdfColumns.earnings !== false) tableColumn.push("TOTAL PAY");
    }'''

content = content.replace(old_col, new_col)

# Replace row logic
old_row = '''      } else {
        row = [
          record.full_name,
          isFixedUser ? 'Fixed' : 'Timed',
          formatHoursDuration(hrs),
          rate > 0 ? $/hr : '---',
          '---', // Deduction is always --- for Timed
          earnings > 0 ? $ : '-- -- --'
        ];
      }'''

new_row = '''      } else {
        if (pdfColumns.name !== false) row.push(record.full_name);
        row.push(isFixedUser ? 'Fixed' : 'Timed');
        if (pdfColumns.totalHrs !== false) row.push(formatHoursDuration(hrs));
        if (pdfColumns.rate !== false) row.push(rate > 0 ? $/hr : '---');
        row.push('---');
        if (pdfColumns.earnings !== false) row.push(earnings > 0 ? $ : '-- -- --');
      }'''

content = content.replace(old_row, new_row)

with open(fpath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated PDF logic successfully!")

