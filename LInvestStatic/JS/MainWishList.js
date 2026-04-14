// static/js/MainWishlist.js

async function loadWishlist() {
    // 1. 데이터 구조 변경 대응 (객체 형태 또는 이전의 문자열 형태 모두 호환되도록 처리)
    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    const tableBody = document.getElementById('wishlist-body');

    if (wishlist.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="empty-msg">등록된 관심 종목이 없습니다.</td></tr>';
        return;
    }

    // 2. 서버 요청을 위해 코드만 추출
    const codes = wishlist.map(item => typeof item === 'object' ? item.code : item);

    try {
        const response = await fetch('/api/wishlist-info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codes: codes })
        });
        const data = await response.json();

        // 3. 테이블 그리기 (구매가 포함)
        tableBody.innerHTML = data.map((item, index) => {
            // 해당 종목의 구매가 찾기
            const savedItem = wishlist.find(w => (typeof w === 'object' ? w.code : w) === item.code);
            const buyPrice = (savedItem && savedItem.buyPrice) ? `${parseInt(savedItem.buyPrice).toLocaleString()}원` : "-";

            return `
            <tr>
                <td class="name-cell"><a href="${item.link}">${item.name}</a></td>
                <td>${item.code}</td>
                <td class="price-cell">${item.price}</td>
                <td class="buy-price-cell">${buyPrice}</td>
                <td>
                    <button onclick="editBuyPrice('${item.code}')" class="edit-btn">수정</button>
                </td>
                <td>
                    <button onclick="removeWishlistItem('${item.code}')" class="delete-btn">삭제</button>
                </td>
            </tr>
            `;
        }).join('');

    } catch (e) {
        console.error("로드 실패:", e);
    }
}

function editBuyPrice(code) {
    const newPrice = prompt("구매하신 가격을 숫자로 입력해주세요.");
    
    if (newPrice === null) return; // 취소 클릭 시
    if (isNaN(newPrice)) {
        alert("숫자만 입력 가능합니다.");
        return;
    }

    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    
    // 데이터 구조 표준화 및 가격 업데이트
    wishlist = wishlist.map(item => {
        const itemCode = typeof item === 'object' ? item.code : item;
        if (itemCode === code) {
            return { code: itemCode, buyPrice: newPrice };
        }
        return typeof item === 'object' ? item : { code: item, buyPrice: null };
    });

    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    loadWishlist(); // 화면 갱신
}

// 삭제 기능
function removeWishlistItem(code) {
    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    wishlist = wishlist.filter(item => (typeof item === 'object' ? item.code : item) !== code);
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    loadWishlist();
}   

document.addEventListener("DOMContentLoaded", loadWishlist);