import os

fpath = 'c:/xampp/htdocs/DTR/frontend/src/pages/DTR/DtrPage.jsx'

with open(fpath, 'r', encoding='utf-8') as f:
    content = f.read()

# month loop
old_month = '''const dateStr = ${year}--;
        days.push({ dateStr, dayNum: day });'''
new_month = '''const dateStr = ${year}--;
        const d = new Date(year, month - 1, day);
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        days.push({ dateStr, dayNum: day, dayName });'''
content = content.replace(old_month, new_month)

# day loop
old_day = '''days.push({ dateStr: dtrFilterValue, dayNum: parseInt(parts[2], 10) });'''
new_day = '''const d = new Date(parts[0], parts[1] - 1, parts[2]);
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        days.push({ dateStr: dtrFilterValue, dayNum: parseInt(parts[2], 10), dayName });'''
content = content.replace(old_day, new_day)

# The UI rendering in DtrPage.jsx might already be:
old_render = '''<td className="dtr-day-col">
                                  {dtrFilterType === 'week' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: '1.2' }}>
                                      <span style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>{dayObj.dayName}</span>
                                      <span>{dayObj.dateStr}</span>
                                    </div>
                                  ) : (
                                    dayObj.dayNum
                                  )}
                                </td>'''
new_render = '''<td className="dtr-day-col">
                                  {dtrFilterType !== 'month' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: '1.2' }}>
                                      <span style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>{dayObj.dayName}</span>
                                      <span>{dayObj.dateStr}</span>
                                    </div>
                                  ) : (
                                    dayObj.dayNum
                                  )}
                                </td>'''
content = content.replace(old_render, new_render)

with open(fpath, 'w', encoding='utf-8') as f:
    f.write(content)
print(f"Updated {fpath}")

