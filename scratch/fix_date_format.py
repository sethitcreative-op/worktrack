import os

files = [
    'c:/xampp/htdocs/DTR/frontend/src/pages/DTR/AdminDtrPage.jsx',
    'c:/xampp/htdocs/DTR/frontend/src/pages/DTR/FixedDtrPage.jsx'
]

replacement = '''                                <td className="dtr-day-col">
                                  {dtrFilterType !== 'month' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: '1.2' }}>
                                      <span style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>{dayObj.dayName}</span>
                                      <span>{dayObj.dateStr}</span>
                                    </div>
                                  ) : (
                                    dayObj.dayNum
                                  )}
                                </td>'''

for fpath in files:
    if os.path.exists(fpath):
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # We need to make sure filteredDays has dayName for all types except maybe month (or even month).
        # First fix filteredDays:
        
        # month loop
        old_month = '''const dateStr = ${year}--;
          days.push({ dateStr, dayNum: day });'''
        new_month = '''const dateStr = ${year}--;
          const d = new Date(year, month - 1, day);
          const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
          days.push({ dateStr, dayNum: day, dayName });'''
          
        content = content.replace(old_month, new_month)
        
        # week loop
        old_week = '''days.push({ dateStr: ${y}--, dayNum: d.getDate() });'''
        new_week = '''const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
            days.push({ dateStr: ${y}--, dayNum: d.getDate(), dayName });'''
            
        content = content.replace(old_week, new_week)
        
        # day
        old_day = '''days.push({ dateStr: dtrFilterValue, dayNum: parseInt(parts[2], 10) });'''
        new_day = '''const d = new Date(parts[0], parts[1] - 1, parts[2]);
          const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
          days.push({ dateStr: dtrFilterValue, dayNum: parseInt(parts[2], 10), dayName });'''
          
        content = content.replace(old_day, new_day)

        # Replace UI
        content = content.replace('<td className="dtr-day-col">{dayObj.dayNum}</td>', replacement.replace('                                ', '                                '))
        
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {fpath}")

