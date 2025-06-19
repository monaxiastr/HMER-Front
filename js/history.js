document.addEventListener('DOMContentLoaded', () => {
    const basePath = 'https://hmer.recitewords.cn';
    const historyPath = basePath + '/api/history';

    const loginLink = document.getElementById('loginLink');
    const historyList = document.getElementById('historyList');
    const refreshBtn = document.getElementById('refreshBtn');
    const token = localStorage.getItem('token');

    // 验证是否登录
    if (!token) {
        showAlertModal('提示', '尚未登录！\n即将跳转到登录页面...');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
        return;
    }

    // 顶部导航栏信息
    const username = localStorage.getItem('username');
    if (username) {
        loginLink.textContent = `欢迎 ${username}`;
        loginLink.href = 'profile.html';
    }

    async function loadHistory() {
        historyList.innerHTML = '<p class="text-muted text-center">加载中...</p>';

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
                showAlertModal('提示', '登录过期，请重新登录！\n即将跳转到登录页面...');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1000);
                return;
            }

            // 没有历史记录
            if (!response.ok) {
                showAlertModal('提示', '当前没有历史记录');
                historyList.innerHTML = `
                    <div class="text-center text-muted">
                        <img src="img/history-img/no-history.jpg" alt="无历史记录" class="img-fluid mb-3" style="max-width: 200px;">
                        <p>暂无历史记录</p>
                    </div>
                `;
                return;
            }

            const history = data.history;
            const row = document.createElement('div');
            row.className = 'row';

            historyList.innerHTML = '';
            history.forEach(record => {
                const card = document.createElement('div');
                card.className = 'col-md-6 mb-3';

                card.innerHTML = `
                    <div class="card history-card shadow-sm h-100">
                        <div class="card-body d-flex">
                            <img src="${record.image_url}" alt="公式图像" class="img-thumbnail mr-3"
                                style="max-width: 100px; max-height: 100px; object-fit: contain; cursor: pointer;">
                            <div>
                                <p class="mb-1">ID：${record.id}</p>
                                <p class="mb-1"><strong>识别时间：</strong>${record.created_at}</p>
                                <p class="mb-1"><strong>识别结果：</strong><span class="latex-preview">\\[${record.recognized_expression}\\]</span></p>
                            </div>
                            <button class="btn delete-btn ml-auto" data-id="${record.id}" title="删除">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                    </div>
                `;

                row.appendChild(card);
            });

            historyList.appendChild(row);

            if (typeof MathJax !== 'undefined') {
                await MathJax.typesetPromise();
            }

            // 为删除按钮添加事件监听
            const deleteButtons = document.querySelectorAll('.delete-btn');
            deleteButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const recordId = e.currentTarget.getAttribute('data-id');
                    console.log(recordId);
                    showDeleteModal(recordId);
                });
            });

            // 添加图片点击预览事件
            const previewImages = document.querySelectorAll('.history-card img');
            previewImages.forEach(img => {
                img.addEventListener('click', () => {
                    const src = img.getAttribute('src');
                    const preview = document.getElementById('previewImage');
                    preview.setAttribute('src', src);
                    $('#imagePreviewModal').modal('show');
                });
            });

        })
        .catch(error => {
            historyList.innerHTML = '<p class="text-danger text-center">获取历史记录失败，请稍后再试。</p>';
        });
    }

    function showDeleteModal(recordId) {
        // 设置模态框内容
        const modal = $('#deleteModal');
        const confirmBtn = modal.find('.btn-confirm');
        const cancelBtn = modal.find('.btn-cancel');

        // 打开模态框
        modal.modal('show');

        // 确认删除
        confirmBtn.off('click').on('click', () => {
            deleteHistory(recordId);
            modal.modal('hide');
        });

        // 取消删除
        cancelBtn.off('click').on('click', () => {
            modal.modal('hide');
        });
    }

    // 删除历史记录
    function deleteHistory(recordId) {
        fetch(`${historyPath}/${recordId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        })
        .then(response => {
            if (response.ok) {
                showAlertModal('提示', '删除成功！');
                loadHistory(); // 重新加载历史记录
            } else {
                showAlertModal('错误', '删除失败，请稍后再试！');
            }
        })
        .catch(error => {
            showAlertModal('错误', '删除失败！请检查网络或稍后再试...');
        });
    }

    loadHistory();

    refreshBtn.addEventListener('click', loadHistory);
});