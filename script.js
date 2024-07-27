import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js';
import { getDatabase, ref, set, get } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js';

// Firebase yapılandırma nesnesi
const firebaseConfig = {
    apiKey: "AIzaSyB0kYeRCN5FYW22FyDYWhENIJWQ0A7mrqk",
    authDomain: "shivabit-27760.firebaseapp.com",
    databaseURL: "https://shivabit-27760-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "shivabit-27760",
    storageBucket: "shivabit-27760.appspot.com",
    messagingSenderId: "798496427237",
    appId: "1:798496427237:web:f4b6602c3308051a6f980c",
    measurementId: "G-70QQ6EQFVT"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Global değişkenler
let score = 0;
let interval;
let countdownValue = 10; // Saniye olarak başlatılıyor
let isMining = false;
let instantScore = 0;
let matrixInterval;
let upgrades = {}; // Yükseltmeleri saklamak için bir nesne
const USERNAME = 'FF'; // Kullanıcı adını buraya ekleyin

const scoreElement = document.getElementById('score');
const startButton = document.getElementById('start-button');
const pickupButton = document.getElementById('pickup-button');
const statusElement = document.getElementById('status');
const statusTextElement = document.getElementById('status-text');
const matrix = document.getElementById('matrix');

// Matrix efektini başlat
function startMatrixEffect() {
    console.log("Matrix efekti başlatıldı");
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const charArray = chars.split('');
    const columns = Math.floor(window.innerWidth / 20);
    const rows = Math.floor(window.innerHeight / 20);
    const intervalTime = 100; // Efektin hızını ayarlayın

    function generateMatrix() {
        matrix.innerHTML = ''; // Önceki içerikleri temizle
        for (let i = 0; i < columns; i++) {
            for (let j = 0; j < rows; j++) {
                const span = document.createElement('span');
                span.textContent = charArray[Math.floor(Math.random() * charArray.length)];
                span.style.left = `${i * 20}px`;
                span.style.top = `${j * 20}px`;
                matrix.appendChild(span);
            }
        }
    }

    function animateMatrix() {
        const spans = matrix.querySelectorAll('span');
        spans.forEach(span => {
            span.style.opacity = Math.random();
            span.style.top = `${parseFloat(span.style.top) + 20}px`;
            if (parseFloat(span.style.top) > window.innerHeight) {
                span.style.top = '0px';
            }
        });
    }

    generateMatrix();
    matrixInterval = setInterval(animateMatrix, intervalTime);
}

// Matrix efektini durdur
function stopMatrixEffect() {
    console.log("Matrix efekti durduruldu");
    clearInterval(matrixInterval);
    matrix.innerHTML = ''; // Matrix içeriğini temizle
}

// Geri sayımı başlat
function startCountdown() {
    console.log("Geri sayım başlatıldı");
    const countdownInterval = setInterval(() => {
        if (countdownValue <= 0) {
            clearInterval(interval);
            clearInterval(countdownInterval);
            isMining = false;
            stopMatrixEffect(); // Matrix efekti durdur
            statusElement.style.display = 'none';
            pickupButton.style.display = 'block';
            // Sayaç tamamlandığında puan eklenir ve database'e kaydedilir
            saveScoreToDatabase();
        } else {
            countdownValue -= 0.1;
            countdownValue = Math.max(countdownValue, 0); // Negatif olmaması için sınırla
            updateStatusText();
        }
    }, 100); // 100ms = 0.1 saniye
}

// Status metnini güncelle
function updateStatusText() {
    let seconds = Math.floor(countdownValue);
    let milliseconds = Math.floor((countdownValue - seconds) * 10); // Salise olarak göstermek için çarpan
    statusTextElement.innerHTML = `
        <img src="https://i.hizliresim.com/8uunpvf.png" alt="Coin Icon" class="status-icon"> 
        ${instantScore} 
        <img src="https://i.hizliresim.com/m4hxesw.png" alt="Clock Icon" class="status-clock">
        ${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(1, '0')}
    `;
}

// Mining işlemini başlat
function startMining() {
    console.log("Madencilik başlatılıyor");
    if (isMining) {
        console.log("Madencilik zaten devam ediyor");
        return;
    }

    startMatrixEffect(); // Matrix efekti başlat
    isMining = true;
    instantScore = 0;
    countdownValue = 10; // Sayaç 10 saniyeden başlasın
    statusElement.style.display = 'flex';
    startButton.style.display = 'none';
    pickupButton.style.display = 'none';

    interval = setInterval(() => {
        instantScore += getMiningPower(); // Yükseltmeleri uygula
        updateStatusText();
    }, 1000);

    startCountdown();
}

// Coins'ları al
function pickupCoins() {
    console.log("Coins alınıyor");
    score += instantScore;
    scoreElement.innerText = `Puan: ${score}`;
    // Ana bakiye Firebase Realtime Database'e kaydedilecek
    saveScoreToDatabase();
    pickupButton.style.display = 'none';
    startButton.style.display = 'block';
}

// Firebase Realtime Database'e ana bakiye kaydet
function saveScoreToDatabase() {
    console.log("Score kaydediliyor");
    const userRef = ref(db, 'users/' + USERNAME);
    set(userRef, {
        score: score,
        upgrades: upgrades // Yükseltmeleri de kaydet
    }).then(() => {
        console.log('Score and upgrades successfully saved to Firebase Realtime Database!');
    }).catch((error) => {
        console.error('Error saving data to Firebase Realtime Database:', error);
    });
}

// Firebase Realtime Database'den kullanıcı verilerini yükle
function loadUserData() {
    console.log("Kullanıcı verileri yükleniyor");
    const userRef = ref(db, 'users/' + USERNAME);
    get(userRef).then((snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            score = data.score || 0;
            upgrades = data.upgrades || { boost1: 1, boost2: 1, boost3: 1, boost4: 1 }; // Yükseltmeleri yükle
            scoreElement.innerText = `Puan: ${score}`;
        } else {
            console.log("Kullanıcı verisi bulunamadı");
        }
    }).catch((error) => {
        console.error('Error loading user data from Firebase Realtime Database:', error);
    });
}

// Madencilik gücünü hesapla
function getMiningPower() {
    let power = 1;
    if (upgrades.boost1) power *= 2;
    if (upgrades.boost2) power *= 3;
    if (upgrades.boost3) power *= 4; // Yükseltmeleri sırayla uygula
    if (upgrades.boost4) power *= 5;
    return power;
}

// Sayfa yüklendiğinde olay dinleyicilerini ekleyin ve kullanıcı verilerini yükleyin
document.addEventListener('DOMContentLoaded', () => {
    startButton.addEventListener('click', startMining);
    pickupButton.addEventListener('click', pickupCoins);
    // Kullanıcı verilerini yükleyin
    loadUserData();
});
