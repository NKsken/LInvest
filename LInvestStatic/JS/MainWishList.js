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
            
            let profitHTML = ""; // 수익률을 담을 변수
            if (buyPrice > 0) {
                const profitRate = ((currentPrice - buyPrice) / buyPrice * 100).toFixed(2);
                const color = profitRate > 0 ? '#ff4d4f' : profitRate < 0 ? '#4096ff' : 'inherit';
                // 000,000원 (-0.00%) 형식
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

// 1. 수정 버튼 클릭 시 실행: 입력창으로 전환
function editBuyPrice(code) {
    // 1-1. 매수가와 수익률이 들어있는 컨테이너 찾기
    const container = document.getElementById(`buy-price-container-${code}`);
    const btnTd = document.querySelector(`#row-${code} td:nth-child(5)`); // 5번째 칸 (수정 버튼 칸)

    // 기존 가격 숫자만 추출
    const currentPriceText = document.getElementById(`buy-price-${code}`).innerText;
    const currentPrice = currentPriceText.replace(/[^0-9]/g, "");

    // 1-2. 매수가 칸을 입력창으로 변경
    container.innerHTML = `
        <input type="number" id="input-${code}" value="${currentPrice}" 
               class="price-input" placeholder="가격 입력"
               style="width: 100px; padding: 4px; border: 1px solid var(--teal); border-radius: 4px;">
    `;

    // 1-3. 수정 버튼을 '완료' 버튼으로 변경
    btnTd.innerHTML = `
        <button onclick="saveBuyPrice('${code}')" class="edit-btn" 
                style="background: var(--teal); color: white; border: none;">완료</button>
    `;
    
    // 입력창에 바로 포커스
    document.getElementById(`input-${code}`).focus();
}

// 2. 완료(저장) 버튼 클릭 시 실행: 값 저장 및 UI 복구
function saveBuyPrice(code) {
    const newPrice = document.getElementById(`input-${code}`).value;
    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

    // 데이터 업데이트
    wishlist = wishlist.map(item => {
        const itemCode = typeof item === 'object' ? item.code : item;
        if (itemCode === code) {
            return { code: itemCode, buyPrice: newPrice };
        }
        return typeof item === 'object' ? item : { code: item, buyPrice: null };
    });

    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    
    // UI 갱신 (전체 리스트 다시 로드)
    loadWishlist(); 
}

// 관심 종목 삭제 함수
function removeWishlistItem(code) {

    // 1. 로컬스토리지 데이터 가져오기
    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

    // 2. 해당 코드를 가진 아이템 제외 (문자열인 경우와 객체인 경우 모두 대응)
    wishlist = wishlist.filter(item => {
        const itemCode = (typeof item === 'object') ? item.code : item;
        return itemCode !== code;
    });

    // 3. 변경된 리스트 저장
    localStorage.setItem('wishlist', JSON.stringify(wishlist));

    // 4. 화면 새로고침 없이 해당 줄만 삭제하거나 리스트 재로드
    // 여기서는 가장 확실한 방법인 재로드를 사용합니다.
    loadWishlist();
    
    // (선택 사항) 만약 서버 웹소켓 연결도 끊고 싶다면
    if (socket) {
        socket.emit('leave', { code: code });
    }
}

// 페이지 로드 시 실행
window.addEventListener('DOMContentLoaded', loadWishlist);