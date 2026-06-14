const getApiBase = () => {
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE;
  }
  if (typeof window !== 'undefined' && window.location) {
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return 'https://kdn-backend.onrender.com/api';
    }
  }
  return 'http://localhost:5000/api';
};

const API_BASE = getApiBase();

// Intercepts and sets up request parameters
const request = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  
  // Set headers
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  
  // Inject client token if present
  const token = localStorage.getItem('kdn_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Inject secret admin token if calling secret endpoints or flyers
  const secretToken = localStorage.getItem('kdn_secret_token');
  const isSuperAdminPath = typeof window !== 'undefined' && 
    (window.location.pathname === '/secret-gatekeeper' || window.location.pathname === (import.meta.env.VITE_SUPER_ADMIN_PATH || '/dev-super-admin-portal-xyz'));

  if (secretToken && (endpoint.startsWith('/secret') || endpoint.startsWith('/flyers')) && (isSuperAdminPath || !token)) {
    headers['Authorization'] = `Bearer ${secretToken}`;
  }

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, config);
    
    // Check if the website has been shut down
    if (response.status === 503) {
      const data = await response.json();
      if (data.maintenance) {
        // Broadcast custom event for site shutdown
        window.dispatchEvent(new CustomEvent('kdn-maintenance-triggered'));
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err.message);
    throw err;
  }
};

export const api = {
  // Authentication
  auth: {
    login: (email, password, otp) => request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, otp })
    }),
    register: (username, email, password, role = 'customer', otp, phone) => request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, role, otp, phone })
    }),
    requestRegisterOtp: (email) => request('/auth/register/request-otp', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),
    getProfile: () => request('/auth/profile')
  },

  // Badminton Bookings
  bookings: {
    getByDate: (date) => request(`/bookings?date=${date}`),
    create: (bookingData) => request('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData)
    }),
    pay: (id) => request(`/bookings/${id}/pay`, {
      method: 'PUT'
    }),
    cancel: (id) => request(`/bookings/${id}`, {
      method: 'DELETE'
    })
  },

  // Gym Membership
  gym: {
    getMember: () => request('/gym/member'),
    register: (tier, price, paymentStatus = 'Paid') => request('/gym/register', {
      method: 'POST',
      body: JSON.stringify({ tier, price, paymentStatus })
    }),
    getAll: () => request('/gym/all'),
    updateStatus: (id, statusData) => request(`/gym/member/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData)
    }),
    delete: (id) => request(`/gym/member/${id}`, {
      method: 'DELETE'
    })
  },

  // Supplement Catalog
  products: {
    getAll: () => request('/products'),
    getDetails: (id) => request(`/products/${id}`),
    create: (productData) => request('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    }),
    update: (id, productData) => request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    }),
    delete: (id) => request(`/products/${id}`, {
      method: 'DELETE'
    })
  },

  // Store Orders
  orders: {
    create: (orderData) => request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    }),
    getMyOrders: () => request('/orders/my-orders'),
    getAll: () => request('/orders/all'),
    updateStatus: (id, statusData) => request(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData)
    }),
    delete: (id) => request(`/orders/${id}`, {
      method: 'DELETE'
    })
  },

  // Physiotherapy Bookings
  physio: {
    getAll: () => request('/physio'),
    getMy: () => request('/physio/my'),
    create: (bookingData) => request('/physio', {
      method: 'POST',
      body: JSON.stringify(bookingData)
    }),
    updateStatus: (id, statusData) => request(`/physio/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData)
    })
  },

  // Secret Admin (Master Shutdown Control)
  secret: {
    checkShutdown: () => request('/secret/status'),
    requestOtp: (email) => request('/secret/request-otp', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),
    verifyOtp: (email, otp) => request('/secret/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp })
    }),
    toggleShutdown: (shutdown) => request('/secret/toggle-shutdown', {
      method: 'POST',
      body: JSON.stringify({ shutdown })
    }),
    getUsers: () => request('/secret/users'),
    updateUserStatus: (id, isActive) => request(`/secret/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isActive })
    })
  },

  // Promotional Flyers Management
  flyers: {
    getAll: () => request('/flyers'),
    create: (flyerData) => request('/flyers', {
      method: 'POST',
      body: JSON.stringify(flyerData)
    }),
    delete: (id) => request(`/flyers/${id}`, {
      method: 'DELETE'
    })
  }
};
