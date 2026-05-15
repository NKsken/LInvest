// 상단에 소켓 연결 (이미 index.html에서 로드되었다고 가정)
const socket = typeof io !== 'undefined' ? io() : null;

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

        tableBody.innerHTML = data.map((item) => {
            const savedItem = wishlist.find(w => (typeof w === 'object' ? w.code : w) === item.code);
            const buyPrice = (savedItem && savedItem.buyPrice) ? parseInt(savedItem.buyPrice) : 0;
            const currentPrice = parseInt(item.price.replace(/[^0-9]/g, ""));
            
            let profitRate = 0;
            if (buyPrice > 0) {
                profitRate = ((currentPrice - buyPrice) / buyPrice * 100).toFixed(2);
            }

            return `
                <tr id="row-${item.code}">
                    <td><a href="/code/${item.code}" style="text-decoration:none; color:inherit; font-weight:bold;">${item.name}</a></td>
                    <td>${item.code}</td>
                    <td id="price-${item.code}" class="current-price">${item.price}원</td>
                    <td id="buy-price-${item.code}">${buyPrice > 0 ? buyPrice.toLocaleString() + '원' : '미입력'}</td>
                    <td id="profit-${item.code}" style="font-weight:bold; color: ${profitRate > 0 ? '#ff4d4f' : profitRate < 0 ? '#4096ff' : 'inherit'}">
                        ${buyPrice > 0 ? profitRate + '%' : '-'}
                    </td> 
                    <td>
                        <button onclick="editBuyPrice('${item.code}')" class="edit-btn">수정</button>
                    </td>
                    <td>
                        <button onclick="removeWishlistItem('${item.code}')" class="delete-btn">삭제</button>
                    </td>
                </tr>
            `;
        }).join('');

        // 렌더링 후 각 종목 소켓 룸에 입장
        if (socket) {
            codes.forEach(code => {
                socket.emit('join', { code: code });
            });
        }

    } catch (error) {
        console.error("Wishlist load error:", error);
    }
}

// 실시간 가격 업데이트 리스너
if (socket) {
    socket.on('price_update', function(data) {
        // data: { code: "005930", current: "75,000", rate: "0.67", ... }
        const priceTag = document.getElementById(`price-${data.code}`);
        const profitTag = document.getElementById(`profit-${data.code}`);
        const buyPriceTag = document.getElementById(`buy-price-${data.code}`);

        if (priceTag) {
            priceTag.innerText = data.current + "원";
            
            // 가격 색상 변경 (상승/하락)
            const rate = parseFloat(data.rate);
            priceTag.style.color = rate > 0 ? "#ff4d4f" : rate < 0 ? "#4096ff" : "inherit";

            // 실시간 수익률 재계산
            if (buyPriceTag && profitTag) {
                const buyPrice = parseInt(buyPriceTag.innerText.replace(/[^0-9]/g, ""));
                const currentPrice = parseInt(data.current.replace(/,/g, ""));

                if (buyPrice > 0) {
                    const newProfit = ((currentPrice - buyPrice) / buyPrice * 100).toFixed(2);
                    profitTag.innerText = newProfit + "%";
                    profitTag.style.color = newProfit > 0 ? "#ff4d4f" : newProfit < 0 ? "#4096ff" : "inherit";
                }
            }
        }
    });
}

// 페이지 로드 시 실행
window.addEventListener('DOMContentLoaded', loadWishlist);