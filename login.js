document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    if (appState.data.currentUser) {
        if (appState.data.currentUser.type === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'ref.html';
        }
    }

    const loginForm = document.getElementById('login-form');
    if(loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const code = document.getElementById('login-code').value.trim();
            
            if (code === ADMIN_CODE) {
                appState.loginAsAdmin();
                window.location.href = 'admin.html';
            } else if (appState.loginAsRep(code)) {
                window.location.href = 'ref.html';
            } else {
                showToast('Invalid access code', 'error');
            }
        });
    }
    
    const yearEl = document.getElementById('current-year');
    if(yearEl) yearEl.textContent = new Date().getFullYear();
});
