// static/js/MainWishlist.js

async function loadWishlist() {
    const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    const tableBody = document.getElementById('wishlist-body');

    if (wishlist.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="empty-msg">등록된 관심 종목이 없습니다.</td></tr>';
        return;
    }

    try {
        // 서버에 종목 정보 요청
        const response = await fetch('/api/wishlist-info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codes: wishlist })
        });
        const data = await response.json();

        // 테이블 업데이트
        tableBody.innerHTML = data.map(item => `
            <tr>
                <td class="name-cell"><a href="${item.link}">${item.name}</a></td>
                <td>${item.code}</td>
                <td class="price-cell">${item.price}</td>
                <td>
                    <button onclick="removeWishlistItem('${item.code}')" class="delete-btn">삭제</button>
                </td>
            </tr>
        `).join('');

    } catch (e) {
        console.error("관심 종목 로드 실패:", e);
    }
}

// 삭제 기능
function removeWishlistItem(code) {
    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    wishlist = wishlist.filter(item => item !== code);
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    loadWishlist(); // 삭제 후 리스트 갱신
}

document.addEventListener("DOMContentLoaded", loadWishlist);