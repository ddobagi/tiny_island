// ✅ Firebase SDK 추가
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app-compat.js";
import { getAuth, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth-compat.js";

// 🔹 1. Firebase 설정 (환경 변수 또는 직접 값 입력)
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};

// 🔹 2. Firebase 앱 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.setPersistence(auth.Auth.Persistence.LOCAL);

// 🔹 3. Google 로그인 프로바이더 생성
const provider = new GoogleAuthProvider();

// 🔹 4. 로그인 버튼 클릭 이벤트
const loginButton = document.getElementById('google-login');
const logoutButton = document.getElementById('logout');
const userInfo = document.getElementById('user-info');

loginButton.addEventListener('click', () => {
    signInWithRedirect(auth, provider);
});

// 🔹 5. 로그인 후 리디렉션 결과 확인
getRedirectResult(auth)
    .then((result) => {
        if (result.user) {
            console.log("✅ 로그인 성공:", result.user);
            alert(`환영합니다, ${result.user.displayName}님!`);
            window.location.href = "/dashboard.html"; // 로그인 후 자동 이동
        }
    })
    .catch((error) => {
        console.error("❌ 로그인 오류:", error);
    });

// 🔹 6. 로그인 상태 변경 감지
onAuthStateChanged(auth, (user) => {
    updateUI(user);
    if (user) {
        window.location.href = "/dashboard.html";
    }
});

// 🔹 7. UI 업데이트 함수
function updateUI(user) {
    if (user) {
        userInfo.innerHTML = `로그인한 사용자: ${user.displayName} (${user.email})`;
        loginButton.style.display = 'none';
        logoutButton.style.display = 'block';
    } else {
        userInfo.innerHTML = "로그인한 사용자 정보가 없습니다.";
        loginButton.style.display = 'block';
        logoutButton.style.display = 'none';
    }
}

// 🔹 8. 로그아웃 기능 추가
logoutButton.addEventListener('click', () => {
    signOut(auth).then(() => {
        alert("로그아웃 되었습니다.");
        window.location.href = "/login.html"; // 로그아웃 후 로그인 페이지로 이동
    }).catch((error) => {
        console.error("❌ 로그아웃 오류:", error);
    });
});
