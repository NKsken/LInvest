// static/js/MainWishlist.js

async function loadWishlist() {
    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    const tableBody = document.getElementById('wishlist-body');

    if (wishlist.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="empty-msg">등록된 관심 종목이 없습니다.</td></tr>';
        return;
    }

    const codes = wishlist.map(item => typeof item === 'object' ? item.code : item);

    try {
        const response = await fetch('/api/wishlist-info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codes: codes })
        });
        const data = await response.json();

        tableBody.innerHTML = data.map((item, index) => {
            const savedItem = wishlist.find(w => (typeof w === 'object' ? w.code : w) === item.code);
            const buyPrice = (savedItem && savedItem.buyPrice) ? parseInt(savedItem.buyPrice) : 0;
            
            // 현재가 문자열에서 숫자만 추출 (예: "199,000원" -> 199000)
            const currentPrice = parseInt(item.price.replace(/[^0-9]/g, ""));
            
            let profitDisplay = "";
            if (buyPrice > 0) {
                // 수익률 계산
                const profitRate = ((currentPrice - buyPrice) / buyPrice * 100).toFixed(2);
                const isPlus = profitRate >= 0;
                const color = isPlus ? 'var(--danger-red)' : 'var(--primary-blue)';
                profitDisplay = `<span style="color: ${color}; font-size: 12px; margin-left: 5px;">
                                    (${isPlus ? '+' : ''}${profitRate}%)
                                 </span>`;
            }

            const buyPriceText = buyPrice ? `${buyPrice.toLocaleString()}원` : "-";

            return `
            <tr id="row-${item.code}">
                <td class="name-cell"><a href="${item.link}">${item.name}</a></td>
                <td>${item.code}</td>
                <td class="price-cell">${item.price}</td>
                <td class="buy-price-cell" id="price-td-${item.code}">
                    <span id="text-${item.code}">${buyPriceText}</span>
                    ${profitDisplay} </td>
                <td id="btn-td-${item.code}">
                    <button onclick="switchToInput('${item.code}', '${buyPrice || ''}')" class="edit-btn">수정</button>
                </td>
                <td>
                    <button onclick="removeWishlistItem('${item.code}')" class="delete-btn">삭제</button>
                </td>
            </tr>
            `;
        }).join('');
    } catch (e) { console.error(e); }
}

// 1. 텍스트를 입력창으로 교체하는 함수
function switchToInput(code, currentPrice) {
    const priceTd = document.getElementById(`price-td-${code}`);
    const btnTd = document.getElementById(`btn-td-${code}`);

    // 입력창으로 변경 (디자인을 위해 인라인 스타일이나 클래스 추가)
    priceTd.innerHTML = `
        <input type="number" id="input-${code}" value="${currentPrice}" 
               class="price-input" placeholder="가격 입력"
               style="width: 80px; padding: 4px; border: 1px solid var(--teal); border-radius: 4px;">
    `;

    // 버튼을 '저장'으로 변경
    btnTd.innerHTML = `
        <button onclick="saveBuyPrice('${code}')" class="edit-btn" style="background: var(--teal); color: white;">저장</button>
    `;
    
    // 바로 포커스
    document.getElementById(`input-${code}`).focus();
}

// 2. 입력된 값을 저장하는 함수
function saveBuyPrice(code) {
    const newPrice = document.getElementById(`input-${code}`).value;
    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

    wishlist = wishlist.map(item => {
        const itemCode = typeof item === 'object' ? item.code : item;
        if (itemCode === code) {
            return { code: itemCode, buyPrice: newPrice };
        }
        return typeof item === 'object' ? item : { code: item, buyPrice: null };
    });

    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    loadWishlist(); // 전체 리스트 다시 불러와서 UI 갱신
}

// 삭제 기능
function removeWishlistItem(code) {
    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    wishlist = wishlist.filter(item => (typeof item === 'object' ? item.code : item) !== code);
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    loadWishlist();
}   

document.addEventListener("DOMContentLoaded", loadWishlist);