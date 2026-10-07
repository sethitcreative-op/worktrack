import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNotification } from '../../context/NotificationContext';
import { Plus, X, Check, Clock } from 'lucide-react';
import API_BASE from '../../config/api';

const LeaveTracker = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());

  const user = JSON.parse(localStorage.getItem('user'));
  const { addNotification } = useNotification();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const reqRes = await axios.get(`${API_BASE}/leaves.php?action=requests&user_id=${user.id}&role=user`);
      if (reqRes.data.status === 'success') {
        setRequests(reqRes.data.data);
      }
    } catch (err) {
      console.error(err);
      addNotification({ type: 'error', message: 'Failed to fetch leave data' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return (
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#10b981', color: '#fff', width: '28px', height: '28px', borderRadius: '50%', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)' }} title="Approved">
          <Check size={16} strokeWidth={3} />
        </span>
      );
      case 'rejected': return (
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#ef4444', color: '#fff', width: '28px', height: '28px', borderRadius: '50%', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)' }} title="Rejected">
          <X size={16} strokeWidth={3} />
        </span>
      );
      case 'pending': default: return (
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#f59e0b', color: '#fff', width: '28px', height: '28px', borderRadius: '50%', boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)' }} title="Pending">
          <Clock size={16} strokeWidth={2.5} />
        </span>
      );
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return new Date(y, m - 1, d).toLocaleDateString();
  };

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const daysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();

  const isLeaveDay = (monthIndex, day) => {
    const currentDate = new Date(year, monthIndex, day);

    for (const req of requests) {
      if (req.status !== 'approved') continue;
      
      const [sYear, sMonth, sDay] = req.start_date.split('-');
      const start = new Date(sYear, sMonth - 1, sDay);
      
      const [eYear, eMonth, eDay] = req.end_date.split('-');
      const end = new Date(eYear, eMonth - 1, eDay);

      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      currentDate.setHours(0, 0, 0, 0);
      
      if (currentDate >= start && currentDate <= end) {
        return true;
      }
    }
    return false;
  };

  const exportCSV = () => {
    let csv = 'Month,';
    for (let i = 1; i <= 31; i++) csv += `${i},`;
    csv += 'Total\n';

    months.forEach((monthName, mIndex) => {
      let row = `${monthName},`;
      const dInM = daysInMonth(mIndex, year);
      let totalLeaves = 0;

      for (let day = 1; day <= 31; day++) {
        if (day > dInM) {
          row += ',';
        } else {
          const isLeave = isLeaveDay(mIndex, day);
          if (isLeave) totalLeaves++;
          row += isLeave ? '1,' : '0,';
        }
      }
      row += `${totalLeaves}\n`;
      csv += row;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leave_tracker_${year}.csv`;
    a.click();
  };

  const currentYearApprovedRequests = requests.filter(req => {
    const [sYear] = req.start_date.split('-');
    return parseInt(sYear, 10) === year && req.status === 'approved';
  });

  const totalLeaveDaysTaken = currentYearApprovedRequests.reduce((total, req) => total + parseInt(req.total_days || 0, 10), 0);
  const totalLeavesAllowed = parseInt(user?.leave_credits || 0, 10);
  const leavesRemaining = Math.max(0, totalLeavesAllowed - totalLeaveDaysTaken);
  const hasReachedLimit = totalLeavesAllowed > 0 && totalLeaveDaysTaken >= totalLeavesAllowed;
  const hasNoCredits = totalLeavesAllowed === 0;

  useEffect(() => {
    if (requests.length > 0) {
      if (hasReachedLimit) {
        addNotification({ 
          type: 'warning', 
          message: `Notice: You have already consumed all ${totalLeavesAllowed} of your allocated leave credits for this year.` 
        });
      } else if (hasNoCredits && totalLeaveDaysTaken > 0) {
         addNotification({ 
          type: 'warning', 
          message: `Notice: You have 0 leave credits but have taken leaves.` 
        });
      }
    }
  }, [hasReachedLimit, hasNoCredits, requests.length, totalLeavesAllowed, totalLeaveDaysTaken, addNotification]);

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 className="page-title">My Leave Tracker</h1>
          <div style={{ marginTop: '12px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', padding: '6px 12px', background: '#f1f5f9', color: '#475569', borderRadius: '20px', fontWeight: '600' }}>
              Leave Credits: {totalLeavesAllowed}
            </span>
            <span style={{ fontSize: '0.85rem', padding: '6px 12px', background: (hasReachedLimit || (hasNoCredits && totalLeaveDaysTaken > 0)) ? '#fee2e2' : '#d1fae5', color: (hasReachedLimit || (hasNoCredits && totalLeaveDaysTaken > 0)) ? '#991b1b' : '#065f46', borderRadius: '20px', fontWeight: '600' }}>
              Consumed: {totalLeaveDaysTaken}
            </span>
            <span style={{ fontSize: '0.85rem', padding: '6px 12px', background: '#eff6ff', color: '#1e40af', borderRadius: '20px', fontWeight: '600' }}>
              Remaining: {leavesRemaining}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <select className="input-field" style={{ width: '120px', minWidth: '120px' }} value={year} onChange={e => setYear(parseInt(e.target.value))}>
            {[year - 2, year - 1, year, year + 1, year + 2].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button className="btn" style={{ background: '#10b981', color: 'white' }} onClick={exportCSV}>Export CSV</button>
        </div>
      </div>

      <div className="glass table-container" style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', marginBottom: '30px' }}>
        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: '1200px', width: '100%', fontSize: '0.85rem', borderCollapse: 'separate', borderSpacing: '0' }}>
            <thead>
              <tr>
                <th style={{ position: 'sticky', left: 0, background: '#f8fafc', zIndex: 2, padding: '14px 16px', color: '#475569', fontWeight: '600', textAlign: 'left', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.75rem' }}>Month</th>
                {Array.from({ length: 31 }, (_, i) => (
                  <th key={i + 1} style={{ textAlign: 'center', padding: '14px 4px', color: '#475569', fontWeight: '600', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', width: '32px', fontSize: '0.75rem' }}>{i + 1}</th>
                ))}
                <th style={{ textAlign: 'center', background: '#f8fafc', padding: '14px 16px', color: '#475569', fontWeight: '600', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.75rem' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {months.map((monthName, mIndex) => {
                const dInM = daysInMonth(mIndex, year);
                let totalLeaves = 0;
                return (
                  <tr key={monthName} style={{ transition: 'background-color 0.2s ease', backgroundColor: '#fff' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}>
                    <td style={{ position: 'sticky', left: 0, backgroundColor: 'inherit', fontWeight: '600', color: '#1e293b', zIndex: 1, padding: '12px 16px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
                      {monthName}
                    </td>
                    {Array.from({ length: 31 }, (_, dIndex) => {
                      const day = dIndex + 1;
                      if (day > dInM) return <td key={day} style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', backgroundImage: 'repeating-linear-gradient(45deg, #f1f5f9 25%, transparent 25%, transparent 75%, #f1f5f9 75%, #f1f5f9)', backgroundSize: '10px 10px' }}></td>;

                      const isLeave = isLeaveDay(mIndex, day);
                      if (isLeave) totalLeaves++;

                      return (
                        <td key={day} style={{ 
                          textAlign: 'center', 
                          padding: '6px 4px',
                          borderBottom: '1px solid #e2e8f0',
                          borderRight: '1px solid #e2e8f0',
                          background: 'transparent'
                        }}>
                          {isLeave ? (
                            <div 
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '24px',
                                height: '24px',
                                borderRadius: '6px',
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                color: '#fff',
                                fontWeight: 'bold',
                                fontSize: '0.85rem',
                                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)',
                                transition: 'transform 0.2s ease'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                              ✓
                            </div>
                          ) : (
                            <span style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>-</span>
                          )}
                        </td>
                      );
                    })}
                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#0f172a', background: '#f8fafc', padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>{totalLeaves}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px' }}>
        <h2 style={{ margin: 0 }}>Leave History</h2>
      </div>

      <div className="glass table-container">
        <div className="table-responsive">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Date Applied</th>
                <th>Leave Type</th>
                <th>Duration</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.length > 0 ? (
                requests.map(req => (
                  <tr key={req.id}>
                    <td>{new Date(req.created_at).toLocaleDateString()}</td>
                    <td>{req.leave_type}</td>
                    <td>{formatDate(req.start_date)} to {formatDate(req.end_date)}</td>
                    <td>{req.total_days}</td>
                    <td>{req.reason}</td>
                    <td>{getStatusBadge(req.status)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No leave requests found.
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

export default LeaveTracker;

