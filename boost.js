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
const USERNAME = 'FF'; // Kullanıcı adını buraya ekleyin

document.addEventListener('DOMContentLoaded', () => {
    const upgradeButtons = document.querySelectorAll('.purchase-button');
    const feedbackElement = document.getElementById('feedback');
    let currentPoints = 0;
    let upgrades = {};

    // Firebase Realtime Database'den puanları ve yükseltmeleri yükle
    const userRef = ref(db, 'users/' + USERNAME);
    get(userRef).then((snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            currentPoints = data.score || 0;
            upgrades = data.upgrades || { boost1: 0, boost2: 0, boost3: 0, boost4: 0 };
        } else {
            upgrades = { boost1: 0, boost2: 0, boost3: 0, boost4: 0 }; // Başlangıçta hiç boost satın alınmamış
        }
        updateButtons();
    }).catch((error) => {
        console.error('Error loading user data from Firebase Realtime Database:', error);
        feedbackElement.textContent = 'Error loading user data. Please try again later.';
    });

    // Butonları güncelle
    function updateButtons() {
        upgradeButtons.forEach(button => {
            const boostId = button.parentElement.id;
            const price = parseInt(button.getAttribute('data-price'));
            button.textContent = `Buy for ${price} Points`;
            if (currentPoints >= price && canBuyBoost(boostId)) {
                button.disabled = false;
                button.classList.remove('disabled');
            } else {
                button.disabled = true;
                button.classList.add('disabled');
            }
        });
    }

    // Yükseltme satın alımını kontrol et
    function canBuyBoost(boostId) {
        if (boostId === 'boost2' && upgrades.boost1 === 0) return false;
        if (boostId === 'boost3' && upgrades.boost2 === 0) return false;
        if (boostId === 'boost4' && upgrades.boost3 === 0) return false;
        return upgrades[boostId] === 0; // Bu boost daha önce alınmamış mı?
    }

    // Boost satın alma
    function purchaseBoost(boostId, price) {
        if (currentPoints >= price && canBuyBoost(boostId)) {
            // Puanları düşür ve yükseltmeleri güncelle
            currentPoints -= price;
            upgrades[boostId] = 1; // Bu boost artık alınmış

            // Verileri Firebase Realtime Database'e kaydet
            const userRef = ref(db, 'users/' + USERNAME);
            set(userRef, {
                score: currentPoints,
                upgrades: upgrades
            }).then(() => {
                console.log('Upgrades and score successfully saved to Firebase Realtime Database!');
                feedbackElement.textContent = `Purchased ${boostId}. Your new points balance: ${currentPoints}`;
                localStorage.setItem('score', currentPoints);
                localStorage.setItem('upgrades', JSON.stringify(upgrades));
                updateButtons();
            }).catch((error) => {
                console.error('Error saving data to Firebase Realtime Database:', error);
                feedbackElement.textContent = 'Error saving data. Please try again later.';
            });
        } else if (currentPoints < price) {
            feedbackElement.textContent = 'Not enough points!';
        } else {
            feedbackElement.textContent = 'You need to purchase the previous level boost first!';
        }
    }

    // Buton tıklama olayını ele al
    upgradeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const boostId = button.parentElement.id;
            const price = parseInt(button.getAttribute('data-price'));
            purchaseBoost(boostId, price);
        });
    });
});
