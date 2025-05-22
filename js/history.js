document.addEventListener('DOMContentLoaded', () => {
    const basePath = 'http://localhost:5000';
    const historyPath = basePath + '/api/history';

    const loginLink = document.getElementById('loginLink');
    const historyList = document.getElementById('historyList');
    const token = localStorage.getItem('token');

    // 验证是否登录
    if (!token) {
        showAlertModal('提示', '尚未登录！\n3秒后跳转到登录页面...');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 3000);
        return;
    }

    // 获取历史记录
    fetch(historyPath, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
    .then(async response => {
        const data = await response.json();
        if (response.status === 401) {
            showAlertModal('提示', '登录过期，请重新登录！\n跳转到登录页面...');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);
            return;
        }

        // 没有历史记录
        if (!response.ok) {
            showAlertModal('提示', '当前没有历史记录');
            return;
        }
    })

    // 顶部导航栏信息
    const username = localStorage.getItem('username');
    if (username) {
        loginLink.textContent = `欢迎 ${username}`;
        loginLink.href = 'profile.html';
    }
});