import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, Users, CalendarDays, Calendar as CalendarIcon, 
  Search, Download, Filter, CheckCircle, 
  Clock, AlertCircle, ArrowRight
} from 'lucide-react';
import CustomWeekPicker from '../../components/common/CustomWeekPicker';
import './SummaryDetailModal.css';

const SummaryDetailModal = ({
  isOpen,
  onClose,
  initialType = 'present', // 'present' | 'absent' | 'scheduled' | 'leave'
  summaryData = {},
  dtrFilterType = 'week',
  dtrFilterValue = '',
  onFilterTypeChange,
  onFilterValueChange,
  onGoToToday,
  filteredDays = [],
  formatTime,
  formatHoursDuration
}) => {
  const [activeTab, setActiveTab] = useState(initialType);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'Timed' | 'Fixed'

  // Sync activeTab when initialType changes
  useEffect(() => {
    if (initialType) {
      setActiveTab(initialType);
    }
  }, [initialType]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Fallback formatters if not provided
  const formatTimeFallback = (timeStr, recordDate) => {
    if (formatTime) return formatTime(timeStr, recordDate);
    if (!timeStr || timeStr.includes('1900-01-01') || timeStr.includes('0000-00-00')) return '--:--';
    const parts = timeStr.includes(' ') ? timeStr.split(' ')[1] : timeStr;
    if (!parts || !parts.includes(':')) return '--:--';
    const [h, m] = parts.split(':');
    const hour = parseInt(h, 10);
    if (isNaN(hour)) return '--:--';
    const period = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${String(h12).padStart(2, '0')}:${m} ${period}`;
  };

  const formatHoursFallback = (hrs) => {
    if (formatHoursDuration) return formatHoursDuration(hrs);
    const val = parseFloat(hrs);
    if (!val || isNaN(val) || val === 0) return '0hrs 0mins';
    const totalMinutes = Math.round(val * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}hrs ${minutes}mins`;
  };

  // Helper for human-readable date range label
  const dateRangeLabel = useMemo(() => {
    if (!dtrFilterValue) return 'All Dates';

    if (dtrFilterType === 'day') {
      const parts = dtrFilterValue.split('-');
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
      }
      return dtrFilterValue;
    }

    if (dtrFilterType === 'week') {
      if (filteredDays && filteredDays.length > 0) {
        const start = filteredDays[0];
        const end = filteredDays[filteredDays.length - 1];
        const startParts = start.dateStr.split('-').map(Number);
        const endParts = end.dateStr.split('-').map(Number);
        const d1 = new Date(startParts[0], startParts[1] - 1, startParts[2]);
        const d2 = new Date(endParts[0], endParts[1] - 1, endParts[2]);
        return `${d1.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${d2.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} (Specific Week)`;
      }
      return dtrFilterValue;
    }

    if (dtrFilterType === 'month') {
      const [y, m] = dtrFilterValue.split('-').map(Number);
      if (y && m) {
        const d = new Date(y, m - 1, 1);
        return `${d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} (Specific Month)`;
      }
      return dtrFilterValue;
    }

    return dtrFilterValue;
  }, [dtrFilterType, dtrFilterValue, filteredDays]);

  // Current tab metadata
  const currentTabMeta = useMemo(() => {
    switch (activeTab) {
      case 'present':
        return {
          title: dtrFilterType === 'day' ? 'Employees Present' : 'Total Present Records',
          icon: <Users size={22} />,
          badgeClass: 'type-present',
          count: summaryData?.totalPresent || 0,
          list: summaryData?.presentList || []
        };
      case 'absent':
        return {
          title: dtrFilterType === 'day' ? 'Absent Today' : 'Total Absent Records',
          icon: <X size={22} />,
          badgeClass: 'type-absent',
          count: summaryData?.totalAbsent || 0,
          list: summaryData?.absentList || []
        };
      case 'scheduled':
        return {
          title: dtrFilterType === 'day' ? 'Scheduled Today' : 'Total Scheduled Shifts',
          icon: <CalendarDays size={22} />,
          badgeClass: 'type-scheduled',
          count: summaryData?.totalScheduled || 0,
          list: summaryData?.scheduledList || []
        };
      case 'leave':
        return {
          title: dtrFilterType === 'day' ? 'On Leave Today' : 'Total Leave Records',
          icon: <CalendarIcon size={22} />,
          badgeClass: 'type-leave',
          count: summaryData?.totalLeave || 0,
          list: summaryData?.leaveList || []
        };
      default:
        return {
          title: 'Attendance Details',
          icon: <Users size={22} />,
          badgeClass: 'type-present',
          count: 0,
          list: []
        };
    }
  }, [activeTab, summaryData, dtrFilterType]);

  // Filter list by search query and employee type
  const filteredList = useMemo(() => {
    let list = currentTabMeta.list || [];

    if (typeFilter !== 'all') {
      list = list.filter(item => (item.employeeType || 'Timed') === typeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(item => {
        const name = (item.employeeName || '').toLowerCase();
        const id = String(item.employeeId || '').toLowerCase();
        const dept = (item.department || '').toLowerCase();
        const status = (item.status || item.attendanceStatus || '').toLowerCase();
        return name.includes(q) || id.includes(q) || dept.includes(q) || status.includes(q);
      });
    }

    return list;
  }, [currentTabMeta.list, typeFilter, searchQuery]);

  // Export CSV
  const handleExportCSV = () => {
    if (!filteredList.length) return;

    let headers = [];
    let rows = [];

    if (activeTab === 'present') {
      headers = ['Date', 'Day', 'Employee ID', 'Employee Name', 'Department', 'Type', 'Punch In / Record', 'Punch Out', 'Total Hours', 'Status'];
      rows = filteredList.map(item => [
        item.date,
        item.dayName,
        item.employeeId,
        `"${item.employeeName}"`,
        `"${item.department}"`,
        item.employeeType,
        item.employeeType === 'Fixed' ? (item.amIn ? `Logged in at ${formatTimeFallback(item.amIn, item.date)}` : '---') : formatTimeFallback(item.amIn, item.date),
        item.employeeType === 'Fixed' ? '---' : formatTimeFallback(item.pmOut || item.amOut, item.date),
        formatHoursFallback(item.totalHours),
        item.status
      ]);
    } else if (activeTab === 'absent') {
      headers = ['Date', 'Day', 'Employee ID', 'Employee Name', 'Department', 'Type', 'Reason', 'Status'];
      rows = filteredList.map(item => [
        item.date,
        item.dayName,
        item.employeeId,
        `"${item.employeeName}"`,
        `"${item.department}"`,
        item.employeeType,
        `"${item.reason || 'Missed Shift'}"`,
        item.status
      ]);
    } else if (activeTab === 'scheduled') {
      headers = ['Date', 'Day', 'Employee ID', 'Employee Name', 'Department', 'Type', 'Shift / Event', 'Attendance Status'];
      rows = filteredList.map(item => [
        item.date,
        item.dayName,
        item.employeeId,
        `"${item.employeeName}"`,
        `"${item.department}"`,
        item.employeeType,
        `"${item.details || item.eventTitle || 'Work Shift'}"`,
        item.attendanceStatus || item.status
      ]);
    } else if (activeTab === 'leave') {
      headers = ['Date', 'Day', 'Employee ID', 'Employee Name', 'Department', 'Type', 'Leave Type', 'Period', 'Reason', 'Status'];
      rows = filteredList.map(item => [
        item.date,
        item.dayName,
        item.employeeId,
        `"${item.employeeName}"`,
        `"${item.department}"`,
        item.employeeType,
        `"${item.leaveType}"`,
        `"${item.startDate} to ${item.endDate}"`,
        `"${item.reason || ''}"`,
        item.status
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DTR_${activeTab}_records_${dtrFilterValue || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="dtr-modal-overlay" onClick={onClose}>
      <div 
        className="summary-modal-content" 
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="summary-modal-header">
          <div className="summary-modal-title-group">
            <div className={`summary-modal-icon-badge ${currentTabMeta.badgeClass}`}>
              {currentTabMeta.icon}
            </div>
            <div>
              <div className="summary-modal-heading">
                <span>{currentTabMeta.title}</span>
                <span className={`summary-modal-count-badge ${currentTabMeta.badgeClass}`}>
                  {currentTabMeta.count} {currentTabMeta.count === 1 ? 'Record' : 'Records'}
                </span>
              </div>
              <div className="summary-modal-subtitle">
                <span>📅 {dateRangeLabel}</span>
              </div>
            </div>
          </div>

          <button 
            type="button" 
            className="summary-modal-close" 
            onClick={onClose}
            title="Close (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* 4 Cards / Category Tabs */}
        <div className="summary-modal-tabs">
          <button 
            type="button"
            className={`summary-tab-btn type-present ${activeTab === 'present' ? 'active' : ''}`}
            onClick={() => setActiveTab('present')}
          >
            <Users size={16} />
            <span>Present</span>
            <span className="summary-tab-pill">{summaryData?.totalPresent || 0}</span>
          </button>

          <button 
            type="button"
            className={`summary-tab-btn type-absent ${activeTab === 'absent' ? 'active' : ''}`}
            onClick={() => setActiveTab('absent')}
          >
            <X size={16} />
            <span>Absent</span>
            <span className="summary-tab-pill">{summaryData?.totalAbsent || 0}</span>
          </button>

          <button 
            type="button"
            className={`summary-tab-btn type-scheduled ${activeTab === 'scheduled' ? 'active' : ''}`}
            onClick={() => setActiveTab('scheduled')}
          >
            <CalendarDays size={16} />
            <span>Scheduled</span>
            <span className="summary-tab-pill">{summaryData?.totalScheduled || 0}</span>
          </button>

          <button 
            type="button"
            className={`summary-tab-btn type-leave ${activeTab === 'leave' ? 'active' : ''}`}
            onClick={() => setActiveTab('leave')}
          >
            <CalendarIcon size={16} />
            <span>On Leave</span>
            <span className="summary-tab-pill">{summaryData?.totalLeave || 0}</span>
          </button>
        </div>

        {/* Date Filter Bar connected to Parent */}
        <div className="summary-modal-datebar">
          <div className="summary-datebar-controls">
            <span className="summary-datebar-label">
              <CalendarDays size={14} /> Filter Date:
            </span>
            
            <select
              className="summary-select"
              value={dtrFilterType}
              onChange={onFilterTypeChange}
            >
              <option value="week">Specific Week</option>
              <option value="month">Specific Month</option>
              <option value="day">Specific Day</option>
            </select>

            {dtrFilterType === 'week' ? (
              <CustomWeekPicker
                value={dtrFilterValue}
                onChange={onFilterValueChange}
                className="summary-select"
              />
            ) : (
              <input
                type={dtrFilterType === 'day' ? 'date' : 'month'}
                className="summary-select"
                value={dtrFilterValue}
                onChange={e => onFilterValueChange(e.target.value)}
              />
            )}

            {onGoToToday && (
              <button 
                type="button" 
                className="summary-btn-secondary" 
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                onClick={onGoToToday}
              >
                Today
              </button>
            )}
          </div>

          <div className="summary-datebar-badge">
            <Clock size={14} />
            <span>Period Active: {dateRangeLabel}</span>
          </div>
        </div>

        {/* Secondary Filter & Search Toolbar */}
        <div className="summary-modal-toolbar">
          <div className="summary-search-box">
            <Search size={16} className="summary-search-icon" />
            <input
              type="text"
              className="summary-search-input"
              placeholder="Search by name, ID, or department..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="summary-toolbar-actions">
            <select
              className="summary-select"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="all">All Employee Types</option>
              <option value="Timed">Timed Only</option>
              <option value="Fixed">Fixed Only</option>
            </select>

            <button
              type="button"
              className="summary-btn-secondary"
              onClick={handleExportCSV}
              disabled={filteredList.length === 0}
              title="Download CSV of displayed records"
            >
              <Download size={15} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="summary-modal-body">
          {filteredList.length === 0 ? (
            <div className="summary-empty-state">
              <div className="summary-empty-icon">
                {activeTab === 'present' && <Users size={28} />}
                {activeTab === 'absent' && <CheckCircle size={28} style={{ color: '#10b981' }} />}
                {activeTab === 'scheduled' && <CalendarDays size={28} />}
                {activeTab === 'leave' && <CalendarIcon size={28} />}
              </div>
              <h4 className="summary-empty-title">
                {searchQuery || typeFilter !== 'all' 
                  ? 'No Matching Records' 
                  : `No ${currentTabMeta.title} Found`}
              </h4>
              <p className="summary-empty-desc">
                {searchQuery || typeFilter !== 'all'
                  ? 'Try adjusting your search terms or employee type filter.'
                  : `There are no ${activeTab} records recorded for the selected date range (${dateRangeLabel}).`}
              </p>
            </div>
          ) : (
            <table className="summary-modal-table">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Date</th>
                  <th style={{ minWidth: '180px' }}>Employee</th>
                  <th style={{ width: '100px' }}>Type</th>
                  {activeTab === 'present' && (
                    <>
                      <th style={{ minWidth: '200px' }}>Punch / Log Record</th>
                      <th style={{ width: '110px' }}>Hours</th>
                      <th style={{ width: '110px' }}>Status</th>
                    </>
                  )}
                  {activeTab === 'absent' && (
                    <>
                      <th style={{ minWidth: '220px' }}>Absence Details</th>
                      <th style={{ width: '110px' }}>Status</th>
                    </>
                  )}
                  {activeTab === 'scheduled' && (
                    <>
                      <th style={{ minWidth: '200px' }}>Shift / Event</th>
                      <th style={{ width: '120px' }}>Shift Hours</th>
                      <th style={{ width: '120px' }}>Attendance</th>
                    </>
                  )}
                  {activeTab === 'leave' && (
                    <>
                      <th style={{ minWidth: '160px' }}>Leave Type</th>
                      <th style={{ minWidth: '160px' }}>Period</th>
                      <th style={{ minWidth: '180px' }}>Reason / Notes</th>
                      <th style={{ width: '110px' }}>Status</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredList.map((item, idx) => {
                  const empName = item.employeeName || 'Unknown Employee';
                  const initials = empName.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'EMP';
                  const isFixed = item.employeeType === 'Fixed';

                  return (
                    <tr key={item.id || `${item.userId}_${item.date}_${idx}`}>
                      {/* Date & Day */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.date}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.dayName}</span>
                        </div>
                      </td>

                      {/* Employee Info */}
                      <td>
                        <div className="summary-user-cell">
                          <div className="summary-user-avatar">{initials}</div>
                          <div className="summary-user-details">
                            <span className="summary-user-name">{empName}</span>
                            <span className="summary-user-meta">
                              ID: {String(item.employeeId || item.userId).padStart(3, '0')} • {item.department}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Employee Type Badge */}
                      <td>
                        <span className={`dtr-modal-type-badge ${isFixed ? 'dtr-modal-type-badge--fixed' : 'dtr-modal-type-badge--timed'}`}>
                          {item.employeeType || 'Timed'}
                        </span>
                      </td>

                      {/* PRESENT SPECIFIC COLUMNS */}
                      {activeTab === 'present' && (
                        <>
                          <td>
                            {isFixed ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <CheckCircle size={15} color="#10b981" />
                                <span style={{ fontWeight: 600 }}>
                                  {item.amIn ? `Logged in at: ${formatTimeFallback(item.amIn, item.date)}` : 'Marked Present'}
                                </span>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.82rem' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <span style={{ color: 'var(--text-muted)' }}>AM:</span>
                                  <span>{item.amIn ? formatTimeFallback(item.amIn, item.date) : '--:--'} - {item.amOut ? formatTimeFallback(item.amOut, item.date) : '--:--'}</span>
                                </div>
                                {(item.pmIn || item.pmOut) && (
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>PM:</span>
                                    <span>{item.pmIn ? formatTimeFallback(item.pmIn, item.date) : '--:--'} - {item.pmOut ? formatTimeFallback(item.pmOut, item.date) : '--:--'}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                            {formatHoursFallback(item.totalHours)}
                          </td>
                          <td>
                            <span className={`summary-status-badge ${item.status === 'Late' ? 'status-late' : 'status-present'}`}>
                              {item.status || 'PRESENT'}
                            </span>
                          </td>
                        </>
                      )}

                      {/* ABSENT SPECIFIC COLUMNS */}
                      {activeTab === 'absent' && (
                        <>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <AlertCircle size={15} color="#ef4444" />
                              <span>{item.reason || 'Unscheduled / Missed shift'}</span>
                            </div>
                          </td>
                          <td>
                            <span className="summary-status-badge status-absent">
                              ABSENT
                            </span>
                          </td>
                        </>
                      )}

                      {/* SCHEDULED SPECIFIC COLUMNS */}
                      {activeTab === 'scheduled' && (
                        <>
                          <td>
                            <div style={{ fontWeight: 600 }}>
                              {item.details || item.eventTitle || 'Work Shift'}
                            </div>
                          </td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            {item.eventTime || 'Standard Hours'}
                          </td>
                          <td>
                            <span className={`summary-status-badge ${
                              item.attendanceStatus === 'Present' ? 'status-present' : 
                              item.attendanceStatus === 'On Leave' ? 'status-leave' : 
                              item.attendanceStatus === 'Absent' ? 'status-absent' : 'status-scheduled'
                            }`}>
                              {item.attendanceStatus || 'SCHEDULED'}
                            </span>
                          </td>
                        </>
                      )}

                      {/* LEAVE SPECIFIC COLUMNS */}
                      {activeTab === 'leave' && (
                        <>
                          <td>
                            <div style={{ fontWeight: 600, color: '#f59e0b' }}>
                              {item.leaveType || 'Approved Leave'}
                            </div>
                          </td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            {item.startDate === item.endDate 
                              ? item.startDate 
                              : `${item.startDate} to ${item.endDate}`}
                          </td>
                          <td style={{ fontSize: '0.82rem', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.reason}>
                            {item.reason || 'Approved leave request'}
                          </td>
                          <td>
                            <span className="summary-status-badge status-leave">
                              {item.status || 'APPROVED'}
                            </span>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Footer */}
        <div className="summary-modal-footer">
          <div className="summary-footer-meta">
            Showing <strong>{filteredList.length}</strong> of <strong>{currentTabMeta.count}</strong> {activeTab} {currentTabMeta.count === 1 ? 'record' : 'records'}
          </div>

          <div className="summary-footer-buttons">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              style={{ padding: '8px 24px', borderRadius: '8px' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryDetailModal;

