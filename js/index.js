document.addEventListener('DOMContentLoaded', () => {

    const loginLink = document.getElementById('loginLink');
    
    // 顶部导航栏信息
    const username = localStorage.getItem('username');
    if (username) {
        loginLink.textContent = `欢迎 ${username}`;
        loginLink.href = 'profile.html';
    }
});