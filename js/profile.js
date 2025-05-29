document.addEventListener('DOMContentLoaded', () => {
    const loginLink = document.getElementById('loginLink');
    const username = localStorage.getItem('username');
    const email = localStorage.getItem('email');
    const logoutButton = document.getElementById('logoutButton');
    const changePasswordForm = document.getElementById('changePasswordForm');
    
    // 顶部导航栏信息
    if (username) {
        loginLink.textContent = `欢迎 ${username}`;
        loginLink.href = 'profile.html';
        document.getElementById('username').textContent = username;
        document.getElementById('email').textContent = email;
    }

    // 退出登录功能
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('email');
        window.location.href = 'login.html';
    });

    // 修改密码功能
    changePasswordForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // 简单的密码验证
        if (newPassword !== confirmPassword) {
            showAlertModal('提示', '新密码和确认密码不一致！');
            return;
        }

        if (currentPassword && newPassword) {
            // 进行密码更改的操作
            /* 
             * ......
             */
            showAlertModal('提示', '密码已修改！');
            $('#changePasswordModal').modal('hide');
        } else {
            showAlertModal('提示', '请输入有效密码信息！');
        }
    });
});