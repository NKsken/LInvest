function toggleWishlist() {
    const btn = document.getElementById('wishlist-btn');
    const star = btn.querySelector('.star-icon');
    
    // 1. 현재 저장된 리스트 가져오기
    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    const stockCode = "{{ code }}".trim();

    if (wishlist.includes(stockCode)) {
        // 이미 있다면 제거
        wishlist = wishlist.filter(code => code !== stockCode);
        btn.classList.remove('active');
        star.innerText = '☆';
        btn.innerHTML = '<span class="star-icon">☆</span> 관심 등록';
    } else {
        // 없다면 추가
        wishlist.push(stockCode);
        btn.classList.add('active');
        star.innerText = '★';
        btn.innerHTML = '<span class="star-icon">★</span> 관심 종목';
    }

    // 2. localStorage에 저장
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

// 페이지 로드 시 상태 확인
window.addEventListener('DOMContentLoaded', () => {
    const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    const stockCode = "{{ code }}".trim();
    const btn = document.getElementById('wishlist-btn');
    
    if (wishlist.includes(stockCode)) {
        btn.classList.add('active');
        btn.innerHTML = '<span class="star-icon">★</span> 관심 종목';
    }
});

// LInvestStatic/js/Wishlist.js

function toggleWishlist() {
    const btn = document.getElementById('wishlist-btn');
    if (!btn || typeof STOCK_CODE === 'undefined') return;

    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    const currentCode = STOCK_CODE.trim();
    
    if (wishlist.includes(currentCode)) {
        // 이미 있으면 제거
        wishlist = wishlist.filter(code => code !== currentCode);
        btn.classList.remove('active');
        btn.innerHTML = '<span class="star-icon">☆</span> 관심 등록';
    } else {
        // 없으면 추가
        wishlist.push(currentCode);
        btn.classList.add('active');
        btn.innerHTML = '<span class="star-icon">★</span> 관심 종목';
    }
    
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

/**
 * 페이지 로드 시 해당 종목이 관심 종목인지 체크하여 UI 반영
 */
function checkWishlistStatus() {
    const btn = document.getElementById('wishlist-btn');
    if (!btn || typeof STOCK_CODE === 'undefined') return;

    const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    const currentCode = STOCK_CODE.trim();

    if (wishlist.includes(currentCode)) {
        btn.classList.add('active');
        btn.innerHTML = '<span class="star-icon">★</span> 관심 종목';
    }
}

// 스크립트 로드 시 실행 (혹은 HTML에서 호출)
document.addEventListener("DOMContentLoaded", checkWishlistStatus);