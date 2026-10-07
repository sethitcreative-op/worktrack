import re

path = 'frontend/src/pages/DTR/AdminDtrPage.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# We want to remove the entire <div className="dtr-sidebar">...</div> which is right inside <div className="dtr-content-layout">
# It ends right before <div className="dtr-main-content">

start_marker = '<div className="dtr-sidebar">'
end_marker = '<div className="dtr-main-content">'

idx1 = content.find(start_marker)
idx2 = content.find(end_marker, idx1)

if idx1 != -1 and idx2 != -1:
    content = content[:idx1] + content[idx2:]

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed AdminDtrPage")
