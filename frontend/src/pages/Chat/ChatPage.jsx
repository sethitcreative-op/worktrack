import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Pencil, Trash2, Check, X } from 'lucide-react';
import axios from 'axios';
import API_BASE from '../../config/api';
import { useNotification } from '../../context/NotificationContext';
import './ChatPage.css';

const ChatPage = () => {
  const { refreshNotifications } = useNotification();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  // Delete confirmation state
  const [deletingId, setDeletingId] = useState(null);

  const messagesEndRef = useRef(null);
  const editInputRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user'));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatActiveStatus = (lastActive) => {
    if (!lastActive) return 'Offline';
    const activeDate = new Date(lastActive.replace(/-/g, '/'));
    const now = new Date();
    const diffMins = Math.floor((now - activeDate) / 60000);
    if (diffMins < 5) return 'Active now';
    if (diffMins < 60) return `Active ${diffMins}m ago`;
    if (diffMins < 1440) return `Active ${Math.floor(diffMins / 60)}h ago`;
    return `Active ${Math.floor(diffMins / 1440)}d ago`;
  };

  const isUserActive = (lastActive) => {
    if (!lastActive) return false;
    const activeDate = new Date(lastActive.replace(/-/g, '/'));
    const diffMins = Math.floor((new Date() - activeDate) / 60000);
    return diffMins < 5;
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (name) => {
    if (!name) return 'linear-gradient(135deg, #6B7280 0%, #374151 100%)';
    const colors = [
      'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
      'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
      'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
      'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // ── Fetch users ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${API_BASE}/employees.php?action=list`);
        if (response.data.status === 'success') {
          const otherUsers = response.data.data.filter(u => u.id !== user?.id);
          setEmployees(otherUsers);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    if (user) fetchUsers();
  }, [user?.id]);

  // ── Unread counts ─────────────────────────────────────────────────────────────
  const fetchUnreadCounts = async () => {
    if (!user) return;
    try {
      const response = await axios.post(`${API_BASE}/chat.php`, {
        action: 'get_unread_counts',
        user_id: user.id,
      });
      if (response.data.status === 'success') {
        const counts = {};
        response.data.data.forEach(item => { counts[item.sender_id] = item.count; });
        setUnreadCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching unread counts:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUnreadCounts();
      const interval = setInterval(fetchUnreadCounts, 5000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  // ── Fetch messages ────────────────────────────────────────────────────────────
  const fetchMessages = async () => {
    if (!selectedEmployee || !user) return;
    try {
      const response = await axios.post(`${API_BASE}/chat.php`, {
        action: 'get_messages',
        user_id: user.id,
        chat_partner_id: selectedEmployee.id,
      });
      if (response.data.status === 'success') {
        setMessages(response.data.messages);
        const hasUnread = response.data.messages.some(
          msg => msg.sender_id == selectedEmployee.id && msg.receiver_id == user.id && parseInt(msg.is_read) === 0
        );
        if (hasUnread) {
          axios.post(`${API_BASE}/chat.php`, {
            action: 'mark_read',
            user_id: user.id,
            chat_partner_id: selectedEmployee.id,
          }).then(() => {
            fetchUnreadCounts();
            if (refreshNotifications) refreshNotifications();
          });
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  useEffect(() => {
    if (selectedEmployee) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedEmployee?.id]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingId !== null && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  // ── Send ──────────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!message.trim() || !user || !selectedEmployee) return;
    const newMessage = {
      action: 'send_message',
      receiver_id: selectedEmployee.id,
      sender_id: user.id,
      sender_name: user.full_name || user.username || 'User',
      sender_role: user.role,
      message: message.trim(),
    };
    const optimisticMsg = { ...newMessage, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, optimisticMsg]);
    setMessage('');
    try {
      const response = await axios.post(`${API_BASE}/chat.php`, newMessage);
      if (response.data.status === 'success') {
        setMessages(prev => {
          const arr = [...prev];
          arr[arr.length - 1] = response.data.data;
          return arr;
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────────
  const startEdit = (msg) => {
    setEditingId(msg.id);
    setEditText(msg.message);
    setDeletingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const saveEdit = async (msgId) => {
    if (!editText.trim()) return;
    const original = messages.find(m => m.id === msgId);
    // Optimistic update
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, message: editText.trim(), is_edited: 1 } : m));
    setEditingId(null);
    setEditText('');
    try {
      const res = await axios.post(`${API_BASE}/chat.php`, {
        action: 'edit_message',
        message_id: msgId,
        sender_id: user.id,
        message: editText.trim(),
      });
      if (res.data.status !== 'success') {
        // Roll back
        setMessages(prev => prev.map(m => m.id === msgId ? original : m));
      }
    } catch (err) {
      console.error('Error editing message:', err);
      setMessages(prev => prev.map(m => m.id === msgId ? original : m));
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────────
  const confirmDelete = (msgId) => {
    setDeletingId(msgId);
    setEditingId(null);
  };

  const cancelDelete = () => setDeletingId(null);

  const executeDelete = async (msgId) => {
    // Optimistic remove with fade class
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, _deleting: true } : m));
    setDeletingId(null);
    setTimeout(async () => {
      setMessages(prev => prev.filter(m => m.id !== msgId));
      try {
        await axios.post(`${API_BASE}/chat.php`, {
          action: 'delete_message',
          message_id: msgId,
          sender_id: user.id,
        });
      } catch (err) {
        console.error('Error deleting message:', err);
        fetchMessages(); // Re-sync on error
      }
    }, 350);
  };

  // ── Render message bubble ─────────────────────────────────────────────────────
  const renderMessage = (msg, index) => {
    const isSent = msg.sender_id == user?.id;
    const isEditing = editingId === msg.id;
    const isConfirmingDelete = deletingId === msg.id;

    return (
      <div
        key={msg.id || index}
        className={`chat-message-wrapper ${isSent ? 'sent-wrapper' : 'received-wrapper'} ${msg._deleting ? 'msg-fade-out' : ''}`}
      >
        {/* Action buttons — only visible for the sender's messages */}
        {isSent && !isEditing && !isConfirmingDelete && (
          <div className="msg-actions">
            <button
              className="msg-action-btn edit-btn"
              title="Edit"
              onClick={() => startEdit(msg)}
            >
              <Pencil size={13} />
            </button>
            <button
              className="msg-action-btn delete-btn"
              title="Delete"
              onClick={() => confirmDelete(msg.id)}
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}

        {/* Delete confirmation inline */}
        {isConfirmingDelete && (
          <div className="delete-confirm-bar">
            <span>Delete this message?</span>
            <button className="confirm-yes-btn" onClick={() => executeDelete(msg.id)}><Trash2 size={12}/> Delete</button>
            <button className="confirm-no-btn" onClick={cancelDelete}><X size={12}/> Cancel</button>
          </div>
        )}

        <div
          className={`chat-message ${isSent ? 'sent' : 'received'} ${msg.receiver_id == user?.id && parseInt(msg.is_read) === 0 ? 'unread-highlight' : ''}`}
        >
          {!isSent && (
            <div className="message-sender">{msg.sender_name}</div>
          )}

          {/* Editing mode */}
          {isEditing ? (
            <div className="edit-inline-wrapper">
              <input
                ref={editInputRef}
                className="edit-inline-input"
                value={editText}
                onChange={e => setEditText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') saveEdit(msg.id);
                  if (e.key === 'Escape') cancelEdit();
                }}
                maxLength={2000}
              />
              <div className="edit-inline-actions">
                <button className="edit-save-btn" onClick={() => saveEdit(msg.id)} title="Save"><Check size={14}/></button>
                <button className="edit-cancel-btn" onClick={cancelEdit} title="Cancel"><X size={14}/></button>
              </div>
            </div>
          ) : (
            <p>{msg.message}</p>
          )}

          <span className="message-time">
            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {parseInt(msg.is_edited) === 1 && <em className="edited-label"> · edited</em>}
          </span>
        </div>
      </div>
    );
  };

  // ── JSX ───────────────────────────────────────────────────────────────────────
  return (
    <div className="page-container chat-page-container">
      <div className="page-header">
        <h1 className="page-title">Messages</h1>
        <p className="page-subtitle">Select a colleague to start a conversation.</p>
      </div>

      <div className="chat-layout">
        {/* Sidebar */}
        <div className="chat-sidebar">
          <h3 className="chat-sidebar-title">Directory</h3>
          <div className="employee-list">
            {employees.map(emp => (
              <div
                key={emp.id}
                className={`employee-item ${selectedEmployee?.id === emp.id ? 'active' : ''}`}
                onClick={() => setSelectedEmployee(emp)}
              >
                <div
                  className="employee-avatar"
                  style={{ background: emp.profile_picture ? 'none' : getAvatarColor(emp.full_name || emp.username) }}
                >
                  {emp.profile_picture ? (
                    <img
                      src={
                        emp.profile_picture.startsWith('http') || emp.profile_picture.startsWith('data:image')
                          ? emp.profile_picture
                          : emp.profile_picture.startsWith('img/')
                          ? `/${emp.profile_picture}`
                          : `${API_BASE.replace('/api', '')}/${emp.profile_picture}`
                      }
                      alt="avatar"
                    />
                  ) : (
                    <span className="avatar-initials">{getInitials(emp.full_name || emp.username)}</span>
                  )}
                </div>
                <div className="employee-details">
                  <span className="employee-name">
                    {emp.full_name || emp.username}
                    {isUserActive(emp.last_active) && <span className="active-dot-inline" title="Active now"></span>}
                  </span>
                  <span className="employee-role">{emp.role?.toLowerCase() === 'admin' ? 'Administrator' : 'Employee'}</span>
                </div>
                {unreadCounts[emp.id] > 0 && (
                  <span className="employee-unread-badge">{unreadCounts[emp.id]}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main chat area */}
        <div className="chat-main">
          {!selectedEmployee ? (
            <div className="chat-placeholder">
              <div className="placeholder-illustration">
                <User size={64} className="placeholder-icon" />
              </div>
              <h2>Your Messages</h2>
              <p>Select a colleague from the directory to start a conversation.</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="chat-header">
                <div
                  className="chat-header-avatar"
                  style={{ background: selectedEmployee.profile_picture ? 'none' : getAvatarColor(selectedEmployee.full_name || selectedEmployee.username) }}
                >
                  {selectedEmployee.profile_picture ? (
                    <img
                      src={
                        selectedEmployee.profile_picture.startsWith('http') || selectedEmployee.profile_picture.startsWith('data:image')
                          ? selectedEmployee.profile_picture
                          : selectedEmployee.profile_picture.startsWith('img/')
                          ? `/${selectedEmployee.profile_picture}`
                          : `${API_BASE.replace('/api', '')}/${selectedEmployee.profile_picture}`
                      }
                      alt="avatar"
                    />
                  ) : (
                    <span className="avatar-initials">{getInitials(selectedEmployee.full_name || selectedEmployee.username)}</span>
                  )}
                </div>
                <div className="chat-header-info">
                  <span className="chat-title">{selectedEmployee.full_name || selectedEmployee.username}</span>
                  <span className={`chat-status ${isUserActive(selectedEmployee.last_active) ? 'status-active' : 'status-offline'}`}>
                    {formatActiveStatus(selectedEmployee.last_active)}
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div className="chat-body">
                <div className="chat-messages">
                  {messages.length === 0 ? (
                    <div className="chat-message received">
                      <p>Hello! How can we help you today?</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => renderMessage(msg, index))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Footer */}
              <div className="chat-footer">
                <div className="chat-input-wrapper">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    className="chat-input"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                  />
                  <button className="chat-send-btn" onClick={handleSend}>
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
