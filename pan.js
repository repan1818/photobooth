let selectedFrameSrc = 'spiderman 2.png';
let capturedImages = [];
let countdownInterval = null; // Di-set null dulu biar ga crash pas awal load

// ==========================================
// 2. FUNGSI AKSES & NYALAKAN WEBCAM
// ==========================================
function bukaKamera() {
    const video = document.getElementById('video');
    if (!video) {
        console.error("Elemen video tidak ditemukan!");
        return;
    }
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
        .then(function(stream) {
            video.srcObject = stream;
            console.log("Webcam berhasil dinyalakan!");
        })
        .catch(function(err) {
            console.error("Gagal akses webcam: ", err);
        });
    }
}

// ==========================================
// 3. FUNGSI MANAJEMEN PINDAH HALAMAN
// ==========================================
function pindahHalaman(nomor) {
    console.log("Pindah ke halaman:", nomor);
    const p1 = document.getElementById('page-1');
    const p2 = document.getElementById('page-2');
    const p3 = document.getElementById('page-3');
    const workspace = document.querySelector('.photo-booth-workspace');

    if (p1) p1.style.display = 'none';
    if (p2) p2.style.display = 'none';
    if (p3) p3.style.display = 'none';

    if (nomor === 1) {
        if (p1) p1.style.display = 'block';
        if (workspace) workspace.style.display = 'none'; 
    } else {
        if (workspace) workspace.style.display = 'flex';
        if (nomor === 2) {
            if (p2) p2.style.display = 'block';
            bukaKamera();
        }
        if (nomor === 3) {
            if (p3) p3.style.display = 'block';
        }
    }
}

// ==========================================
// 4. FUNGSI HITUNG MUNDUR & AUTOMATIC CAPTURE
// ==========================================
function startCountdown() {
    const startBtn = document.getElementById('startCaptureBtn');
    const countdownOverlay = document.getElementById('countdown-overlay');
    const countdownText = document.getElementById('countdown-text');
    
    if (startBtn) startBtn.style.display = 'none';
    if (countdownOverlay) countdownOverlay.style.display = 'flex';

    capturedImages = []; 
    let photoCount = 0;
    let timer = 3;

    if (countdownText) countdownText.innerText = timer;

    // Baru kita isi nilai intervalnya di sini pas fungsi dieksekusi
    countdownInterval = setInterval(() => {
        timer--;
        if (countdownText) countdownText.innerText = timer;

        if (timer <= 0) {
            // Efek Flash
            const flash = document.createElement('div');
            flash.style.position = 'fixed';
            flash.style.top = '0'; flash.style.left = '0';
            flash.style.width = '100vw'; flash.style.height = '100vh';
            flash.style.backgroundColor = '#fff'; flash.style.zIndex = '9999';
            document.body.appendChild(flash);
            setTimeout(() => flash.remove(), 100);

            // Capture ke canvas sementara
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
            console.log(`Foto ke-${photoCount} sukses!`);

            if (photoCount < 3) {
                timer = 3; 
                if (countdownText) countdownText.innerText = timer;
            } else {
                clearInterval(countdownInterval);
                if (countdownOverlay) countdownOverlay.style.display = 'none';
                if (startBtn) startBtn.style.display = 'block';
                
                // Eksekusi fungsi penggabungan async
                prosesGabungStripPolaroid();
            }
        }
    }, 1000);
}

// ==========================================
// 5. LOGIKA ASYNC GABUNG FOTO POLAROID STRIP
// ==========================================
async function prosesGabungStripPolaroid() {
    if (capturedImages.length < 3) return;

    let finalCanvas = document.getElementById('canvas-polaroid-utama');
    if (!finalCanvas) {
        finalCanvas = document.createElement('canvas');
        finalCanvas.id = "canvas-polaroid-utama";
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
    const boxYPositions = [50, 290, 530];

    // Helper Promise Loader
    const loadImage = src => new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = reject;
    });

    try {
        // Render 3 foto secara sekuensial pake await async bawaan lu
        for (let index = 0; index < capturedImages.length; index++) {
            const img = await loadImage(capturedImages[index]);
            
            let scale = Math.max(boxW / img.width, boxH / img.height);
            let sW = boxW / scale;
            let sH = boxH / scale;
            let sX = (img.width - sW) / 2;
            let sY = (img.height - sH) / 2;

            ctx.drawImage(img, sX, sY, sW, sH, xPos, boxYPositions[index], boxW, boxH);
        }

        // Tempel bingkai setelah foto beres
        await renderFrameDiAtasCanvas();

    } catch (err) {
        console.error("Gagal memproses gambar polaroid:", err);
    }
}

// ==========================================
// 6. LOGIKA ASYNC RENDER LAYER FRAME
// ==========================================
async function renderFrameDiAtasCanvas() {
    const finalCanvas = document.getElementById('canvas-polaroid-utama');
    if (!finalCanvas) return;
    const ctx = finalCanvas.getContext('2d');

    const loadImage = src => new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = reject;
    });

    try {
        const frameImg = await loadImage(selectedFrameSrc);
        ctx.drawImage(frameImg, 0, 0, finalCanvas.width, finalCanvas.height);

        const wadahPhotos = document.getElementById('photos');
        if (wadahPhotos) {
            wadahPhotos.innerHTML = "";
            const hasilGambar = new Image();
            hasilGambar.src = finalCanvas.toDataURL('image/png');
            hasilGambar.style.width = "100%";
            hasilGambar.style.borderRadius = "8px";
            wadahPhotos.appendChild(hasilGambar);
        }
        pindahHalaman(3);
    } catch (err) {
        console.error("Gagal me-render frame:", err);
    }
}

// ==========================================
// 7. FUNGSI KLIK THUMBNAIL BINGKAI
// ==========================================
function gantiFrameInstan(namaFileFrame) {
    selectedFrameSrc = namaFileFrame;
    
    const liveFrame = document.getElementById('frame-preview');
    if (liveFrame) liveFrame.src = namaFileFrame;

    const tombolQr = document.getElementById('qrBtn');
    const wadahContainer = document.getElementById('qrcode-container');
    if (tombolQr) {
        tombolQr.innerText = "📱 GENERATE QR CODE";
        tombolQr.disabled = false;
    }
    if (wadahContainer) wadahContainer.style.display = 'none';

    prosesGabungStripPolaroid();
}

// ==========================================
// 8. FUNGSI GENERATE QR CODE
// ==========================================
function bikinQrCodeInstan() {
    const finalCanvas = document.getElementById('canvas-polaroid-utama');
    const qrcodeContainer = document.getElementById('qrcode-container');
    const qrcodeDiv = document.getElementById('qrcode');
    const tombolQr = document.getElementById('qrBtn');

    if (!finalCanvas) return;
    const dataUrlFotonya = finalCanvas.toDataURL('image/png');

    if (qrcodeDiv) qrcodeDiv.innerHTML = "";

    try {
        new QRCode(qrcodeDiv, {
            text: dataUrlFotonya,
            width: 150,
            height: 150,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });

        if (qrcodeContainer) qrcodeContainer.style.display = 'block';
        if (tombolQr) {
            tombolQr.innerText = "✅ QR CODE GENERATED!";
            tombolQr.disabled = true;
        }
    } catch (error) {
        console.error(error);
    }
}