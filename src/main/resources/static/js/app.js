const fileInput = document.getElementById('fileInput');
    const fileInputLabel = document.getElementById('fileInputLabel');
    const uploadForm = document.getElementById('uploadForm');
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadBtnText = document.getElementById('uploadBtnText');
    const uploadMessage = document.getElementById('uploadMessage');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('progressBar');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    
    const downloadForm = document.getElementById('downloadForm');
    const downloadBtn = document.getElementById('downloadBtn');
    const downloadBtnText = document.getElementById('downloadBtnText');
    const downloadMessage = document.getElementById('downloadMessage');
    const codeInput = document.getElementById('codeInput');

    // File size formatter
    function formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Show message helper (for download messages only)
    function showMessage(element, message, isSuccess = true) {
      element.className = `mt-6 p-4 rounded-xl ${isSuccess ? 'bg-green-500/20 border border-green-500/30 text-green-400' : 'bg-red-500/20 border border-red-500/30 text-red-400'}`;
      element.textContent = message;
      element.classList.remove('hidden');

      // Only auto-hide download messages, not upload messages
      if (element === downloadMessage) {
        setTimeout(() => {
          element.classList.add('hidden');
        }, 5000);
      }
    }

    // File input change handler
    fileInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        updateFileInputLabel(file);
      }
    });

    function updateFileInputLabel(file) {
      fileInputLabel.innerHTML = `
        <svg class="w-10 h-10 mx-auto mb-3 text-gemini-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <p class="text-gemini-blue font-medium">${file.name}</p>
        <p class="text-gemini-gray text-sm mt-1">${formatFileSize(file.size)}</p>
      `;
    }

    // Drag and drop functionality
    const dropZone = fileInputLabel.parentElement;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
      dropZone.classList.add('border-gemini-blue');
      dropZone.style.borderColor = '#4285f4';
      dropZone.style.backgroundColor = 'rgba(66, 133, 244, 0.1)';
    }

    function unhighlight() {
      dropZone.classList.remove('border-gemini-blue');
      dropZone.style.borderColor = '';
      dropZone.style.backgroundColor = '';
    }

    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
      const dt = e.dataTransfer;
      const files = dt.files;
      
      if (files.length > 0) {
        fileInput.files = files;
        updateFileInputLabel(files[0]);
      }
    }

    // Upload form handler
    uploadForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      const file = fileInput.files[0];
      if (!file) {
        showMessage(uploadMessage, 'Please select a file to upload', false);
        return;
      }

      uploadBtn.disabled = true;
      uploadBtn.innerHTML = `<div class="spinner"></div><span>Uploading...</span>`;

      fileName.textContent = file.name;
      fileSize.textContent = formatFileSize(file.size);
      uploadProgress.classList.remove('hidden');

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("http://localhost:8080/upload", {
          method: "POST",
          body: formData
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const result = await response.json(); // backend should return { code: 12345 }
        progressBar.style.width = '100%';
        showMessage(uploadMessage, `File uploaded successfully! Your file code is: ${result.code}`, true);

      } catch (error) {
        showMessage(uploadMessage, 'Upload failed. Please try again.', false);
      } finally {
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
          <span>Upload File</span>
        `;
      }
    });

    // Download form handler
    downloadForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      const code = codeInput.value.trim();
      if (!code) {
        showMessage(downloadMessage, 'Please enter a file code', false);
        return;
      }

      downloadBtn.disabled = true;
      downloadBtn.innerHTML = `<div class="spinner"></div><span>Downloading...</span>`;

      try {
        const response = await fetch(`http://localhost:8080/download/${code}`, {
          method: "GET"
        });

        if (!response.ok) {
          throw new Error("File not found or expired");
        }

        // Get file blob
        const blob = await response.blob();

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `file_${code}`; // You can improve by reading filename from header
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        showMessage(downloadMessage, 'File download started!', true);

      } catch (error) {
        showMessage(downloadMessage, 'File not found or expired', false);
      } finally {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <span>Download File</span>
        `;
      }
    });

    // Code input formatting
    codeInput.addEventListener('input', function(e) {
      // Only allow numbers
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });

    // Add subtle animations on scroll
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    // Observe all sections
    document.querySelectorAll('section').forEach(section => {
      section.style.opacity = '0';
      section.style.transform = 'translateY(30px)';
      section.style.transition = 'all 0.6s ease-out';
      observer.observe(section);
    });