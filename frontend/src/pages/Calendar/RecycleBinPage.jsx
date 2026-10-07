import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCcw, Trash2, Search } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import './CalendarPage.css';
import API_BASE from '../../config/api';

const RecycleBinPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));
  const { addNotification } = useNotification();

  const fetchRecycleBin = async () => {
    setLoading(true);
    try {
      const [schedulesRes, leavesRes] = await Promise.all([
        axios.get(`${API_BASE}/calendar.php?role=admin&user_id=${user.id}&source=recycle`),
        axios.get(`${API_BASE}/leaves.php?action=requests&role=admin&source=recycle`)
      ]);

      const schedules = (schedulesRes.data.data || []).map(s => ({
        ...s,
        dataType: 'schedule',
        displayType: 'Schedule',
        dateStr: s.event_date
      }));

      const leaves = (leavesRes.data.data || []).map(l => ({
        ...l,
        dataType: 'leave',
        displayType: 'Leave Request',
        title: l.leave_type,
        dateStr: `${l.start_date} to ${l.end_date}`
      }));

      const allItems = [...schedules, ...leaves].sort((a, b) => new Date(b.created_at || b.updated_at || b.dateStr) - new Date(a.created_at || a.updated_at || a.dateStr));
      setItems(allItems);
    } catch (err) {
      console.error(err);
      addNotification({ type: 'error', message: 'Failed to fetch recycle bin items.' });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRecycleBin();
  }, []);

  const handleRestore = async (item) => {
    if (!window.confirm('Are you sure you want to restore this item?')) return;
    try {
      const endpoint = item.dataType === 'schedule' ? `${API_BASE}/calendar.php?id=${item.id}&action=restore&is_admin=true&user_id=${user.id}` : `${API_BASE}/leaves.php?id=${item.id}&action=restore&admin_id=${user.id}`;
      const res = await axios.delete(endpoint);
      if (res.data.status === 'success') {
        addNotification({ type: 'success', message: 'Item restored successfully.' });
        fetchRecycleBin();
      } else {
        addNotification({ type: 'error', message: res.data.message || 'Failed to restore item.' });
      }
    } catch (err) {
      addNotification({ type: 'error', message: 'Failed to restore item.' });
    }
  };

  const handlePermanentDelete = async (item) => {
    if (!window.confirm('Are you sure you want to permanently delete this item? This action cannot be undone.')) return;
    try {
      const endpoint = item.dataType === 'schedule' ? `${API_BASE}/calendar.php?id=${item.id}&action=permanent_delete&is_admin=true&user_id=${user.id}` : `${API_BASE}/leaves.php?id=${item.id}&action=permanent_delete&admin_id=${user.id}`;
      const res = await axios.delete(endpoint);
      if (res.data.status === 'success') {
        addNotification({ type: 'success', message: 'Item permanently deleted.' });
        fetchRecycleBin();
      } else {
        addNotification({ type: 'error', message: res.data.message || 'Failed to permanently delete item.' });
      }
    } catch (err) {
      addNotification({ type: 'error', message: 'Failed to permanently delete item.' });
    }
  };

  const filteredItems = items.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.user_name || '').toLowerCase().includes(term) ||
      (item.title || '').toLowerCase().includes(term) ||
      (item.displayType || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '4px', color: 'white' }}>Recycle Bin</h1>
          <p className="page-subtitle" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Restore or permanently delete removed schedules and leaves.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="search-bar" style={{ position: 'relative' }}>
            <Search className="search-icon" size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search deleted items..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '32px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '8px 16px 8px 36px', color: 'var(--text-main)', fontSize: '0.85rem' }}
            />
          </div>
        </div>
      </div>

      <div className="table-card glass" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="premium-table">
            <thead>
              <tr>
                <th>TYPE</th>
                <th>EMPLOYEE</th>
                <th>DATE(S)</th>
                <th>TITLE / DESCRIPTION</th>
                <th>PREVIOUS STATUS</th>
                <th style={{ width: '120px', textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}><div className="loading-spinner"></div></td></tr>
              ) : filteredItems.length > 0 ? (
                filteredItems.map(item => (
                  <tr key={`${item.dataType}-${item.id}`}>
                    <td>
                      <span className="event-badge" style={{ background: 'var(--card-border)', color: 'var(--text-muted)' }}>
                        {item.displayType}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {item.profile_picture ? (
                          <img src={item.profile_picture.startsWith('http') || item.profile_picture.startsWith('data:') ? item.profile_picture : `${API_BASE.replace('/api', '')}/${item.profile_picture}`} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: 'bold' }}>
                            {item.user_name ? item.user_name.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                        <span style={{ fontWeight: 500 }}>{item.user_name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{item.dateStr}</td>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>{item.title}</div>
                      {item.description && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>{item.description}</div>}
                    </td>
                    <td>
                      <span style={{ textTransform: 'capitalize', color: 'var(--text-muted)' }}>{item.previous_status || 'Unknown'}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button className="action-pill" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }} onClick={() => handleRestore(item)} title="Restore">
                          <RefreshCcw size={16} />
                        </button>
                        <button className="action-pill delete" onClick={() => handlePermanentDelete(item)} title="Delete Permanently">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <Trash2 size={32} style={{ opacity: 0.2, marginBottom: '10px' }} />
                    <p>Recycle bin is empty.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RecycleBinPage;
