import os
import glob

files = glob.glob('c:/xampp/htdocs/DTR/frontend/src/pages/DTR/*.jsx')

old_render_1 = '''                                <td className="dtr-day-col">
                                  {dtrFilterType !== 'month' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: '1.2' }}>
                                      <span style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>{dayObj.dayName}</span>
                                      <span>{dayObj.dateStr}</span>
                                    </div>
                                  ) : (
                                    dayObj.dayNum
                                  )}
                                </td>'''

old_render_2 = '''                                <td className="dtr-day-col">
                                    {dtrFilterType !== 'month' ? (
                                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: '1.2' }}>
                                        <span style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>{dayObj.dayName}</span>
                                        <span>{dayObj.dateStr}</span>
                                      </div>
                                    ) : (
                                      dayObj.dayNum
                                    )}
                                  </td>'''

new_render_1 = '''                                <td className="dtr-day-col">
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: '1.2' }}>
                                    <span style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>{dayObj.dayName}</span>
                                    <span>{dayObj.dateStr}</span>
                                  </div>
                                </td>'''

new_render_2 = '''                                  <td className="dtr-day-col">
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: '1.2' }}>
                                      <span style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>{dayObj.dayName}</span>
                                      <span>{dayObj.dateStr}</span>
                                    </div>
                                  </td>'''

for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Try multiple spacing/indentation variations
    if "{dtrFilterType !== 'month' ?" in content or "{dtrFilterType === 'week' ?" in content:
        # We will use regex to replace everything between <td className="dtr-day-col"> and </td>
        import re
        content = re.sub(r'<td className="dtr-day-col">[\s\S]*?</td>', r'''<td className="dtr-day-col" style={{ width: '120px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: '1.2' }}>
                                      <span style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>{dayObj.dayName}</span>
                                      <span>{dayObj.dateStr}</span>
                                    </div>
                                  </td>''', content)

        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {fpath}")

