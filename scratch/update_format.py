import glob
import os

target_files = glob.glob('c:/xampp/htdocs/DTR/frontend/src/pages/DTR/*.jsx')

old_code = '''  const formatHoursDuration = (decimalHours) => {
    const val = parseFloat(decimalHours);
    if (!val || isNaN(val) || val === 0) return '00:00:00';
    const totalSeconds = Math.round(val * 3600);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return ${String(hours).padStart(2, '0')}::;
  };'''

new_code = '''  const formatHoursDuration = (decimalHours) => {
    const val = parseFloat(decimalHours);
    if (!val || isNaN(val) || val === 0) return '0hrs 0mins';
    const totalSeconds = Math.round(val * 3600);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    return ${hours}hrs mins;
  };'''

for fpath in target_files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if old_code in content:
        content = content.replace(old_code, new_code)
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {fpath}")
    else:
        print(f"Could not find exact block in {fpath}")

