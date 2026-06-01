const kamus = {
    id: {
        // Halaman 1: Welcome
        judulWelcome: "CEKREK X PPLG PHOTOBOOTH📸",
        subWelcome: "Abadikan momennya,simpan kenangannya. - X PPLG 1",
        btnMulai: "MASUK PHOTOBOOTH",
    },
    en: {
        //halaman 1: Welcome
        judulWelcome: "CEKREK X PPLG 1 PHOTOBOOTH📸",
        subWelcome: "capture the moment,keep the memory. - X PPLG 1",
        btnMulai: "ENTER PHOTOBOOTH",

    }
};


function updateTeksHalaman(lang) {
    document.querySelectorAll('.data-lang').forEach(el => {
        const kunci = el.getAttribute('data-key');
        if (kamus[lang] && kamus[lang][kunci]) {
            el.innerHTML = kamus[lang][kunci];
        }
    });
}


function setBahasa(lang) {
    localStorage.setItem('pilihanBahasa', lang);
    updateTeksHalaman(lang);
}


window.addEventListener('DOMContentLoaded', () => {
    const bahasaTerakhir = localStorage.getItem('pilihanBahasa') || 'id'; 
    updateTeksHalaman(bahasaTerakhir);
});