import os
import re

fpath = 'c:/xampp/htdocs/DTR/frontend/src/pages/DTR/AdminDtrPage.jsx'

with open(fpath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update exportWeeklySchedulePDF
content = content.replace(
    'const tableColumn = ["NAME", "CATEGORY", "WORKED", "RATE", "DEDUCTION", "TOTAL PAY"];',
    'const tableColumn = ["NAME", "RATE"];'
)

# 2. Update exportWeeklySchedulePDF row generation
old_row_weekly = '''        return [
          record.full_name,
          isFixed ? 'Fixed' : 'Timed',
          workedStr,
          rate > 0 ? $ + $ : '---',
          deduction > 0 ? -$ + $ : '---',
          earnings > 0 ? $ + $ : '-- -- --'
        ];'''
# Regex approach to be safe with template literals
old_row_weekly_pattern = r"return \[\s*record\.full_name,\s*isFixed \? 'Fixed' : 'Timed',\s*workedStr,\s*rate > 0 \? \$.*?\s*\];"
new_row_weekly = '''return [
          record.full_name,
          isFixed ? (rate > 0 ? $/wk : '---') : formatHoursDuration(hrs)
        ];'''
content = re.sub(old_row_weekly_pattern, new_row_weekly, content, flags=re.DOTALL)

# 3. Update exportWeeklySchedulePDF grand total (remove or keep empty)
old_grand_weekly_pattern = r'// Grand total row\s*tableRows\.push\(\[\s*"GRAND TOTAL",\s*"",\s*"",\s*"",\s*"",\s*\$[^\]]+\]\);'
new_grand_weekly = '''// Grand total row removed since rate columns have mixed units'''
content = re.sub(old_grand_weekly_pattern, new_grand_weekly, content, flags=re.DOTALL)

# 4. Update exportPDF (Monthly/Yearly)
# In exportPDF, we have:
# if (exportType === 'monthly' || exportType === 'yearly') {
#   tableColumn.push("NAME", "TOTAL HRS", "TOTAL PAY");
#   dataKeys.push("full_name", "total_hours", "earnings");
# }
old_cols_monthly = r'if \(exportType === \'monthly\' \|\| exportType === \'yearly\'\) \{\s*tableColumn\.push\("NAME", "TOTAL HRS", "TOTAL PAY"\);\s*dataKeys\.push\("full_name", "total_hours", "earnings"\);\s*\}'
new_cols_monthly = '''if (exportType === 'monthly' || exportType === 'yearly') {
        tableColumn.push("NAME", "RATE");
        dataKeys.push("full_name", "rate_display");
      }'''
content = re.sub(old_cols_monthly, new_cols_monthly, content)

# 5. Update how the monthly rows are built
# Right now, in exportPDF:
# grouped[uid] = { ... full_name: r.full_name, total_hours: 0, earnings: 0 ... }
# Then:
# else if (key === 'total_hours') rowData.push(formatHoursDuration(record[key]));
# else if (key === 'earnings') rowData.push(record[key] > 0 ? $ : '-- -- --');

# Let's find where grouped[uid] is populated to inject rate_display
old_grouped_monthly = r"grouped\[uid\] = \{\s*user_id: uid,\s*full_name: user\.full_name,\s*total_hours: 0,\s*earnings: 0,\s*employee_type: user\.employee_type,\s*weekly_rate: user\.weekly_rate\s*\};"
new_grouped_monthly = '''grouped[uid] = {
            user_id: uid,
            full_name: user.full_name,
            total_hours: 0,
            earnings: 0,
            employee_type: user.employee_type,
            weekly_rate: user.weekly_rate
          };'''
# Actually we can just compute rate_display when building rowData!
old_rowdata_push = r"else if \(key === 'total_hours'\) rowData\.push\(formatHoursDuration\(record\[key\]\)\);\s*else if \(key === 'earnings'\) rowData\.push\(record\[key\] > 0 \? \\$ \+ \$\{parseFloat\(record\[key\]\)\.toFixed\(2\)\} : '-- -- --'\);"
# regex for it:
old_rowdata_push_regex = r"else if \(key === 'total_hours'\) rowData\.push\(formatHoursDuration\(record\[key\]\)\);\s*else if \(key === 'hourly_rate'[\s\S]*?else if \(key === 'earnings'\) rowData\.push[^\n]+\n"

new_rowdata_push = '''else if (key === 'rate_display') {
          const isFixed = record.employee_type === 'Fixed';
          if (isFixed) {
            const wRate = parseFloat(record.weekly_rate || 0);
            rowData.push(wRate > 0 ? $/wk : '---');
          } else {
            rowData.push(formatHoursDuration(record.total_hours));
          }
        }
        else if (key === 'total_hours') rowData.push(formatHoursDuration(record[key]));
        else if (key === 'hourly_rate' || key === 'date' || key === 'status' || key === 'log_in_record' || key === 'am_in' || key === 'am_out' || key === 'pm_in' || key === 'pm_out') rowData.push("");
        else if (key === 'earnings') rowData.push(record[key] > 0 ? $ : '-- -- --');
'''

content = re.sub(old_rowdata_push_regex, new_rowdata_push, content)

with open(fpath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
