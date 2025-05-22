document.addEventListener('DOMContentLoaded', () => {
    const basePath = 'http://localhost:5000';
    const form = document.getElementById('loginForm');

    form.addEventListener('submit', function (e) {
        e.preventDefault(); // 阻止默认提交行为

        // 获取表单输入值
        const username = form.querySelector("input[name='text']").value.trim();
        const password = form.querySelector("input[name='password']").value.trim();

        // 发送 POST 请求到 Flask 后端
        const loginPath = basePath + '/api/login';
        fetch(loginPath, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        })
        .then(async response => {
            const data = await response.json();
            if (response.ok) {
                showAlertModal('提示', '登录成功！3秒后跳转...');
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', data.user.username);
                setTimeout(() => {
                    window.location.href = '/recognize.html';
                }, 3000);
            } else {
                showAlertModal('提示', '登录失败：用户名或密码错误');
            }
        })
        .catch(error => {
            console.error('网络出错:', error);
            showAlertModal('提示', '网络错误，请检查网络连接或稍后再试。');
        });
    });
});

// Example:
/*
{
    "username":"testuser",
    "password":"password123"
}
*
{
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJleHAiOjE3NDg3NjEzNjl9.rG5NqvQhlXllpT-42MnUDTzYRMGM0E8Kl7CJ--kDKbQ",
    "user": {
        "email": "test@example.com",
        "id": 1,
        "username": "testuser"
    }
}
*/