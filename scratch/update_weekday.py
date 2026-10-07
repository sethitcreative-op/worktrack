import os
import glob

files = glob.glob('c:/xampp/htdocs/DTR/frontend/src/pages/DTR/*.jsx')

for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if "weekday: 'short'" in content:
        content = content.replace("weekday: 'short'", "weekday: 'long'")
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {fpath}")

