// GetStockPrice.js

// Socket.IO 객체 안전하게 확보
let socket = typeof io !== 'undefined' ? (window.socket || io()) : null;
if (socket) window.socket = socket;

function initStockPriceSocket() {
    // ==========================================
    // [REST API 초기 진입 가격 강제 동기화 로직 추가]
    // ==========================================
    const priceElement = document.getElementById('realtime-price');
    const rateElement = document.getElementById('realtime-rate');

    // stock.html 상단에 등록되어 있는 Flask REST API 결과 변수(NOW_PRICE, PAST_PRICE)를 활용합니다.
    if (typeof NOW_PRICE !== 'undefined' && NOW_PRICE > 0) {
        if (priceElement) {
            priceElement.innerText = NOW_PRICE.toLocaleString() + "원";
        }
    }

    if (typeof PAST_PRICE !== 'undefined' && typeof NOW_PRICE !== 'undefined' && NOW_PRICE > 0 && PAST_PRICE > 0) {
        if (rateElement) {
            // 변동 금액 계산 (현재가 - 전일종가)
            const diffPrice = NOW_PRICE - PAST_PRICE;
            // 변동률 계산 (변동금액 / 전일종가 * 100)
            const diffRate = ((diffPrice / PAST_PRICE) * 100).toFixed(2);
            
            const sign = diffPrice > 0 ? "+" : "";
            rateElement.innerHTML = `${sign}${diffPrice.toLocaleString()}원(${sign}${diffRate}%)`;

            // 초기 REST 가격 색상 조건 매핑
            if (diffPrice > 0) {
                rateElement.style.color = "#ff4d4f"; // 상승 시 빨간색
            } else if (diffPrice < 0) {
                rateElement.style.color = "#4096ff"; // 하락 시 파란색
            } else {
                rateElement.style.color = "#888888"; // 보합 시 회색
            }
        }
    }
    // ==========================================

    // 1. 현재 종목 코드 전용 채널(Room)에 입장 요청
    if (socket && typeof STOCK_CODE !== 'undefined') {
        socket.emit('join', { code: STOCK_CODE });
    }

    // 2. 서버로부터 'price_update' 이벤트를 받았을 때의 처리 (실시간 소켓)
    if (socket) {
        socket.on('price_update', function(data) {
            // data: { current: "75,000", diff: "500", rate: "0.67" }
            
            const priceElementLive = document.getElementById('realtime-price');
            const rateElementLive = document.getElementById('realtime-rate');

            if (priceElementLive) priceElementLive.innerText = data.current + "원";

            if (rateElementLive) {
                const rateNum = parseFloat(data.rate);
                const sign = rateNum > 0 ? "+" : ""; // 양수일 때만 + 기호 추가
                
                // 새로운 형식으로 업데이트
                rateElementLive.innerHTML = `${sign}${data.diff}원(${sign}${data.rate}%)`;

                // 색상 변경
                if (rateNum > 0) {
                    rateElementLive.style.color = "#ff4d4f";
                } else if (rateNum < 0) {
                    rateElementLive.style.color = "#4096ff";
                } else {
                    rateElementLive.style.color = "#888";
                }
            }
        });
    }
}

// 페이지 로드 시 초기화 구동
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStockPriceSocket);
} else {
    initStockPriceSocket();
}