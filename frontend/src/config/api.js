const API_BASE = import.meta.env.PROD
  ? '/api'
  //: 'http://localhost/ems-new/backend/api';
  : 'http://localhost/DTR/backend/api'; // Update 'DTR' to match your XAMPP htdocs folder name if it's different

export default API_BASE;
