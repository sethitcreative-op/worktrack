import re
import os

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

# AdminDtrPage.jsx
admin_path = 'frontend/src/pages/DTR/AdminDtrPage.jsx'
content = read_file(admin_path)

content = content.replace("import './FixedDtrPage.css';", "import './AdminDtrPage.css';")
content = content.replace("const FixedDtrPage = () => {", "const AdminDtrPage = () => {")
content = content.replace("export default FixedDtrPage;", "export default AdminDtrPage;")

# Remove the dtr-sidebar block (which is the employee clock in/out UI)
# In FixedDtrPage, it starts at `<div className="dtr-sidebar">` and ends before `<div className="dtr-main-content">`
# Let's use regex to remove it:
content = re.sub(r'<div className="dtr-sidebar">.*?</div>\s*<div className="dtr-main-content">', '<div className="dtr-main-content">', content, flags=re.DOTALL)

# In AdminDtrPage, we don't need the "Download PDF" button meant for standard users
content = re.sub(r'\{!isAdmin && \(\s*<div style={{ marginLeft: \'auto\' }}>.*?</div>\s*\)\}', '', content, flags=re.DOTALL)

write_file(admin_path, content)

# Now for DtrPage.jsx
dtr_path = 'frontend/src/pages/DTR/DtrPage.jsx'
dtr = read_file(dtr_path)

# Remove export center logic (Admin EXPORT LOGIC)
dtr = re.sub(r'// --- ADMIN EXPORT LOGIC ---.*?// --- END ADMIN EXPORT LOGIC ---', '', dtr, flags=re.DOTALL) # wait, I don't think there is an END comment.
# Let's remove from "const handlePresetExport =" up to "const handleEmployeePdfExport ="
dtr = re.sub(r'const handlePresetExport = \(type\).*?const handleEmployeePdfExport =', 'const handleEmployeePdfExport =', dtr, flags=re.DOTALL)

# Remove edit modal logic
dtr = re.sub(r'const openEditModal = \(record, dayObj\) => \{.*?const handleDeleteRecord = \(recordId\) => \{.*?\} catch \(err\) \{[^}]*\}\s*\};\s*', '', dtr, flags=re.DOTALL)

# Remove Admin Export Center UI
dtr = re.sub(r'\{isAdmin && \(\s*<div className="admin-export-center">.*?</div>\s*\)\}', '', dtr, flags=re.DOTALL)

# Remove Employee Select from toolbar
dtr = re.sub(r'\{isAdmin && \(\s*<>\s*<div className="toolbar-divider"></div>\s*<div className="toolbar-group">.*?</div>\s*</>\s*\)\}', '', dtr, flags=re.DOTALL)

# Remove Admin columns from table
dtr = re.sub(r'\{isAdmin && \(\s*<th.*?>Actions</th>\s*\)\}', '', dtr, flags=re.DOTALL)
dtr = re.sub(r'\{isAdmin && \(\s*<td className="premium-table-actions">.*?</td>\s*\)\}', '', dtr, flags=re.DOTALL)

# Remove Edit Modal UI at bottom
dtr = re.sub(r'\{editModal\.isOpen && \(\s*<div className="premium-modal-overlay">.*?</div>\s*\)\}', '', dtr, flags=re.DOTALL)

write_file(dtr_path, dtr)

# Now for FixedDtrPage.jsx
fixed_path = 'frontend/src/pages/DTR/FixedDtrPage.jsx'
fixed = read_file(fixed_path)

# Same removals
fixed = re.sub(r'const handlePresetExport = \(type\).*?const handleEmployeePdfExport =', 'const handleEmployeePdfExport =', fixed, flags=re.DOTALL)
fixed = re.sub(r'const openEditModal = \(record, dayObj, targetUserId\) => \{.*?const handleDeleteRecord = \(recordId\) => \{.*?\} catch \(err\) \{[^}]*\}\s*\};\s*', '', fixed, flags=re.DOTALL)
fixed = re.sub(r'\{isAdmin && \(\s*<div className="admin-export-center">.*?</div>\s*\)\}', '', fixed, flags=re.DOTALL)
fixed = re.sub(r'\{isAdmin && \(\s*<>\s*<div className="toolbar-divider"></div>\s*<div className="toolbar-group">.*?</div>\s*</>\s*\)\}', '', fixed, flags=re.DOTALL)
fixed = re.sub(r'\{isAdmin && \(\s*<th.*?>Actions</th>\s*\)\}', '', fixed, flags=re.DOTALL)
fixed = re.sub(r'\{isAdmin && \(\s*<td className="premium-table-actions">.*?</td>\s*\)\}', '', fixed, flags=re.DOTALL)
fixed = re.sub(r'\{editModal\.isOpen && \(\s*<div className="premium-modal-overlay">.*?</div>\s*\)\}', '', fixed, flags=re.DOTALL)

write_file(fixed_path, fixed)

print("Done")
