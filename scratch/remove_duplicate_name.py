import os
import re

fpath = 'c:/xampp/htdocs/DTR/frontend/src/pages/DTR/AdminDtrPage.jsx'

with open(fpath, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the duplicate name checkbox block exactly.
pattern = r'<label className="checkbox-label"[^>]+>\s*<input type="checkbox" checked=\{pdfColumns\.name\}[^>]+/> Name\s*</label>'

# We know the first one is correct, the second one is duplicate. Let's find all occurrences and replace the second one.
matches = list(re.finditer(pattern, content))
if len(matches) > 1:
    second_match = matches[1]
    # Replace the second match with an empty string
    content = content[:second_match.start()] + content[second_match.end():]
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Removed duplicate Name checkbox successfully!")
else:
    print("Could not find duplicate Name checkbox.")

