let selectedFrameSrc = 'spiderman 2.png';
let capturedImages = [];
let countdownInterval = null;

function pilihFrameDanLanjut(namaFrame) {
    selectedFrameSrc = namaFrame;
    pindahHalaman(3);
}

function bukaKamera() {
    const video = document.getElementById('video');
    if (!video) return;

    const framePreview = document.getElementById('frame-preview');
    if (framePreview) framePreview.src = selectedFrameSrc;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
        .then(function(stream) {
            video.srcObject = stream;
        })
        .catch(function(err) {
            alert("Gagal akses kamera. Pastikan izin kamera sudah diberikan di browser.");
        });
    } else {
        alert("Browser kamu tidak mendukung akses kamera.");
    }
}

// FIX UTAMA: pakai class active-page, bukan style.display
function pindahHalaman(nomor) {
    for (let i = 1; i <= 4; i++) {
        const page = document.getElementById('page-' + i);
        if (page) page.classList.remove('active-page');
    }

    const target = document.getElementById('page-' + nomor);
    if (target) target.classList.add('active-page');

    if (nomor === 3) {
        bukaKamera();
        capturedImages = [];
        const startBtn = document.getElementById('startCaptureBtn');
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.innerText = "📷 START CAPTURE";
        }
    }
}

function startCountdown() {
    const startBtn = document.getElementById('startCaptureBtn');
    const countdownOverlay = document.getElementById('countdown-overlay');
    const countdownText = document.getElementById('countdown-text');

    if (startBtn) {
        startBtn.disabled = true;
        startBtn.innerText = "📸 Sedang Memotret...";
    }
    if (countdownOverlay) countdownOverlay.style.display = 'flex';

    capturedImages = [];
    let photoCount = 0;
    let timer = 3;

    if (countdownText) countdownText.innerText = timer;

    countdownInterval = setInterval(() => {
        timer--;
        if (countdownText) countdownText.innerText = timer;

        if (timer <= 0) {
            const flash = document.createElement('div');
            flash.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#fff;z-index:9999;';
            document.body.appendChild(flash);
            setTimeout(() => flash.remove(), 120);

            const video = document.getElementById('video');
            const tempCanvas = document.createElement('canvas');
            if (video) {
                tempCanvas.width = video.videoWidth || 640;
                tempCanvas.height = video.videoHeight || 480;
                const tCtx = tempCanvas.getContext('2d');
                tCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
                capturedImages.push(tempCanvas.toDataURL('image/png'));
            }

            photoCount++;

            if (photoCount < 3) {
                timer = 3;
                if (countdownText) countdownText.innerText = timer;
            } else {
                clearInterval(countdownInterval);
                if (countdownOverlay) countdownOverlay.style.display = 'none';
                prosesGabungStripPolaroid();
            }
        }
    }, 1000);
}

async function prosesGabungStripPolaroid() {
    if (capturedImages.length < 3) return;

    let finalCanvas = document.getElementById('canvas-polaroid-utama');
    if (!finalCanvas) {
        finalCanvas = document.createElement('canvas');
        finalCanvas.id = 'canvas-polaroid-utama';
        finalCanvas.style.display = 'none';
        document.body.appendChild(finalCanvas);
    }

    const w = 450;
    const h = 850;
    finalCanvas.width = w;
    finalCanvas.height = h;
    const ctx = finalCanvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    const boxW = 400;
    const boxH = 250;
    const xPos = 25;
    const boxYPositions = [50, 310, 570];

    const loadImage = src => new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });

    try {
        for (let index = 0; index < capturedImages.length; index++) {
            const img = await loadImage(capturedImages[index]);

            let scale = Math.max(boxW / img.width, boxH / img.height);
            let sW = boxW / scale;
            let sH = boxH / scale;
            let sX = (img.width - sW) / 2;
            let sY = (img.height - sH) / 2;

            ctx.drawImage(img, sX, sY, sW, sH, xPos, boxYPositions[index], boxW, boxH);
        }

        await renderFrameDiAtasCanvas();
    } catch (err) {
        console.error("Gagal memproses gambar polaroid:", err);
    }
}

async function renderFrameDiAtasCanvas() {
    const finalCanvas = document.getElementById('canvas-polaroid-utama');
    if (!finalCanvas) return;
    const ctx = finalCanvas.getContext('2d');

    const loadImage = src => new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });

    try {
        const frameImg = await loadImage(selectedFrameSrc);
        ctx.drawImage(frameImg, 0, 0, finalCanvas.width, finalCanvas.height);

        const wadahPhotos = document.getElementById('photos');
        if (wadahPhotos) {
            wadahPhotos.innerHTML = '';
            const hasilGambar = new Image();
            hasilGambar.src = finalCanvas.toDataURL('image/png');
            hasilGambar.style.cssText = 'width:100%; border-radius:8px; max-width:420px;';
            wadahPhotos.appendChild(hasilGambar);
        }

        pindahHalaman(4);

        const tombolQr = document.getElementById('qrBtn');
        const wadahContainer = document.getElementById('qrcode-container');
        if (tombolQr) { tombolQr.innerText = "📱 GENERATE QR CODE"; tombolQr.disabled = false; }
        if (wadahContainer) wadahContainer.style.display = 'none';

    } catch (err) {
        console.error("Gagal me-render frame:", err);
    }
}

function gantiFrameInstan(namaFileFrame) {
    selectedFrameSrc = namaFileFrame;
    prosesGabungStripPolaroid();
}

async function bikinQrCodeInstan() {
    const finalCanvas = document.getElementById('canvas-polaroid-utama');
    const qrcodeContainer = document.getElementById('qrcode-container');
    const qrcodeDiv = document.getElementById('qrcode');
    const tombolQr = document.getElementById('qrBtn');

    if (!finalCanvas) return;

    // Ubah tombol jadi loading
    if (tombolQr) {
        tombolQr.innerText = "⏳ Uploading...";
        tombolQr.disabled = true;
    }

    try {
        // Kompres dulu jadi JPEG kualitas 70% biar kecil
        const dataUrl = finalCanvas.toDataURL('image/jpeg', 0.7);
        const base64Data = dataUrl.split(',')[1]; // Buang prefix "data:image/jpeg;base64,"

        // Upload ke Imgur (anonymous, gratis, no login)
        const response = await fetch('https://api.imgur.com/3/image', {
            method: 'POST',
            headers: {
                'Authorization': 'Client-ID 546c25a59c58ad7', // Client ID publik Imgur
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image: base64Data,
                type: 'base64'
            })
        });

        const result = await response.json();

        if (!result.success) throw new Error('Upload gagal');

        const imageUrl = result.data.link; // URL gambar hasil upload

        // Baru bikin QR dari URL (pendek, pasti muat!)
        if (qrcodeDiv) qrcodeDiv.innerHTML = '';

        new QRCode(qrcodeDiv, {
            text: imageUrl,
            width: 150,
            height: 150,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
        });

        if (qrcodeContainer) qrcodeContainer.style.display = 'block';
        if (tombolQr) {
            tombolQr.innerText = "✅ QR CODE GENERATED!";
            tombolQr.disabled = true;
        }

    } catch (error) {
        console.error("Error:", error);
        if (tombolQr) {
            tombolQr.innerText = "📱 GENERATE QR CODE";
            tombolQr.disabled = false;
        }
        alert("Gagal upload foto. Coba lagi ya!");
    }
}