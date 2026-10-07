import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, CheckCircle, Clock, Filter, Settings, Calendar as CalendarIcon, ChevronDown, CalendarDays, Users, ListFilter, Edit, Trash2, Plus, X } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import './DtrPage.css';
import API_BASE from '../../config/api';
import CustomWeekPicker from '../../components/common/CustomWeekPicker';
import { logSystemAction } from '../../utils/logger';

const ActiveTimer = ({ activeShift }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let interval;
    const amIn = activeShift?.am_in;
    if (activeShift && amIn && !amIn.includes('1900-01-01')) {
      const recordDate = activeShift.date;

      // Parse a DB datetime or time string into a Date object
      const parseTS = (str) => {
        if (!str || str.includes('1900-01-01')) return null;
        const dtStr = str.includes(' ') ? str : `${recordDate} ${str}`;
        return new Date(dtStr.replace(/-/g, '/'));
      };

      const calculateElapsed = () => {
        const nowString = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
        const now = new Date(nowString);

        const tAmIn = parseTS(activeShift.am_in);
        const tAmOut = parseTS(activeShift.am_out);
        const tPmIn = parseTS(activeShift.pm_in);

        if (!tAmIn) return 0;

        if (tPmIn) {
          // PM session active — accumulate: AM work + current PM elapsed (gross, deduction applied on PM OUT by backend)
          const amWorkSecs = Math.max(0, (tAmOut - tAmIn) / 1000);
          const pmWorkSecs = Math.max(0, (now - tPmIn) / 1000);
          return Math.floor(amWorkSecs + pmWorkSecs);
        } else if (tAmOut) {
          // On lunch — timer paused at AM work duration
          return Math.max(0, Math.floor((tAmOut - tAmIn) / 1000));
        } else {
          // AM session only — elapsed since clock-in
          return Math.max(0, Math.floor((now - tAmIn) / 1000));
        }
      };

      setElapsedSeconds(calculateElapsed());
      interval = setInterval(() => setElapsedSeconds(calculateElapsed()), 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [activeShift]);

  const formatElapsedTime = (totalSeconds) => {
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '1.2rem', color: 'var(--primary)' }}>
      {formatElapsedTime(elapsedSeconds)}
    </span>
  );
};

