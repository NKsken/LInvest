// Socket.IO 객체 생성
const socket = io();

// 1. 현재 종목 코드 전용 채널(Room)에 입장 요청
socket.emit('join', { code: STOCK_CODE });

// 2. 서버로부터 'price_update' 이벤트를 받았을 때의 처리
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

// 3. 페이지를 나갈 때 서버에 알림 (스레드 정리 용도)
window.addEventListener('beforeunload', function() {
    socket.emit('leave', { code: STOCK_CODE });
});