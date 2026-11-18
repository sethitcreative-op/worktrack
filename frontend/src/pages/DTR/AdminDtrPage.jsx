import React, { useState, useEffect, useMemo } from 'react';
import SummaryDetailModal from './SummaryDetailModal';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, CheckCircle, Clock, Filter, Settings, Calendar as CalendarIcon, ChevronDown, CalendarDays, Users, ListFilter, Edit, Trash2, Plus, X, RotateCcw, Search } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import './AdminDtrPage.css';
import API_BASE from '../../config/api';
import CustomWeekPicker from '../../components/common/CustomWeekPicker';
import { logSystemAction } from '../../utils/logger';

const ActiveTimer = ({ activeShift }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let interval;
    if (activeShift && (activeShift.am_in || activeShift.pm_in)) {
      const calculateElapsed = () => {
        const nowString = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
        const now = new Date(nowString);

        // Pick the active start time (if am_in is set but no am_out, it's AM. If pm_in is set but no pm_out, it's PM)
        const activeStr = (activeShift.am_in && !activeShift.am_out) ? activeShift.am_in : activeShift.pm_in;
        if (!activeStr) return 0;

        const recordDate = activeShift.date;
        let activeDate;

        if (activeStr.includes(' ')) {
          activeDate = new Date(activeStr.replace(/-/g, '/'));
        } else {
          activeDate = new Date(`${recordDate} ${activeStr}`.replace(/-/g, '/'));
        }

        const diffInSeconds = Math.floor((now - activeDate) / 1000);
        return diffInSeconds > 0 ? diffInSeconds : 0;
      };

      setElapsedSeconds(calculateElapsed());
      interval = setInterval(() => {
        setElapsedSeconds(calculateElapsed());
      }, 1000);
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

const AdminDtrPage = () => {
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
    const str = String(datetimeStr).trim();
    if (str.includes('1900-01-01') || str.includes('0000-00-00')) return '-- -- --';
    // Split by space to get time part if it's a datetime
    const [datePart, timePart] = str.includes(' ') ? str.split(' ') : [null, str];
    if (!timePart || !timePart.includes(':')) return '--:--';
    const [hours, minutes] = timePart.split(':');
    const h = parseInt(hours, 10);
    if (isNaN(h)) return '--:--';
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    let result = `${String(h12).padStart(2, '0')}:${minutes} ${period}`;
    if (datePart && recordDate && datePart !== recordDate) {
      result += " (+1d)";
    }
    return result;
  };

  // Helper: format decimal hours (e.g. 8.5) to "Xhrs Ymins"
  const formatHoursDuration = (decimalHours) => {
    const val = parseFloat(decimalHours);
    if (!val || isNaN(val) || val === 0) return '0hrs 0mins';
    const totalMinutes = Math.round(val * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours}hrs ${minutes}mins`;
  };

  // Advanced Export State (Admin Only)
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [monthlyExportUsers, setMonthlyExportUsers] = useState(['all']);
  const [weeklyExportUsers, setWeeklyExportUsers] = useState(['all']);
  const [customExportUsers, setCustomExportUsers] = useState(['all']);
  const [tableFilterUser, setTableFilterUser] = useState('all');
  const [tableFilterType, setTableFilterType] = useState('all');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [summaryModal, setSummaryModal] = useState({
    isOpen: false,
    type: 'present'
  });
  const [fixedReportCategory, setFixedReportCategory] = useState('Timed');
  const [fixedReportDateType, setFixedReportDateType] = useState('week');
  const [fixedReportDateValue, setFixedReportDateValue] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = (dayOfWeek + 7 - 4) % 7;
    const start = new Date(today);
    start.setDate(today.getDate() - diff);
    return getLocalDateStr(start);
  });
  const [fixedReportUsers, setFixedReportUsers] = useState(['all']);
  const [pdfColumns, setPdfColumns] = useState({
    name: true,
    day: true,
    logInRecord: true,
    amIn: true,
    amOut: true,
    pmIn: true,
    pmOut: true,
    totalHrs: true,
    rate: true,
    earnings: true,
    hours: true,
    status: true,
    daysWorked: true,
    totalRate: true
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
    employeeType: 'Timed',
    employeeName: '',
    dateStr: '',
    amIn: '',
    amOut: '',
    pmIn: '',
    pmOut: '',
    totalHours: '',
    status: 'Present',
    isCustomHours: false
  });

  // Grand Total Edit State & Overrides
  const [editedGrandTotals, setEditedGrandTotals] = useState(() => {
    try {
      const saved = localStorage.getItem('dtr_edited_grand_totals');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [grandTotalModal, setGrandTotalModal] = useState({
    isOpen: false,
    userId: null,
    employeeName: '',
    calculatedHours: 0,
    overrideHours: '',
    periodKey: ''
  });

  const getGrandTotalOverride = (empId) => {
    if (!empId) return undefined;
    const periodKey = `${dtrFilterType}_${dtrFilterValue}`;
    const key = `${empId}_${periodKey}`;
    return editedGrandTotals[key];
  };

  const openGrandTotalModal = (empId, empName, calcHours) => {
    const periodKey = `${dtrFilterType}_${dtrFilterValue}`;
    const key = `${empId}_${periodKey}`;
    const existing = editedGrandTotals[key];
    setGrandTotalModal({
      isOpen: true,
      userId: empId,
      employeeName: empName || 'Employee',
      calculatedHours: calcHours,
      overrideHours: existing !== undefined ? String(existing) : String(calcHours),
      periodKey
    });
  };

  const saveGrandTotalOverride = () => {
    const { userId, periodKey, overrideHours, employeeName } = grandTotalModal;
    const key = `${userId}_${periodKey}`;
    const val = parseFloat(overrideHours);
    if (isNaN(val) || val < 0) {
      alert("Please enter a valid number of hours.");
      return;
    }
    const updated = { ...editedGrandTotals, [key]: val };
    setEditedGrandTotals(updated);
    try {
      localStorage.setItem('dtr_edited_grand_totals', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    logSystemAction('EDIT_GRAND_TOTAL', `Admin edited Grand Total for ${employeeName} (${periodKey}) to ${val} hrs.`);
    setGrandTotalModal(prev => ({ ...prev, isOpen: false }));
  };

  const resetGrandTotalOverride = (empId, empName) => {
    const periodKey = `${dtrFilterType}_${dtrFilterValue}`;
    const key = `${empId}_${periodKey}`;
    const updated = { ...editedGrandTotals };
    delete updated[key];
    setEditedGrandTotals(updated);
    try {
      localStorage.setItem('dtr_edited_grand_totals', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    logSystemAction('RESET_GRAND_TOTAL', `Admin reset Grand Total for ${empName} (${periodKey}) to auto-calculated.`);
  };

  // Employee Overtime State
  const [overtimeRecords, setOvertimeRecords] = useState([]);
  const [otInputValues, setOtInputValues] = useState({});

  const fetchOvertime = async () => {
    try {
      const res = await axios.get(`${API_BASE}/dtr.php?action=get_overtime`);
      let data = res.data;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) {}
      }
      if (data?.status === 'success' && Array.isArray(data.data)) {
        setOvertimeRecords(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching overtime records:', err);
    }
  };

  const weekBelongsToMonth = (weekStartStr, monthStr) => {
    if (!weekStartStr || !monthStr) return false;
    const parts = weekStartStr.split('-').map(Number);
    if (parts.length === 3) {
      // Thursday + 3 days = Sunday (middle day of the 7-day week Thu-Wed, ensuring each week belongs to exactly 1 month)
      const mid = new Date(parts[0], parts[1] - 1, parts[2] + 3);
      const midMonthStr = `${mid.getFullYear()}-${String(mid.getMonth() + 1).padStart(2, '0')}`;
      return midMonthStr === monthStr;
    }
    return weekStartStr.startsWith(monthStr);
  };

  const dayBelongsToWeek = (dayStr, weekStartStr) => {
    if (!dayStr || !weekStartStr) return false;
    const parts = weekStartStr.split('-').map(Number);
    if (parts.length !== 3) return false;
    const start = new Date(parts[0], parts[1] - 1, parts[2]);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const startStr = weekStartStr;
    const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
    return dayStr >= startStr && dayStr <= endStr;
  };

  const getEmployeeDailyOvertimeForWeek = (userId, weekStartStr) => {
    if (!userId || !weekStartStr) return 0;
    const matchingDays = overtimeRecords.filter(r => 
      String(r.user_id) === String(userId) && 
      r.period_type === 'day' && 
      dayBelongsToWeek(r.period_value, weekStartStr)
    );
    return matchingDays.reduce((sum, r) => sum + (parseFloat(r.ot_amount) || 0), 0);
  };

  const getDirectOvertime = (userId, filterType = dtrFilterType, filterVal = dtrFilterValue) => {
    if (!userId || !filterVal) return 0;
    const rec = overtimeRecords.find(r => 
      String(r.user_id) === String(userId) && 
      r.period_type === filterType && 
      r.period_value === filterVal
    );
    return rec ? parseFloat(rec.ot_amount || 0) : 0;
  };

  const getEmployeeOvertime = (userId, filterType = dtrFilterType, filterVal = dtrFilterValue) => {
    if (!userId || !filterVal) return 0;
    
    if (filterType === 'day') {
      const rec = overtimeRecords.find(r => String(r.user_id) === String(userId) && r.period_type === 'day' && r.period_value === filterVal);
      return rec ? parseFloat(rec.ot_amount || 0) : 0;
    }
    
    if (filterType === 'week') {
      const rec = overtimeRecords.find(r => String(r.user_id) === String(userId) && r.period_type === 'week' && r.period_value === filterVal);
      const weeklyDirect = rec ? parseFloat(rec.ot_amount || 0) : 0;
      const dailySum = getEmployeeDailyOvertimeForWeek(userId, filterVal);
      return weeklyDirect + dailySum;
    }
    
    if (filterType === 'month') {
      const monthPrefix = filterVal ? filterVal.slice(0, 7) : '';
      // Sum all weekly OT for weeks that fall in this month
      const matchingWeeks = overtimeRecords.filter(r => 
        String(r.user_id) === String(userId) && 
        r.period_type === 'week' && 
        weekBelongsToMonth(r.period_value, monthPrefix)
      );
      const totalWeeklyOT = matchingWeeks.reduce((sum, r) => sum + (parseFloat(r.ot_amount) || 0), 0);
      
      const matchingDays = overtimeRecords.filter(r => 
        String(r.user_id) === String(userId) && 
        r.period_type === 'day' && 
        r.period_value.startsWith(monthPrefix)
      );
      const totalDayOT = matchingDays.reduce((sum, r) => sum + (parseFloat(r.ot_amount) || 0), 0);
      
      return totalWeeklyOT + totalDayOT;
    }

    if (filterType === 'year' || filterType === 'yearly') {
      const yearPrefix = filterVal ? filterVal.slice(0, 4) : '';
      const matching = overtimeRecords.filter(r => 
        String(r.user_id) === String(userId) && 
        r.period_value.startsWith(yearPrefix)
      );
      return matching.reduce((sum, r) => sum + (parseFloat(r.ot_amount) || 0), 0);
    }
    
    const rec = overtimeRecords.find(r => String(r.user_id) === String(userId) && r.period_value === filterVal);
    return rec ? parseFloat(rec.ot_amount || 0) : 0;
  };

  const handleSaveOvertime = async (userId, periodType, periodVal, amountStr) => {
    const amt = parseFloat(amountStr) || 0;
    if (amt < 0) return;
    
    try {
      const res = await axios.post(`${API_BASE}/dtr.php`, {
        action: 'save_overtime',
        user_id: userId,
        period_type: periodType,
        period_value: periodVal,
        ot_amount: amt,
        modifier_id: user?.id || 1
      });
      
      if (res.data.status === 'success') {
        setOvertimeRecords(prev => {
          const filtered = prev.filter(r => !(String(r.user_id) === String(userId) && r.period_type === periodType && r.period_value === periodVal));
          return [...filtered, { user_id: userId, period_type: periodType, period_value: periodVal, ot_amount: amt }];
        });
        addNotification({ type: 'success', message: `Overtime updated ($${amt.toFixed(2)})` });
      }
    } catch (err) {
      console.error('Failed to save overtime:', err);
      addNotification({ type: 'error', message: 'Failed to save overtime' });
    }
  };

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
    fetchOvertime();
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
      // Fetch approved leave requests  -  admin sees all, user sees their own
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
      let data = res.data;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) {}
      }
      if (data?.status === 'success' && Array.isArray(data.data)) {
        const nonAdmins = data.data.filter(u => u.role !== 'admin');
        setEmployees(nonAdmins);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const fetchRecords = async () => {
    try {
      const url = isAdmin
        ? `${API_BASE}/dtr.php?action=get_records`
        : `${API_BASE}/dtr.php?action=get_records&user_id=${user.id}`;
      const res = await axios.get(url);
      let data = res.data;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) {}
      }
      if (data?.status === 'success' && Array.isArray(data.data)) {
        setRecords(data.data);
      }
    } catch (err) {
      console.error('Error fetching DTR records:', err);
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

  // Helper to extract time string (HH:MM:SS) or detect mispunch
  const parseTimeOrMispunch = (val) => {
    if (!val) return '';
    if (val.includes('1900-01-01')) return '-- -- --';
    return val.includes(' ') ? val.split(' ')[1] : val;
  };

  // Helper to calculate total hours for timed employees matching backend rules
  const calculateTimedTotalHours = (amIn, amOut, pmIn, pmOut, dateStr = '2026-01-01') => {
    if (!amIn || !pmOut || amIn === '-- -- --' || pmOut === '-- -- --') {
      return 0;
    }
    const tAmIn = new Date(`${dateStr}T${amIn.length === 5 ? amIn + ':00' : amIn}`);
    const tPmOut = new Date(`${dateStr}T${pmOut.length === 5 ? pmOut + ':00' : pmOut}`);
    if (isNaN(tAmIn.getTime()) || isNaN(tPmOut.getTime())) {
      return 0;
    }
    const grossHours = Math.max(0, (tPmOut - tAmIn) / (1000 * 3600));
    let deductionHours = 0;
    const hasAmOut = amOut && amOut !== '-- -- --';
    const hasPmIn = pmIn && pmIn !== '-- -- --';
    if (hasAmOut && hasPmIn) {
      const tAmOut = new Date(`${dateStr}T${amOut.length === 5 ? amOut + ':00' : amOut}`);
      const tPmIn = new Date(`${dateStr}T${pmIn.length === 5 ? pmIn + ':00' : pmIn}`);
      if (!isNaN(tAmOut.getTime()) && !isNaN(tPmIn.getTime())) {
        const lunchHours = Math.max(0, (tPmIn - tAmOut) / (1000 * 3600));
        deductionHours = Math.max(0.5, lunchHours);
      }
    } else {
      if (grossHours > 5) {
        deductionHours = 0.5;
      }
    }
    return Math.round(Math.max(0, grossHours - deductionHours) * 100) / 100;
  };

  const openEditModal = (record, dayObj, targetUserId, targetEmployee = null) => {
    const targetUser = targetEmployee
      || employees.find(e => String(e.id) === String(targetUserId))
      || (displayUser && String(displayUser.id) === String(targetUserId) ? displayUser : null);

    const empType = targetUser?.employee_type || record?.employee_type || 'Timed';
    const empName = targetUser?.full_name || record?.full_name || 'Employee';

    if (record) {
      const amInVal = parseTimeOrMispunch(record.am_in);
      const amOutVal = parseTimeOrMispunch(record.am_out);
      const pmInVal = parseTimeOrMispunch(record.pm_in);
      const pmOutVal = parseTimeOrMispunch(record.pm_out);
      const rawHours = record.total_hours !== null && record.total_hours !== undefined ? parseFloat(record.total_hours) : null;
      const existingHours = rawHours !== null && !isNaN(rawHours) && rawHours > 0
        ? String(rawHours)
        : '';
      const calcIfEmpty = empType !== 'Fixed' && (amInVal || amOutVal || pmInVal || pmOutVal)
        ? calculateTimedTotalHours(amInVal, amOutVal, pmInVal, pmOutVal, record.date)
        : 0;
      const initialHours = existingHours || (empType === 'Fixed' ? '10' : (calcIfEmpty > 0 ? String(calcIfEmpty) : ''));

      setEditModal({
        isOpen: true,
        mode: 'edit',
        recordId: record.id,
        targetUserId: record.user_id,
        employeeType: empType,
        employeeName: empName,
        dateStr: record.date,
        amIn: amInVal,
        amOut: amOutVal,
        pmIn: pmInVal,
        pmOut: pmOutVal,
        totalHours: initialHours,
        status: record.status || 'Present',
        isCustomHours: false
      });
    } else {
      setEditModal({
        isOpen: true,
        mode: 'add',
        recordId: null,
        targetUserId: targetUserId,
        employeeType: empType,
        employeeName: empName,
        dateStr: dayObj.dateStr,
        amIn: '',
        amOut: '',
        pmIn: '',
        pmOut: '',
        totalHours: empType === 'Fixed' ? '10' : '',
        status: 'Present',
        isCustomHours: false
      });
    }
  };

  const handleSaveModal = async () => {
    try {
      const isFixed = editModal.employeeType === 'Fixed';
      const isSpecialStatus = ['Absent', 'Leave', 'Holiday', 'Rescheduled'].includes(editModal.status);

      let amInDate = '';
      let amOutDate = '';
      let pmInDate = '';
      let pmOutDate = '';
      let totalHoursVal = editModal.totalHours;

      if (isSpecialStatus) {
        amInDate = '';
        amOutDate = '';
        pmInDate = '';
        pmOutDate = '';
        if (editModal.status === 'Leave') {
          totalHoursVal = '10';
        } else {
          totalHoursVal = '0';
        }
      } else if (isFixed) {
        amInDate = editModal.amIn === '-- -- --'
          ? '1900-01-01 00:00:00'
          : (editModal.amIn ? `${editModal.dateStr} ${editModal.amIn}` : '');
        amOutDate = '';
        pmInDate = '';
        pmOutDate = '';
        totalHoursVal = editModal.totalHours || '10';
      } else {
        amInDate = editModal.amIn === '-- -- --'
          ? '1900-01-01 00:00:00'
          : (editModal.amIn ? `${editModal.dateStr} ${editModal.amIn}` : '');
        amOutDate = editModal.amOut === '-- -- --'
          ? '1900-01-01 00:00:00'
          : (editModal.amOut ? `${editModal.dateStr} ${editModal.amOut}` : '');
        pmInDate = editModal.pmIn === '-- -- --'
          ? '1900-01-01 00:00:00'
          : (editModal.pmIn ? `${editModal.dateStr} ${editModal.pmIn}` : '');
        pmOutDate = editModal.pmOut === '-- -- --'
          ? '1900-01-01 00:00:00'
          : (editModal.pmOut ? `${editModal.dateStr} ${editModal.pmOut}` : '');
        totalHoursVal = editModal.totalHours;
        if (!totalHoursVal) {
          const autoCalc = calculateTimedTotalHours(editModal.amIn, editModal.amOut, editModal.pmIn, editModal.pmOut, editModal.dateStr);
          if (autoCalc > 0) {
            totalHoursVal = String(autoCalc);
          }
        }
      }

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
        total_hours: totalHoursVal,
        status: editModal.status
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

  // Directory of employees filtered by active category type and search query
  const directoryEmployees = useMemo(() => {
    return employees.filter(emp => {
      if (emp.is_active !== undefined && parseInt(emp.is_active) === 0) return false;
      if (tableFilterType !== 'all' && (emp.employee_type || 'Timed') !== tableFilterType) return false;
      if (employeeSearch.trim()) {
        const q = employeeSearch.toLowerCase();
        const nameMatch = (emp.full_name || '').toLowerCase().includes(q);
        const idMatch = String(emp.employee_id || emp.id || '').toLowerCase().includes(q);
        const deptMatch = (emp.department || '').toLowerCase().includes(q);
        if (!nameMatch && !idMatch && !deptMatch) return false;
      }
      return true;
    });
  }, [employees, tableFilterType, employeeSearch]);

  // Selected active employee for the timesheet workspace (null = All Employees)
  const activeEmployee = useMemo(() => {
    if (!isAdmin) return user;
    if (selectedEmployeeId && selectedEmployeeId !== 'all') {
      const found = employees.find(e => String(e.id) === String(selectedEmployeeId));
      if (found) return found;
    }
    if (tableFilterUser && tableFilterUser !== 'all') {
      const found = employees.find(e => String(e.id) === String(tableFilterUser));
      if (found) return found;
    }
    return null;
  }, [isAdmin, user, selectedEmployeeId, tableFilterUser, employees]);

  const displayUser = activeEmployee;

  const displayedEmployees = useMemo(() => {
    if (displayUser) return [displayUser];
    return directoryEmployees;
  }, [displayUser, directoryEmployees]);

  // Period Summary metrics for the active scope (All Employees or selected employee)
  const periodSummary = useMemo(() => {
    let totalHours = 0;
    let totalOvertime = 0;
    let totalPayroll = 0;
    let timedCount = 0;
    let fixedCount = 0;
    let employeesWithLogs = 0;
    let totalDaysWorked = 0;

    displayedEmployees.forEach(emp => {
      const isFixedEmp = emp.employee_type === 'Fixed';
      if (isFixedEmp) fixedCount += 1;
      else timedCount += 1;

      const empRecords = records.filter(r => String(r.user_id) === String(emp.id));
      let empHrs = 0;
      let empDaysWorked = 0;

      filteredDays.forEach(d => {
        const row = empRecords.find(r => r.date === d.dateStr);
        if (row && row.status !== 'Absent') {
          const h = parseFloat(row.total_hours) || 0;
          empHrs += h;
          if ((row.am_in && !row.am_in.includes('1900-01-01')) || row.status === 'Present' || h > 0) {
            empDaysWorked += 1;
          }
        }
      });

      const overrideHrs = getGrandTotalOverride(emp.id);
      const finalHrs = overrideHrs !== undefined ? overrideHrs : empHrs;
      const empOt = getEmployeeOvertime(emp.id, dtrFilterType, dtrFilterValue);

      let empBasePay = 0;
      if (isFixedEmp) {
        const weeklyRate = parseFloat(emp.weekly_rate) || 0;
        const absents = dtrFilterType === 'week' && empDaysWorked < 5 ? 5 - empDaysWorked : 0;
        const deduction = (weeklyRate / 5) * absents;
        empBasePay = dtrFilterType === 'day'
          ? (empDaysWorked > 0 ? weeklyRate / 5 : 0)
          : Math.max(0, weeklyRate - deduction);
      } else {
        const hourlyRate = parseFloat(emp.hourly_rate) || 0;
        empBasePay = finalHrs * hourlyRate;
      }

      totalHours += finalHrs;
      totalOvertime += empOt;
      totalPayroll += empBasePay + empOt;
      totalDaysWorked += empDaysWorked;
      if (empDaysWorked > 0 || finalHrs > 0) {
        employeesWithLogs += 1;
      }
    });

    let periodLabel = dtrFilterValue || '';
    if (filteredDays.length === 1) {
      periodLabel = filteredDays[0].dateStr;
    } else if (filteredDays.length > 1) {
      const startDateLabel = filteredDays[0].dateStr;
      const endDateLabel = filteredDays[filteredDays.length - 1].dateStr;
      periodLabel = dtrFilterType === 'month' && dtrFilterValue
        ? new Date(`${dtrFilterValue}-01T00:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : `${startDateLabel} – ${endDateLabel}`;
    }

    return {
      totalHours,
      totalOvertime,
      totalPayroll,
      timedCount,
      fixedCount,
      employeesWithLogs,
      totalDaysWorked,
      periodLabel
    };
  }, [displayedEmployees, records, filteredDays, dtrFilterType, dtrFilterValue, editedGrandTotals, overtimeRecords]);

  // Filter records for the active employee (or all records when viewing All Employees)
  const tableRecords = useMemo(() => {
    if (!displayUser) return records;
    return records.filter(r => String(r.user_id) === String(displayUser.id));
  }, [records, displayUser]);

  const getEmployeePeriodSummary = (empId, empType) => {
    const empRecords = records.filter(r => String(r.user_id) === String(empId));
    let totalHrs = 0;
    let daysWorked = 0;

    filteredDays.forEach(d => {
      const row = empRecords.find(r => r.date === d.dateStr);
      if (row && row.status !== 'Absent') {
        const h = parseFloat(row.total_hours) || 0;
        totalHrs += h;
        if ((row.am_in && !row.am_in.includes('1900-01-01')) || row.status === 'Present' || h > 0) {
          daysWorked += 1;
        }
      }
    });

    const overrideHrs = getGrandTotalOverride(empId);
    const finalHrs = overrideHrs !== undefined ? overrideHrs : totalHrs;

    return {
      totalHrs: finalHrs,
      daysWorked,
      isFixed: empType === 'Fixed'
    };
  };

  const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const renderStatusBadge = (status, isSpecial) => {
    const s = (status || '').toUpperCase();
    if (s === 'PRESENT') {
      return <span className="dtr-badge-pill dtr-badge-pill--present">Present</span>;
    }
    if (s === 'ABSENT') {
      return <span className="dtr-badge-pill dtr-badge-pill--absent">Absent</span>;
    }
    if (s === 'LEAVE' || s === 'APPROVED LEAVE') {
      return <span className="dtr-badge-pill dtr-badge-pill--leave">Leave</span>;
    }
    if (s === 'HOLIDAY') {
      return <span className="dtr-badge-pill dtr-badge-pill--holiday">Holiday</span>;
    }
    if (s === 'RESCHEDULED' || s === 'PENDING RESCHEDULE') {
      return <span className="dtr-badge-pill dtr-badge-pill--warning">Rescheduled</span>;
    }
    if (s === 'MISSING TIMEOUT') {
      return <span className="dtr-badge-pill dtr-badge-pill--danger">Missing Timeout</span>;
    }
    if (s === 'SCHEDULED' || s === 'PENDING SCHEDULE') {
      return <span className="dtr-badge-pill dtr-badge-pill--scheduled">Scheduled</span>;
    }
    if (!status || status === '----' || status === '---') {
      return <span style={{ color: 'var(--text-muted)', opacity: 0.5 }}>—</span>;
    }
    return <span className="dtr-badge-pill dtr-badge-pill--neutral">{status}</span>;
  };

  // Calculate All Employees Summary (if displayUser is null)
  const allEmployeesSummary = React.useMemo(() => {
    if (displayUser || !isAdmin) return [];

    // Group records by user_id for the selectedMonth
    const summaryMap = {};
    employees.forEach(emp => {
      const empType = emp.employee_type || 'Timed';
      if (tableFilterType !== 'all' && empType !== tableFilterType) return;

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
  const myTodayRecord = myRecords.find(r => r.date === todayDateStr);

  const isValidTS = (t) => !!(t && !t.includes('1900-01-01'));
  const displayActiveShift = tableRecords.find(r =>
    isValidTS(r.am_in) && !isValidTS(r.pm_out) && r.date === todayDateStr
  );
  const displayTodayRecord = tableRecords.find(r => r.date === todayDateStr);

  // Summary Metrics & Detailed Lists for Summary Cards (fully connected to date filter)
  const summaryData = useMemo(() => {
    let totalScheduled = 0;
    let totalPresent = 0;
    let totalLeave = 0;
    let totalAbsent = 0;

    const presentList = [];
    const absentList = [];
    const scheduledList = [];
    const leaveList = [];

    // Respect active filters for employee type and exclude deactivated employees
    const activeEmployees = employees.filter(emp => {
      if (emp.is_active !== undefined && parseInt(emp.is_active) === 0) return false;
      if (tableFilterType !== 'all' && (emp.employee_type || 'Timed') !== tableFilterType) return false;
      return true;
    });

    filteredDays.forEach(d => {
      const dayStr = d.dateStr;
      const isPast = dayStr < todayDateStr;

      activeEmployees.forEach(emp => {
        // Find record if exists for this date and employee
        const row = records.find(r => r.date === dayStr && String(r.user_id) === String(emp.id));

        // Check for approved leave
        const matchingLeaveRequest = leaveRequests.find(lr =>
          String(lr.user_id) === String(emp.id) &&
          dayStr >= lr.start_date &&
          dayStr <= lr.end_date &&
          (lr.status === 'approved' || lr.status === 'Approved')
        );
        const isOnLeave = Boolean(matchingLeaveRequest) || (row && (row.status === 'Leave' || row.status === 'Approved Leave'));

        // Check for holiday
        const matchingHoliday = events.find(e =>
          e.event_date === dayStr &&
          (String(e.user_id) === String(emp.id) || e.user_id == 0) &&
          e.status === 'approved' &&
          (e.event_type === 'Holiday' || e.event_type === 'HL')
        );
        const isHoliday = Boolean(matchingHoliday) || (row && row.status === 'Holiday');

        // Check if scheduled event in calendar
        const matchingScheduledEvent = events.find(e =>
          e.event_date === dayStr &&
          (String(e.user_id) === String(emp.id) || e.user_id == 0) &&
          e.status === 'approved' &&
          (e.event_type === 'WS' || e.title === 'Work Shift' || (e.event_type !== 'Holiday' && e.event_type !== 'HL' && e.event_type !== 'VL'))
        );
        const isScheduledEvent = Boolean(matchingScheduledEvent);

        // Check if clocked in or marked present
        const isPresent = !isHoliday && (row && (
          (row.am_in && !row.am_in.includes('1900-01-01')) ||
          (row.pm_in && !row.pm_in.includes('1900-01-01')) ||
          row.status === 'Present' ||
          row.status === 'Late' ||
          row.status === 'Missing Timeout' ||
          (parseFloat(row.total_hours) > 0)
        ));

        // Explicit absent in record
        const isExplicitAbsent = !isPresent && (row && row.status === 'Absent');

        // Scheduled shift in the past missed (not present, not on leave, not a holiday)
        const isMissedScheduledShift = !isPresent && !isOnLeave && !isHoliday && isScheduledEvent && isPast;

        const isAbsent = isExplicitAbsent || isMissedScheduledShift;

        // Total scheduled days includes all actual shifts worked, explicit absences, approved leaves, and approved scheduled shifts
        const isScheduled = isScheduledEvent || isPresent || isExplicitAbsent || (isOnLeave && !isHoliday);

        if (isPresent) {
          totalPresent++;
          presentList.push({
            id: `${emp.id}_${dayStr}_present`,
            employee: emp,
            userId: emp.id,
            employeeName: emp.full_name || 'N/A',
            employeeId: emp.employee_id || emp.id,
            employeeType: emp.employee_type || 'Timed',
            department: emp.department || 'General',
            position: emp.position || emp.role || 'N/A',
            date: dayStr,
            dayName: d.dayName,
            row: row,
            amIn: row?.am_in,
            amOut: row?.am_out,
            pmIn: row?.pm_in,
            pmOut: row?.pm_out,
            totalHours: row ? parseFloat(row.total_hours) || 0 : 0,
            status: row?.status || 'Present'
          });
        } else if (isOnLeave) {
          totalLeave++;
          leaveList.push({
            id: `${emp.id}_${dayStr}_leave`,
            employee: emp,
            userId: emp.id,
            employeeName: emp.full_name || 'N/A',
            employeeId: emp.employee_id || emp.id,
            employeeType: emp.employee_type || 'Timed',
            department: emp.department || 'General',
            position: emp.position || emp.role || 'N/A',
            date: dayStr,
            dayName: d.dayName,
            leaveType: matchingLeaveRequest?.leave_type || row?.status || 'Leave',
            startDate: matchingLeaveRequest?.start_date || dayStr,
            endDate: matchingLeaveRequest?.end_date || dayStr,
            reason: matchingLeaveRequest?.reason || 'Approved Leave',
            status: 'Approved Leave',
            row: row
          });
        } else if (isAbsent) {
          totalAbsent++;
          absentList.push({
            id: `${emp.id}_${dayStr}_absent`,
            employee: emp,
            userId: emp.id,
            employeeName: emp.full_name || 'N/A',
            employeeId: emp.employee_id || emp.id,
            employeeType: emp.employee_type || 'Timed',
            department: emp.department || 'General',
            position: emp.position || emp.role || 'N/A',
            date: dayStr,
            dayName: d.dayName,
            reason: isExplicitAbsent ? 'Marked Absent in Record' : 'Missed Scheduled Shift',
            status: 'Absent',
            row: row
          });
        }

        if (isScheduled) {
          totalScheduled++;
          let schedDetails = 'Scheduled Workday';
          if (matchingScheduledEvent) {
            schedDetails = matchingScheduledEvent.title || 'Work Shift';
          } else if (isPresent) {
            schedDetails = 'Worked Shift';
          } else if (isOnLeave) {
            schedDetails = 'Scheduled (On Leave)';
          } else if (isAbsent) {
            schedDetails = 'Scheduled (Absent)';
          }

          let attendanceStatus = 'Scheduled';
          if (isPresent) attendanceStatus = 'Present';
          else if (isOnLeave) attendanceStatus = 'On Leave';
          else if (isAbsent) attendanceStatus = 'Absent';

          scheduledList.push({
            id: `${emp.id}_${dayStr}_scheduled`,
            employee: emp,
            userId: emp.id,
            employeeName: emp.full_name || 'N/A',
            employeeId: emp.employee_id || emp.id,
            employeeType: emp.employee_type || 'Timed',
            department: emp.department || 'General',
            position: emp.position || emp.role || 'N/A',
            date: dayStr,
            dayName: d.dayName,
            event: matchingScheduledEvent,
            eventTitle: matchingScheduledEvent?.title || 'Work Shift',
            eventTime: (matchingScheduledEvent?.start_time && matchingScheduledEvent?.end_time) 
              ? `${formatTime(matchingScheduledEvent.start_time, dayStr)} - ${formatTime(matchingScheduledEvent.end_time, dayStr)}`
              : 'Standard Shift',
            details: schedDetails,
            attendanceStatus: attendanceStatus,
            status: 'Scheduled',
            row: row
          });
        }
      });
    });

    return {
      totalScheduled,
      totalPresent,
      totalLeave,
      totalAbsent,
      presentList,
      absentList,
      scheduledList,
      leaveList
    };
  }, [filteredDays, employees, records, events, leaveRequests, tableFilterType, todayDateStr]);

  const currentHour = new Date().getHours();
  const isAM = currentHour < 12;

  const hasAmIn = !!myTodayRecord?.am_in;
  const hasPmOut = !!myTodayRecord?.pm_out;

  const isAmInDisabled = loading || hasAmIn || hasPmOut;
  const isAmOutDisabled = loading || !!myTodayRecord?.am_out || hasPmOut || !hasAmIn;
  const isPmInDisabled = loading || !!myTodayRecord?.pm_in || hasPmOut || !hasAmIn;
  const isPmOutDisabled = loading || hasPmOut || !hasAmIn;

  // --- ADMIN EXPORT LOGIC ---
  const handlePresetExport = (type) => {
    const today = new Date();
    let start = '';
    let end = getLocalDateStr(today);

    if (type === 'weekly') {
      const [year, month, day] = exportWeekStr.split('-').map(Number);
      if (year && month && day) {
        const startObj = new Date(year, month - 1, day);
        start = getLocalDateStr(startObj);
        const endObj = new Date(startObj);
        endObj.setDate(startObj.getDate() + 6);
        end = getLocalDateStr(endObj);
      }
    } else if (type === 'monthly') {
      const [year, month] = exportMonth.split('-').map(Number);
      start = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    } else if (type === 'yearly') {
      const lastYear = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
      start = getLocalDateStr(lastYear);
    }

    setStartDate(start);
    setEndDate(end);

    let usersToExport = customExportUsers;
    if (type === 'weekly') usersToExport = weeklyExportUsers;
    else if (type === 'monthly') usersToExport = monthlyExportUsers;

    setTimeout(() => {
      try {
        exportPDF(start, end, type, usersToExport);
      } catch (err) {
        alert("Export error: " + err.message);
        console.error(err);
      }
    }, 100);
  };

  const exportWeeklySchedulePDF = (startStr, endStr, usersToExport, exportType = 'weekly') => {
    const doc = new jsPDF({ orientation: 'landscape' });

    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    
    let reportTitle = "Weekly Payroll Report";
    if (exportType === 'monthly') reportTitle = "Monthly Payroll Report";
    else if (exportType === 'yearly') reportTitle = "Yearly Payroll Report";

    doc.text(reportTitle, 148.5, 20, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);

    const formatMMDDYYYY = (dateStr) => {
      if (!dateStr) return 'All Time';
      const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
      return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}-${d.getFullYear()}`;
    };
    const cycleStr = (startStr && endStr) ? `${formatMMDDYYYY(startStr)} to ${formatMMDDYYYY(endStr)}` : "All Records";
    doc.text(`Cycle: ${cycleStr}`, 148.5, 28, { align: "center" });

    // Filter records by date range and users
    let currentRecords = [...records];
    if (!usersToExport.includes('all')) {
      currentRecords = currentRecords.filter(r => usersToExport.includes(String(r.user_id)));
    }
    if (startStr) currentRecords = currentRecords.filter(r => r.date >= startStr);
    if (endStr) currentRecords = currentRecords.filter(r => r.date <= endStr);

    // Group by employee
    const grouped = {};
    let emps = employees;
    if (!usersToExport.includes('all')) {
      emps = employees.filter(e => usersToExport.includes(String(e.id)));
    }
    // No category filter needed for weekly summary, include both Fixed and Timed

    emps.forEach(emp => {
      grouped[emp.id] = {
        user_id: emp.id,
        full_name: emp.full_name,
        // Ensure rate is a valid number from the employees list
        hourly_rate: parseFloat(emp.hourly_rate || 0),
        weekly_rate: parseFloat(emp.weekly_rate || 0),
        ot_rate: parseFloat(emp.ot_rate || 0),
        employee_type: emp.employee_type || 'Timed',
        total_hours: 0,
        ot_hours: 0,
        days_worked: 0,
      };
    });

    currentRecords.forEach(r => {
      const uid = r.user_id;
      if (grouped[uid] && r.status !== 'Absent') {
        const h = parseFloat(r.total_hours || 0);
        grouped[uid].total_hours += h;
        grouped[uid].days_worked += 1;
        const isFixed = grouped[uid].employee_type === 'Fixed';
        const otThreshold = isFixed ? 10 : 8;
        if (h > otThreshold) {
          grouped[uid].ot_hours += (h - otThreshold);
        }
      }
    });

    const tableColumn = ["NAME", "RATE"];

    let grandTotalEarnings = 0;

    const tableRows = Object.values(grouped).map(record => {
      const overrideHrs = getGrandTotalOverride(record.user_id);
      const hrs = overrideHrs !== undefined ? overrideHrs : parseFloat(record.total_hours || 0);
      const days = parseInt(record.days_worked || 0);
      const isFixed = record.employee_type === 'Fixed';
      const rate = isFixed ? parseFloat(record.weekly_rate || 0) : parseFloat(record.hourly_rate || 0);
      const otRate = parseFloat(record.ot_rate || 0);
      const otHours = parseFloat(record.ot_hours || 0);
      
      let deduction = 0;
      let earnings = 0;
      let workedStr = "";

      const otType = exportType === 'monthly' ? 'month' : (exportType === 'yearly' ? 'year' : 'week');
      const otVal = exportType === 'monthly' ? (startStr ? startStr.slice(0, 7) : exportMonth) : (exportType === 'yearly' ? (startStr ? startStr.slice(0, 4) : '') : startStr);
      const empManualOt = getEmployeeOvertime(record.user_id, otType, otVal);

      if (isFixed) {
        workedStr = `${days} days`;
        // Deduct if days < 5
        if (days < 5) {
          const absents = 5 - days;
          deduction = (rate / 5) * absents;
        }
        const otPay = otHours * otRate;
        earnings = Math.max(0, rate - deduction) + otPay + empManualOt;
      } else {
        workedStr = formatHoursDuration(hrs);
        const regHours = Math.max(0, hrs - otHours);
        const effectiveOtRate = otRate > 0 ? otRate : rate;
        earnings = (regHours * rate) + (otHours * effectiveOtRate) + empManualOt;
      }

      grandTotalEarnings += earnings;
      
      const fixedRateWithOt = rate + empManualOt;

      return [
        record.full_name,
        isFixed ? (fixedRateWithOt > 0 ? `$${fixedRateWithOt.toFixed(2)}` : '---') : formatHoursDuration(hrs)
      ];
    });

    // Grand total row removed since rate columns have mixed units

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [200, 240, 210], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', lineWidth: 0.5, lineColor: [0, 0, 0], fontSize: 13, cellPadding: 8 },
      bodyStyles: { textColor: [0, 0, 0], halign: 'center', lineWidth: 0.5, lineColor: [0, 0, 0], fontSize: 13, cellPadding: 8 },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      styles: { font: 'helvetica', fontSize: 13, cellPadding: 8, fontStyle: 'bold', lineWidth: 0.5, lineColor: [0, 0, 0] },
      didParseCell: function (data) {
        if (data.row.raw[0] === 'GRAND TOTAL') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [200, 240, 210];
          data.cell.styles.fontSize = 13;
        }
      }
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}`, 280, 200, { align: 'right' });
    }

    let fileName = 'Weekly Payroll Summary Report.pdf';
    if (exportType === 'monthly') fileName = 'Monthly Payroll Summary Report.pdf';
    else if (exportType === 'yearly') fileName = 'Yearly Payroll Summary Report.pdf';

    doc.save(fileName);
    logSystemAction('DOWNLOAD_PAYROLL', `Admin downloaded ${fileName}.`);
  };

  const exportFixedReportPDF = (startStr, endStr, category, dateType, dateValue, usersToExport) => {
    const doc = new jsPDF({ orientation: 'landscape' });

    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(`Report Salary - ${category}`, 148.5, 20, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);

    const formatMMDDYYYY = (dateStr) => {
      if (!dateStr) return 'All Time';
      const parts = dateStr.split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[1]}-${parts[2]}-${parts[0]}`;
      }
      return dateStr;
    };

    let periodStr = startStr === endStr
      ? formatMMDDYYYY(startStr)
      : `${formatMMDDYYYY(startStr)} to ${formatMMDDYYYY(endStr)}`;

    doc.text(`Period: ${periodStr}`, 148.5, 28, { align: "center" });

    // Filter records by date range and users
    let currentRecords = [...records];
    if (!usersToExport.includes('all')) {
      currentRecords = currentRecords.filter(r => usersToExport.includes(String(r.user_id)));
    }
    if (startStr) currentRecords = currentRecords.filter(r => r.date >= startStr);
    if (endStr) currentRecords = currentRecords.filter(r => r.date <= endStr);

    let emps = employees;
    if (!usersToExport.includes('all')) {
      emps = employees.filter(e => usersToExport.includes(String(e.id)));
    }
    
    // Filter by Category (Fixed vs Timed)
    emps = emps.filter(e => {
      const empType = e.employee_type || 'Timed';
      return empType === category;
    });

    if (emps.length === 0) {
      alert(`No ${category} employees found to export.`);
      return;
    }

    const isFixed = category === 'Fixed';

    const getDaysList = (start, end) => {
      const days = [];
      if (!start || !end) return days;
      const [sY, sM, sD] = start.split('-').map(Number);
      const [eY, eM, eD] = end.split('-').map(Number);
      const curr = new Date(sY, sM - 1, sD);
      const endD = new Date(eY, eM - 1, eD);
      while (curr <= endD) {
        const y = curr.getFullYear();
        const m = String(curr.getMonth() + 1).padStart(2, '0');
        const dt = String(curr.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${dt}`;
        const dayName = curr.toLocaleDateString('en-US', { weekday: 'long' });
        days.push({ dateStr, dayName, dayNum: curr.getDate() });
        curr.setDate(curr.getDate() + 1);
      }
      return days;
    };

    const daysList = getDaysList(startStr, endStr);

    let currentY = 40;

    emps.forEach((emp, index) => {
      const empRecords = currentRecords.filter(r => String(r.user_id) === String(emp.id));
      const hourlyRate = parseFloat(emp.hourly_rate || 0);
      const weeklyRate = parseFloat(emp.weekly_rate || 0);
      const dailyRate = weeklyRate / 5;

      let tableColumn = [];
      if (isFixed) {
        if (pdfColumns.name !== false) tableColumn.push("NAME");
        if (pdfColumns.day !== false) tableColumn.push("DAY");
        if (pdfColumns.logInRecord !== false) tableColumn.push("LOG IN RECORD");
        tableColumn.push("STATUS");
        if (pdfColumns.daysWorked !== false) tableColumn.push("DAYS WORKED");
        if (pdfColumns.totalRate !== false) tableColumn.push("TOTAL RATE");
      } else {
        if (pdfColumns.name !== false) tableColumn.push("NAME");
        if (pdfColumns.day !== false) tableColumn.push("DAY");
        if (pdfColumns.amIn !== false) tableColumn.push("AM IN");
        if (pdfColumns.amOut !== false) tableColumn.push("AM OUT");
        if (pdfColumns.pmIn !== false) tableColumn.push("PM IN");
        if (pdfColumns.pmOut !== false) tableColumn.push("PM OUT");
        if (pdfColumns.totalHrs !== false) tableColumn.push("WORKED");
        if (pdfColumns.rate !== false) tableColumn.push("RATE");
        if (pdfColumns.earnings !== false) tableColumn.push("TOTAL PAY");
      }

      const tableRows = [];
      let empTotalHrs = 0;
      let empDaysWorked = 0;

      daysList.forEach(dayObj => {
        const row = empRecords.find(r => r.date === dayObj.dateStr);
        const dayText = `${dayObj.dayName}, ${formatMMDDYYYY(dayObj.dateStr)}`;

        const approvedLeaveForDay = leaveRequests.find(lr =>
          String(lr.user_id) === String(emp.id) &&
          dayObj.dateStr >= lr.start_date &&
          dayObj.dateStr <= lr.end_date &&
          (lr.status === 'approved' || lr.status === 'Approved')
        );

        const isHoliday = events.some(e =>
          e.event_date === dayObj.dateStr &&
          (String(e.user_id) === String(emp.id) || e.user_id == 0) &&
          e.status === 'approved' &&
          (e.event_type === 'Holiday' || e.event_type === 'HL')
        );

        let virtualStatus = '';
        if (!row) {
          if (approvedLeaveForDay) {
            virtualStatus = 'LEAVE';
          } else if (isHoliday) {
            virtualStatus = 'HOLIDAY';
          } else {
            const isPast = dayObj.dateStr < todayDateStr;
            if (isPast) {
              const isScheduled = events.some(e =>
                e.event_date === dayObj.dateStr &&
                (String(e.user_id) === String(emp.id) || e.user_id == 0) &&
                e.status === 'approved' &&
                (e.event_type === 'WS' || e.title === 'Work Shift')
              );
              virtualStatus = isScheduled ? 'ABSENT' : '---';
            } else {
              virtualStatus = '---';
            }
          }
        }

        const isSpecialStatus = (row && ['Absent', 'Leave', 'Holiday', 'Rescheduled'].includes(row.status)) || (!row && (virtualStatus === 'LEAVE' || virtualStatus === 'HOLIDAY'));
        const displayStatus = row && row.status ? row.status.toUpperCase() : virtualStatus;

        if (isFixed) {
          let fixedTimeLog = '---';
          let isWorked = false;

          if (isSpecialStatus) {
            fixedTimeLog = displayStatus || '---';
          } else if (row && row.am_in && row.status !== 'Absent') {
            fixedTimeLog = formatTime(row.am_in, row.date);
            isWorked = true;
          } else if (row && row.status === 'Present') {
            fixedTimeLog = 'Present';
            isWorked = true;
          } else {
            fixedTimeLog = displayStatus === 'ABSENT' ? 'ABSENT' : '---';
          }

          if (isWorked) {
            empDaysWorked += 1;
          }

          const dailyRow = [];
          if (pdfColumns.name !== false) dailyRow.push(emp.full_name);
          if (pdfColumns.day !== false) dailyRow.push(dayText);
          if (pdfColumns.logInRecord !== false) dailyRow.push(fixedTimeLog);
          dailyRow.push(isSpecialStatus ? displayStatus : (isWorked ? 'PRESENT' : (displayStatus || '---')));
          if (pdfColumns.daysWorked !== false) dailyRow.push(isWorked ? '1' : '0');
          if (pdfColumns.totalRate !== false) dailyRow.push(isWorked && dailyRate > 0 ? `$${dailyRate.toFixed(2)}` : '---');
          tableRows.push(dailyRow);
        } else {
          // Timed employee
          const hrs = (row && row.status !== 'Absent') ? (parseFloat(row.total_hours) || 0) : 0;
          const pay = hrs * hourlyRate;

          if (row && row.status !== 'Absent') {
            empTotalHrs += hrs;
          }

          const amInVal = isSpecialStatus ? '---' : (row && row.am_in ? formatTime(row.am_in, row.date) : '--:--');
          const amOutVal = isSpecialStatus ? '---' : (row && row.am_out ? formatTime(row.am_out, row.date) : '--:--');
          const pmInVal = isSpecialStatus ? '---' : (row && row.pm_in ? formatTime(row.pm_in, row.date) : '--:--');
          const pmOutVal = isSpecialStatus ? '---' : (row && row.pm_out ? formatTime(row.pm_out, row.date) : '--:--');

          const dailyRow = [];
          if (pdfColumns.name !== false) dailyRow.push(emp.full_name);
          if (pdfColumns.day !== false) dailyRow.push(dayText);
          if (pdfColumns.amIn !== false) dailyRow.push(amInVal);
          if (pdfColumns.amOut !== false) dailyRow.push(amOutVal);
          if (pdfColumns.pmIn !== false) dailyRow.push(pmInVal);
          if (pdfColumns.pmOut !== false) dailyRow.push(pmOutVal);
          if (pdfColumns.totalHrs !== false) dailyRow.push(isSpecialStatus ? (displayStatus === 'LEAVE' ? '8hrs 0mins' : '---') : (hrs > 0 ? formatHoursDuration(hrs) : '0hrs 0mins'));
          if (pdfColumns.rate !== false) dailyRow.push(hourlyRate > 0 ? `$${hourlyRate.toFixed(2)}/hr` : '---');
          if (pdfColumns.earnings !== false) dailyRow.push(pay > 0 ? `$${pay.toFixed(2)}` : '---');
          tableRows.push(dailyRow);
        }
      });

      // SUMMARY / TOTAL Row
      if (isFixed) {
        const empManualOt = getEmployeeOvertime(emp.id, dateType, dateValue);
        const absents = empDaysWorked < 5 ? 5 - empDaysWorked : 0;
        const deduction = (weeklyRate / 5) * absents;
        let baseEarnings = weeklyRate - deduction;
        if (baseEarnings < 0) baseEarnings = 0;
        let earnings = baseEarnings + empManualOt;

        const totalRow = [];
        if (pdfColumns.name !== false) totalRow.push("TOTAL");
        if (pdfColumns.day !== false) totalRow.push(pdfColumns.name === false ? "TOTAL" : "");
        if (pdfColumns.logInRecord !== false) totalRow.push(`Days Worked: ${empDaysWorked} / 5`);
        totalRow.push(deduction > 0 ? `Deduction: -$${deduction.toFixed(2)}` : 'Full Week');
        if (pdfColumns.daysWorked !== false) totalRow.push(`${empDaysWorked}`);
        if (pdfColumns.totalRate !== false) totalRow.push(earnings > 0 ? `$${earnings.toFixed(2)}` : '---');
        tableRows.push(totalRow);
      } else {
        const empManualOt = getEmployeeOvertime(emp.id, dateType, dateValue);
        const overrideHrs = getGrandTotalOverride(emp.id);
        const finalHrs = overrideHrs !== undefined ? overrideHrs : empTotalHrs;
        const totalPay = (finalHrs * hourlyRate) + empManualOt;

        const totalRow = [];
        if (pdfColumns.name !== false) totalRow.push("TOTAL");
        if (pdfColumns.day !== false) totalRow.push(pdfColumns.name === false ? "TOTAL" : "");
        if (pdfColumns.amIn !== false) totalRow.push("");
        if (pdfColumns.amOut !== false) totalRow.push("");
        if (pdfColumns.pmIn !== false) totalRow.push("");
        if (pdfColumns.pmOut !== false) totalRow.push("");
        if (pdfColumns.totalHrs !== false) totalRow.push(formatHoursDuration(finalHrs));
        if (pdfColumns.rate !== false) totalRow.push(hourlyRate > 0 ? `$${hourlyRate.toFixed(2)}/hr` : '---');
        if (pdfColumns.earnings !== false) totalRow.push(totalPay > 0 ? `$${totalPay.toFixed(2)}` : '---');
        tableRows.push(totalRow);
      }

      // Check page break
      const estimatedTableHeight = (tableRows.length + 1) * 7 + 22;
      if (index > 0 && (currentY + estimatedTableHeight > 190 || dateType === 'month')) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(`Salary Slip - ${emp.full_name}`, 14, currentY);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: currentY + 6,
        theme: 'grid',
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
          lineWidth: 0.5,
          lineColor: [0, 0, 0],
          fontSize: 10,
          cellPadding: 5
        },
        bodyStyles: {
          textColor: [0, 0, 0],
          halign: 'center',
          lineWidth: 0.5,
          lineColor: [0, 0, 0],
          fontSize: 9,
          cellPadding: 4
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 4, lineWidth: 0.5, lineColor: [0, 0, 0] },
        didParseCell: function (data) {
          if (data.row.raw && (data.row.raw[0] === 'TOTAL' || data.row.raw[1] === 'TOTAL')) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [239, 246, 255];
            data.cell.styles.textColor = [30, 58, 138];
          }
        }
      });

      currentY = doc.lastAutoTable.finalY + 16;
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text(`Page ${i} of ${pageCount}`, 14, 200);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}`, 280, 200, { align: 'right' });
    }

    doc.save(`Report_Salary_${category}_${periodStr}.pdf`);
    logSystemAction('DOWNLOAD_PAYROLL', `Admin downloaded Report Salary PDF for ${category}.`);
  };

  const exportTimeCardPDF = (startStr, endStr, dateType, dateValue, usersToExport) => {
    const doc = new jsPDF({ orientation: 'portrait' });

    // Filter records by date range and users
    let currentRecords = [...records];
    if (!usersToExport.includes('all')) {
      currentRecords = currentRecords.filter(r => usersToExport.includes(String(r.user_id)));
    }
    if (startStr) currentRecords = currentRecords.filter(r => r.date >= startStr);
    if (endStr) currentRecords = currentRecords.filter(r => r.date <= endStr);

    // Group by employee
    let emps = employees;
    if (!usersToExport.includes('all')) {
      emps = employees.filter(e => usersToExport.includes(String(e.id)));
    }

    const formatShortDate = (dateStr) => {
      if (!dateStr) return '';
      const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
      return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
    };

    const formatLongDate = (dateStr) => {
      const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    };

    const getDaysArray = (start, end) => {
      const arr = [];
      const dt = new Date(start.includes('T') ? start : start + 'T00:00:00');
      const endDt = new Date(end.includes('T') ? end : end + 'T00:00:00');
      while (dt <= endDt) {
        arr.push(new Date(dt));
        dt.setDate(dt.getDate() + 1);
      }
      return arr;
    };

    const daysList = (startStr && endStr) ? getDaysArray(startStr, endStr) : [];

    let isFirstPage = true;

    emps.forEach((emp, index) => {
      if (!isFirstPage) {
        doc.addPage();
      }
      isFirstPage = false;

      const empRecords = currentRecords.filter(r => String(r.user_id) === String(emp.id));
      const rate = parseFloat(emp.hourly_rate || 0);

      // --- Header Rendering ---
      // Impact Pro PH - Employee Timecard
      doc.setFillColor(146, 208, 80); // Green color from image
      doc.rect(14, 15, 181, 10, 'F');
      doc.setFontSize(15);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Impact Pro PH - Employee Timecard", 16, 22);

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Pay Cycle:", 14, 33);

      doc.setFont("helvetica", "normal");

      let cycleText = 'Custom';
      if (dateType === 'month') {
        const [y, m] = dateValue.split('-');
        const d = new Date(y, m - 1);
        cycleText = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      } else if (dateType === 'week') {
        const startDay = daysList.length > 0 ? daysList[0].toLocaleDateString('en-US', { weekday: 'long' }) : '';
        const endDay = daysList.length > 0 ? daysList[daysList.length - 1].toLocaleDateString('en-US', { weekday: 'long' }) : '';
        cycleText = startDay && endDay ? `${startDay} - ${endDay}` : 'Custom';
      } else if (dateType === 'day') {
        cycleText = daysList.length > 0 ? daysList[0].toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Custom';
      } else {
        cycleText = `${startStr} to ${endStr}`;
      }
      doc.text(cycleText, 55, 33);

      doc.setFont("helvetica", "bold");
      doc.text("Rate per Hour:", 14, 40);

      doc.setFillColor(226, 239, 218); // Light green background for rate
      doc.rect(53, 34, 40, 7, 'F');
      doc.setFont("helvetica", "normal");
      doc.text(rate.toFixed(2), 90, 39.5, { align: "right" });

      // EMPLOYEE row
      doc.setFillColor(255, 255, 0); // Yellow
      doc.rect(14, 48, 181, 9, 'F');
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`EMPLOYEE: ${emp.full_name}`, 16, 54.5);

      // Pay Period
      doc.setFontSize(11);
      doc.text("Pay Period:", 14, 68);

      // START / END Headers
      doc.text("START", 83, 62, { align: "center" });
      doc.text("END", 125, 62, { align: "center" });

      // drawing a rect for the dates
      doc.setFillColor(255, 255, 0);
      doc.rect(63, 63, 40, 7, 'F'); // START date rect
      doc.rect(105, 63, 40, 7, 'F'); // END date rect

      doc.setFont("helvetica", "normal");
      doc.text(formatShortDate(startStr), 83, 68, { align: "center" });
      doc.text(formatShortDate(endStr), 125, 68, { align: "center" });

      // Table Generation
      const tableRows = [];
      let totalHrs = 0;
      let totalPay = 0;

      daysList.forEach(d => {
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const record = empRecords.find(r => r.date === dateStr);

        const hrs = record && record.status !== 'Absent' ? parseFloat(record.total_hours || 0) : 0;
        const pay = hrs * rate;

        totalHrs += hrs;
        totalPay += pay;

        let inTime = '12:00 AM';
        let outTime = '12:00 AM';
        let rowHrs = '0.00';

        if (record && record.status !== 'Absent') {
          inTime = record.am_in ? formatTime(record.am_in, record.date) : (record.pm_in ? formatTime(record.pm_in, record.date) : '12:00 AM');
          outTime = record.pm_out ? formatTime(record.pm_out, record.date) : (record.am_out ? formatTime(record.am_out, record.date) : '12:00 AM');
          rowHrs = hrs.toFixed(2);
        }

        tableRows.push([
          formatLongDate(dateStr),
          hrs > 0 ? hrs.toFixed(2) : '-',
          pay > 0 ? pay.toFixed(2) : '-'
        ]);
      });

      autoTable(doc, {
        startY: 78,
        head: [['Day', 'Hours Worked', 'Daily Pay']],
        body: tableRows,
        theme: 'plain',
        headStyles: {
          fillColor: [217, 225, 242], // Light blue
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          fontSize: 12,
          lineWidth: 0.2,
          lineColor: [180, 180, 180],
          cellPadding: { top: 5, right: 6, bottom: 5, left: 6 }
        },
        bodyStyles: {
          textColor: [0, 0, 0],
          fontSize: 11,
          lineWidth: 0.2,
          lineColor: [200, 200, 200],
          cellPadding: { top: 5, right: 6, bottom: 5, left: 6 }
        },
        columnStyles: {
          0: { cellWidth: 95 },
          1: { cellWidth: 43, halign: 'right' },
          2: { cellWidth: 43, halign: 'right' }
        }
      });

      const finalY = doc.lastAutoTable.finalY;

      doc.setFillColor(252, 228, 214); // Light orange
      doc.rect(14, finalY, 181, 9, 'F');

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");

      const grandOverride = getGrandTotalOverride(emp.id);
      const finalTotalHrs = grandOverride !== undefined ? grandOverride : totalHrs;
      const empManualOt = getEmployeeOvertime(emp.id, dateType, dateValue);
      const finalTotalPay = (grandOverride !== undefined ? (grandOverride * rate) : totalPay) + empManualOt;

      doc.text(finalTotalHrs.toFixed(2), 150, finalY + 6.5, { align: "right" });
      doc.text(`$${finalTotalPay.toFixed(2)}`, 193, finalY + 6.5, { align: "right" });
    });

    let periodStr = "";
    if (dateType === 'month') {
      const [y, m] = dateValue.split('-');
      const d = new Date(y, m - 1);
      periodStr = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    } else if (dateType === 'week') {
      periodStr = `Week_of_${startStr}`;
    } else {
      periodStr = startStr;
    }

    doc.save(`Time_Card_Report_${periodStr}.pdf`);
    logSystemAction('DOWNLOAD_PAYROLL', `Admin downloaded Time Card PDF.`);
  };

  const handleFixedReportExport = () => {
    let start = '';
    let end = '';
    const today = new Date();

    if (fixedReportDateType === 'month') {
      const val = fixedReportDateValue || today.toISOString().slice(0, 7);
      const [year, month] = val.split('-').map(Number);
      start = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    } else if (fixedReportDateType === 'week') {
      let val = fixedReportDateValue;
      if (!val) {
        const dayOfWeek = today.getDay();
        const diff = (dayOfWeek + 7 - 4) % 7;
        const s = new Date(today);
        s.setDate(today.getDate() - diff);
        val = getLocalDateStr(s);
      }
      const [year, month, day] = val.split('-').map(Number);
      if (year && month && day) {
        const startObj = new Date(year, month - 1, day);
        start = getLocalDateStr(startObj);
        const endObj = new Date(startObj);
        endObj.setDate(startObj.getDate() + 6);
        end = getLocalDateStr(endObj);
      }
    } else if (fixedReportDateType === 'day') {
      const val = fixedReportDateValue || getLocalDateStr(today);
      start = val;
      end = val;
    }

    setTimeout(() => {
      try {
        if (fixedReportCategory === 'Time Card') {
          exportTimeCardPDF(start, end, fixedReportDateType, fixedReportDateValue, fixedReportUsers);
        } else if (fixedReportCategory === 'Punch Record') {
          const emps = fixedReportUsers.includes('all')
            ? employees
            : employees.filter(e => fixedReportUsers.includes(String(e.id)));
          exportPunchReportPDF(emps, start, end, fixedReportDateType, fixedReportDateValue);
        } else {
          exportFixedReportPDF(start, end, fixedReportCategory, fixedReportDateType, fixedReportDateValue, fixedReportUsers);
        }
      } catch (err) {
        alert("Export error: " + err.message);
        console.error(err);
      }
    }, 100);
  };

  const exportPunchReportPDF = (
    empsToExport,
    startStr = null,
    endStr = null,
    dateType = dtrFilterType,
    dateValue = dtrFilterValue,
    customDays = null
  ) => {
    if (!empsToExport || empsToExport.length === 0) {
      alert("No employees selected for export.");
      return;
    }

    const doc = new jsPDF({ orientation: 'portrait' });

    // Determine days list
    let daysList = [];
    if (customDays && customDays.length > 0) {
      daysList = customDays;
    } else if (startStr && endStr) {
      const [sY, sM, sD] = startStr.split('-').map(Number);
      const [eY, eM, eD] = endStr.split('-').map(Number);
      const curr = new Date(sY, sM - 1, sD);
      const endD = new Date(eY, eM - 1, eD);
      while (curr <= endD) {
        const y = curr.getFullYear();
        const m = String(curr.getMonth() + 1).padStart(2, '0');
        const dt = String(curr.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${dt}`;
        const dayName = curr.toLocaleDateString('en-US', { weekday: 'long' });
        daysList.push({ dateStr, dayNum: curr.getDate(), dayName });
        curr.setDate(curr.getDate() + 1);
      }
    } else if (dateType === 'month') {
      const val = dateValue || new Date().toISOString().slice(0, 7);
      const [year, month] = val.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const d = new Date(year, month - 1, day);
        const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
        daysList.push({ dateStr, dayNum: day, dayName });
      }
    } else if (dateType === 'week') {
      let val = dateValue;
      if (!val) {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diff = (dayOfWeek + 7 - 4) % 7;
        const s = new Date(today);
        s.setDate(today.getDate() - diff);
        val = getLocalDateStr(s);
      }
      const [year, month, day] = val.split('-').map(Number);
      if (year && month && day) {
        const start = new Date(year, month - 1, day);
        for (let i = 0; i < 7; i++) {
          const d = new Date(start);
          d.setDate(start.getDate() + i);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const dt = String(d.getDate()).padStart(2, '0');
          const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
          daysList.push({ dateStr, dayNum: d.getDate(), dayName });
        }
      }
    } else if (dateType === 'day') {
      const val = dateValue || getLocalDateStr(new Date());
      const parts = val.split('-');
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
        daysList.push({ dateStr: val, dayNum: parseInt(parts[2], 10), dayName });
      }
    }

    if (daysList.length === 0) {
      alert("No dates found for the selected period.");
      return;
    }

    // Determine period text (dates only without weekday names)
    let periodText = '';
    if (dateType === 'month') {
      const val = dateValue || (daysList[0] ? daysList[0].dateStr.slice(0, 7) : '');
      const [year, month] = val.split('-').map(Number);
      const d = new Date(year, month - 1);
      periodText = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    } else if (dateType === 'week') {
      const startD = daysList[0];
      const endD = daysList[daysList.length - 1];
      periodText = (startD && endD)
        ? `${startD.dateStr} to ${endD.dateStr}`
        : `Week of ${dateValue}`;
    } else if (dateType === 'day') {
      const d = daysList[0];
      periodText = d ? d.dateStr : dateValue;
    } else {
      periodText = (startStr && endStr) ? `${startStr} to ${endStr}` : 'All Time';
    }

    let isFirstPage = true;

    empsToExport.forEach(emp => {
      if (!isFirstPage) {
        doc.addPage();
      }
      isFirstPage = false;

      const empRecords = records.filter(r => String(r.user_id) === String(emp.id));
      const isFixedEmp = emp.employee_type === 'Fixed';
      const empManualOt = getEmployeeOvertime(emp.id, dateType, dateValue);
      const weeklyRate = parseFloat(emp.weekly_rate || 0);
      const hourlyRate = parseFloat(emp.hourly_rate || 0);

      // Title
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text("ATTENDANCE RECORD", 105, 17, { align: "center" });

      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(37, 99, 235);
      doc.text(emp.full_name, 105, 23, { align: "center" });

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      const rateLabel = isFixedEmp ? `Weekly Rate: $${weeklyRate.toFixed(2)}` : `Rate: $${hourlyRate.toFixed(2)}/hr`;
      doc.text(rateLabel, 105, 28, { align: "center" });

      let empGrandTotalHrs = 0;
      const tableRows = [];

      daysList.forEach(dayObj => {
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
            const approved = dailyEvents.find(e => e.status === 'approved' && (e.event_type === 'Holiday' || e.event_type === 'HL'))
              || dailyEvents.find(e => e.status === 'approved');

            if (approved) {
              if (approved.event_type === 'VL') virtualStatus = 'APPROVED LEAVE';
              else if (approved.event_type === 'HL' || approved.event_type === 'Holiday') virtualStatus = 'HOLIDAY';
            }
          }
        }

        const hrs = row ? (parseFloat(row.total_hours) || 0) : 0;
        const isSpecialStatus = (row && ['Absent', 'Leave', 'Holiday', 'Rescheduled'].includes(row.status)) || (!row && virtualStatus === 'LEAVE');
        const displayStatus = row && row.status ? row.status.toUpperCase() : (virtualStatus || '');

        if (row && row.status !== 'Absent') {
          empGrandTotalHrs += hrs;
        }

        const dayCell = `${dayObj.dayName}\n${dayObj.dateStr}`;

        if (isFixedEmp) {
          let logInText = '---';
          if (isSpecialStatus) logInText = displayStatus || '---';
          else if (row && row.am_in) logInText = `Logged in at: ${formatTime(row.am_in, row.date)}`;
          else if (row && row.status === 'Present') logInText = 'Present';

          tableRows.push([
            dayCell,
            logInText,
            hrs > 0 ? formatHoursDuration(hrs) : '---'
          ]);
        } else {
          const amInVal = isSpecialStatus ? '---' : (row && row.am_in ? formatTime(row.am_in, row.date) : '---');
          const amOutVal = isSpecialStatus ? '---' : (row && row.am_out ? formatTime(row.am_out, row.date) : '---');
          const pmInVal = isSpecialStatus ? '---' : (row && row.pm_in ? formatTime(row.pm_in, row.date) : '---');
          const pmOutVal = isSpecialStatus ? '---' : (row && row.pm_out ? formatTime(row.pm_out, row.date) : '---');
          const totalHrsVal = (displayStatus === 'LEAVE' || displayStatus === 'APPROVED LEAVE')
            ? '8h'
            : (isSpecialStatus ? '---' : (hrs > 0 ? formatHoursDuration(hrs) : '---'));

          tableRows.push([
            dayCell,
            amInVal,
            amOutVal,
            pmInVal,
            pmOutVal,
            totalHrsVal
          ]);
        }
      });

      const overrideHrs = getGrandTotalOverride(emp.id);
      const finalHrs = overrideHrs !== undefined ? overrideHrs : empGrandTotalHrs;

      let totalSalaryPay = 0;
      if (isFixedEmp) {
        const daysWorked = daysList.filter(d => {
          const r = empRecords.find(rec => rec.date === d.dateStr);
          return r && r.status && r.status !== 'Absent';
        }).length;
        const absents = dateType === 'week' && daysWorked < 5 ? 5 - daysWorked : 0;
        const deduction = (weeklyRate / 5) * absents;
        totalSalaryPay = Math.max(0, weeklyRate - deduction) + empManualOt;
      } else {
        totalSalaryPay = (finalHrs * hourlyRate) + empManualOt;
      }

      const hrsFormatted = finalHrs > 0 ? formatHoursDuration(finalHrs) : '0hrs 0mins';
      const payDetail = `Pay: $${totalSalaryPay.toFixed(2)}`;

      if (isFixedEmp) {
        tableRows.push([
          { content: 'GRAND TOTAL', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249] } },
          { content: `${hrsFormatted}   |   ${payDetail}`, styles: { halign: 'center', fontStyle: 'bold', textColor: [37, 99, 235], fillColor: [241, 245, 249] } }
        ]);
      } else {
        tableRows.push([
          { content: 'GRAND TOTAL', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249] } },
          { content: `${hrsFormatted}   |   ${payDetail}`, styles: { halign: 'center', fontStyle: 'bold', textColor: [37, 99, 235], fillColor: [241, 245, 249] } }
        ]);
      }

      const tableHead = isFixedEmp ? [
        [
          { content: 'DAY', styles: { halign: 'center' } },
          { content: 'LOG IN RECORD', styles: { halign: 'center' } },
          { content: 'TOTAL HRS', styles: { halign: 'center' } }
        ]
      ] : [
        [
          { content: 'DAY', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
          { content: 'AM', colSpan: 2, styles: { halign: 'center' } },
          { content: 'PM', colSpan: 2, styles: { halign: 'center' } },
          { content: 'TOTAL HRS', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } }
        ],
        [
          { content: 'IN', styles: { halign: 'center' } },
          { content: 'OUT', styles: { halign: 'center' } },
          { content: 'IN', styles: { halign: 'center' } },
          { content: 'OUT', styles: { halign: 'center' } }
        ]
      ];

      autoTable(doc, {
        head: tableHead,
        body: tableRows,
        startY: 32,
        theme: 'grid',
        headStyles: {
          fillColor: [241, 245, 249],
          textColor: [30, 41, 59],
          fontStyle: 'bold',
          fontSize: 9,
          lineWidth: 0.3,
          lineColor: [203, 213, 225],
          cellPadding: 4
        },
        bodyStyles: {
          textColor: [30, 41, 59],
          fontSize: 8.5,
          halign: 'center',
          valign: 'middle',
          lineWidth: 0.2,
          lineColor: [226, 232, 240],
          cellPadding: 3.5
        },
        columnStyles: isFixedEmp ? {
          0: { cellWidth: 52 },
          1: { cellWidth: 80 },
          2: { cellWidth: 50, fontStyle: 'bold', textColor: [37, 99, 235] }
        } : {
          0: { cellWidth: 42 },
          1: { cellWidth: 28 },
          2: { cellWidth: 28 },
          3: { cellWidth: 28 },
          4: { cellWidth: 28 },
          5: { cellWidth: 28, fontStyle: 'bold', textColor: [37, 99, 235] }
        },
        alternateRowStyles: {
          fillColor: [255, 255, 255]
        }
      });
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(`Page ${i} of ${pageCount}`, 14, 287);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}`, 196, 287, { align: 'right' });
    }

    const periodSlug = (dateValue || 'report').replace(/[^a-zA-Z0-9_-]/g, '_');
    if (empsToExport.length === 1) {
      const empNameSlug = empsToExport[0].full_name.replace(/[^a-zA-Z0-9_-]/g, '_');
      doc.save(`Attendance_Record_${empNameSlug}_${periodSlug}.pdf`);
      logSystemAction('DOWNLOAD_ATTENDANCE', `Admin downloaded Attendance Record Punch PDF for ${empsToExport[0].full_name}.`);
    } else {
      doc.save(`Report_Salary_Attendance_Punch_${periodSlug}.pdf`);
      logSystemAction('DOWNLOAD_PAYROLL', `Admin downloaded Report Salary Attendance Punch PDF.`);
    }
  };

  const exportSingleEmployeePunchPDF = (emp) => {
    if (!emp) return;
    const start = filteredDays.length > 0 ? filteredDays[0].dateStr : dtrFilterValue;
    const end = filteredDays.length > 0 ? filteredDays[filteredDays.length - 1].dateStr : dtrFilterValue;
    exportPunchReportPDF([emp], start, end, dtrFilterType, dtrFilterValue, filteredDays);
  };

  const handleEmployeePdfExport = () => {
    exportSingleEmployeePunchPDF(displayUser || user);
  };

  const exportPDF = (customStart = startDate, customEnd = endDate, exportType = 'custom', usersToExport = customExportUsers, category = 'Timed') => {
    if (exportType === 'weekly' || exportType === 'monthly' || exportType === 'yearly') {
      exportWeeklySchedulePDF(customStart, customEnd, usersToExport, exportType);
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
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(`Payroll Report - ${category}`, 148.5, 20, { align: "center" });

    doc.setFontSize(12);
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
        tableColumn.push("NAME", "RATE");
        dataKeys.push("full_name", "rate_display");
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
      const overrideHrs = getGrandTotalOverride(record.user_id);
      const recordHrs = overrideHrs !== undefined ? overrideHrs : parseFloat(record.total_hours || 0);
      const empObj = employees.find(e => String(e.id) === String(record.user_id));
      const recordRate = parseFloat(record.hourly_rate || empObj?.hourly_rate || 0);
      const recordOtRate = parseFloat(record.ot_rate || empObj?.ot_rate || 0);
      const isFixed = (empObj?.employee_type || record.employee_type) === 'Fixed';
      const otThreshold = isFixed ? 10 : 8;

      let recordEarnings = 0;
      if (record.status !== 'Absent') {
        if (recordHrs > otThreshold) {
          const regHrs = otThreshold;
          const otHrs = recordHrs - otThreshold;
          const effectiveOtRate = recordOtRate > 0 ? recordOtRate : recordRate;
          recordEarnings = (regHrs * recordRate) + (otHrs * effectiveOtRate);
        } else {
          recordEarnings = recordHrs * recordRate;
        }

        if (exportType === 'monthly' || exportType === 'yearly') {
          const otType = exportType === 'monthly' ? 'month' : 'year';
          const otVal = exportType === 'monthly' ? (customStart ? customStart.slice(0, 7) : '') : (customStart ? customStart.slice(0, 4) : '');
          const empManualOt = getEmployeeOvertime(record.user_id, otType, otVal);
          recordEarnings += empManualOt;
        }

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

        else if (key === 'total_hours') rowData.push(isLeave ? '8h' : (isSpecialStatus ? '---' : (record.total_hours ? formatHoursDuration(recordHrs) : '0h')));
        else if (key === 'hourly_rate') rowData.push(isSpecialStatus ? '' : `${recordRate.toFixed(2)}`);
        else if (key === 'earnings') rowData.push(isSpecialStatus ? '' : (recordEarnings > 0 ? `${recordEarnings.toFixed(2)}` : '-- -- --'));
      });
      tableRows.push(rowData);
    });

    if (exportType !== 'monthly' && exportType !== 'yearly') {
      const uniqueUserIds = [...new Set(recordsToProcess.map(r => r.user_id))];
      uniqueUserIds.forEach(uid => {
        const empManualOt = getEmployeeOvertime(uid, exportType === 'weekly' ? 'week' : 'custom', customStart);
        grandTotalEarnings += empManualOt;
      });
    }

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
      headStyles: { fillColor: [200, 240, 210], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', lineWidth: 0.5, lineColor: [0, 0, 0], fontSize: 12, cellPadding: 7 },
      bodyStyles: { textColor: [0, 0, 0], halign: 'center', lineWidth: 0.5, lineColor: [0, 0, 0], fontSize: 12, cellPadding: 7 },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      styles: { font: 'helvetica', fontSize: 12, cellPadding: 7, fontStyle: 'bold', lineWidth: 0.5, lineColor: [0, 0, 0] },
      didParseCell: function (data) {
        if (data.row.raw[0] === 'GRAND TOTAL') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [200, 240, 210];
          data.cell.styles.fontSize = 12;
        }
      }
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
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
            <button className="btn btn-primary dtr-action-btn" onClick={() => handleClockAction('fixed_in')} disabled={hasAmIn}>
              <CheckCircle size={20} /> MARK PRESENT
            </button>
          </div>
        </div>
      ) : (
        <div className="admin-summary-boxes">
          {[
            {
              type: 'present',
              label: dtrFilterType === 'day' ? 'Employees Present' : 'Total Present',
              value: summaryData.totalPresent,
              title: 'Click to view Total Present records',
              Icon: Users,
              variant: 'present',
            },
            {
              type: 'absent',
              label: dtrFilterType === 'day' ? 'Absent' : 'Total Absent',
              value: summaryData.totalAbsent,
              title: 'Click to view Total Absent records',
              Icon: X,
              variant: 'absent',
            },
            {
              type: 'scheduled',
              label: dtrFilterType === 'day' ? 'Scheduled Today' : 'Total Scheduled',
              value: summaryData.totalScheduled,
              title: 'Click to view Total Scheduled shifts',
              Icon: CalendarDays,
              variant: 'scheduled',
            },
            {
              type: 'leave',
              label: dtrFilterType === 'day' ? 'On Leave' : 'Total Leave',
              value: summaryData.totalLeave,
              title: 'Click to view Total Leave records',
              Icon: CalendarIcon,
              variant: 'leave',
            },
          ].map(({ type, label, value, title, Icon, variant }) => (
            <button
              key={type}
              type="button"
              className={`premium-summary-card summary-card--${variant}`}
              onClick={() => setSummaryModal({ isOpen: true, type })}
              title={title}
            >
              <div className="summary-card-top">
                <span className="summary-card-label">{label}</span>
                <span className="summary-card-icon">
                  <Icon size={18} strokeWidth={2.2} />
                </span>
              </div>
              <div className="summary-card-bottom">
                <span className="summary-card-value">{value}</span>
                <span className="summary-card-link">
                  View list <span className="summary-card-arrow" aria-hidden="true">→</span>
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* New Design: Details and Record */}
      <div className="dtr-new-design-container">
        <div className="premium-dtr-toolbar">

          <div className="toolbar-filters-wrap">
            <div className="toolbar-group">
              <div className="toolbar-label">
                <ListFilter size={15} /> Filter By
              </div>
              <select
                className="toolbar-input"
                value={dtrFilterType}
                onChange={handleFilterTypeChange}
              >
                <option value="week">Specific Week</option>
                <option value="month">Specific Month</option>
                <option value="day">Specific Day</option>
              </select>
            </div>

            <div className="toolbar-divider"></div>

            <div className="toolbar-group">
              <div className="toolbar-label">
                <CalendarDays size={15} /> Date
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
                type="button"
                className="toolbar-today-btn"
                onClick={handleGoToToday}
                title="Go to Today"
              >
                Today
              </button>
            </div>

            {isAdmin && (
              <>
                <div className="toolbar-divider"></div>
                <div className="toolbar-group">
                  <div className="toolbar-label">
                    <Filter size={15} /> Type
                  </div>
                  <select
                    className="toolbar-input"
                    value={tableFilterType}
                    onChange={e => {
                      setTableFilterType(e.target.value);
                      setTableFilterUser('all');
                      setSelectedEmployeeId(null);
                    }}
                  >
                    <option value="all">All Types</option>
                    <option value="Timed">Timed</option>
                    <option value="Fixed">Fixed</option>
                  </select>
                </div>

                <button
                  type="button"
                  className="toolbar-export-btn"
                  onClick={() => setShowExportCenter(true)}
                  title="Open Export Report Settings"
                >
                  <Settings size={15} strokeWidth={2} />
                  <span>Export Report Setting</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="dtr-split-layout">
          {/* Left Column: Employee Directory + Period Summary Card */}
          <div className="dtr-left-sidebar">
            <div className="dtr-directory-panel">
              <div className="dtr-directory-header">
                <div className="dtr-directory-title-row">
                  <span className="dtr-directory-title">
                    <Users size={16} /> Directory
                  </span>
                  <span className="dtr-directory-count-badge">
                    {directoryEmployees.length} {directoryEmployees.length === 1 ? 'Employee' : 'Employees'}
                  </span>
                </div>
                <div className="dtr-directory-search">
                  <Search size={14} className="dtr-directory-search-icon" />
                  <input
                    type="text"
                    placeholder="Search name, ID, dept..."
                    value={employeeSearch}
                    onChange={e => setEmployeeSearch(e.target.value)}
                  />
                  {employeeSearch && (
                    <button
                      type="button"
                      className="dtr-directory-search-clear"
                      onClick={() => setEmployeeSearch('')}
                      title="Clear search"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              <div className="dtr-directory-list">
                {directoryEmployees.length === 0 ? (
                  <div className="dtr-directory-empty">
                    <p>No employees match your search.</p>
                    {employeeSearch && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setEmployeeSearch('')}
                        style={{ marginTop: '8px', fontSize: '0.78rem' }}
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div
                      className={`dtr-directory-item ${!displayUser ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedEmployeeId(null);
                        setTableFilterUser('all');
                      }}
                    >
                      <div className="dtr-directory-avatar">
                        <Users size={16} />
                      </div>
                      <div className="dtr-directory-item-info">
                        <div className="dtr-directory-item-name-row">
                          <span className="dtr-directory-item-name">All Employees</span>
                          <span className="dtr-type-tag dtr-type-tag--timed">All</span>
                        </div>
                        <div className="dtr-directory-item-sub">
                          <span>Show all {directoryEmployees.length} {directoryEmployees.length === 1 ? 'record' : 'records'}</span>
                        </div>
                      </div>
                    </div>
                    {directoryEmployees.map(emp => {
                      const isSelected = Boolean(displayUser && String(emp.id) === String(displayUser.id));
                      const summary = getEmployeePeriodSummary(emp.id, emp.employee_type);
                      const isFixedEmp = emp.employee_type === 'Fixed';

                      return (
                        <div
                          key={emp.id}
                          className={`dtr-directory-item ${isSelected ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedEmployeeId(emp.id);
                            setTableFilterUser(emp.id);
                          }}
                        >
                          <div className="dtr-directory-avatar">
                            {getInitials(emp.full_name)}
                          </div>
                          <div className="dtr-directory-item-info">
                            <div className="dtr-directory-item-name-row">
                              <span className="dtr-directory-item-name">{emp.full_name}</span>
                              <span className={`dtr-type-tag ${isFixedEmp ? 'dtr-type-tag--fixed' : 'dtr-type-tag--timed'}`}>
                                {isFixedEmp ? 'Fixed' : 'Timed'}
                              </span>
                            </div>
                            <div className="dtr-directory-item-sub">
                              <span>ID: {emp.employee_id || emp.id}</span>
                              <span className="dtr-directory-dot">&bull;</span>
                              <span className="dtr-directory-stat-badge">
                                {isFixedEmp
                                  ? `${summary.daysWorked}/5 days`
                                  : (summary.totalHrs > 0 ? formatHoursDuration(summary.totalHrs) : '0h 00m')}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>

            {/* Period Summary & Quick Payroll Card */}
            <div className="dtr-period-summary-card">
              <div className="dtr-period-summary-header">
                <span className="dtr-period-summary-title">
                  <Clock size={15} /> Period Summary
                </span>
                <span className="dtr-period-scope-pill" title={displayUser ? displayUser.full_name : 'All Employees'}>
                  {displayUser ? displayUser.full_name : 'All Employees'}
                </span>
              </div>

              <div className="dtr-period-summary-body">
                <div className="dtr-period-meta-row">
                  <CalendarDays size={13} />
                  <span>{periodSummary.periodLabel || 'Current Period'}</span>
                  <span className="dtr-period-meta-sep">&bull;</span>
                  <span>
                    {displayUser
                      ? `${displayUser.employee_type || 'Timed'}`
                      : `${periodSummary.timedCount} Timed, ${periodSummary.fixedCount} Fixed`}
                  </span>
                </div>

                <div className="dtr-period-metrics-grid">
                  <div className="dtr-period-metric">
                    <span className="dtr-period-metric-label">Total Hours</span>
                    <span className="dtr-period-metric-value">
                      {periodSummary.totalHours > 0 ? formatHoursDuration(periodSummary.totalHours) : '0hrs 0mins'}
                    </span>
                  </div>
                  <div className="dtr-period-metric">
                    <span className="dtr-period-metric-label">
                      {displayUser ? 'Days Worked' : 'With Logs'}
                    </span>
                    <span className="dtr-period-metric-value">
                      {displayUser
                        ? `${periodSummary.totalDaysWorked} / ${filteredDays.length} days`
                        : `${periodSummary.employeesWithLogs} / ${displayedEmployees.length} emp`}
                    </span>
                  </div>
                  <div className="dtr-period-metric">
                    <span className="dtr-period-metric-label">Overtime ($)</span>
                    <span className="dtr-period-metric-value">
                      ${periodSummary.totalOvertime.toFixed(2)}
                    </span>
                  </div>
                  <div className="dtr-period-metric dtr-period-metric--highlight">
                    <span className="dtr-period-metric-label">Est. Payroll</span>
                    <span className="dtr-period-metric-value">
                      ${periodSummary.totalPayroll.toFixed(2)}
                    </span>
                  </div>
                </div>

                {displayedEmployees.length > 0 && (
                  <button
                    type="button"
                    className="dtr-period-export-btn"
                    onClick={() => {
                      const start = filteredDays.length > 0 ? filteredDays[0].dateStr : dtrFilterValue;
                      const end = filteredDays.length > 0 ? filteredDays[filteredDays.length - 1].dateStr : dtrFilterValue;
                      exportPunchReportPDF(displayedEmployees, start, end, dtrFilterType, dtrFilterValue, filteredDays);
                    }}
                  >
                    <Download size={15} />
                    {displayUser ? `Export ${displayUser.full_name.split(' ')[0]}'s PDF` : `Export All (${displayedEmployees.length}) PDF`}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Pane: Active Employee / All Employees Timesheet Workspace */}
          <div className="dtr-timesheet-panel">
            {displayedEmployees.length > 0 ? (
              displayedEmployees.map(targetEmp => {
                const empRecords = records.filter(r => String(r.user_id) === String(targetEmp.id));
                const isFixedEmp = targetEmp.employee_type === 'Fixed';

                return (
                  <div key={targetEmp.id} className="dtr-employee-workspace-card">
                    {/* Active Employee Banner */}
                    <div className="dtr-active-emp-banner">
                      <div className="dtr-active-emp-profile">
                        <div className="dtr-active-emp-avatar">
                          {getInitials(targetEmp.full_name)}
                        </div>
                        <div className="dtr-active-emp-meta">
                          <div className="dtr-active-emp-name-row">
                            <h2 className="dtr-active-emp-name">{targetEmp.full_name}</h2>
                            <span className={`dtr-type-tag ${isFixedEmp ? 'dtr-type-tag--fixed' : 'dtr-type-tag--timed'}`}>
                              {isFixedEmp ? 'Fixed Employee' : 'Timed Employee'}
                            </span>
                          </div>
                          <div className="dtr-active-emp-details">
                            <span>{targetEmp.email || 'No email'}</span>
                            <span className="dtr-meta-sep">&bull;</span>
                            <span>Dept: {targetEmp.department || 'General'}</span>
                            <span className="dtr-meta-sep">&bull;</span>
                            <span>ID: {targetEmp.employee_id || targetEmp.id}</span>
                            <span className="dtr-meta-sep">&bull;</span>
                            <span style={{ color: 'var(--success)', fontWeight: 700 }}>
                              {isFixedEmp
                                ? `$${parseFloat(targetEmp.weekly_rate || 0).toFixed(2)}/wk`
                                : `$${parseFloat(targetEmp.hourly_rate || 0).toFixed(2)}/hr`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="dtr-active-emp-actions">
                        {/* Overtime Controls */}
                        <div className="dtr-ot-container" title={`Overtime for this ${dtrFilterType}`}>
                          <span className="dtr-ot-label">
                            {dtrFilterType === 'month' ? 'OT Total' : 'OT ($)'}:
                          </span>
                          {dtrFilterType === 'month' ? (
                            <span className="dtr-ot-total-badge" title="Sum of weekly and daily OT for this month">
                              ${getEmployeeOvertime(targetEmp.id, 'month', dtrFilterValue).toFixed(2)}
                            </span>
                          ) : (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <div className="dtr-ot-input-wrap">
                                <span className="dtr-ot-currency">$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  className="dtr-ot-input"
                                  value={
                                    otInputValues[`${targetEmp.id}_${dtrFilterType}_${dtrFilterValue}`] !== undefined
                                      ? otInputValues[`${targetEmp.id}_${dtrFilterType}_${dtrFilterValue}`]
                                      : (getDirectOvertime(targetEmp.id, dtrFilterType, dtrFilterValue) > 0 ? getDirectOvertime(targetEmp.id, dtrFilterType, dtrFilterValue) : '')
                                  }
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setOtInputValues(prev => ({
                                      ...prev,
                                      [`${targetEmp.id}_${dtrFilterType}_${dtrFilterValue}`]: val
                                    }));
                                  }}
                                  onBlur={(e) => {
                                    const val = e.target.value;
                                    handleSaveOvertime(targetEmp.id, dtrFilterType, dtrFilterValue, val);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.target.blur();
                                    }
                                  }}
                                  title={`Enter ${dtrFilterType} Overtime ($) for ${targetEmp.full_name}`}
                                />
                              </div>
                              {dtrFilterType === 'week' && getEmployeeDailyOvertimeForWeek(targetEmp.id, dtrFilterValue) > 0 && (
                                <span
                                  className="dtr-ot-total-badge"
                                  title={`Daily OT: $${getEmployeeDailyOvertimeForWeek(targetEmp.id, dtrFilterValue).toFixed(2)} + Weekly: $${getDirectOvertime(targetEmp.id, 'week', dtrFilterValue).toFixed(2)}`}
                                  style={{ fontSize: '0.8rem', padding: '2px 6px' }}
                                >
                                  Total: ${getEmployeeOvertime(targetEmp.id, 'week', dtrFilterValue).toFixed(2)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          className="dtr-download-btn"
                          onClick={() => exportSingleEmployeePunchPDF(targetEmp)}
                          title={`Download Attendance Record PDF for ${targetEmp.full_name}`}
                        >
                          <Download size={16} /> Export PDF
                        </button>
                      </div>
                    </div>

                    {/* Attendance Record Table */}
                    <div className="dtr-table-section">
                      <div className="dtr-table-title">
                        <span>ATTENDANCE RECORD &bull; {targetEmp.full_name}</span>
                      </div>

                      <div className="table-responsive">
                        <table className="dtr-monthly-table">
                          <thead>
                            <tr>
                              <th rowSpan={2} style={{ width: '130px' }}>DAY</th>
                              {isFixedEmp ? (
                                <th colSpan={4} rowSpan={2} style={{ minWidth: '280px', textAlign: 'center' }}>LOG IN RECORD</th>
                              ) : (
                                <>
                                  <th colSpan={2} style={{ minWidth: '160px', textAlign: 'center' }}>AM</th>
                                  <th colSpan={2} style={{ minWidth: '160px', textAlign: 'center' }}>PM</th>
                                </>
                              )}
                              <th rowSpan={2} style={{ width: '110px' }}>
                                {isFixedEmp ? 'RATE' : 'TOTAL HRS'}
                              </th>
                              {!isFixedEmp && <th rowSpan={2} style={{ width: '100px' }}>RATE/HR</th>}
                              {isFixedEmp && <th rowSpan={2} style={{ width: '100px', textAlign: 'center' }}>HOURS</th>}
                              <th rowSpan={2} style={{ width: '130px' }}>STATUS</th>
                              <th rowSpan={2} style={{ width: '100px', textAlign: 'center' }}>ACTIONS</th>
                            </tr>
                            <tr>
                              {!isFixedEmp && (
                                <>
                                  <th style={{ minWidth: '80px', textAlign: 'center' }}>IN</th>
                                  <th style={{ minWidth: '80px', textAlign: 'center' }}>OUT</th>
                                  <th style={{ minWidth: '80px', textAlign: 'center' }}>IN</th>
                                  <th style={{ minWidth: '80px', textAlign: 'center' }}>OUT</th>
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
                                    const dailyRecords = empRecords.filter(r => r.date === dayObj.dateStr);
                                    const row = dailyRecords[0];
                                    const targetUserId = targetEmp.id;

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
                                          } else {
                                            virtualStatus = (new Date(dayObj.dateStr) < new Date(todayDateStr)) ? 'ABSENT' : 'SCHEDULED';
                                          }
                                        } else if (pendingReschedule) {
                                          virtualStatus = 'PENDING RESCHEDULE';
                                        } else if (pendingNew) {
                                          virtualStatus = 'PENDING SCHEDULE';
                                        }
                                      }
                                    }

                                    const hrs = row ? parseFloat(row.total_hours) || 0 : 0;
                                    const rate = row
                                      ? (isFixedEmp ? (parseFloat(row.weekly_rate) || parseFloat(targetEmp?.weekly_rate) || 0) : (parseFloat(row.hourly_rate) || parseFloat(targetEmp?.hourly_rate) || 0))
                                      : (isFixedEmp ? parseFloat(targetEmp?.weekly_rate || 0) : parseFloat(targetEmp?.hourly_rate || 0));
                                    const earnings = isFixedEmp ? rate : hrs * rate;

                                    grandTotalHrs += hrs;
                                    grandTotalEarnings += earnings;

                                    const isSpecialStatus = (row && ['Absent', 'Leave', 'Holiday', 'Rescheduled'].includes(row.status)) || (!row && virtualStatus === 'LEAVE');
                                    const displayStatus = row && row.status ? row.status.toUpperCase() : virtualStatus;

                                    return (
                                      <tr key={dayObj.dateStr}>
                                        <td className="dtr-day-col">
                                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: '1.2' }}>
                                            <span style={{ fontSize: '0.78em', color: 'var(--text-muted)' }}>{dayObj.dayName}</span>
                                            <span style={{ fontWeight: 600 }}>{dayObj.dateStr}</span>
                                          </div>
                                        </td>
                                        {isFixedEmp ? (
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
                                          {isFixedEmp
                                            ? (rate ? `$${rate.toFixed(2)}` : '---')
                                            : ((displayStatus === 'LEAVE' || displayStatus === 'APPROVED LEAVE') ? '8h' : (isSpecialStatus ? '---' : (hrs ? formatHoursDuration(hrs) : '---')))}
                                        </td>
                                        {!isFixedEmp && <td>{rate ? `$${rate.toFixed(2)}` : '---'}</td>}
                                        {isFixedEmp && (
                                          <td style={{ fontWeight: 600, color: 'var(--text-main)', textAlign: 'center' }}>
                                            {hrs > 0 ? formatHoursDuration(hrs) : '---'}
                                          </td>
                                        )}
                                        <td>
                                          {renderStatusBadge(displayStatus, isSpecialStatus)}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                          <div className="dtr-action-icons" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            {row ? (
                                              <>
                                                <button className="btn-icon text-primary" onClick={() => openEditModal(row, dayObj, targetUserId, targetEmp)} title="Edit Record" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}>
                                                  <Edit size={16} />
                                                </button>
                                                <button className="btn-icon text-danger" onClick={() => handleDeleteRecord(row.id)} title="Delete Record" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                                                  <Trash2 size={16} />
                                                </button>
                                              </>
                                            ) : (
                                              <button onClick={() => openEditModal(null, dayObj, targetUserId, targetEmp)} title="Add Record" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', cursor: 'pointer', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                                                <Plus size={14} /> Add
                                              </button>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                  {(() => {
                                    const overrideVal = getGrandTotalOverride(targetEmp.id);
                                    const isEdited = overrideVal !== undefined;
                                    const finalHrs = isEdited ? overrideVal : grandTotalHrs;

                                    return (
                                      <tr className="grand-total-row">
                                        <td colSpan={5} style={{ textAlign: 'right', paddingRight: '24px', fontWeight: 800 }}>GRAND TOTAL</td>
                                        <td style={{ color: 'var(--primary)', fontWeight: 800, textAlign: 'center' }}>
                                          {isFixedEmp ? '' : (
                                            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}>
                                              <span>{finalHrs > 0 ? formatHoursDuration(finalHrs) : '0hrs 0mins'}</span>
                                              {isEdited && (
                                                <span style={{ fontSize: '0.7rem', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                                  Manual
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </td>
                                        {!isFixedEmp && <td></td>}
                                        {isFixedEmp && (
                                          <td style={{ color: 'var(--primary)', fontWeight: 800, textAlign: 'center' }}>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}>
                                              <span>{formatHoursDuration(finalHrs)}</span>
                                              {isEdited && (
                                                <span style={{ fontSize: '0.7rem', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                                  Manual
                                                </span>
                                              )}
                                            </div>
                                          </td>
                                        )}
                                        <td></td>
                                        <td style={{ textAlign: 'center' }}>
                                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                                            <button
                                              type="button"
                                              className="btn-icon text-primary"
                                              onClick={() => openGrandTotalModal(targetEmp.id, targetEmp.full_name, grandTotalHrs)}
                                              title="Edit Grand Total"
                                              style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)', cursor: 'pointer', color: 'var(--primary)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                                            >
                                              <Edit size={13} /> Edit
                                            </button>
                                            {isEdited && (
                                              <button
                                                type="button"
                                                className="btn-icon"
                                                onClick={() => resetGrandTotalOverride(targetEmp.id, targetEmp.full_name)}
                                                title="Reset to Calculated"
                                                style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', cursor: 'pointer', color: 'var(--danger)', padding: '4px 6px', borderRadius: '6px' }}
                                              >
                                                <RotateCcw size={13} />
                                              </button>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })()}
                                </>
                              );
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="dtr-empty-state">
                <Users size={48} style={{ opacity: 0.3 }} />
                <h3>No Employees Found</h3>
                <p>Try adjusting your type filter or directory search query.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Attendance and Payroll Reports Modal */}
      {isAdmin && showExportCenter && (
        <div
          className="dtr-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowExportCenter(false);
          }}
        >
          <div className="dtr-modal-content dtr-modal-export">
            <div className="dtr-modal-header dtr-export-modal-header">
              <div className="dtr-export-header-title">
                <div className="dtr-export-header-icon">
                  <Settings size={20} color="var(--primary)" />
                </div>
                <div>
                  <h3>Attendance and Payroll Reports</h3>
                  <p>Generate scheduled attendance exports and custom salary reports.</p>
                </div>
              </div>
              <button
                className="dtr-export-close-btn"
                type="button"
                onClick={() => setShowExportCenter(false)}
                title="Close"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="dtr-export-modal-body">
              <div className="dtr-export-stack">
                <div className="dtr-export-group-label">Quick Preset Exports</div>

                {/* Monthly Export Row */}
                <div className="dtr-export-section-box dtr-export-preset-grid">
                  <div className="dtr-export-field">
                    <label>Select Month</label>
                    <input
                      type="month"
                      className="premium-input"
                      value={exportMonth}
                      onChange={e => setExportMonth(e.target.value)}
                    />
                  </div>
                  <div className="dtr-export-field">
                    <label>Employee</label>
                    <MultiSelectDropdown
                      options={employees}
                      selected={monthlyExportUsers}
                      onChange={setMonthlyExportUsers}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary dtr-export-action-btn"
                    onClick={() => handlePresetExport('monthly')}
                  >
                    <Download size={15} /> Monthly PDF Export
                  </button>
                </div>

                {/* Weekly Export Row */}
                <div className="dtr-export-section-box dtr-export-preset-grid">
                  <div className="dtr-export-field">
                    <label>Select Week</label>
                    <CustomWeekPicker
                      value={exportWeekStr}
                      onChange={val => setExportWeekStr(val)}
                    />
                  </div>
                  <div className="dtr-export-field">
                    <label>Employee</label>
                    <MultiSelectDropdown
                      options={employees}
                      selected={weeklyExportUsers}
                      onChange={setWeeklyExportUsers}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary dtr-export-action-btn"
                    onClick={() => handlePresetExport('weekly')}
                  >
                    <Download size={15} /> Weekly PDF Export
                  </button>
                </div>

                {/* Yearly Export Row */}
                <div className="dtr-export-section-box dtr-export-preset-grid dtr-export-annual-row">
                  <div className="dtr-export-annual-info">
                    <span className="dtr-export-annual-title">Annual Report</span>
                    <p>Generate a comprehensive report for the entire previous year automatically.</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline dtr-export-action-btn"
                    onClick={() => handlePresetExport('yearly')}
                  >
                    <Download size={15} /> Yearly PDF Export
                  </button>
                </div>

                <div className="dtr-export-group-label" style={{ marginTop: '4px' }}>Custom Report</div>

                {/* Report Salary Section */}
                <div className="dtr-export-section-box dtr-export-salary-card">
                  <div className="dtr-export-salary-header">
                    <div>
                      <h4>Report Salary</h4>
                      <p>Customize category, date period, employee scope, and included PDF columns.</p>
                    </div>
                  </div>

                  <div className="dtr-export-salary-grid">
                    <div className="dtr-export-field">
                      <label>Category</label>
                      <select
                        className="premium-input"
                        value={fixedReportCategory}
                        onChange={e => setFixedReportCategory(e.target.value)}
                      >
                        <option value="Timed">Report Salary - Timed</option>
                        <option value="Fixed">Report Salary - Fixed</option>
                        <option value="Punch Record">Report Salary - Attendance Punch</option>
                        <option value="Time Card">Time Card</option>
                      </select>
                    </div>

                    <div className="dtr-export-field">
                      <label>Period Type</label>
                      <select
                        className="premium-input"
                        value={fixedReportDateType}
                        onChange={(e) => {
                          const type = e.target.value;
                          setFixedReportDateType(type);
                          const today = new Date();
                          if (type === 'week') {
                            const dayOfWeek = today.getDay();
                            const diff = (dayOfWeek + 7 - 4) % 7;
                            const start = new Date(today);
                            start.setDate(today.getDate() - diff);
                            setFixedReportDateValue(getLocalDateStr(start));
                          } else if (type === 'month') {
                            setFixedReportDateValue(today.toISOString().slice(0, 7));
                          } else if (type === 'day') {
                            setFixedReportDateValue(getLocalDateStr(today));
                          }
                        }}
                      >
                        <option value="week">Specific Week</option>
                        <option value="month">Specific Month</option>
                        <option value="day">Specific Day</option>
                      </select>
                    </div>

                    <div className="dtr-export-field">
                      <label>Select Period</label>
                      {fixedReportDateType === 'week' ? (
                        <CustomWeekPicker
                          value={fixedReportDateValue}
                          onChange={val => setFixedReportDateValue(val)}
                        />
                      ) : (
                        <input
                          type={fixedReportDateType === 'day' ? 'date' : 'month'}
                          className="premium-input"
                          value={fixedReportDateValue}
                          onChange={e => setFixedReportDateValue(e.target.value)}
                        />
                      )}
                    </div>

                    <div className="dtr-export-field">
                      <label>Employee</label>
                      <MultiSelectDropdown
                        options={fixedReportCategory === 'Time Card' || fixedReportCategory === 'Punch Record' ? employees : employees.filter(e => {
                          const eType = e.employee_type || 'Timed';
                          const cat = fixedReportCategory === 'Timed' ? 'Timed' : 'Fixed';
                          return eType === cat;
                        })}
                        selected={fixedReportUsers}
                        onChange={setFixedReportUsers}
                      />
                    </div>
                  </div>

                  {fixedReportCategory !== 'Time Card' && fixedReportCategory !== 'Punch Record' && (
                    <div className="dtr-export-columns-wrap">
                      <div className="dtr-export-columns-title">Include Columns</div>
                      <div className="dtr-export-columns-grid">
                        {[
                          { key: 'name', label: 'Name', defaultTrue: false },
                          { key: 'day', label: 'Day', defaultTrue: true },
                          ...(fixedReportCategory === 'Fixed'
                            ? [
                                { key: 'logInRecord', label: 'Log In Record', defaultTrue: true },
                                { key: 'daysWorked', label: 'Days Worked', defaultTrue: true },
                                { key: 'totalRate', label: 'Total Rate', defaultTrue: true },
                              ]
                            : [
                                { key: 'amIn', label: 'AM IN', defaultTrue: true },
                                { key: 'amOut', label: 'AM OUT', defaultTrue: true },
                                { key: 'pmIn', label: 'PM IN', defaultTrue: true },
                                { key: 'pmOut', label: 'PM OUT', defaultTrue: true },
                                { key: 'totalHrs', label: 'Total Hrs', defaultTrue: false },
                                { key: 'rate', label: 'Rate', defaultTrue: false },
                                { key: 'earnings', label: 'Total Pay', defaultTrue: false },
                              ]),
                        ].map(({ key, label, defaultTrue }) => {
                          const isChecked = defaultTrue ? pdfColumns[key] !== false : Boolean(pdfColumns[key]);
                          return (
                            <label key={key} className={`dtr-export-col-chip ${isChecked ? 'is-checked' : ''}`}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={e => setPdfColumns({ ...pdfColumns, [key]: e.target.checked })}
                              />
                              <span>{label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="dtr-export-salary-footer">
                    <button
                      type="button"
                      className="btn btn-primary dtr-export-action-btn"
                      onClick={handleFixedReportExport}
                    >
                      <Download size={15} /> Export PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Edit/Add Modal */}
      {editModal.isOpen && (() => {
        const isFixed = editModal.employeeType === 'Fixed';
        const isSpecialStatus = ['Absent', 'Leave', 'Holiday', 'Rescheduled'].includes(editModal.status);
        const calcHours = !isFixed
          ? calculateTimedTotalHours(editModal.amIn, editModal.amOut, editModal.pmIn, editModal.pmOut, editModal.dateStr)
          : (parseFloat(editModal.totalHours) || 0);

        return (
          <div className="dtr-modal-overlay">
            <div className={`dtr-modal-content ${isFixed ? 'dtr-modal-fixed' : 'dtr-modal-timed'}`}>
              <div className="dtr-modal-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: 700 }}>
                      {editModal.mode === 'edit' ? 'Edit Record' : 'Add Record'}
                    </h3>
                    <span className={`dtr-modal-type-badge ${isFixed ? 'dtr-modal-type-badge--fixed' : 'dtr-modal-type-badge--timed'}`}>
                      {isFixed ? 'Fixed Employee' : 'Timed Employee'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <strong>{editModal.employeeName}</strong> &bull; {editModal.dateStr}
                  </div>
                </div>
                <button
                  className="btn-icon"
                  type="button"
                  onClick={() => setEditModal({ ...editModal, isOpen: false })}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSaveModal(); }}>
                <div className="dtr-modal-body" style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Status Selection */}
                  <div className="premium-select-group">
                    <label style={{ fontWeight: 600 }}>Status</label>
                    <select
                      className="premium-input"
                      value={editModal.status}
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        let newHours = editModal.totalHours;
                        if (newStatus === 'Leave') {
                          newHours = '10';
                        } else if (newStatus === 'Absent' || newStatus === 'Holiday' || newStatus === 'Rescheduled') {
                          newHours = '0';
                        } else if (newStatus === 'Present') {
                          if (isFixed) {
                            newHours = (!editModal.totalHours || editModal.totalHours === '0' || editModal.totalHours === '0.00') ? '10' : editModal.totalHours;
                          } else {
                            const calculated = calculateTimedTotalHours(editModal.amIn, editModal.amOut, editModal.pmIn, editModal.pmOut, editModal.dateStr);
                            newHours = calculated > 0 ? String(calculated) : (editModal.totalHours === '0' || editModal.totalHours === '0.00' ? '' : editModal.totalHours);
                          }
                        }
                        setEditModal({
                          ...editModal,
                          status: newStatus,
                          totalHours: newHours,
                          isCustomHours: (newStatus === 'Present' && (editModal.totalHours === '0' || editModal.totalHours === '0.00')) ? false : editModal.isCustomHours
                        });
                      }}
                    >
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                      <option value="Leave">Leave</option>
                      <option value="Holiday">Holiday</option>
                      <option value="Rescheduled">Rescheduled</option>
                      {!isFixed && <option value="Missing Timeout">Missing Timeout</option>}
                    </select>
                  </div>

                  {isSpecialStatus && (
                    <div style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      background: editModal.status === 'Absent' ? 'rgba(239, 68, 68, 0.08)' : (editModal.status === 'Rescheduled' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(99, 102, 241, 0.08)'),
                      border: `1px solid ${editModal.status === 'Absent' ? 'rgba(239, 68, 68, 0.2)' : (editModal.status === 'Rescheduled' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(99, 102, 241, 0.2)')}`,
                      fontSize: '0.85rem',
                      color: editModal.status === 'Absent' ? 'var(--danger)' : (editModal.status === 'Rescheduled' ? 'var(--warning, #d97706)' : 'var(--primary)')
                    }}>
                      {editModal.status === 'Leave' && 'Marked as Leave (10 hours default applied). Time punches are not required.'}
                      {editModal.status === 'Absent' && 'Marked as Absent (0 hours). Time punches will be cleared upon saving.'}
                      {editModal.status === 'Holiday' && 'Marked as Holiday (0 hours). Time punches will be cleared upon saving.'}
                      {editModal.status === 'Rescheduled' && 'Marked as Rescheduled. Time punches will be cleared upon saving.'}
                    </div>
                  )}

                  {/* --------------------------------------------------------- */}
                  {/* FIXED EMPLOYEE FORMAT                                     */}
                  {/* --------------------------------------------------------- */}
                  {isFixed ? (
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div className="premium-select-group" style={{ flex: 1 }}>
                        <label style={{ fontWeight: 600, marginBottom: '6px' }}>Log In Time</label>
                        <input
                          type="time"
                          step="1"
                          className="premium-input"
                          style={{ width: '100%' }}
                          value={editModal.amIn !== '-- -- --' ? editModal.amIn : ''}
                          onChange={(e) => setEditModal({ ...editModal, amIn: e.target.value })}
                          disabled={isSpecialStatus}
                        />
                      </div>
                      <div className="premium-select-group" style={{ flex: 1 }}>
                        <label style={{ fontWeight: 600, marginBottom: '6px' }}>Total Hours</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="premium-input"
                          style={{ width: '100%' }}
                          value={editModal.totalHours}
                          onChange={(e) => setEditModal({ ...editModal, totalHours: e.target.value })}
                          disabled={isSpecialStatus}
                          placeholder="10.00"
                        />
                      </div>
                    </div>
                  ) : (
                    /* --------------------------------------------------------- */
                    /* TIMED EMPLOYEE FORMAT                                     */
                    /* --------------------------------------------------------- */
                    <>
                      {/* AM Block (Morning / Lunch Out) */}
                      <div className="dtr-modal-punch-card">
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                          Morning Shift (AM)
                        </div>
                        <div style={{ display: 'flex', gap: '14px' }}>
                          {/* AM IN */}
                          <div className="premium-select-group" style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <label style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem' }}>AM IN</label>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', cursor: isSpecialStatus ? 'default' : 'pointer', margin: 0, fontWeight: '500', color: editModal.amIn === '-- -- --' ? 'var(--warning, #f59e0b)' : 'var(--text-muted)' }}>
                                <input
                                  type="checkbox"
                                  checked={editModal.amIn === '-- -- --'}
                                  onChange={(e) => {
                                    const val = e.target.checked ? '-- -- --' : '';
                                    const newCalculated = calculateTimedTotalHours(val, editModal.amOut, editModal.pmIn, editModal.pmOut, editModal.dateStr);
                                    setEditModal({
                                      ...editModal,
                                      amIn: val,
                                      totalHours: newCalculated > 0 ? String(newCalculated) : '',
                                      isCustomHours: false
                                    });
                                  }}
                                  disabled={isSpecialStatus}
                                />
                                Mispunch
                              </label>
                            </div>
                            {editModal.amIn === '-- -- --' ? (
                              <input type="text" className="premium-input mispunch-input" value="-- -- --" disabled style={{ width: '100%', color: 'var(--text-muted)', textAlign: 'center', letterSpacing: '2px', fontWeight: 700 }} />
                            ) : (
                              <input
                                type="time"
                                step="1"
                                className="premium-input"
                                style={{ width: '100%' }}
                                value={editModal.amIn}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const newCalculated = calculateTimedTotalHours(val, editModal.amOut, editModal.pmIn, editModal.pmOut, editModal.dateStr);
                                  setEditModal({
                                    ...editModal,
                                    amIn: val,
                                    totalHours: newCalculated > 0 ? String(newCalculated) : '',
                                    isCustomHours: false
                                  });
                                }}
                                disabled={isSpecialStatus}
                              />
                            )}
                          </div>

                          {/* AM OUT */}
                          <div className="premium-select-group" style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <label style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem' }}>AM OUT</label>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', cursor: isSpecialStatus ? 'default' : 'pointer', margin: 0, fontWeight: '500', color: editModal.amOut === '-- -- --' ? 'var(--warning, #f59e0b)' : 'var(--text-muted)' }}>
                                <input
                                  type="checkbox"
                                  checked={editModal.amOut === '-- -- --'}
                                  onChange={(e) => {
                                    const val = e.target.checked ? '-- -- --' : '';
                                    const newCalculated = calculateTimedTotalHours(editModal.amIn, val, editModal.pmIn, editModal.pmOut, editModal.dateStr);
                                    setEditModal({
                                      ...editModal,
                                      amOut: val,
                                      totalHours: newCalculated > 0 ? String(newCalculated) : '',
                                      isCustomHours: false
                                    });
                                  }}
                                  disabled={isSpecialStatus}
                                />
                                Mispunch
                              </label>
                            </div>
                            {editModal.amOut === '-- -- --' ? (
                              <input type="text" className="premium-input mispunch-input" value="-- -- --" disabled style={{ width: '100%', color: 'var(--text-muted)', textAlign: 'center', letterSpacing: '2px', fontWeight: 700 }} />
                            ) : (
                              <input
                                type="time"
                                step="1"
                                className="premium-input"
                                style={{ width: '100%' }}
                                value={editModal.amOut}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const newCalculated = calculateTimedTotalHours(editModal.amIn, val, editModal.pmIn, editModal.pmOut, editModal.dateStr);
                                  setEditModal({
                                    ...editModal,
                                    amOut: val,
                                    totalHours: newCalculated > 0 ? String(newCalculated) : '',
                                    isCustomHours: false
                                  });
                                }}
                                disabled={isSpecialStatus}
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* PM Block (Afternoon / Lunch In / Timeout) */}
                      <div className="dtr-modal-punch-card">
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                          Afternoon Shift (PM)
                        </div>
                        <div style={{ display: 'flex', gap: '14px' }}>
                          {/* PM IN */}
                          <div className="premium-select-group" style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <label style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem' }}>PM IN</label>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', cursor: isSpecialStatus ? 'default' : 'pointer', margin: 0, fontWeight: '500', color: editModal.pmIn === '-- -- --' ? 'var(--warning, #f59e0b)' : 'var(--text-muted)' }}>
                                <input
                                  type="checkbox"
                                  checked={editModal.pmIn === '-- -- --'}
                                  onChange={(e) => {
                                    const val = e.target.checked ? '-- -- --' : '';
                                    const newCalculated = calculateTimedTotalHours(editModal.amIn, editModal.amOut, val, editModal.pmOut, editModal.dateStr);
                                    setEditModal({
                                      ...editModal,
                                      pmIn: val,
                                      totalHours: newCalculated > 0 ? String(newCalculated) : '',
                                      isCustomHours: false
                                    });
                                  }}
                                  disabled={isSpecialStatus}
                                />
                                Mispunch
                              </label>
                            </div>
                            {editModal.pmIn === '-- -- --' ? (
                              <input type="text" className="premium-input mispunch-input" value="-- -- --" disabled style={{ width: '100%', color: 'var(--text-muted)', textAlign: 'center', letterSpacing: '2px', fontWeight: 700 }} />
                            ) : (
                              <input
                                type="time"
                                step="1"
                                className="premium-input"
                                style={{ width: '100%' }}
                                value={editModal.pmIn}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const newCalculated = calculateTimedTotalHours(editModal.amIn, editModal.amOut, val, editModal.pmOut, editModal.dateStr);
                                  setEditModal({
                                    ...editModal,
                                    pmIn: val,
                                    totalHours: newCalculated > 0 ? String(newCalculated) : '',
                                    isCustomHours: false
                                  });
                                }}
                                disabled={isSpecialStatus}
                              />
                            )}
                          </div>

                          {/* PM OUT */}
                          <div className="premium-select-group" style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <label style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem' }}>PM OUT</label>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', cursor: isSpecialStatus ? 'default' : 'pointer', margin: 0, fontWeight: '500', color: editModal.pmOut === '-- -- --' ? 'var(--warning, #f59e0b)' : 'var(--text-muted)' }}>
                                <input
                                  type="checkbox"
                                  checked={editModal.pmOut === '-- -- --'}
                                  onChange={(e) => {
                                    const val = e.target.checked ? '-- -- --' : '';
                                    const newCalculated = calculateTimedTotalHours(editModal.amIn, editModal.amOut, editModal.pmIn, val, editModal.dateStr);
                                    setEditModal({
                                      ...editModal,
                                      pmOut: val,
                                      totalHours: newCalculated > 0 ? String(newCalculated) : '',
                                      isCustomHours: false,
                                      status: e.target.checked ? 'Missing Timeout' : (editModal.status === 'Missing Timeout' ? 'Present' : editModal.status)
                                    });
                                  }}
                                  disabled={isSpecialStatus}
                                />
                                Mispunch
                              </label>
                            </div>
                            {editModal.pmOut === '-- -- --' ? (
                              <input type="text" className="premium-input mispunch-input" value="-- -- --" disabled style={{ width: '100%', color: 'var(--text-muted)', textAlign: 'center', letterSpacing: '2px', fontWeight: 700 }} />
                            ) : (
                              <input
                                type="time"
                                step="1"
                                className="premium-input"
                                style={{ width: '100%' }}
                                value={editModal.pmOut}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const newCalculated = calculateTimedTotalHours(editModal.amIn, editModal.amOut, editModal.pmIn, val, editModal.dateStr);
                                  setEditModal({
                                    ...editModal,
                                    pmOut: val,
                                    totalHours: newCalculated > 0 ? String(newCalculated) : '',
                                    isCustomHours: false
                                  });
                                }}
                                disabled={isSpecialStatus}
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Total Hours with Auto-calculation summary */}
                      <div className="premium-select-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ margin: 0, fontWeight: 600 }}>Total Hours</label>
                          {calcHours > 0 && (
                            <button
                              type="button"
                              onClick={() => setEditModal({ ...editModal, totalHours: String(calcHours), isCustomHours: false })}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                cursor: 'pointer',
                                fontSize: '0.78rem',
                                color: 'var(--primary)',
                                fontWeight: 600,
                                textDecoration: 'underline'
                              }}
                            >
                              Auto-calculated: {calcHours.toFixed(2)}h
                            </button>
                          )}
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="premium-input"
                          style={{ width: '100%' }}
                          placeholder={calcHours > 0 ? calcHours.toFixed(2) : "0.00"}
                          value={editModal.totalHours}
                          onChange={(e) => setEditModal({ ...editModal, totalHours: e.target.value, isCustomHours: true })}
                          disabled={isSpecialStatus}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="dtr-modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
                  <div>
                    {editModal.mode === 'edit' && editModal.recordId && (
                      <button
                        type="button"
                        className="btn"
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: 'var(--danger, #ef4444)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          borderRadius: '8px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          const recId = editModal.recordId;
                          setEditModal({ ...editModal, isOpen: false });
                          handleDeleteRecord(recId);
                        }}
                      >
                        <Trash2 size={16} /> Delete Record
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="button" className="btn btn-outline" onClick={() => setEditModal({ ...editModal, isOpen: false })}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" style={{ padding: '8px 22px', fontWeight: 600 }}>
                      Save Record
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Admin Edit Grand Total Modal */}
      {grandTotalModal.isOpen && (
        <div className="dtr-modal-overlay">
          <div className="dtr-modal-content" style={{ maxWidth: '440px' }}>
            <div className="dtr-modal-header">
              <div>
                <h3 className="dtr-modal-title">Edit Grand Total</h3>
                <span className="dtr-modal-subtitle">{grandTotalModal.employeeName}</span>
              </div>
              <button
                type="button"
                className="dtr-modal-close"
                onClick={() => setGrandTotalModal(prev => ({ ...prev, isOpen: false }))}
              >
                <X size={18} />
              </button>
            </div>

            <div className="dtr-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '10px', padding: '12px 16px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Auto-Calculated Total</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>
                  {formatHoursDuration(grandTotalModal.calculatedHours)} ({grandTotalModal.calculatedHours.toFixed(2)}h)
                </div>
              </div>

              <div className="premium-select-group">
                <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Grand Total Hours</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="premium-input"
                  value={grandTotalModal.overrideHours}
                  onChange={(e) => setGrandTotalModal({ ...grandTotalModal, overrideHours: e.target.value })}
                  placeholder="e.g. 40.0"
                  style={{ width: '100%', fontSize: '1.1rem', fontWeight: 700 }}
                  autoFocus
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Formatted: {formatHoursDuration(parseFloat(grandTotalModal.overrideHours) || 0)}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  onClick={() => setGrandTotalModal({ ...grandTotalModal, overrideHours: String(grandTotalModal.calculatedHours) })}
                >
                  Use Auto ({grandTotalModal.calculatedHours}h)
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  onClick={() => setGrandTotalModal({ ...grandTotalModal, overrideHours: '40' })}
                >
                  40h
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  onClick={() => setGrandTotalModal({ ...grandTotalModal, overrideHours: '48' })}
                >
                  48h
                </button>
              </div>
            </div>

            <div className="dtr-modal-footer" style={{ padding: '16px 20px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setGrandTotalModal(prev => ({ ...prev, isOpen: false }))}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '8px 20px', fontWeight: 600 }}
                onClick={saveGrandTotalOverride}
              >
                Save Grand Total
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Detail Modal (Connected to 4 Cards & Date Filter) */}
      <SummaryDetailModal
        isOpen={summaryModal.isOpen}
        onClose={() => setSummaryModal(prev => ({ ...prev, isOpen: false }))}
        initialType={summaryModal.type}
        summaryData={summaryData}
        dtrFilterType={dtrFilterType}
        dtrFilterValue={dtrFilterValue}
        onFilterTypeChange={handleFilterTypeChange}
        onFilterValueChange={val => setDtrFilterValue(val)}
        onGoToToday={handleGoToToday}
        filteredDays={filteredDays}
        formatTime={formatTime}
        formatHoursDuration={formatHoursDuration}
      />
    </div>
  );
};

export default AdminDtrPage;
