document.addEventListener('DOMContentLoaded', function () {
    const basePath = 'http://localhost:5000';
    const form = document.getElementById('registerForm');

    form.addEventListener('submit', function (e) {
        e.preventDefault(); // 阻止默认提交行为

        // 获取表单输入值
        const username = form.querySelector("input[name='text']").value.trim();
        const email = form.querySelector("input[name='email']").value.trim();
        const password = form.querySelector("input[name='password']").value.trim();
        const confirmPassword = form.querySelector("input[name='confirmPassword']").value.trim();

        // 检查两次输入的密码
        if (password !== confirmPassword) {
            showAlertModal('提示', '注册失败，两次输入的密码不一致！');
            return;
        }

        // 发送 POST 请求到 Flask 后端
        const loginPath = basePath + '/api/register';
        fetch(loginPath, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                email: email,
                password: password
            })
        })
        .then(async response => {
            const data = await response.json();
            if (response.ok) {
                showAlertModal('提示', '注册成功！即将跳转...');
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 1000);
            } else {
                showAlertModal('提示', '注册失败，用户名已存在！');
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
    "username": "jack",
    "email": "jack@example.com",
    "password": "jack123"
}
{
    "username": "tom",
    "email": "tom@example.com",
    "password": "tom123"
}
{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
}
*
{
    "message": "User registered successfully"
}
*/