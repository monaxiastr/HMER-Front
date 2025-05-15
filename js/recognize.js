document.addEventListener('DOMContentLoaded', () => {

    const imageInput = document.getElementById('imageUpload');
    const previewImage = document.getElementById('previewImage');
    const dropArea = document.getElementById('dropArea');
    const latexCode = document.getElementById('latexCode');
    const mathPreview = document.getElementById('mathPreview');
    const uploadButton = document.getElementById('uploadButton');

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
    window.renderLatex = function () {
        const code = latexCode.value;
        mathPreview.innerHTML = `\\[${code}\\]`;
        if (typeof MathJax !== "undefined") {
            MathJax.typeset();
        }
    }

    // 复制 LaTeX
    window.copyLatex = function () {
        latexCode.select();
        document.execCommand('copy');
        alert('LaTeX 代码已复制');
    }

    // 模拟识别按钮（你可以替换为实际 API 调用）
    uploadButton.addEventListener('click', function (e) {
        e.preventDefault();
        const fakeLatex = '\\sum_{i=0}^{n-1}\\sum_{j=0}^{m-1}\\frac{\\int_{0}^{\\pi}f_{i}(t)f_{j}(t)dt}{g_{j}(i)+g_{i}(j)}';
        latexCode.value = fakeLatex;
        renderLatex();
    });

    // 拖拽上传功能
    ;['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, e => {
            e.preventDefault();
            e.stopPropagation();
            dropArea.classList.add('hover');
        });
    });

    ;['dragleave', 'drop'].forEach(eventName => {
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

});
