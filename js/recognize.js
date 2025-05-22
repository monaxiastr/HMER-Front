document.addEventListener('DOMContentLoaded', () => {
    const basePath = 'http://localhost:5000';
    const recognizePath = basePath + '/api/recognize';

    const imageInput = document.getElementById('imageUpload');
    const previewImage = document.getElementById('previewImage');
    const dropArea = document.getElementById('dropArea');
    const latexCode = document.getElementById('latexCode');
    const mathPreview = document.getElementById('mathPreview');
    const uploadButton = document.getElementById('uploadButton');
    const downloadButton = document.getElementById('downloadButton');
    const loginLink = document.getElementById('loginLink');

    // 顶部导航栏信息
    const username = localStorage.getItem('username');
    if (username) {
        loginLink.textContent = `欢迎 ${username}`;
        loginLink.href = 'profile.html';
    }

    // 图片预览功能
    imageInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                previewImage.src = e.target.result;
                previewImage.classList.remove('d-none');
            };
            reader.readAsDataURL(file);
        }
    });

    // 渲染 LaTeX
    window.renderLatex = async function () {
        const code = latexCode.value;
        mathPreview.innerHTML = `\\[${code}\\]`;
        if (typeof MathJax !== 'undefined') {
            await MathJax.typesetPromise();
        }
    }

    // 实时渲染 LaTeX 预览
    latexCode.addEventListener('input', renderLatex);

    // 复制 LaTeX
    window.copyLatex = function () {
        latexCode.select();
        document.execCommand('copy');
        showAlertModal('提示', 'LaTeX 代码已复制');
    }

    // 上传识别按钮
    uploadButton.addEventListener('click', async function (e) {
        e.preventDefault();

        const file = imageInput.files[0];
        if (!file) {
            showAlertModal('提示', '请先选择或拖曳图片上传');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            showAlertModal('提示', '请先登录！\n3秒后跳转到登录页面...');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        fetch(recognizePath, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token
            },
            body: formData
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

            if (!response.ok) {
                showAlertModal('提示', '识别失败：服务器错误。');
                return;
            }

            const recognized = data.recognized_expression;
            latexCode.value = recognized;
            await renderLatex();
        })
        .catch(error => {
            console.error('网络出错:', error);
            showAlertModal('提示', '网络错误，请检查网络连接或稍后再试。');
        });

    });

    // 拖拽上传功能
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, e => {
            e.preventDefault();
            e.stopPropagation();
            dropArea.classList.add('hover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, e => {
            e.preventDefault();
            e.stopPropagation();
            dropArea.classList.remove('hover');
        });
    });

    dropArea.addEventListener('drop', e => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            imageInput.files = files;
            const changeEvent = new Event('change');
            imageInput.dispatchEvent(changeEvent);
        }
    });

    // 下载图片
    downloadButton.addEventListener('click', async function () {
        // 检查公式是否为空
        const code = latexCode.value.trim();
        if (!code) {
            showAlertModal('提示', '请先上传图片进行识别！');
            return;
        }
        
        // 等待渲染完成
        await renderLatex();

        // svg 转 png
        // 1. 序列化 SVG
        const svgElement = mathPreview.querySelector('svg');
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgElement);

        // 2. 创建 Canvas，尺寸用 SVG 的 viewBox 或 getBBox 来设定
        const bbox = svgElement.getBBox();
        const canvas = document.createElement('canvas');
        canvas.width  = Math.ceil(bbox.width);
        canvas.height = Math.ceil(bbox.height);

        // 3. 用 Canvg 把 SVG 绘制到 Canvas
        const ctx = canvas.getContext('2d');
        const v = await canvg.Canvg.from(ctx, svgString);
        await v.render();

        // 4. 导出为 Blob 并下载
        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'LaTeX_formula.png';
            document.body.appendChild(a);
            a.click();
            // 清理
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }, 'image/png');
    });
});

/*
{
  "message": "Image processed successfully",
  "recognized_expression": "x^2 + y^2 = z^2"
}
*/