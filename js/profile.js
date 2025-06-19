document.addEventListener('DOMContentLoaded', () => {
    const basePath = 'https://hmer.recitewords.cn';
    const changePwdPath = basePath + '/api/change-password';

    const loginLink = document.getElementById('loginLink');
    const username = localStorage.getItem('username');
    const email = localStorage.getItem('email');
    const token = localStorage.getItem('token');
    const logoutButton = document.getElementById('logoutButton');
    const changePasswordForm = document.getElementById('changePasswordForm');
    
    // 验证是否登录
    if (!token) {
        showAlertModal('提示', '尚未登录！\n即将跳转到登录页面...');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
        return;
    }

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
        if (newPassword === currentPassword) {
            showAlertModal('提示', '新密码和旧密码不能相同！');
            return;
        }

        if (currentPassword && newPassword) {
            // 进行密码更改的操作
            fetch(changePwdPath, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({
                    old_password: currentPassword,
                    new_password: newPassword
                })
            })
            .then(async response => {
                const data = await response.json();
                if (response.ok) {
                    showAlertModal('提示', '密码修改成功！');
                } else {
                    showAlertModal('提示', '旧密码不正确，修改失败！');
                    return;
                }
            })
            .catch(error => {
                console.error('网络出错:', error);
                showAlertModal('提示', '网络错误，请检查网络连接或稍后再试。');
            });

            $('#changePasswordModal').modal('hide');
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        } else {
            showAlertModal('提示', '请输入有效密码信息！');
        }
    });
});