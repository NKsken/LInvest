// Socket.IO 객체 (이미 MainWishList.js에서 선언되었으면 사용, 아니면 생성)
let socket = typeof io !== 'undefined' ? (window.socket || io()) : null;
if (socket) window.socket = socket;

function initStockPriceSocket() {
    // 1. 현재 종목 코드 전용 채널(Room)에 입장 요청
    if (socket && typeof STOCK_CODE !== 'undefined') {
        socket.emit('join', { code: STOCK_CODE });
    }

    // 2. 서버로부터 'price_update' 이벤트를 받았을 때의 처리
    if (socket) {
        socket.on('price_update', function(data) {
            // data: { current: "75,000", diff: "500", rate: "0.67" }
            
            const priceElement = document.getElementById('realtime-price');
            const rateElement = document.getElementById('realtime-rate');

            if (priceElement) priceElement.innerText = data.current + "원";

            if (rateElement) {
                const rateNum = parseFloat(data.rate);
                const sign = rateNum > 0 ? "+" : ""; // 양수일 때만 + 기호 추가
                
                // 새로운 형식으로 업데이트
                rateElement.innerHTML = `${sign}${data.diff}원(${sign}${data.rate}%)`;

                // 색상 변경
                if (rateNum > 0) {
                    rateElement.style.color = "#ff4d4f";
                } else if (rateNum < 0) {
                    rateElement.style.color = "#4096ff";
                } else {
                    rateElement.style.color = "#888";
                    priceElement.style.color = "inherit";
                }
            }
        });
    }
}

// 페이지 로드 시 초기화
window.addEventListener('DOMContentLoaded', initStockPriceSocket);

// 3. 페이지를 나갈 때 서버에 알림 (스레드 정리 용도)
window.addEventListener('beforeunload', function() {
    if (socket && typeof STOCK_CODE !== 'undefined') {
        socket.emit('leave', { code: STOCK_CODE });
    }
});