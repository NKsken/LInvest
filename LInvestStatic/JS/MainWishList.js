<<<<<<< HEAD
const socket = (typeof window.socket !== 'undefined') ? window.socket : (typeof io !== 'undefined' ? io() : null);
=======
let socket = typeof io !== 'undefined' ? io() : null;
>>>>>>> f5769a6544e5ae0ca087ed3899aef820f3b4b3b3

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
            
            let profitHTML = "";
            if (buyPrice > 0) {
                const profitRate = ((currentPrice - buyPrice) / buyPrice * 100).toFixed(2);
                const color = profitRate > 0 ? '#ff4d4f' : profitRate < 0 ? '#4096ff' : 'inherit';
                profitHTML = `<br><span id="profit-${item.code}" style="font-size: 0.85em; color: ${color};">(${profitRate > 0 ? '+' : ''}${profitRate}%)</span>`;
            }

            return `
                <tr id="row-${item.code}">
                    <td><a href="/code/${item.code}" style="text-decoration:none; color:inherit; font-weight:bold;">${item.name}</a></td>
                    <td>${item.code}</td>
                    <td id="price-${item.code}" class="current-price">${item.price}원</td>
                    
                    <td id="buy-price-container-${item.code}">
                        <span id="buy-price-${item.code}">${buyPrice > 0 ? buyPrice.toLocaleString() + '원' : '미입력'}</span>
                        ${profitHTML}
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

        // [핵심 수정 포인트] forEach로 따로 보내지 않고, join_all로 한 번에 보냅니다.
        if (socket && codes.length > 0) {
            socket.emit('join_all', { codes: codes });
            setupPriceUpdate();
        }

    } catch (error) {
        console.error("Wishlist load error:", error);
    }
}

function setupPriceUpdate() {
    if (!socket) return;

    socket.on('price_update', function(data) {
        const priceTag = document.getElementById(`price-${data.code}`);
        const profitTag = document.getElementById(`profit-${data.code}`);
        const buyPriceTag = document.getElementById(`buy-price-${data.code}`);

        if (priceTag) {
            priceTag.innerText = data.current + "원";
            const rate = parseFloat(data.rate);
            priceTag.style.color = rate > 0 ? "#ff4d4f" : rate < 0 ? "#4096ff" : "inherit";

            if (buyPriceTag && profitTag) {
                const buyPrice = parseInt(buyPriceTag.innerText.replace(/[^0-9]/g, ""));
                const currentPrice = parseInt(data.current.replace(/,/g, ""));

                if (buyPrice > 0) {
                    const newProfit = ((currentPrice - buyPrice) / buyPrice * 100).toFixed(2);
                    profitTag.innerText = `(${newProfit > 0 ? '+' : ''}${newProfit}%)`;
                    profitTag.style.color = newProfit > 0 ? "#ff4d4f" : newProfit < 0 ? "#4096ff" : "inherit";
                }
            }
        }
    });
}

function editBuyPrice(code) {
    const container = document.getElementById(`buy-price-container-${code}`);
    const btnTd = document.querySelector(`#row-${code} td:nth-child(5)`);
    const currentPriceText = document.getElementById(`buy-price-${code}`).innerText;
    const currentPrice = currentPriceText.replace(/[^0-9]/g, "");

    container.innerHTML = `
        <input type="number" id="input-${code}" value="${currentPrice}" 
               class="price-input" placeholder="가격 입력"
               style="width: 100px; padding: 4px; border: 1px solid var(--teal); border-radius: 4px;">
    `;

    btnTd.innerHTML = `
        <button onclick="saveBuyPrice('${code}')" class="edit-btn" 
                style="background: var(--teal); color: white; border: none;">완료</button>
    `;
    document.getElementById(`input-${code}`).focus();
}

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
    loadWishlist(); 
}

function removeWishlistItem(code) {
    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    wishlist = wishlist.filter(item => {
        const itemCode = (typeof item === 'object') ? item.code : item;
        return itemCode !== code;
    });
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    loadWishlist();
}

window.addEventListener('DOMContentLoaded', loadWishlist);