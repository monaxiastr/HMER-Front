document.addEventListener('DOMContentLoaded', () => {
    const basePath = 'http://localhost:5000';
    const recognizePath = basePath + '/api/recognize';
    const aiAnalyzePath = basePath + '/api/chat';

    const imageInput = document.getElementById('imageUpload');
    const previewImage = document.getElementById('previewImage');
    const dropArea = document.getElementById('dropArea');
    const latexCode = document.getElementById('latexCode');
    const mathPreview = document.getElementById('mathPreview');
    const toggleButton = document.getElementById('toggleButton');
    const uploadButton = document.getElementById('uploadButton');
    const downloadButton = document.getElementById('downloadButton');
    const loginLink = document.getElementById('loginLink');
    const canvas = document.getElementById('canvas');
    const rubberButton = document.getElementById('rubberButton');
    const clearCanvasButton = document.getElementById('clearCanvasButton');
    const aiAnalyzeResult = document.getElementById('aiAnalyzeResult');

    var pictureFile = null;
    var penClick = false;
    var startAxisX = 0;
    var startAxisY = 0;
    var penWidth = 4;
    var isRubber = false;

    // 顶部导航栏信息
    const username = localStorage.getItem('username');
    if (username) {
        loginLink.textContent = `欢迎 ${username}`;
        loginLink.href = 'profile.html';
    }

    // 图片预览功能
    imageInput.addEventListener('change', function (e) {
        pictureFile = e.target.files[0];
        if (pictureFile) {
            const reader = new FileReader();
            reader.onload = function (e) {
                previewImage.src = e.target.result;
                previewImage.classList.remove('d-none');
            };
            reader.readAsDataURL(pictureFile);
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

    // 切换上传/手写板
    toggleButton.addEventListener('click', function() {
        var uploadArea = document.getElementById('uploadArea');
        var drawingArea = document.getElementById('drawingArea');
        
        if (uploadArea.classList.contains('d-none')) {
            uploadArea.classList.remove('d-none');
            drawingArea.classList.add('d-none');
            toggleButton.textContent = '切换到手写板';

        } else {
            uploadArea.classList.add('d-none');
            drawingArea.classList.remove('d-none');
            toggleButton.textContent = '切换到上传图片';
        }
    });

    // 上传识别按钮
    uploadButton.addEventListener('click', async function (e) {
        e.preventDefault();

        if (!pictureFile) {
            showAlertModal('提示', '请先上传图片/在手写板中绘制公式！');
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
        formData.append('file', pictureFile);

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

    document.getElementById('aiAnalyzeButton').addEventListener('click', async function (e) {
        e.preventDefault();
        const code = latexCode.value;
        console.log(code);
        if (!code) {
            showAlertModal('提示', '请先上传图片进行识别！');
            return;
        }

        aiAnalyzeResult.textContent = '正在分析...';

        fetch(aiAnalyzePath, {
            method: 'POST',
            headers: {'Content-Type': 'application/json' },
            body: JSON.stringify({'message': `${code}$这个公式有什么用?`})
        })
        .then(async response => {
            const data = await response.json();
            if (!response.ok) {
                showAlertModal('提示', '分析失败：服务器错误。');
                return;
            }
            aiAnalyzeResult.textContent = data.response;
        })
        .catch(error => {
            console.error('网络出错:', error);
            showAlertModal('提示', '网络错误，请检查网络连接或稍后再试。');
        });
    });

    // 橡皮擦切换功能
    rubberButton.addEventListener('click', function (e) {
        e.preventDefault();
        isRubber = !isRubber;
        if (isRubber) {
            rubberButton.style.backgroundColor = '#000000';
        } else {
            rubberButton.style.backgroundColor = '#ffffff';
        }
    });

    clearCanvasButton.addEventListener('click', function (e) {
        e.preventDefault();
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    document.getElementById('penWidth4pxButton').addEventListener('click', function (e) {
        e.preventDefault();
        penWidth = 4;
    });

    document.getElementById('penWidth8pxButton').addEventListener('click', function (e) {
        e.preventDefault();
        penWidth = 8;
    });

    document.getElementById('penWidth12pxButton').addEventListener('click', function (e) {
        e.preventDefault();
        penWidth = 12;
    });

    function isCanvasBlank(canvas) {
        var blank = document.createElement('canvas');
        blank.width = canvas.width;
        blank.height = canvas.height;

        return canvas.toDataURL() == blank.toDataURL();
    }

    document.getElementById('createImageButton').addEventListener('click', async function (e) {
        e.preventDefault();
        // 检查canvas是否为空
        if (isCanvasBlank(canvas)) {
            showAlertModal('提示', '请在画布上绘制公式！');
            return;
        }
        // 将 canvas 内容转换为数据URL
        const dataURL = canvas.toDataURL('image/png');

        // 使用 fetch 从数据URL下载图像数据
        const response = await fetch(dataURL);
        const blob = await response.blob();

        // 创建 File 对象
        pictureFile = new File([blob], 'created_image.png', { type: 'image/png' });

        // 可选：将创建的图像显示在预览区域
        previewImage.src = dataURL;
        previewImage.classList.remove('d-none');
    });

    function getPosition(e) {
        const rect = canvas.getBoundingClientRect(); // 获取canvas相对于视口的位置
        let x, y;
        if (e.touches && e.touches.length) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }
        // 适配屏幕缩放
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        x = (x - window.scrollX) * scaleX;
        y = (y - window.scrollY) * scaleY;
        console.log(x, y);
        return { x, y };
    }

    canvas.addEventListener("mousemove", function (e) {
        e.preventDefault();
        if (!penClick) return;
        var ctx = canvas.getContext("2d");
        const {x, y} = getPosition(e);
        const stopAxisX = x;
        const stopAxisY = y;
        if (isRubber) {
            // 橡皮擦功能
            ctx.beginPath();
            ctx.arc(stopAxisX, stopAxisY, penWidth / 2, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff'; // 假设背景色为白色
            ctx.fill();
        } else {
            // 画笔功能
            ctx.beginPath();
            ctx.moveTo(startAxisX, startAxisY);
            ctx.lineTo(stopAxisX, stopAxisY);
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penWidth;
            ctx.lineCap = "round";
            ctx.stroke();
        }

        startAxisX = stopAxisX;
        startAxisY = stopAxisY;
    });


    canvas.addEventListener("mousedown", function (e) {
        e.preventDefault();
        penClick = true;
        const {x, y} = getPosition(e);
        startAxisX = x;
        startAxisY = y;
    });

    canvas.addEventListener("mouseup", function (e) {
        e.preventDefault();
        penClick = false;
    });

    canvas.addEventListener("mouseout", function (e) {
        e.preventDefault();
        penClick = false;
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