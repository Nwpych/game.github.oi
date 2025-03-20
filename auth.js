// Authentication functions for 吃货球球

// DOM Elements
const authBtn = document.getElementById('authBtn');
const logoutBtn = document.getElementById('logoutBtn');
const authModal = document.getElementById('authModal');
const authTitle = document.getElementById('authTitle');
const authMessage = document.getElementById('authMessage');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authSwitchBtn = document.getElementById('authSwitchBtn');
const authCloseBtn = document.getElementById('authCloseBtn');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

// Auth state
let isRegistering = true;

// Check if user is logged in
function isLoggedIn() {
    return !!localStorage.getItem('authToken');
}

// Update UI based on auth state
function updateAuthUI() {
    if (isLoggedIn()) {
        authBtn.classList.add('hidden');
        logoutBtn.classList.remove('hidden');
        
        // Enable the submit score button if it exists
        const submitScoreBtn = document.getElementById('submitScoreBtn');
        if (submitScoreBtn) {
            submitScoreBtn.disabled = false;
            submitScoreBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            submitScoreBtn.textContent = "提交分数";
        }
    } else {
        authBtn.classList.remove('hidden');
        logoutBtn.classList.add('hidden');
        
        // Disable the submit score button if it exists
        const submitScoreBtn = document.getElementById('submitScoreBtn');
        if (submitScoreBtn) {
            submitScoreBtn.disabled = true;
            submitScoreBtn.classList.add('opacity-50', 'cursor-not-allowed');
            submitScoreBtn.textContent = "请先登录后提交分数";
        }
    }
}

// Show auth modal
function showAuthModal() {
    authModal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    
    // Update title and button text based on auth mode
    if (isRegistering) {
        authTitle.textContent = '注册';
        authSubmitBtn.textContent = '注册';
        authSwitchBtn.textContent = '已有账号？登录';
    } else {
        authTitle.textContent = '登录';
        authSubmitBtn.textContent = '登录';
        authSwitchBtn.textContent = '没有账号？注册';
    }
    
    // Clear previous inputs and messages
    usernameInput.value = '';
    passwordInput.value = '';
    authMessage.classList.add('hidden');
}

// Hide auth modal
function hideAuthModal() {
    authModal.classList.add('hidden');
    document.body.classList.remove('modal-open');
}

// Handle registration
function register(username, password) {
    if (!username || !password) {
        showAuthError("用户名和密码不能为空");
        return;
    }
    
    // API request to register
    fetch('/api/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Registration successful, switch to login mode automatically
            isRegistering = false;
            showAuthMessage("注册成功！请登录", "success");
            
            // Update UI
            authTitle.textContent = '登录';
            authSubmitBtn.textContent = '登录';
            authSwitchBtn.textContent = '没有账号？注册';
        } else {
            showAuthError(data.message || "注册失败");
        }
    })
    .catch(error => {
        console.error("Registration error:", error);
        showAuthError("网络错误，请重试");
    });
}

// Handle login
function login(username, password) {
    if (!username || !password) {
        showAuthError("用户名和密码不能为空");
        return;
    }
    
    // API request to login
    fetch('/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Store token
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('username', data.username);
            
            // Update UI
            updateAuthUI();
            hideAuthModal();
        } else {
            showAuthError(data.message || "登录失败");
        }
    })
    .catch(error => {
        console.error("Login error:", error);
        showAuthError("网络错误，请重试");
    });
}

// Handle logout
function logout() {
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    
    // Update UI
    updateAuthUI();
}

// Show error message in auth modal
function showAuthError(message) {
    authMessage.textContent = message;
    authMessage.classList.remove('hidden', 'text-green-500');
    authMessage.classList.add('text-red-500');
}

// Show success message in auth modal
function showAuthMessage(message, type = 'error') {
    authMessage.textContent = message;
    authMessage.classList.remove('hidden');
    
    if (type === 'success') {
        authMessage.classList.remove('text-red-500');
        authMessage.classList.add('text-green-500');
    } else {
        authMessage.classList.remove('text-green-500');
        authMessage.classList.add('text-red-500');
    }
}

// Event Listeners
authBtn.addEventListener('click', () => {
    showAuthModal();
});

logoutBtn.addEventListener('click', () => {
    logout();
});

authCloseBtn.addEventListener('click', () => {
    hideAuthModal();
});

authSwitchBtn.addEventListener('click', () => {
    // Toggle between register and login modes
    isRegistering = !isRegistering;
    
    if (isRegistering) {
        authTitle.textContent = '注册';
        authSubmitBtn.textContent = '注册';
        authSwitchBtn.textContent = '已有账号？登录';
    } else {
        authTitle.textContent = '登录';
        authSubmitBtn.textContent = '登录';
        authSwitchBtn.textContent = '没有账号？注册';
    }
    
    // Clear inputs and error message
    usernameInput.value = '';
    passwordInput.value = '';
    authMessage.classList.add('hidden');
});

authSubmitBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (isRegistering) {
        register(username, password);
    } else {
        login(username, password);
    }
});

// Close modal when clicking outside
authModal.addEventListener('click', (e) => {
    if (e.target === authModal) {
        hideAuthModal();
    }
});

// Initialize auth UI
window.addEventListener('load', () => {
    updateAuthUI();
    
    // Mock API responses for testing
    // This would be replaced with actual API calls in production
    // For demo purposes, we'll simulate API behavior
    
    // Mock registration and login APIs
    const mockUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');
    
    // Override the fetch function to handle our mock APIs
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        if (url === '/api/auth/register') {
            return mockRegister(JSON.parse(options.body));
        } else if (url === '/api/auth/login') {
            return mockLogin(JSON.parse(options.body));
        } else if (url === '/api/scores' && options.method === 'POST') {
            return mockSubmitScore(options);
        } else if (url === '/api/scores' && (!options || options.method === 'GET')) {
            return mockGetLeaderboard();
        }
        
        return originalFetch(url, options);
    };
    
    // Mock register API
    function mockRegister(data) {
        const { username, password } = data;
        
        // Check if username already exists
        const userExists = mockUsers.some(user => user.username === username);
        
        if (userExists) {
            return Promise.resolve({
                json: () => Promise.resolve({
                    success: false,
                    message: "用户名已存在"
                })
            });
        }
        
        // Add new user
        mockUsers.push({ username, password });
        localStorage.setItem('mockUsers', JSON.stringify(mockUsers));
        
        return Promise.resolve({
            json: () => Promise.resolve({
                success: true,
                message: "注册成功",
                username
            })
        });
    }
    
    // Mock login API
    function mockLogin(data) {
        const { username, password } = data;
        
        // Find user
        const user = mockUsers.find(user => user.username === username && user.password === password);
        
        if (!user) {
            return Promise.resolve({
                json: () => Promise.resolve({
                    success: false,
                    message: "用户名或密码错误"
                })
            });
        }
        
        // Generate mock token
        const token = `mock-token-${username}-${Date.now()}`;
        
        return Promise.resolve({
            json: () => Promise.resolve({
                success: true,
                message: "登录成功",
                token,
                username
            })
        });
    }
});