const MultiSelectDropdown = ({ options, selected, onChange, className = "premium-input" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (value) => {
    if (value === 'all') {
      onChange(['all']);
    } else {
      let newSelected = selected.includes('all') ? [] : [...selected];
      if (newSelected.includes(value)) {
        newSelected = newSelected.filter(id => id !== value);
      } else {
        newSelected.push(value);
      }
      if (newSelected.length === 0 || newSelected.length === options.length) {
        newSelected = ['all'];
      }
      onChange(newSelected);
    }
  };

  const getDisplayText = () => {
    if (selected.includes('all')) return 'All Employees';
    if (selected.length === 1) {
      const opt = options.find(o => String(o.id) === selected[0]);
      return opt ? opt.full_name : '1 Selected';
    }
    return `${selected.length} Selected`;
  };

  return (
    <div className="multi-select-dropdown" ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      <div
        className={className}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none', background: 'var(--bg-surface)' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getDisplayText()}</span>
        <ChevronDown size={16} style={{ flexShrink: 0, marginLeft: '8px', opacity: 0.7 }} />
      </div>
      {isOpen && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-surface, #fff)', border: '1px solid var(--glass-border, #e2e8f0)', borderRadius: '8px', marginTop: '4px', zIndex: 999, maxHeight: '250px', overflowY: 'auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
          <div
            style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--glass-border, #e2e8f0)' }}
            onClick={() => toggleOption('all')}
          >
            <input type="checkbox" checked={selected.includes('all')} readOnly style={{ cursor: 'pointer', width: '16px', height: '16px' }} />
            <span style={{ color: 'var(--text-main, #000)', fontSize: '0.9rem', fontWeight: 600 }}>All Employees</span>
          </div>
          {options.map(opt => (
            <div
              key={opt.id}
              style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
              onClick={() => toggleOption(String(opt.id))}
            >
              <input type="checkbox" checked={selected.includes('all') || selected.includes(String(opt.id))} readOnly style={{ cursor: 'pointer', width: '16px', height: '16px' }} />
              <span style={{ color: 'var(--text-main, #000)', fontSize: '0.9rem' }}>{opt.full_name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const DtrPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user?.role === 'admin';
  const [employees, setEmployees] = useState([]);
  const [events, setEvents] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const { addNotification } = useNotification();

  // Helper: get US date as YYYY-MM-DD to match the server time
  const getLocalDateStr = (date = new Date()) => {
    const options = { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' };
    const usDate = new Intl.DateTimeFormat('en-US', options).format(date);
    const [month, day, year] = usDate.split('/');
    return `${year}-${month}-${day}`;
  };

  // Helper: format DATETIME or HH:MM:SS string to 12-hour format
  const formatTime = (datetimeStr, recordDate) => {
    if (!datetimeStr) return '--:--';
    if (datetimeStr.includes('1900-01-01')) return '-- -- --';
    // Split by space to get time part if it's a datetime
    const [datePart, timePart] = datetimeStr.includes(' ') ? datetimeStr.split(' ') : [null, datetimeStr];
    const [hours, minutes] = timePart.split(':');
    const h = parseInt(hours, 10);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    let result = `${String(h12).padStart(2, '0')}:${minutes} ${period}`;
    if (datePart && recordDate && datePart !== recordDate) {
      result += " (+1d)";
    }
    return result;
  };

  // Helper: format decimal hours (e.g. 8.5) to "HH:MM:SS"
  const formatHoursDuration = (decimalHours) => {
    const val = parseFloat(decimalHours);
    if (!val || isNaN(val) || val === 0) return '0hrs 0mins';
    const totalSeconds = Math.round(val * 3600);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    return `${hours}hrs ${minutes}mins`;
  };

  // Advanced Export State (Admin Only)
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [monthlyExportUsers, setMonthlyExportUsers] = useState(['all']);
  const [weeklyExportUsers, setWeeklyExportUsers] = useState(['all']);
  const [customExportUsers, setCustomExportUsers] = useState(['all']);
  const [tableFilterUser, setTableFilterUser] = useState('all');
  const [fixedReportCategory, setFixedReportCategory] = useState('Timed');
  const [fixedReportDateType, setFixedReportDateType] = useState('month');
  const [fixedReportDateValue, setFixedReportDateValue] = useState(() => new Date().toISOString().slice(0, 7));
  const [fixedReportUsers, setFixedReportUsers] = useState(['all']);
  const [pdfColumns, setPdfColumns] = useState({
    name: true,
    amIn: true,
    amOut: true,
    pmIn: true,
    pmOut: true,
    totalHrs: true,
    rate: true,
    earnings: true,
    logInRecord: true,
    hours: true,
    status: true
  });

  const [showExportCenter, setShowExportCenter] = useState(false);
  const [exportMonth, setExportMonth] = useState(new Date().toISOString().slice(0, 7));
  const [exportWeekStr, setExportWeekStr] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = (dayOfWeek + 7 - 4) % 7;
    const start = new Date(today);
    start.setDate(today.getDate() - diff);
    return getLocalDateStr(start);
  });

  // Dynamic Date Filter State
  const [dtrFilterType, setDtrFilterType] = useState('week'); // 'month', 'week', 'day'
  const [dtrFilterValue, setDtrFilterValue] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = (dayOfWeek + 7 - 4) % 7;
    const start = new Date(today);
    start.setDate(today.getDate() - diff);
    return getLocalDateStr(start);
  });

  // Admin Edit Modal State
  const [editModal, setEditModal] = useState({
    isOpen: false,
    mode: 'edit', // 'edit' or 'add'
    recordId: null,
    targetUserId: null,
    dateStr: '',
    amIn: '',
    amOut: '',
    pmIn: '',
    pmOut: '',
    totalHours: '',
    status: 'Present'
  });

  const handleFilterTypeChange = (e) => {
    const type = e.target.value;
    setDtrFilterType(type);
    const today = new Date();
    if (type === 'month') {
      setDtrFilterValue(today.toISOString().slice(0, 7));
    } else if (type === 'day') {
      setDtrFilterValue(getLocalDateStr(today));
    } else if (type === 'week') {
      const dayOfWeek = today.getDay();
      const diff = (dayOfWeek + 7 - 4) % 7;
      const start = new Date(today);
      start.setDate(today.getDate() - diff);
      setDtrFilterValue(getLocalDateStr(start));
    }
  };

  const handleGoToToday = () => {
    const today = new Date();
    if (dtrFilterType === 'month') {
      setDtrFilterValue(today.toISOString().slice(0, 7));
    } else if (dtrFilterType === 'day') {
      setDtrFilterValue(getLocalDateStr(today));
    } else if (dtrFilterType === 'week') {
      const dayOfWeek = today.getDay();
      const diff = (dayOfWeek + 7 - 4) % 7;
      const start = new Date(today);
      start.setDate(today.getDate() - diff);
      setDtrFilterValue(getLocalDateStr(start));
    }
  };

  useEffect(() => {
    fetchRecords();
    fetchEvents();
    fetchLeaveRequests();
    if (isAdmin) fetchEmployees();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${API_BASE}/calendar.php?role=${user.role}&user_id=${user.id}`);
      if (res.data.status === 'success') {
        setEvents(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      // Fetch approved leave requests — admin sees all, user sees their own
      const url = isAdmin
        ? `${API_BASE}/leaves.php?action=requests&role=admin`
        : `${API_BASE}/leaves.php?action=requests&role=user&user_id=${user.id}`;
      const res = await axios.get(url);
      if (res.data.status === 'success') {
        // Only keep approved leave requests
        const approved = res.data.data.filter(lr => lr.status === 'approved');
        setLeaveRequests(approved);
      }
    } catch (err) {
      console.error('Error fetching leave requests:', err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_BASE}/employees.php?action=list`);
      if (res.data.status === 'success') {
        const nonAdmins = res.data.data.filter(u => u.role !== 'admin');
        setEmployees(nonAdmins);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecords = async () => {
    try {
      const url = isAdmin
        ? `${API_BASE}/dtr.php?action=get_records`
        : `${API_BASE}/dtr.php?action=get_records&user_id=${user.id}`;
      const res = await axios.get(url);
      if (res.data.status === 'success') {
        setRecords(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper: get local time as HH:MM:SS string aligned with the system clock
  const getLocalTimeStr = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const openEditModal = (record, dayObj, targetUserId) => {
    if (record) {
      setEditModal({
        isOpen: true,
        mode: 'edit',
        recordId: record.id,
        targetUserId: record.user_id,
        dateStr: record.date,
        amIn: record.am_in ? (record.am_in.includes('1900-01-01') ? '-- -- --' : record.am_in.split(' ')[1]) : '',
        amOut: record.am_out ? (record.am_out.includes('1900-01-01') ? '-- -- --' : record.am_out.split(' ')[1]) : '',
        pmIn: record.pm_in ? (record.pm_in.includes('1900-01-01') ? '-- -- --' : record.pm_in.split(' ')[1]) : '',
        pmOut: record.pm_out ? (record.pm_out.includes('1900-01-01') ? '-- -- --' : record.pm_out.split(' ')[1]) : '',
        totalHours: record.total_hours !== null && record.total_hours !== undefined ? String(record.total_hours) : '',
        status: record.status || 'Present'
      });
    } else {
      setEditModal({
        isOpen: true,
        mode: 'add',
        recordId: null,
        targetUserId: targetUserId,
        dateStr: dayObj.dateStr,
        amIn: '',
        amOut: '',
        pmIn: '',
        pmOut: '',
        totalHours: '',
        status: 'Present'
      });
    }
  };

  const handleSaveModal = async () => {
    try {
      const amInDate = editModal.amIn === '-- -- --' ? '1900-01-01 00:00:00' : (editModal.amIn ? `${editModal.dateStr} ${editModal.amIn}` : '');
      const amOutDate = editModal.amOut === '-- -- --' ? '1900-01-01 00:00:00' : (editModal.amOut ? `${editModal.dateStr} ${editModal.amOut}` : '');
      const pmInDate = editModal.pmIn === '-- -- --' ? '1900-01-01 00:00:00' : (editModal.pmIn ? `${editModal.dateStr} ${editModal.pmIn}` : '');
      const pmOutDate = editModal.pmOut === '-- -- --' ? '1900-01-01 00:00:00' : (editModal.pmOut ? `${editModal.dateStr} ${editModal.pmOut}` : '');

      const modalTargetUser = employees.find(e => String(e.id) === String(editModal.targetUserId)) || user;
      const isModalFixed = modalTargetUser?.employee_type === 'Fixed';

      const payload = {
        action: editModal.mode === 'edit' ? 'edit_record' : 'add_record',
        record_id: editModal.recordId,
        user_id: editModal.targetUserId,
        modifier_id: user.id,
        date: editModal.dateStr,
        am_in: amInDate,
        am_out: amOutDate,
        pm_in: pmInDate,
        pm_out: pmOutDate,
        total_hours: isModalFixed ? editModal.totalHours : '',
        status: editModal.status === 'Missing Timeout' ? 'Present' : editModal.status
      };

      const res = await axios.post(`${API_BASE}/dtr.php`, payload);
      if (res.data.status === 'success') {
        addNotification({ type: 'success', message: res.data.message });
        setEditModal({ ...editModal, isOpen: false });
        // Re-fetch all data sources so the DTR stays in sync with latest state
        fetchRecords();
        fetchEvents();
        fetchLeaveRequests();
      } else {
        addNotification({ type: 'error', message: res.data.message || 'Failed to save record.' });
      }
    } catch (err) {
      console.error(err);
      addNotification({ type: 'error', message: 'Network error while saving record.' });
    }
  };

  const handleDeleteRecord = async (recordId) => {
    if (!window.confirm("Are you sure you want to delete this DTR record?")) return;
    try {
      const res = await axios.get(`${API_BASE}/dtr.php?action=delete_record&record_id=${recordId}&modifier_id=${user.id}`);
      if (res.data.status === 'success') {
        addNotification({ type: 'success', message: res.data.message });
        // Re-fetch all data sources so the DTR stays in sync with latest state
        fetchRecords();
        fetchEvents();
        fetchLeaveRequests();
      } else {
        addNotification({ type: 'error', message: res.data.message || 'Failed to delete record.' });
      }
    } catch (err) {
      console.error(err);
      addNotification({ type: 'error', message: 'Network error while deleting record.' });
    }
  };


  const handleClockAction = async (actionType) => {
    setLoading(true);
    try {
      const timeStr = getLocalTimeStr();
      const res = await axios.post(`${API_BASE}/dtr.php`, {
        action: actionType,
        user_id: user.id,
        client_time: timeStr,
        client_date: getLocalDateStr()
      });
      if (res.data.status === 'success') {
        addNotification({ type: 'success', message: res.data.message });
        fetchRecords();
        fetchEvents();
        fetchLeaveRequests();
      } else {
        addNotification({ type: 'error', message: res.data.message });
      }
    } catch (err) {
      console.error(err);
      addNotification({ type: 'error', message: 'Failed to record time.' });
    }
    setLoading(false);
  };

  // --- FILTERED DATE LOGIC ---
  const filteredDays = React.useMemo(() => {
    const days = [];
    if (!dtrFilterValue) return days;

    if (dtrFilterType === 'month') {
      const [year, month] = dtrFilterValue.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const d = new Date(year, month - 1, day);
        const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
        days.push({ dateStr, dayNum: day, dayName });
      }
    } else if (dtrFilterType === 'week') {
      const [year, month, day] = dtrFilterValue.split('-').map(Number);
      if (year && month && day) {
        const start = new Date(year, month - 1, day);
        for (let i = 0; i < 7; i++) {
          const d = new Date(start);
          d.setDate(start.getDate() + i);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const dt = String(d.getDate()).padStart(2, '0');
          const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
          days.push({ dateStr: `${y}-${m}-${dt}`, dayNum: d.getDate(), dayName });
        }
      }
    } else if (dtrFilterType === 'day') {
      const parts = dtrFilterValue.split('-');
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
        days.push({ dateStr: dtrFilterValue, dayNum: parseInt(parts[2], 10), dayName });
      }
    }
    return days;
  }, [dtrFilterType, dtrFilterValue]);

  // Filter records for the main table view
  const tableRecords = tableFilterUser === 'all'
    ? records
    : records.filter(r => String(r.user_id) === String(tableFilterUser));

  let displayUser = user;
  if (isAdmin && tableFilterUser !== 'all') {
    displayUser = employees.find(e => String(e.id) === String(tableFilterUser)) || user;
  } else if (isAdmin && tableFilterUser === 'all') {
    displayUser = null;
  }

  // Calculate All Employees Summary (if displayUser is null)
  const allEmployeesSummary = React.useMemo(() => {
    if (displayUser || !isAdmin) return [];

    // Group records by user_id for the selectedMonth
    const summaryMap = {};
    employees.forEach(emp => {
      summaryMap[emp.id] = {
        ...emp,
        daysPresent: 0,
        totalHours: 0,
        totalEarnings: 0
      };
    });

    tableRecords.forEach(record => {
      // Only process records for the filtered dates
      if (record.date && filteredDays.some(d => d.dateStr === record.date)) {
        const uid = record.user_id;
        if (summaryMap[uid]) {
          if (record.am_in) {
            summaryMap[uid].daysPresent += 1;
          }
          const hrs = parseFloat(record.total_hours) || 0;
          summaryMap[uid].totalHours += hrs;
          const rate = parseFloat(record.hourly_rate) || parseFloat(summaryMap[uid].hourly_rate) || 0;
          summaryMap[uid].totalEarnings += (hrs * rate);
        }
      }
    });

    return Object.values(summaryMap);
  }, [displayUser, isAdmin, tableRecords, employees, filteredDays]);

  // Clock Restrictions (Check for Active Shift and Today's Record)
  const todayDateStr = getLocalDateStr();
  const myRecords = records.filter(r => String(r.user_id) === String(user.id));

  // Use displayUser.id to get the correct records for the sidebar
  const activeUserId = displayUser ? displayUser.id : user.id;
  const targetRecords = records.filter(r => String(r.user_id) === String(activeUserId));

  const myTodayRecord = targetRecords.find(r => r.date === todayDateStr);

  // Match any mid-shift state: AM IN is valid AND PM OUT not yet set
  // Covers: AM-only session, on-lunch (AM OUT set, PM IN not set), PM session
  const isValidTS = (t) => !!(t && !t.includes('1900-01-01'));
  const displayActiveShift = targetRecords.find(r =>
    isValidTS(r.am_in) && !isValidTS(r.pm_out) && r.date === todayDateStr
  );
  const displayTodayRecord = targetRecords.find(r => r.date === todayDateStr);

  const currentHour = new Date().getHours();
  const isAM = currentHour < 12;

  const hasAmIn = !!myTodayRecord?.am_in;
  const hasPmOut = !!myTodayRecord?.pm_out;

  const hasAmOut = !!myTodayRecord?.am_out;
  const hasPmIn = !!myTodayRecord?.pm_in;
  const isTimedUser = user?.employee_type !== 'Fixed';

  const isAmInDisabled = loading || hasAmIn || hasPmOut;
  // AM OUT: only for Timed employees, requires AM IN, not already punched, no PM OUT yet
  const isAmOutDisabled = loading || !isTimedUser || hasAmOut || hasPmOut || !hasAmIn;
  // PM IN:  only after AM OUT has been punched (lunch started), not already back in, no PM OUT yet
  const isPmInDisabled = loading || !isTimedUser || hasPmIn || hasPmOut || !hasAmOut;
  const isPmOutDisabled = loading || hasPmOut || !hasAmIn;

  // --- ADMIN EXPORT LOGIC ---
  const handleEmployeePdfExport = () => {
    const doc = new jsPDF({ orientation: 'portrait' });

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("Attendance Record", 105, 20, { align: "center" });

    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(`Employee: ${user.full_name}`, 14, 30);

    let filterText = "";
    if (dtrFilterType === 'month') {
      const [y, m] = dtrFilterValue.split('-');
      const d = new Date(y, m - 1);
      filterText = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    } else if (dtrFilterType === 'week') {
      filterText = `Week of ${dtrFilterValue}`;
    } else {
      filterText = dtrFilterValue;
    }
    doc.text(`Period: ${filterText}`, 14, 36);

    const tableColumn = ["DATE", "AM IN", "AM OUT", "PM IN", "PM OUT", "HRS", "STATUS"];
    const tableRows = [];
    let totalHrs = 0;

    filteredDays.forEach(dayObj => {
      const dailyRecords = tableRecords.filter(r => r.date === dayObj.dateStr);
      const row = dailyRecords[0];
      const targetUserId = user.id;

      const approvedLeaveForDay = leaveRequests.find(lr =>
        String(lr.user_id) === String(targetUserId) &&
        dayObj.dateStr >= lr.start_date &&
        dayObj.dateStr <= lr.end_date
      );

      let virtualStatus = '';
      if (!row) {
        if (approvedLeaveForDay) {
          virtualStatus = 'LEAVE';
        } else {
          const dailyEvents = events.filter(e => e.event_date === dayObj.dateStr && (e.user_id == targetUserId || e.user_id == 0));
          const pendingReschedule = dailyEvents.find(e => e.status === 'pending' && e.reschedule_for_event_id);
          const pendingNew = dailyEvents.find(e => e.status === 'pending' && !e.reschedule_for_event_id);
          const approved = dailyEvents.find(e => e.status === 'approved' && (e.event_type === 'Holiday' || e.event_type === 'HL'))
            || dailyEvents.find(e => e.status === 'approved');

          if (approved) {
            if (approved.event_type === 'VL') virtualStatus = 'APPROVED LEAVE';
            else if (approved.event_type === 'HL' || approved.event_type === 'Holiday') virtualStatus = 'HOLIDAY';
            else if (approved.event_type === 'WS' || approved.title === 'Work Shift') {
              virtualStatus = (new Date(dayObj.dateStr) < new Date(todayDateStr)) ? 'ABSENT' : 'SCHEDULED';
            }
            else virtualStatus = 'ABSENT';
          } else if (pendingReschedule) {
            virtualStatus = 'PENDING RESCHEDULE';
          } else if (pendingNew) {
            virtualStatus = 'PENDING SCHEDULE';
          }
        }
      }

      const hrs = row ? parseFloat(row.total_hours) || 0 : 0;
      totalHrs += hrs;

      const isSpecialStatus = (row && ['Absent', 'Leave', 'Holiday', 'Rescheduled'].includes(row.status)) || (!row && virtualStatus === 'LEAVE');
      const displayStatus = row && row.status ? row.status.toUpperCase() : virtualStatus;

      tableRows.push([
        dtrFilterType === 'week' && dayObj.dayName ? `${dayObj.dayName} (${dayObj.dateStr})` : dayObj.dateStr,
        isSpecialStatus ? '---' : (row && row.am_in ? formatTime(row.am_in, row.date) : '--:--'),
        isSpecialStatus ? '---' : (row && row.am_out ? formatTime(row.am_out, row.date) : '--:--'),
        isSpecialStatus ? '---' : (row && row.pm_in ? formatTime(row.pm_in, row.date) : '--:--'),
        isSpecialStatus ? '---' : (row && row.pm_out ? formatTime(row.pm_out, row.date) : '--:--'),
        (displayStatus === 'LEAVE' || displayStatus === 'APPROVED LEAVE') ? '8h' : (isSpecialStatus ? '---' : (hrs ? formatHoursDuration(hrs) : '')),
        displayStatus
      ]);
    });

    tableRows.push(["TOTAL", "", "", "", "", formatHoursDuration(totalHrs), ""]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 42,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
      bodyStyles: { textColor: [0, 0, 0], halign: 'center' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 4, lineWidth: 0.1, lineColor: [226, 232, 240] },
      columnStyles: { 0: { halign: 'left' } }
    });

    doc.save(`Attendance_Record_${user.full_name}_${dtrFilterValue}.pdf`);
    logSystemAction('DOWNLOAD_ATTENDANCE', `User/Admin downloaded Attendance Record PDF for ${user.full_name}.`);
  };

  const exportPDF = (customStart = startDate, customEnd = endDate, exportType = 'custom', usersToExport = customExportUsers, category = 'Timed') => {
    if (exportType === 'weekly') {
      exportWeeklySchedulePDF(customStart, customEnd, usersToExport);
      return;
    }

    let currentRecords = records;

    if (!usersToExport.includes('all')) {
      currentRecords = currentRecords.filter(r => usersToExport.includes(String(r.user_id)));
    }

    if (customStart) currentRecords = currentRecords.filter(r => r.date >= customStart);
    if (customEnd) currentRecords = currentRecords.filter(r => r.date <= customEnd);

    currentRecords.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA - dateB;
    });

    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(`Payroll Report - ${category}`, 148.5, 20, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);

    const formatMMDDYYYY = (dateStr) => {
      if (!dateStr) return 'All Time';
      const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
      return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}-${d.getFullYear()}`;
    };
    const cycleStr = (customStart && customEnd) ? `${formatMMDDYYYY(customStart)} to ${formatMMDDYYYY(customEnd)}` : "All Records";
    doc.text(`Cycle: ${cycleStr}`, 148.5, 28, { align: "center" });

    const tableColumn = [];
    const dataKeys = [];

    if (exportType === 'monthly' || exportType === 'yearly') {
      tableColumn.push("NAME", "TOTAL HRS", "TOTAL PAY");
      dataKeys.push("full_name", "total_hours", "earnings");
    } else {
      if (pdfColumns.name) { tableColumn.push("NAME"); dataKeys.push("full_name"); }
      tableColumn.push("DATE"); dataKeys.push("date");

      if (category === 'Fixed') {
        if (pdfColumns.logInRecord) { tableColumn.push("LOG IN RECORD"); dataKeys.push("log_in_record"); }
        if (pdfColumns.rate) { tableColumn.push("RATE"); dataKeys.push("hourly_rate"); }
        if (pdfColumns.hours) { tableColumn.push("HOURS"); dataKeys.push("total_hours"); }
        if (pdfColumns.status) { tableColumn.push("STATUS"); dataKeys.push("status"); }
      } else {
        if (pdfColumns.totalHrs) { tableColumn.push("TOTAL HRS"); dataKeys.push("total_hours"); }
        if (pdfColumns.rate) { tableColumn.push("RATE"); dataKeys.push("hourly_rate"); }
        if (pdfColumns.amIn) { tableColumn.push("AM IN"); dataKeys.push("am_in"); }
        if (pdfColumns.amOut) { tableColumn.push("AM OUT"); dataKeys.push("am_out"); }
        if (pdfColumns.pmIn) { tableColumn.push("PM IN"); dataKeys.push("pm_in"); }
        if (pdfColumns.pmOut) { tableColumn.push("PM OUT"); dataKeys.push("pm_out"); }
        if (pdfColumns.earnings) { tableColumn.push("TOTAL PAY"); dataKeys.push("earnings"); }
      }
    }

    let recordsToProcess = currentRecords;
    if (exportType === 'monthly' || exportType === 'yearly') {
      const grouped = {};
      currentRecords.forEach(r => {
        const uid = r.user_id;
        const empRate = parseFloat(employees.find(e => String(e.id) === String(uid))?.hourly_rate || r.hourly_rate || 0);
        if (!grouped[uid]) {
          grouped[uid] = { ...r, hourly_rate: empRate, total_hours: 0, status: 'Present', full_name: r.full_name || employees.find(e => String(e.id) === String(uid))?.full_name || user.full_name };
        } else {
          if (!grouped[uid].hourly_rate) grouped[uid].hourly_rate = empRate;
        }
        if (r.status !== 'Absent') {
          grouped[uid].total_hours += parseFloat(r.total_hours || 0);
        }
      });
      recordsToProcess = Object.values(grouped);
    }

    let grandTotalHrs = 0;
    let grandTotalEarnings = 0;

    const tableRows = [];
    recordsToProcess.forEach(record => {
      const rowData = [];
      const recordHrs = parseFloat(record.total_hours || 0);
      const recordRate = parseFloat(record.hourly_rate || employees.find(e => String(e.id) === String(record.user_id))?.hourly_rate || 0);
      const recordEarnings = recordHrs * recordRate;

      if (record.status !== 'Absent') {
        grandTotalHrs += recordHrs;
        grandTotalEarnings += recordEarnings;
      }

      dataKeys.forEach(key => {
        const isSpecialStatus = ['Absent', 'Leave', 'Holiday', 'Rescheduled'].includes(record.status);
        const displayStatus = record.status ? record.status.toUpperCase() : '';
        const isLeave = displayStatus === 'LEAVE' || displayStatus === 'APPROVED LEAVE';

        if (key === 'date') rowData.push(record.date);
        else if (key === 'status') rowData.push(displayStatus || 'PRESENT');
        else if (key === 'full_name') rowData.push(record.full_name);

        else if (key === 'log_in_record' || key === 'am_in') rowData.push(isSpecialStatus ? '---' : (record.am_in ? formatTime(record.am_in, record.date) : '--:--'));
        else if (key === 'am_out') rowData.push(isSpecialStatus ? '---' : (record.am_out ? formatTime(record.am_out, record.date) : '--:--'));
        else if (key === 'pm_in') rowData.push(isSpecialStatus ? '---' : (record.pm_in ? formatTime(record.pm_in, record.date) : '--:--'));
        else if (key === 'pm_out') rowData.push(isSpecialStatus ? '---' : (record.pm_out ? formatTime(record.pm_out, record.date) : '--:--'));

        else if (key === 'total_hours') rowData.push(isLeave ? '8h' : (isSpecialStatus ? '---' : (record.total_hours ? formatHoursDuration(record.total_hours) : '0h')));
        else if (key === 'hourly_rate') rowData.push(isSpecialStatus ? '' : `${recordRate.toFixed(2)}`);
        else if (key === 'earnings') rowData.push(isSpecialStatus ? '' : (recordEarnings > 0 ? `${recordEarnings.toFixed(2)}` : '-- -- --'));
      });
      tableRows.push(rowData);
    });

    const grandTotalRow = [];
    dataKeys.forEach((key, index) => {
      if (index === 0) grandTotalRow.push("GRAND TOTAL");
      else if (key === 'total_hours') grandTotalRow.push(formatHoursDuration(grandTotalHrs));
      else if (key === 'hourly_rate' || key === 'date' || key === 'status' || key === 'log_in_record' || key === 'am_in' || key === 'am_out' || key === 'pm_in' || key === 'pm_out') grandTotalRow.push("");
      else if (key === 'earnings') grandTotalRow.push(grandTotalEarnings > 0 ? `${grandTotalEarnings.toFixed(2)}` : '-- -- --');
      else grandTotalRow.push("");
    });
    tableRows.push(grandTotalRow);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [200, 240, 210], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', lineWidth: 0.5, lineColor: [0, 0, 0] },
      bodyStyles: { textColor: [0, 0, 0], halign: 'center', lineWidth: 0.5, lineColor: [0, 0, 0] },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      styles: { font: 'helvetica', fontSize: 10, cellPadding: 6, fontStyle: 'bold', lineWidth: 0.5, lineColor: [0, 0, 0] },
      didParseCell: function (data) {
        if (data.row.raw[0] === 'GRAND TOTAL') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [200, 240, 210];
        }
      }
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}`, 280, 200, { align: 'right' });
    }

    let fileName = 'Payroll Summary Report.pdf';
    if (exportType === 'monthly') fileName = 'Monthly Payroll Summary Report.pdf';
    else if (exportType === 'yearly') fileName = 'Yearly Payroll Summary Report.pdf';

    doc.save(fileName);
    logSystemAction('DOWNLOAD_PAYROLL', `Admin downloaded ${fileName}.`);
  };

  return (
    <div className="page-container">
      {!isAdmin ? (
        <div className="page-header">
          <div>
            <h1 className="page-title">Daily Time Record</h1>
            <p className="page-subtitle">Track attendance and manage schedules</p>
          </div>
          <div className="action-buttons" style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary dtr-action-btn" onClick={() => handleClockAction('am_in')} disabled={isAmInDisabled}>
              <CheckCircle size={20} /> AM IN
            </button>
            <button className="btn btn-danger dtr-action-btn" onClick={() => handleClockAction('am_out')} disabled={isAmOutDisabled}>
              <Clock size={20} /> AM OUT
            </button>
            <button className="btn btn-primary dtr-action-btn" onClick={() => handleClockAction('pm_in')} disabled={isPmInDisabled}>
              <CheckCircle size={20} /> PM IN
            </button>
            <button className="btn btn-danger dtr-action-btn" onClick={() => handleClockAction('pm_out')} disabled={isPmOutDisabled}>
              <Clock size={20} /> PM OUT
            </button>
          </div>
        </div>
      ) : (
        (() => {
          let totalScheduled = 0;
          let totalPresent = 0;
          let totalLeave = 0;
          let totalAbsent = 0;

          filteredDays.forEach(d => {
            const dayStr = d.dateStr;
            employees.forEach(emp => {
              // Check if employee has an approved scheduled shift for this day (not a holiday/leave)
              const isScheduled = events.some(e =>
                e.event_date === dayStr &&
                (e.user_id == emp.id || e.user_id == 0) &&
                e.status === 'approved' &&
                e.event_type !== 'Holiday' &&
                e.event_type !== 'HL' &&
                e.event_type !== 'VL'
              );

              // Check if employee clocked in or is marked present
              const isPresent = records.some(r =>
                r.date === dayStr &&
                r.user_id == emp.id &&
                ((r.am_in && !r.am_in.includes('1900-01-01')) ||
                  (r.pm_in && !r.pm_in.includes('1900-01-01')) ||
                  r.status === 'Present' ||
                  r.status === 'Late')
              );

              // Check if employee has an approved leave request covering this day
              const isOnLeave = leaveRequests.some(lr => {
                const s = new Date(lr.start_date);
                const e = new Date(lr.end_date);
                const t = new Date(dayStr);
                s.setHours(0, 0, 0, 0); e.setHours(0, 0, 0, 0); t.setHours(0, 0, 0, 0);
                return lr.user_id == emp.id && t >= s && t <= e && lr.status === 'approved';
              });

              if (isPresent) totalPresent++;
              if (isOnLeave) totalLeave++;

              if (isScheduled) {
                totalScheduled++;
                // They are absent ONLY if they were scheduled but didn't show up and are not on leave
                // Only count as absent if the scheduled day is in the past
                if (!isPresent && !isOnLeave && (new Date(dayStr) < new Date(todayDateStr))) {
                  totalAbsent++;
                }
              }
            });
          });

          return (
            <div className="admin-summary-boxes" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px', width: '100%' }}>
              <div className="premium-summary-card" style={{ '--card-bg': 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', '--card-shadow': 'rgba(59, 130, 246, 0.3)' }}>
                <div className="bg-icon">
                  <Users size={100} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1 }}>
                  <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '10px' }}>
                    <Users size={20} color="white" />
                  </div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.9)' }}>
                    {dtrFilterType === 'day' ? 'Employees Present' : 'Total Present'}
                  </span>
                </div>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1, zIndex: 1 }}>{totalPresent}</span>
              </div>

              <div className="premium-summary-card" style={{ '--card-bg': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', '--card-shadow': 'rgba(239, 68, 68, 0.3)' }}>
                <div className="bg-icon">
                  <X size={100} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1 }}>
                  <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '10px' }}>
                    <X size={20} color="white" />
                  </div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.9)' }}>
                    {dtrFilterType === 'day' ? 'Absent' : 'Total Absent'}
                  </span>
                </div>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1, zIndex: 1 }}>{totalAbsent}</span>
              </div>

              <div className="premium-summary-card" style={{ '--card-bg': 'linear-gradient(135deg, #10b981 0%, #059669 100%)', '--card-shadow': 'rgba(16, 185, 129, 0.3)' }}>
                <div className="bg-icon">
                  <CalendarDays size={100} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1 }}>
                  <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '10px' }}>
                    <CalendarDays size={20} color="white" />
                  </div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.9)' }}>
                    {dtrFilterType === 'day' ? 'Scheduled Today' : 'Total Scheduled'}
                  </span>
                </div>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1, zIndex: 1 }}>{totalScheduled}</span>
              </div>

              <div className="premium-summary-card" style={{ '--card-bg': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', '--card-shadow': 'rgba(245, 158, 11, 0.3)' }}>
                <div className="bg-icon">
                  <CalendarIcon size={100} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1 }}>
                  <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '10px' }}>
                    <CalendarIcon size={20} color="white" />
                  </div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.9)' }}>
                    {dtrFilterType === 'day' ? 'On Leave' : 'Total Leave'}
                  </span>
                </div>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1, zIndex: 1 }}>{totalLeave}</span>
              </div>
            </div>
          );
        })()
      )}

      {/* Admin Export Panel */}
      {isAdmin && (
        <div className="premium-admin-card" style={{ padding: showExportCenter ? '24px 30px' : '16px 30px' }}>
          <div
            className="admin-card-header"
            style={{
              borderBottom: showExportCenter ? '1px solid var(--glass-border)' : 'none',
              marginBottom: showExportCenter ? '24px' : '0',
              paddingBottom: showExportCenter ? '16px' : '0',
              cursor: 'pointer'
            }}
            onClick={() => setShowExportCenter(!showExportCenter)}
          >
            <div className="admin-card-title">
              <div style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
                <Filter size={20} color="var(--primary)" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)', letterSpacing: '0.5px' }}>Attendance and Payroll Management</h3>
                {showExportCenter && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Generate specific reports and payroll records.</p>}
              </div>
            </div>
            <button className="btn btn-ghost" onClick={(e) => { e.stopPropagation(); setShowExportCenter(!showExportCenter); }}>
              <ChevronDown size={20} style={{ transform: showExportCenter ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }} />
            </button>
          </div>

          {showExportCenter && (
            <div className="animate-fade-in">
              <div className="admin-controls-surface" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '16px' }}>

                {/* Monthly Export Row */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)', flexWrap: 'wrap' }}>
                  <div className="premium-select-group" style={{ flex: 1, minWidth: '150px' }}>
                    <label>Select Month</label>
                    <input
                      type="month"
                      className="premium-input"
                      value={exportMonth}
                      onChange={e => setExportMonth(e.target.value)}
                    />
                  </div>
                  <div className="premium-select-group" style={{ flex: 1, minWidth: '150px' }}>
                    <label>Employee</label>
                    <MultiSelectDropdown
                      options={employees}
                      selected={monthlyExportUsers}
                      onChange={setMonthlyExportUsers}
                    />
                  </div>
                  <button className="btn btn-primary" style={{ padding: '10px 24px', flexShrink: 0 }} onClick={() => handlePresetExport('monthly')}>
                    <Download size={16} /> Monthly PDF Export
                  </button>
                </div>

                {/* Weekly Export Row */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)', flexWrap: 'wrap' }}>
                  <div className="premium-select-group" style={{ flex: 1, minWidth: '150px' }}>
                    <label>Select Week</label>
                    <CustomWeekPicker
                      value={exportWeekStr}
                      onChange={val => setExportWeekStr(val)}
                    />
                  </div>
                  <div className="premium-select-group" style={{ flex: 1, minWidth: '150px' }}>
                    <label>Employee</label>
                    <MultiSelectDropdown
                      options={employees}
                      selected={weeklyExportUsers}
                      onChange={setWeeklyExportUsers}
                    />
                  </div>
                  <button className="btn btn-primary" style={{ padding: '10px 24px', flexShrink: 0 }} onClick={() => handlePresetExport('weekly')}>
                    <Download size={16} /> Weekly PDF Export
                  </button>
                </div>

                {/* Yearly Export Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Annual Report</label>
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.9rem', color: 'var(--text-main)' }}>Generate a comprehensive report for the entire previous year automatically.</p>
                  </div>
                  <button className="btn btn-outline" style={{ padding: '10px 24px', flexShrink: 0 }} onClick={() => handlePresetExport('yearly')}>
                    <Download size={16} /> Yearly PDF Export
                  </button>
                </div>

                {/* Fixed Report Salary Row */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>Report Salary</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
                    <div className="premium-select-group" style={{ flex: 1, minWidth: '120px' }}>
                      <label>Category</label>
                      <select className="premium-input" value={fixedReportCategory} onChange={e => setFixedReportCategory(e.target.value)}>
                        <option value="Timed">Report Salary - Timed</option>
                        <option value="Fixed">Report Salary - Fixed</option>
                        <option value="Time Card">Time Card</option>
                      </select>
                    </div>
                    <div className="premium-select-group" style={{ flex: 1, minWidth: '120px' }}>
                      <label>Period Type</label>
                      <select className="premium-input" value={fixedReportDateType} onChange={(e) => {
                        const type = e.target.value;
                        setFixedReportDateType(type);
                        const today = new Date();
                        if (type === 'month') {
                          setFixedReportDateValue(today.toISOString().slice(0, 7));
                        } else if (type === 'day') {
                          setFixedReportDateValue(getLocalDateStr(today));
                        } else if (type === 'week') {
                          const dayOfWeek = today.getDay();
                          const diff = (dayOfWeek + 7 - 4) % 7;
                          const start = new Date(today);
                          start.setDate(today.getDate() - diff);
                          setFixedReportDateValue(getLocalDateStr(start));
                        }
                      }}>
                        <option value="month">Specific Month</option>
                        <option value="week">Specific Week</option>
                        <option value="day">Specific Day</option>
                      </select>
                    </div>
                    <div className="premium-select-group" style={{ flex: 1, minWidth: '150px' }}>
                      <label>Select Period</label>
                      {fixedReportDateType === 'week' ? (
                        <CustomWeekPicker value={fixedReportDateValue} onChange={val => setFixedReportDateValue(val)} />
                      ) : (
                        <input
                          type={fixedReportDateType === 'day' ? 'date' : 'month'}
                          className="premium-input"
                          value={fixedReportDateValue}
                          onChange={e => setFixedReportDateValue(e.target.value)}
                        />
                      )}
                    </div>
                    <div className="premium-select-group" style={{ flex: 1, minWidth: '150px' }}>
                      <label>Employee</label>
                      <MultiSelectDropdown
                        options={employees}
                        selected={fixedReportUsers}
                        onChange={setFixedReportUsers}
                      />
                    </div>

                    {fixedReportCategory !== 'Time Card' && (
                      <div style={{ width: '100%', marginTop: '16px' }}>
                        <h4 style={{ color: 'var(--text-main)', marginBottom: '8px', fontSize: '0.9rem' }}>Include Columns:</h4>
                        <div className="checkbox-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
                          <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                            <input type="checkbox" checked={pdfColumns.name} onChange={e => setPdfColumns({ ...pdfColumns, name: e.target.checked })} /> Name
                          </label>
                          {fixedReportCategory === 'Fixed' ? (
                            <>
                              <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                <input type="checkbox" checked={pdfColumns.logInRecord} onChange={e => setPdfColumns({ ...pdfColumns, logInRecord: e.target.checked })} /> Log in Record
                              </label>
                              <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                <input type="checkbox" checked={pdfColumns.rate} onChange={e => setPdfColumns({ ...pdfColumns, rate: e.target.checked })} /> Rate
                              </label>
                              <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                <input type="checkbox" checked={pdfColumns.hours} onChange={e => setPdfColumns({ ...pdfColumns, hours: e.target.checked })} /> Hours
                              </label>
                              <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                <input type="checkbox" checked={pdfColumns.status} onChange={e => setPdfColumns({ ...pdfColumns, status: e.target.checked })} /> Status
                              </label>
                            </>
                          ) : (
                            <>
                              <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                <input type="checkbox" checked={pdfColumns.totalHrs} onChange={e => setPdfColumns({ ...pdfColumns, totalHrs: e.target.checked })} /> Total Hrs
                              </label>
                              <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                <input type="checkbox" checked={pdfColumns.rate} onChange={e => setPdfColumns({ ...pdfColumns, rate: e.target.checked })} /> Rate
                              </label>
                              <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                <input type="checkbox" checked={pdfColumns.amIn} onChange={e => setPdfColumns({ ...pdfColumns, amIn: e.target.checked })} /> AM In
                              </label>
                              <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                <input type="checkbox" checked={pdfColumns.amOut} onChange={e => setPdfColumns({ ...pdfColumns, amOut: e.target.checked })} /> AM Out
                              </label>
                              <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                <input type="checkbox" checked={pdfColumns.pmIn} onChange={e => setPdfColumns({ ...pdfColumns, pmIn: e.target.checked })} /> PM In
                              </label>
                              <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                <input type="checkbox" checked={pdfColumns.pmOut} onChange={e => setPdfColumns({ ...pdfColumns, pmOut: e.target.checked })} /> PM Out
                              </label>
                              <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                <input type="checkbox" checked={pdfColumns.earnings} onChange={e => setPdfColumns({ ...pdfColumns, earnings: e.target.checked })} /> Total Pay
                              </label>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    <button className="btn btn-primary" style={{ padding: '10px 24px', flexShrink: 0 }} onClick={handleFixedReportExport}>
                      <Download size={16} /> Export PDF
                    </button>
                  </div>
                </div>
              </div>


            </div>
          )}
        </div>
      )}

      {/* New Design: Details and Record */}
      <div className="dtr-new-design-container">
        <div className="premium-dtr-toolbar">

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="toolbar-group">
              <div className="toolbar-label">
                <ListFilter size={16} /> Filter By
              </div>
              <select
                className="toolbar-input"
                value={dtrFilterType}
                onChange={handleFilterTypeChange}
              >
                <option value="month">Specific Month</option>
                <option value="week">Specific Week</option>
                <option value="day">Specific Day</option>
              </select>
            </div>

            <div className="toolbar-group">
              <div className="toolbar-label">
                <CalendarDays size={16} /> Date
              </div>
              {dtrFilterType === 'week' ? (
                <CustomWeekPicker
                  value={dtrFilterValue}
                  onChange={val => setDtrFilterValue(val)}
                  className="toolbar-input"
                />
              ) : (
                <input
                  type={dtrFilterType === 'day' ? 'date' : 'month'}
                  className="toolbar-input"
                  value={dtrFilterValue}
                  onChange={e => setDtrFilterValue(e.target.value)}
                />
              )}
              <button
                className="toolbar-today-btn"
                onClick={handleGoToToday}
                title="Go to Today"
              >
                Today
              </button>
            </div>

            
          </div>

          {!isAdmin && (
            <div style={{ marginLeft: 'auto' }}>
              <button className="btn btn-outline-primary" onClick={handleEmployeePdfExport} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', padding: '6px 12px', background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '6px', cursor: 'pointer' }}>
                <Download size={16} /> Download PDF
              </button>
            </div>
          )}
        </div>

        {displayUser ? (
          <>
            <div className="dtr-content-layout">
              <div className="dtr-sidebar">
                <div className="daily-attendance-summary">
                  {displayUser?.employee_type === 'Fixed' ? (
                    <div className="summary-row">
                      <span className="summary-label">Logged In:</span>
                      <span className="summary-value" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)' }}>
                        {displayTodayRecord?.am_in ? formatTime(displayTodayRecord.am_in, displayTodayRecord.date) : '--:--'}
                      </span>
                    </div>
                  ) : (
                    <>
                      {/* ── Work Timer Hero Block ── */}
                      <div className="dtr-work-hero">
                        <div className="dtr-work-hero-label">
                          {displayActiveShift && isValidTS(displayActiveShift.am_out) && !isValidTS(displayActiveShift.pm_in)
                            ? 'Work Duration (AM — On Lunch)'
                            : 'Work Duration'}
                        </div>
                        <div className="dtr-work-hero-timer">
                          {displayActiveShift ? (
                            <ActiveTimer activeShift={displayActiveShift} />
                          ) : displayTodayRecord?.pm_out ? (
                            <span style={{ color: 'var(--success)' }}>
                              {displayTodayRecord.total_hours ? formatHoursDuration(displayTodayRecord.total_hours) : '00:00:00'}
                            </span>
                          ) : (
                            <span className="dtr-work-hero-idle">--:--:--</span>
                          )}
                        </div>
                        {displayTodayRecord?.pm_out && <span className="dtr-status-pill dtr-status-pill--done">&#10003; Shift Complete</span>}
                        {displayActiveShift && !displayTodayRecord?.pm_out && (() => {
                          const onLunch = isValidTS(displayActiveShift.am_out) && !isValidTS(displayActiveShift.pm_in);
                          return onLunch
                            ? <span className="dtr-status-pill dtr-status-pill--live" style={{ background: 'rgba(245,158,11,0.12)', color: '#d97706', borderColor: 'rgba(245,158,11,0.3)' }}>&#x1F374; On Lunch</span>
                            : <span className="dtr-status-pill dtr-status-pill--live">&#x25CF; Live</span>;
                        })()}
                      </div>

                      {/* ── Shift Block: AM IN → PM OUT ── */}
                      <div className="dtr-punch-card">
                        <div className="dtr-punch-card-title">
                          <span className="dtr-punch-card-dot dtr-punch-card-dot--shift"></span>
                          AM IN &nbsp;–&nbsp; PM OUT
                        </div>
                        <div className="dtr-punch-card-row">
                          <div className="dtr-punch-entry">
                            <span className="dtr-punch-tag dtr-punch-tag--in">AM IN</span>
                            <span className="dtr-punch-time">
                              {displayTodayRecord?.am_in ? formatTime(displayTodayRecord.am_in, displayTodayRecord.date) : '--:--'}
                            </span>
                          </div>
                          <span className="dtr-punch-arrow">&#8594;</span>
                          <div className="dtr-punch-entry">
                            <span className="dtr-punch-tag dtr-punch-tag--out">PM OUT</span>
                            <span className="dtr-punch-time">
                              {displayTodayRecord?.pm_out ? formatTime(displayTodayRecord.pm_out, displayTodayRecord.date) : '--:--'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* ── Lunch Block: AM OUT → PM IN ── */}
                      <div className="dtr-punch-card dtr-punch-card--lunch">
                        <div className="dtr-punch-card-title">
                          <span className="dtr-punch-card-dot dtr-punch-card-dot--lunch"></span>
                          AM OUT &nbsp;–&nbsp; PM IN
                          {/* Deduction pill — shown only when both AM OUT and PM IN are set */}
                          {(() => {
                            const amOutStr = displayTodayRecord?.am_out;
                            const pmInStr = displayTodayRecord?.pm_in;
                            const validAmOut = amOutStr && !amOutStr.includes('1900-01-01');
                            const validPmIn = pmInStr && !pmInStr.includes('1900-01-01');
                            if (!validAmOut || !validPmIn) return null;
                            const tOut = new Date(amOutStr.includes(' ') ? amOutStr.replace(/-/g, '/') : `${displayTodayRecord.date} ${amOutStr}`.replace(/-/g, '/'));
                            const tIn = new Date(pmInStr.includes(' ') ? pmInStr.replace(/-/g, '/') : `${displayTodayRecord.date} ${pmInStr}`.replace(/-/g, '/'));
                            const actualMins = Math.max(0, Math.round((tIn - tOut) / 60000));
                            const deductMins = Math.max(30, actualMins);
                            const rounded = deductMins > actualMins;
                            return (
                              <span className={`dtr-deduct-pill ${rounded ? 'dtr-deduct-pill--warn' : 'dtr-deduct-pill--ok'}`}>
                                -{deductMins}m deducted{rounded ? ' *' : ''}
                              </span>
                            );
                          })()}
                        </div>
                        <div className="dtr-punch-card-row">
                          <div className="dtr-punch-entry">
                            <span className="dtr-punch-tag dtr-punch-tag--lunch-out">AM OUT</span>
                            <span className="dtr-punch-time">
                              {(() => {
                                const v = displayTodayRecord?.am_out;
                                return (v && !v.includes('1900-01-01')) ? formatTime(v, displayTodayRecord.date) : '--:--';
                              })()}
                            </span>
                          </div>
                          <span className="dtr-punch-arrow">&#8594;</span>
                          <div className="dtr-punch-entry">
                            <span className="dtr-punch-tag dtr-punch-tag--lunch-in">PM IN</span>
                            <span className="dtr-punch-time">
                              {(() => {
                                const amOut = displayTodayRecord?.am_out;
                                const pmIn = displayTodayRecord?.pm_in;
                                const validAmOut = amOut && !amOut.includes('1900-01-01');
                                const validPmIn = pmIn && !pmIn.includes('1900-01-01');
                                if (validAmOut && !validPmIn) return <span className="dtr-punch-on-lunch">On lunch…</span>;
                                return validPmIn ? formatTime(pmIn, displayTodayRecord.date) : '--:--';
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  <div className="summary-row">
                    <span className="summary-label">Date: </span>
                    <span className="summary-value">{new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Status:</span>
                    <span className={`summary-value ${(() => {
                      if (displayTodayRecord && displayTodayRecord.status !== 'Absent') return 'status-present';

                      const targetId = displayUser ? displayUser.id : user.id;
                      const todayEvents = events.filter(e => e.event_date === todayDateStr && (e.user_id == targetId || e.user_id == 0));
                      const approvedHoliday = todayEvents.find(e => e.status === 'approved' && (e.event_type === 'Holiday' || e.event_type === 'HL'));
                      const approvedLeave = todayEvents.find(e => e.status === 'approved' && e.event_type === 'VL');
                      const scheduledShift = todayEvents.find(e => e.status === 'approved' && e.event_type !== 'Holiday' && e.event_type !== 'HL' && e.event_type !== 'VL');

                      if (approvedHoliday || approvedLeave) return 'status-present'; // Just to not show red

                      const d = new Date(todayDateStr + 'T12:00:00');
                      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                      if (isWeekend && !scheduledShift) return ''; // blank/neutral for weekends without schedule

                      return 'status-absent';
                    })()}`}>
                      {(() => {
                        if (displayTodayRecord && displayTodayRecord.status !== 'Absent') return displayTodayRecord.status.toLowerCase();

                        const targetId = displayUser ? displayUser.id : user.id;
                        const todayEvents = events.filter(e => e.event_date === todayDateStr && (e.user_id == targetId || e.user_id == 0));
                        const approvedHoliday = todayEvents.find(e => e.status === 'approved' && (e.event_type === 'Holiday' || e.event_type === 'HL'));
                        const approvedLeave = todayEvents.find(e => e.status === 'approved' && e.event_type === 'VL');
                        const scheduledShift = todayEvents.find(e => e.status === 'approved' && e.event_type !== 'Holiday' && e.event_type !== 'HL' && e.event_type !== 'VL');

                        if (approvedHoliday) return 'holiday';
                        if (approvedLeave) return 'approved leave';

                        const d = new Date(todayDateStr + 'T12:00:00');
                        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                        if (isWeekend && !scheduledShift) return '';

                        return 'absent';
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="dtr-main-panel">
                <div className="premium-employee-card">
                  <div className="employee-card-header">
                    <div className="employee-card-profile">
                      <div className="employee-info-main">
                        <h2 className="employee-name">{displayUser.full_name || 'N/A'}</h2>
                        <span className="employee-role">{displayUser.email || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="employee-id-badge">
                      Employee ID: {(displayUser.employee_id || displayUser.id) ? String(displayUser.employee_id || displayUser.id).padStart(3, '0') : 'N/A'}
                    </div>
                  </div>

                  <div className="employee-card-divider"></div>

                  <div className="employee-card-body">
                    <div className="employee-stat-group">
                      <span className="stat-label">Month</span>
                      <span className="stat-value">{new Date().toLocaleString('en-US', { month: 'short' })}</span>
                    </div>
                    <div className="employee-stat-group">
                      <span className="stat-label">Day</span>
                      <span className="stat-value">{new Date().toLocaleString('en-US', { day: 'numeric' })}</span>
                    </div>
                    <div className="employee-stat-group">
                      <span className="stat-label">Year</span>
                      <span className="stat-value">{new Date().toLocaleString('en-US', { year: 'numeric' })}</span>
                    </div>
                    <div className="employee-stat-group">
                      <span className="stat-label">Sex</span>
                      <span className="stat-value">{displayUser.sex || 'N/A'}</span>
                    </div>
                    <div className="employee-stat-group">
                      <span className="stat-label">Department</span>
                      <span className="stat-value">{displayUser.department || 'N/A'}</span>
                    </div>
                    <div className="employee-stat-group">
                      <span className="stat-label">Position</span>
                      <span className="stat-value" style={{ textTransform: 'capitalize' }}>{displayUser.position || displayUser.role || 'N/A'}</span>
                    </div>
                    <div className="employee-stat-group">
                      <span className="stat-label">Employment Status</span>
                      <span className="stat-value status-active">Active</span>
                    </div>
                    {isAdmin && (
                      <div className="employee-stat-group">
                        <span className="stat-label">Rate/Hr</span>
                        <span className="stat-value" style={{ color: 'var(--success)' }}>${displayUser.hourly_rate || '0.00'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="dtr-table-section" style={{ marginTop: '24px' }}>
              <div className="dtr-table-title">
                <span>ATTENDANCE RECORD</span>
              </div>
              <div className="table-responsive">
                <table className="dtr-monthly-table">
                  <thead>
                    <tr>
                      <th rowSpan={2} style={{ width: '60px' }}>DAY</th>
                      {displayUser?.employee_type === 'Fixed' ? (
                        <th colSpan={4} rowSpan={2} style={{ minWidth: '320px', width: '400px', textAlign: 'center' }}>LOG IN RECORD</th>
                      ) : (
                        <>
                          <th colSpan={2} style={{ minWidth: '160px', width: '200px', textAlign: 'center' }}>AM</th>
                          <th colSpan={2} style={{ minWidth: '160px', width: '200px', textAlign: 'center' }}>PM</th>
                        </>
                      )}
                      <th rowSpan={2} style={{ width: '100px' }}>
                        {displayUser?.employee_type === 'Fixed' ? 'RATE' : 'TOTAL HRS'}
                      </th>
                      {isAdmin && displayUser?.employee_type !== 'Fixed' && <th rowSpan={2} style={{ width: '100px' }}>RATE/HR</th>}
                      {isAdmin && displayUser?.employee_type === 'Fixed' && <th rowSpan={2} style={{ width: '100px', textAlign: 'center' }}>HOURS</th>}
                      <th rowSpan={2} style={{ width: '120px' }}>STATUS</th>
                      {isAdmin && <th rowSpan={2} style={{ width: '100px', textAlign: 'center' }}>ACTIONS</th>}
                    </tr>
                    <tr>
                      {displayUser?.employee_type !== 'Fixed' && (
                        <>
                          <th style={{ minWidth: '80px', width: '100px', textAlign: 'center' }}>IN</th>
                          <th style={{ minWidth: '80px', width: '100px', textAlign: 'center' }}>OUT</th>
                          <th style={{ minWidth: '80px', width: '100px', textAlign: 'center' }}>IN</th>
                          <th style={{ minWidth: '80px', width: '100px', textAlign: 'center' }}>OUT</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      let grandTotalHrs = 0;
                      let grandTotalEarnings = 0;

                      return (
                        <>
                          {filteredDays.map(dayObj => {
                            const dailyRecords = tableRecords.filter(r => r.date === dayObj.dateStr);
                            const row = dailyRecords[0];
                            const targetUserId = displayUser.id;

                            // Check if this date is covered by an approved leave request.
                            // Only apply virtual leave status when there is NO actual DTR row for this day,
                            // so that admin edits (which create/update a row) always take precedence.
                            const approvedLeaveForDay = leaveRequests.find(lr =>
                              String(lr.user_id) === String(targetUserId) &&
                              dayObj.dateStr >= lr.start_date &&
                              dayObj.dateStr <= lr.end_date
                            );

                            let virtualStatus = '';
                            if (!row) {
                              // If covered by an approved leave request and no DTR row exists, show LEAVE
                              if (approvedLeaveForDay) {
                                virtualStatus = 'LEAVE';
                              } else {
                                const dailyEvents = events.filter(e => e.event_date === dayObj.dateStr && (e.user_id == targetUserId || e.user_id == 0));
                                const pendingReschedule = dailyEvents.find(e => e.status === 'pending' && e.reschedule_for_event_id);
                                const pendingNew = dailyEvents.find(e => e.status === 'pending' && !e.reschedule_for_event_id);

                                // Prioritize holiday over leave for display if both exist, or just use the first approved
                                const approved = dailyEvents.find(e => e.status === 'approved' && (e.event_type === 'Holiday' || e.event_type === 'HL'))
                                  || dailyEvents.find(e => e.status === 'approved');

                                if (approved) {
                                  if (approved.event_type === 'VL') virtualStatus = 'APPROVED LEAVE';
                                  else if (approved.event_type === 'HL' || approved.event_type === 'Holiday') virtualStatus = 'HOLIDAY';
                                  else if (approved.event_type === 'WS' || approved.title === 'Work Shift') {
                                    virtualStatus = (new Date(dayObj.dateStr) < new Date(todayDateStr)) ? 'ABSENT' : 'SCHEDULED';
                                  }
                                  else virtualStatus = 'ABSENT';
                                } else if (pendingReschedule) {
                                  virtualStatus = 'PENDING RESCHEDULE';
                                } else if (pendingNew) {
                                  virtualStatus = 'PENDING SCHEDULE';
                                }
                              }
                            }
                            // If a real DTR row exists, it always wins — never overlay leave/event virtualStatus on top of it.

                            const hrs = row ? parseFloat(row.total_hours) || 0 : 0;
                            const rate = row ? (parseFloat(row.hourly_rate) || parseFloat(displayUser.hourly_rate) || 0) : 0;
                            const earnings = hrs * rate;

                            grandTotalHrs += hrs;
                            grandTotalEarnings += earnings;

                            const isSpecialStatus = (row && ['Absent', 'Leave', 'Holiday', 'Rescheduled'].includes(row.status)) || (!row && virtualStatus === 'LEAVE');
                            const displayStatus = row && row.status ? row.status.toUpperCase() : virtualStatus;

                            let statusColor = 'inherit';
                            if (row?.status === 'Absent') statusColor = 'var(--danger)';
                            else if (row?.status === 'Missing Timeout') statusColor = 'var(--danger)';
                            else if (row?.status === 'Rescheduled') statusColor = 'var(--warning, #f59e0b)';
                            else if (isSpecialStatus) statusColor = 'var(--primary)';
                            else if (virtualStatus === 'LEAVE') statusColor = 'var(--primary)';
                            else if (virtualStatus) statusColor = 'var(--text-muted)';
                            else statusColor = 'inherit'; // Default to inherit for anything else (like Present)

                            // If we are falling back to '----', use the faint color
                            if (!row && !virtualStatus) {
                              statusColor = 'rgba(0, 0, 0, 0.15)';
                            }

                            return (
                              <tr key={dayObj.dateStr}>
                                <td className="dtr-day-col" style={{ width: '120px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: '1.2' }}>
                                      <span style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>{dayObj.dayName}</span>
                                      <span>{dayObj.dateStr}</span>
                                    </div>
                                  </td>
                                {displayUser?.employee_type === 'Fixed' ? (
                                  <td colSpan={4} style={{ color: 'var(--text-main)', fontWeight: 600, textAlign: 'center' }}>
                                    {isSpecialStatus ? '---' : (row && row.am_in ? `Logged in at: ${formatTime(row.am_in, row.date)}` : '---')}
                                  </td>
                                ) : (
                                  <>
                                    <td style={{ color: 'var(--text-main)', fontWeight: 600, textAlign: 'center' }}>
                                      {isSpecialStatus ? '---' : (row && row.am_in ? formatTime(row.am_in, row.date) : '---')}
                                    </td>
                                    <td style={{ color: 'var(--text-main)', fontWeight: 600, textAlign: 'center' }}>
                                      {isSpecialStatus ? '---' : (row && row.am_out ? formatTime(row.am_out, row.date) : '---')}
                                    </td>
                                    <td style={{ color: 'var(--text-main)', fontWeight: 600, textAlign: 'center' }}>
                                      {isSpecialStatus ? '---' : (row && row.pm_in ? formatTime(row.pm_in, row.date) : '---')}
                                    </td>
                                    <td style={{ color: 'var(--text-main)', fontWeight: 600, textAlign: 'center' }}>
                                      {isSpecialStatus ? '---' : (row && row.pm_out ? formatTime(row.pm_out, row.date) : '---')}
                                    </td>
                                  </>
                                )}
                                <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                                  {displayUser?.employee_type === 'Fixed'
                                    ? (rate ? `$${rate.toFixed(2)}` : '---')
                                    : ((displayStatus === 'LEAVE' || displayStatus === 'APPROVED LEAVE') ? '8h' : (isSpecialStatus ? '---' : (hrs ? formatHoursDuration(hrs) : '---')))}
                                </td>
                                {isAdmin && displayUser?.employee_type !== 'Fixed' && <td>{rate ? `$${rate.toFixed(2)}` : '---'}</td>}
                                {isAdmin && displayUser?.employee_type === 'Fixed' && (
                                  <td style={{ fontWeight: 600, color: 'var(--text-main)', textAlign: 'center' }}>
                                    {hrs > 0 ? formatHoursDuration(hrs) : '---'}
                                  </td>
                                )}
                                <td style={{ fontWeight: 600, color: statusColor }}>
                                  {displayStatus || '----'}
                                </td>
                                {isAdmin && (
                                  <td style={{ textAlign: 'center' }}>
                                    <div className="dtr-action-icons" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                      {row ? (
                                        <>
                                          <button className="btn-icon text-primary" onClick={() => openEditModal(row, dayObj, targetUserId)} title="Edit Record" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}>
                                            <Edit size={16} />
                                          </button>
                                          <button className="btn-icon text-danger" onClick={() => handleDeleteRecord(row.id)} title="Delete Record" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                                            <Trash2 size={16} />
                                          </button>
                                        </>
                                      ) : (
                                        <button onClick={() => openEditModal(null, dayObj, targetUserId)} title="Add Record" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', cursor: 'pointer', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                                          <Plus size={14} /> Add
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                          <tr className="grand-total-row">
                            <td colSpan={5} style={{ textAlign: 'right', paddingRight: '24px', fontWeight: 800 }}>GRAND TOTAL</td>
                            <td style={{ color: 'var(--primary)', fontWeight: 800 }}>
                              {displayUser?.employee_type === 'Fixed' ? '' : (grandTotalHrs > 0 ? formatHoursDuration(grandTotalHrs) : '')}
                            </td>
                            {isAdmin && displayUser?.employee_type !== 'Fixed' && <td></td>}
                            {isAdmin && displayUser?.employee_type === 'Fixed' && (
                              <td style={{ color: 'var(--primary)', fontWeight: 800, textAlign: 'center' }}>
                                {formatHoursDuration(grandTotalHrs)}
                              </td>
                            )}
                            <td></td>
                            {isAdmin && <td></td>}
                          </tr>
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="dtr-all-employees-view">
            {employees.map((emp, index) => {
              const empRecords = tableRecords.filter(r => String(r.user_id) === String(emp.id));
              let grandTotalHrs = 0;
              let grandTotalEarnings = 0;

              return (
                <div key={emp.id} className="dtr-table-section" style={{ marginTop: index === 0 ? '0' : '40px' }}>
                  <div className="dtr-table-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>ATTENDANCE RECORD - <span style={{ color: 'var(--primary)' }}>{emp.full_name}</span></span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ID: {emp.employee_id || emp.id}</span>
                  </div>
                  <div className="table-responsive">
                    <table className="dtr-monthly-table">
                      <thead>
                        <tr>
                          <th rowSpan={2} style={{ width: '60px' }}>DAY</th>
                          {emp.employee_type === 'Fixed' ? (
                            <th colSpan={4} rowSpan={2} style={{ minWidth: '320px', width: '400px', textAlign: 'center' }}>LOG IN RECORD</th>
                          ) : (
                            <>
                              <th colSpan={2} style={{ minWidth: '160px', width: '200px', textAlign: 'center' }}>AM</th>
                              <th colSpan={2} style={{ minWidth: '160px', width: '200px', textAlign: 'center' }}>PM</th>
                            </>
                          )}
                          <th rowSpan={2} style={{ width: '100px' }}>
                            {emp.employee_type === 'Fixed' ? 'RATE' : 'TOTAL HRS'}
                          </th>
                          {isAdmin && emp.employee_type !== 'Fixed' && <th rowSpan={2} style={{ width: '100px' }}>RATE/HR</th>}
                          {isAdmin && emp.employee_type === 'Fixed' && <th rowSpan={2} style={{ width: '100px', textAlign: 'center' }}>HOURS</th>}
                          <th rowSpan={2} style={{ width: '120px' }}>STATUS</th>
                          {isAdmin && <th rowSpan={2} style={{ width: '100px', textAlign: 'center' }}>ACTIONS</th>}
                        </tr>
                        <tr>
                          {emp.employee_type !== 'Fixed' && (
                            <>
                              <th style={{ minWidth: '80px', width: '100px', textAlign: 'center' }}>IN</th>
                              <th style={{ minWidth: '80px', width: '100px', textAlign: 'center' }}>OUT</th>
                              <th style={{ minWidth: '80px', width: '100px', textAlign: 'center' }}>IN</th>
                              <th style={{ minWidth: '80px', width: '100px', textAlign: 'center' }}>OUT</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDays.map(dayObj => {
                          const dailyRecords = empRecords.filter(r => r.date === dayObj.dateStr);
                          const row = dailyRecords[0];
                          const targetUserId = emp.id;

                          const approvedLeaveForDay = leaveRequests.find(lr =>
                            String(lr.user_id) === String(targetUserId) &&
                            dayObj.dateStr >= lr.start_date &&
                            dayObj.dateStr <= lr.end_date
                          );

                          let virtualStatus = '';
                          if (!row) {
                            if (approvedLeaveForDay) {
                              virtualStatus = 'LEAVE';
                            } else {
                              const dailyEvents = events.filter(e => e.event_date === dayObj.dateStr && (e.user_id == targetUserId || e.user_id == 0));
                              const pendingReschedule = dailyEvents.find(e => e.status === 'pending' && e.reschedule_for_event_id);
                              const pendingNew = dailyEvents.find(e => e.status === 'pending' && !e.reschedule_for_event_id);

                              const approved = dailyEvents.find(e => e.status === 'approved' && (e.event_type === 'Holiday' || e.event_type === 'HL'))
                                || dailyEvents.find(e => e.status === 'approved');

                              if (approved) {
                                if (approved.event_type === 'VL') virtualStatus = 'APPROVED LEAVE';
                                else if (approved.event_type === 'HL' || approved.event_type === 'Holiday') virtualStatus = 'HOLIDAY';
                                else if (approved.event_type === 'WS' || approved.title === 'Work Shift') {
                                  virtualStatus = (new Date(dayObj.dateStr) < new Date(todayDateStr)) ? 'ABSENT' : 'SCHEDULED';
                                }
                                else virtualStatus = 'ABSENT';
                              } else if (pendingReschedule) {
                                virtualStatus = 'PENDING RESCHEDULE';
                              } else if (pendingNew) {
                                virtualStatus = 'PENDING SCHEDULE';
                              }
                            }
                          }

                          const hrs = row ? parseFloat(row.total_hours) || 0 : 0;
                          const rate = row ? (parseFloat(row.hourly_rate) || parseFloat(emp.hourly_rate) || 0) : 0;
                          const earnings = hrs * rate;

                          grandTotalHrs += hrs;
                          grandTotalEarnings += earnings;

                          const isSpecialStatus = (row && ['Absent', 'Leave', 'Holiday', 'Rescheduled'].includes(row.status)) || (!row && virtualStatus === 'LEAVE');
                          const displayStatus = row && row.status ? row.status.toUpperCase() : virtualStatus;

                          let statusColor = 'inherit';
                          if (row?.status === 'Absent') statusColor = 'var(--danger)';
                          else if (row?.status === 'Missing Timeout') statusColor = 'var(--danger)';
                          else if (row?.status === 'Rescheduled') statusColor = 'var(--warning, #f59e0b)';
                          else if (isSpecialStatus) statusColor = 'var(--primary)';
                          else if (virtualStatus === 'LEAVE') statusColor = 'var(--primary)';
                          else if (virtualStatus) statusColor = 'var(--text-muted)';
                          else statusColor = 'inherit';

                          if (!row && !virtualStatus) {
                            statusColor = 'rgba(0, 0, 0, 0.15)';
                          }

                          return (
                            <tr key={`${emp.id}-${dayObj.dateStr}`}>
                              <td className="dtr-day-col" style={{ width: '120px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: '1.2' }}>
                                      <span style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>{dayObj.dayName}</span>
                                      <span>{dayObj.dateStr}</span>
                                    </div>
                                  </td>
                              {emp.employee_type === 'Fixed' ? (
                                <td colSpan={4} style={{ color: 'var(--text-main)', fontWeight: 600, textAlign: 'center' }}>
                                  {isSpecialStatus ? '---' : (row && row.am_in ? `Logged in at: ${formatTime(row.am_in, row.date)}` : '---')}
                                </td>
                              ) : (
                                <>
                                  <td style={{ color: 'var(--text-main)', fontWeight: 600, textAlign: 'center' }}>
                                    {isSpecialStatus ? '---' : (row && row.am_in ? formatTime(row.am_in, row.date) : '---')}
                                  </td>
                                  <td style={{ color: 'var(--text-main)', fontWeight: 600, textAlign: 'center' }}>
                                    {isSpecialStatus ? '---' : (row && row.am_out ? formatTime(row.am_out, row.date) : '---')}
                                  </td>
                                  <td style={{ color: 'var(--text-main)', fontWeight: 600, textAlign: 'center' }}>
                                    {isSpecialStatus ? '---' : (row && row.pm_in ? formatTime(row.pm_in, row.date) : '---')}
                                  </td>
                                  <td style={{ color: 'var(--text-main)', fontWeight: 600, textAlign: 'center' }}>
                                    {isSpecialStatus ? '---' : (row && row.pm_out ? formatTime(row.pm_out, row.date) : '---')}
                                  </td>
                                </>
                              )}
                              <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                                {emp.employee_type === 'Fixed'
                                  ? (rate ? `$${rate.toFixed(2)}` : '---')
                                  : ((displayStatus === 'LEAVE' || displayStatus === 'APPROVED LEAVE') ? '8h' : (isSpecialStatus ? '---' : (hrs ? formatHoursDuration(hrs) : '---')))}
                              </td>
                              {isAdmin && emp.employee_type !== 'Fixed' && <td>{rate ? `$${rate.toFixed(2)}` : '---'}</td>}
                              {isAdmin && emp.employee_type === 'Fixed' && (
                                <td style={{ fontWeight: 600, color: 'var(--text-main)', textAlign: 'center' }}>
                                  {hrs > 0 ? formatHoursDuration(hrs) : '---'}
                                </td>
                              )}
                              <td style={{ fontWeight: 600, color: statusColor }}>
                                {displayStatus || '----'}
                              </td>
                              {isAdmin && (
                                <td style={{ textAlign: 'center' }}>
                                  <div className="dtr-action-icons" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                    {row ? (
                                      <>
                                        <button className="btn-icon text-primary" onClick={() => openEditModal(row, dayObj, targetUserId)} title="Edit Record" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}>
                                          <Edit size={16} />
                                        </button>
                                        <button className="btn-icon text-danger" onClick={() => handleDeleteRecord(row.id)} title="Delete Record" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                                          <Trash2 size={16} />
                                        </button>
                                      </>
                                    ) : (
                                      <button onClick={() => openEditModal(null, dayObj, targetUserId)} title="Add Record" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', cursor: 'pointer', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                                        <Plus size={14} /> Add
                                      </button>
                                    )}
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                        <tr className="grand-total-row">
                          <td colSpan={5} style={{ textAlign: 'right', paddingRight: '24px', fontWeight: 800 }}>GRAND TOTAL</td>
                          <td style={{ color: 'var(--primary)', fontWeight: 800 }}>
                            {emp.employee_type === 'Fixed' ? '' : (grandTotalHrs > 0 ? formatHoursDuration(grandTotalHrs) : '')}
                          </td>
                          {isAdmin && emp.employee_type !== 'Fixed' && <td></td>}
                          {isAdmin && emp.employee_type === 'Fixed' && (
                            <td style={{ color: 'var(--primary)', fontWeight: 800, textAlign: 'center' }}>
                              {formatHoursDuration(grandTotalHrs)}
                            </td>
                          )}
                          <td></td>
                          {isAdmin && <td></td>}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Admin Edit/Add Modal */}
      {editModal.isOpen && (() => {
        const modalTargetUser = employees.find(e => String(e.id) === String(editModal.targetUserId)) || (String(displayUser?.id) === String(editModal.targetUserId) ? displayUser : null);
        const isModalFixed = modalTargetUser?.employee_type === 'Fixed';

        return (
          <div className="dtr-modal-overlay">
            <div className="dtr-modal-content">
              <div className="dtr-modal-header">
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)' }}>
                  {editModal.mode === 'edit' ? 'Edit Record' : 'Add Record'} - {editModal.dateStr}
                </h3>
                <button className="btn-icon" onClick={() => setEditModal({ ...editModal, isOpen: false })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleSaveModal(); }}>
                <div className="dtr-modal-body" style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="premium-select-group">
                    <label>Status</label>
                    <select className="premium-input" value={editModal.status} onChange={(e) => setEditModal({ ...editModal, status: e.target.value })}>
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                      <option value="Leave">Leave</option>
                      <option value="Holiday">Holiday</option>
                      <option value="Rescheduled">Rescheduled</option>
                      {!isModalFixed && <option value="Missing Timeout">Missing Timeout</option>}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div className="premium-select-group" style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label style={{ margin: 0 }}>{isModalFixed ? 'Log In Time' : 'AM IN Time'}</label>
                      </div>
                      <input type="time" step="1" className="premium-input" style={{ width: '100%' }} value={editModal.amIn !== '-- -- --' ? editModal.amIn : ''} onChange={(e) => setEditModal({ ...editModal, amIn: e.target.value })} disabled={['Absent', 'Leave', 'Holiday', 'Rescheduled'].includes(editModal.status)} />
                    </div>
                    {isModalFixed && (
                      <div className="premium-select-group" style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ margin: 0 }}>Total Hours</label>
                        </div>
                        <input type="number" step="0.01" min="0" className="premium-input" style={{ width: '100%' }} value={editModal.totalHours} onChange={(e) => setEditModal({ ...editModal, totalHours: e.target.value })} disabled={['Absent', 'Leave', 'Holiday', 'Rescheduled'].includes(editModal.status)} />
                      </div>
                    )}
                    {!isModalFixed && (
                      <div className="premium-select-group" style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ margin: 0 }}>AM OUT Time</label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', cursor: 'pointer', margin: 0, fontWeight: '500', color: 'var(--text-muted)' }}>
                            <input type="checkbox" checked={editModal.amOut === '-- -- --'} onChange={(e) => setEditModal({ ...editModal, amOut: e.target.checked ? '-- -- --' : '' })} disabled={['Absent', 'Leave', 'Holiday', 'Rescheduled'].includes(editModal.status)} />
                            Mispunch
                          </label>
                        </div>
                        {editModal.amOut === '-- -- --' ? (
                          <input type="text" className="premium-input" value="-- -- --" disabled style={{ width: '100%', color: 'var(--text-muted)', textAlign: 'center', letterSpacing: '2px' }} />
                        ) : (
                          <input type="time" step="1" className="premium-input" style={{ width: '100%' }} value={editModal.amOut} onChange={(e) => setEditModal({ ...editModal, amOut: e.target.value })} disabled={['Absent', 'Leave', 'Holiday', 'Rescheduled'].includes(editModal.status)} />
                        )}
                      </div>
                    )}
                  </div>
                  {!isModalFixed && (
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div className="premium-select-group" style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ margin: 0 }}>PM IN Time</label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', cursor: 'pointer', margin: 0, fontWeight: '500', color: 'var(--text-muted)' }}>
                            <input type="checkbox" checked={editModal.pmIn === '-- -- --'} onChange={(e) => setEditModal({ ...editModal, pmIn: e.target.checked ? '-- -- --' : '' })} disabled={['Absent', 'Leave', 'Holiday', 'Rescheduled'].includes(editModal.status)} />
                            Mispunch
                          </label>
                        </div>
                        {editModal.pmIn === '-- -- --' ? (
                          <input type="text" className="premium-input" value="-- -- --" disabled style={{ width: '100%', color: 'var(--text-muted)', textAlign: 'center', letterSpacing: '2px' }} />
                        ) : (
                          <input type="time" step="1" className="premium-input" style={{ width: '100%' }} value={editModal.pmIn} onChange={(e) => setEditModal({ ...editModal, pmIn: e.target.value })} disabled={['Absent', 'Leave', 'Holiday', 'Rescheduled'].includes(editModal.status)} />
                        )}
                      </div>
                      <div className="premium-select-group" style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ margin: 0 }}>PM OUT Time</label>
                        </div>
                        <input type="time" step="1" className="premium-input" style={{ width: '100%' }} value={editModal.pmOut !== '-- -- --' ? editModal.pmOut : ''} onChange={(e) => setEditModal({ ...editModal, pmOut: e.target.value })} disabled={['Absent', 'Leave', 'Holiday', 'Rescheduled'].includes(editModal.status)} />
                      </div>
                    </div>
                  )}
                </div>
                <div className="dtr-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setEditModal({ ...editModal, isOpen: false })}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Record</button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default DtrPage
