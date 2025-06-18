document.addEventListener('DOMContentLoaded', () => {
    const basePath = 'http://localhost:5000';
    const recognizePath = basePath + '/api/recognize';
    const verifyLatexPath = basePath + '/api/verify-latex';
    const saveHistoryPath = basePath + '/api/save-recognition';
    const calculatePath = basePath + '/api/calculate-latex';
    const aiAnalyzePath = basePath + '/api/chat';

    const imageInput = document.getElementById('imageUpload');
    const previewImage = document.getElementById('previewImage');
    const dropArea = document.getElementById('dropArea');
    const latexCode = document.getElementById('latexCode');
    const mathPreview = document.getElementById('mathPreview');
    const verificationStatus = document.getElementById('verificationStatus');
    const errorMessage = document.getElementById('errorMessage');
    const toggleButton = document.getElementById('toggleButton');
    const uploadButton = document.getElementById('uploadButton');
    const downloadButton = document.getElementById('downloadButton');
    const saveHistoryBtn = document.getElementById('saveHistoryBtn');
    const loginLink = document.getElementById('loginLink');
    const canvas = document.getElementById('canvas');
    const clearCanvasButton = document.getElementById('clearCanvasButton');
    const chatFloatWindow = document.getElementById('chatFloatWindow');
    const aiAnalyzeSession = document.getElementById('aiAnalyzeSession');
    const chatSendBtn = document.getElementById('chatSendBtn');
    const clearChatBtn = document.getElementById('clearChatBtn');

    var pictureFile = null;
    var penWidth = 4;
    var isRubber = false;

    // 顶部导航栏信息
    const username = localStorage.getItem('username');
    if (username) {
        loginLink.textContent = `欢迎 ${username}`;
        loginLink.href = 'profile.html';
    }

    console.image = function (url, scale) {
        const img = new Image()
        img.onload = () => {
            const c = document.createElement('canvas')
            const ctx = c.getContext('2d')
            if (ctx) {
                c.width = img.width
                c.height = img.height
                ctx.fillStyle = "red";
                ctx.fillRect(0, 0, c.width, c.height);
                ctx.drawImage(img, 0, 0)
                const dataUri = c.toDataURL('image/png')

                console.log(`%c sup?` ,
                    `
                    font-size: 1px;
                    padding: ${Math.floor((img.height * scale) / 2)}px ${Math.floor((img.width * scale) / 2)}px;
                    background-image: url(${dataUri});
                    background-repeat: no-repeat;
                    background-size: ${img.width * scale}px ${img.height * scale}px;
                    color: transparent;
                    `
                )
            }
        }
        img.src = url
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
        console.image(URL.createObjectURL(pictureFile), 0.5);

        const token = localStorage.getItem('token');
        if (!token) {
            showAlertModal('提示', '请先登录！\n即将跳转到登录页面...');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
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
                showAlertModal('提示', '登录过期，请重新登录！\n即将跳转到登录页面...');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1000);
                return;
            }

            if (!response.ok) {
                showAlertModal('提示', '识别失败：服务器错误。');
                return;
            }

            const recognized = data.recognized_expression;
            latexCode.value = recognized;
            await renderLatex();

            // 验证 LaTeX 公式
            const verifyResponse = await fetch(verifyLatexPath, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ latex: latexCode.value })
                //body: JSON.stringify({ latex: '\\sqrt{x^^2+y^2}' })
            });
            const verifyData = await verifyResponse.json();

            if (verifyData.valid) {
                errorMessage.style.display = 'none';  // 隐藏错误气泡
            } else {
                verificationStatus.innerHTML = `
                    <button id="errorBtn" class="btn btn-outline-danger" style="margin-top: 15px;">！错误信息</button>
                `;
                
                const safeText = verifyData.error
                    .replace(/^\s*\n/, '')
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/\n/g, '<br>')
                    .replace(/ /g, '&nbsp;');

                const errorBtn = document.getElementById('errorBtn');
                errorBtn.addEventListener('click', () => {
                    errorMessage.innerHTML = `
                        <div style="text-align: right;">
                            <button id="closeMessageButton" style="color: black; background: transparent; border: none; font-size: 16px; cursor: pointer;">
                                &times;
                            </button>
                        </div>${safeText}
                    `;  // 显示错误信息
                    if (!errorMessage.parentNode || errorMessage.parentNode !== document.body) {
                        document.body.appendChild(errorMessage);
                    }

                    errorMessage.style.display = 'block';  // 显示浮动气泡

                    const btnRect = errorBtn.getBoundingClientRect();
                    const scrollY = window.scrollY || window.pageYOffset;
                    const scrollX = window.scrollX || window.pageXOffset;
                    errorMessage.style.top = (btnRect.bottom + scrollY + 5) + 'px';
                    errorMessage.style.left = (btnRect.left + scrollX + btnRect.width/2) + 'px';
                    errorMessage.style.transform = 'translateX(-50%)';
                    
                    const closeMessageBtn = document.getElementById('closeMessageButton');
                    closeMessageBtn.addEventListener('click', () => {
                        errorMessage.style.display = 'none';
                    });
                });
            }
        })
        .catch(error => {
            console.error('网络出错:', error);
            showAlertModal('提示', '网络错误，请检查网络连接或稍后再试。');
        });

    });

    // 保存历史记录按钮
    saveHistoryBtn.addEventListener('click', async function (e) {
        e.preventDefault();

        const file = pictureFile;
        if (!file) {
            showAlertModal('提示', '请先选择或拖曳图片上传');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            showAlertModal('提示', '请先登录！\n即将跳转到登录页面...');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('recognized_expression', latexCode.value);

        fetch(saveHistoryPath, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token
            },
            body: formData
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

            if (!response.ok) {
                showAlertModal('提示', '保存失败：服务器错误。');
                return;
            }

            showAlertModal('提示', '历史记录保存成功！');
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
            pictureFile = files[0];
            const changeEvent = new Event('change');
            imageInput.dispatchEvent(changeEvent);
        }
    });

    const sendMessage = async (message) => {
        chatSendBtn.disabled = true;
        clearChatBtn.disabled = true;
        aiAnalyzeSession.innerHTML += `<div class="mb-2"><strong>用户:</strong> ${message}</div>`; 

        const aiAnalyzeResult = document.createElement('div');
        aiAnalyzeResult.classList.add('mb-2');
        aiAnalyzeResult.innerHTML = '<p>正在分析，请稍候...</p>';
        aiAnalyzeSession.appendChild(aiAnalyzeResult);

        await fetch(aiAnalyzePath, {
            method: 'POST',
            headers: {'Content-Type': 'application/json' },
            body: JSON.stringify({'message': message + "。请用150字以内的篇幅回答。"})
        })
        .then(async response => {
            const data = await response.json();
            if (!response.ok) {
                showAlertModal('提示', '分析失败：服务器错误。');
                return;
            }
            const raw = data.response;
            // const raw = "This is a test message. \\(s=\\frac{at^2}{2}\\)  \\$\\frac{1}{2}x^2+\\frac{1}{2}y^2=\\frac{1}{2}z^2\\$  $$\\frac{1}{2}x^2+\\frac{1}{2}y^2=\\frac{1}{2}z^2$$"
            console.log(raw);
            const text = raw.replace(/\$\$(.*?)\$\$/g, '\\\\[$1\\\\]').replace(/\\\((.*?)\\\)/g, '\\$$$1\\$$');
            console.log(text);
            const html = marked.parse(text);
            console.log(html);
            // 将 HTML 内容插入到 aiAnalyzeResult 中
            aiAnalyzeResult.innerHTML = '<strong>AI助手:</strong>' + html;

            MathJax.typeset([aiAnalyzeResult]);
        })
        .catch(error => {
            console.error('网络出错:', error);
            showAlertModal('提示', '网络错误，请检查网络连接或稍后再试。');
        });
        chatSendBtn.disabled = false;
        clearChatBtn.disabled = false;
    }
    
    document.getElementById('calculateButton').addEventListener('click', async function (e) {
        e.preventDefault();
        if (!latexCode.value) {
            showAlertModal('提示', '请先上传图片进行识别！');
            return;
        }
        await fetch(calculatePath, {
            method: 'POST',
            headers: {'Content-Type': 'application/json' },
            body: JSON.stringify({'latex': latexCode.value.replace('\\', '\\\\')})
        })
        .then(async response => {
            const data = await response.json();
            if (!response.ok) {
                showAlertModal('提示', '分析失败：服务器错误。');
                return;
            }
            if (data.calculable === false) {
                showAlertModal('提示', `无法计算: ${data.error}`);
                return;
            }
            showAlertModal('提示', `计算结果: ${data.result}`);
        })
        .catch(error => {
            console.error('网络出错:', error);
            showAlertModal('提示', '网络错误，请检查网络连接或稍后再试。');
        });
    });

    document.getElementById('aiAnalyzeButton').addEventListener('click', async function (e) {
        e.preventDefault();
        if (aiAnalyzeSession.children.length <= 0) {
            if (!latexCode.value) {
                showAlertModal('提示', '请先上传图片进行识别！');
                return;
            }
            sendMessage(`${latexCode.value}这个算式有什么含义？`);
        }
        chatFloatWindow.classList.remove('d-none');
    });

    chatSendBtn.addEventListener('click', async function (e) {
        e.preventDefault();
        const message = document.getElementById('chatInput').value.trim();
        if (!message) {
            showAlertModal('提示', '请输入消息内容！');
            return;
        }
        sendMessage(message);
    });

    document.getElementById('closeChatBtn').addEventListener('click', function (e) {
        e.preventDefault();
        chatFloatWindow.classList.add('d-none');
    });

    clearChatBtn.addEventListener('click', function (e) {
        e.preventDefault();
        aiAnalyzeSession.innerHTML = '';
    });

    // 橡皮擦切换功能
    document.getElementById('toggleRubberButton').addEventListener('click', function (e) {
        e.preventDefault();
        let icon = document.getElementById('toggleRubberButton').querySelector('i');
        if (isRubber) {
            icon.className = 'fa fa-pencil';
        } else {
            icon.className = 'fa fa-eraser';
        }
        isRubber = !isRubber;
    });

    clearCanvasButton.addEventListener('click', function (e) {
        e.preventDefault();
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    document.getElementById('penWidthSlider').addEventListener('input', function() {
        penWidth = this.value;
        document.getElementById('penWidthValue').textContent = penWidth + 'PX';
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
        
        // 避免透明部分
        const context = canvas.getContext('2d');
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            // 检查是否为空白像素（假设空白像素是完全透明的）
            if (data[i + 3] === 0) { // alpha通道为0表示透明
                data[i] = 255;     // R
                data[i + 1] = 255; // G
                data[i + 2] = 255; // B
                data[i + 3] = 255; // A
            }
        }

        // 将修改后的图像数据重新绘制到画布上
        context.putImageData(imageData, 0, 0);

        // 将 canvas 内容转换为数据URL
        const dataURL = canvas.toDataURL('image/png');

        const byteString = atob(dataURL.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        // 创建 File 对象
        pictureFile = new File([new Blob([ab], { type: 'image/png' })], 'created_image.png', { type: 'image/png' });

        // 将创建的图像显示在预览区域
        const reader = new FileReader();
        reader.onload = function (e) {
            previewImage.src = e.target.result;
            previewImage.classList.remove('d-none');
        };
        reader.readAsDataURL(pictureFile);
    });

    const getMousePosition = (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;    // device pixel ratio
        const scaleY = canvas.height / rect.height;  // device pixel ratio

        return {
            offsetX: (e.clientX - rect.left) * scaleX,
            offsetY: (e.clientY - rect.top) * scaleY
        };
    }

    const mousemove = (e) => {
        e.preventDefault();
        var ctx = canvas.getContext("2d");
        // 画笔功能
        const { offsetX, offsetY } = getMousePosition(e);
        ctx.lineTo(offsetX, offsetY);
        if (isRubber)
            ctx.strokeStyle = "#ffffff";
        else
            ctx.strokeStyle = "#000000";
        ctx.lineWidth = penWidth;
        ctx.lineCap = "round";
        ctx.stroke();
    }

    const mouseenter = (e) => {
        // 从外部回到画布，改变上一点的位置，继续书写
        var ctx = canvas.getContext("2d");
        const { offsetX, offsetY } = getMousePosition(e);
        ctx.moveTo(offsetX, offsetY)
    }

    const mouseup = (e) => {
        e.preventDefault();
        var ctx = canvas.getContext("2d");
        ctx.closePath();
        canvas.removeEventListener('mousemove', mousemove);
        document.removeEventListener('mouseup', mouseup);
        canvas.removeEventListener('mouseenter', mouseenter);
    }

    canvas.addEventListener("mousedown", function (e) {
        e.preventDefault();
        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        const { offsetX, offsetY } = getMousePosition(e);
        ctx.moveTo(offsetX, offsetY);
        canvas.addEventListener('mousemove', mousemove);
        document.addEventListener('mouseup', mouseup);
        canvas.addEventListener('mouseenter', mouseenter);
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

        // 底层 SVG 上 <svg viewBox="x y width height"> 的尺寸
        const svgElement = mathPreview.querySelector('svg');
        const width  = svgElement.clientWidth;
        const height = svgElement.clientHeight;

        // 缩放倍数
        const scale = 2;

        // 新建 Canvas，并按 viewBox 尺寸 * scale 设置像素大小
        const canvas = document.createElement('canvas');
        canvas.width  = Math.ceil(width * scale);
        canvas.height = Math.ceil(height * scale);

        const ctx = canvas.getContext('2d');
        // 按比例放大上下文
        ctx.scale(scale, scale);

        // 确保有 namespace
        if (!svgElement.getAttribute('xmlns')) {
            svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        }

        // 序列化 SVG
        const serializer = new XMLSerializer();
        const svgString  = serializer.serializeToString(svgElement);

        // 用 Canvg 渲染
        const v = await canvg.Canvg.from(ctx, svgString, {
            ignoreDimensions: true,
        });
        await v.render();

        // 导出为 Blob 并下载
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