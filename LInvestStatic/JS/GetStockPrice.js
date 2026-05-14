// Socket.IO 객체 생성
const socket = io();

// 1. 현재 종목 코드 전용 채널(Room)에 입장 요청
socket.emit('join', { code: STOCK_CODE });

// 2. 서버로부터 'price_update' 이벤트를 받았을 때의 처리
socket.on('price_update', function(data) {
    // data 형태: { current: "75,000", diff: "500", rate: "0.67" }
    
    // 현재가 업데이트
    const priceElement = document.getElementById('realtime-price');
    if (priceElement) {
        priceElement.innerText = data.current + "원";
    }

    // 대비율 및 등락 업데이트
    const rateElement = document.getElementById('realtime-rate');
    if (rateElement) {
        // 등락 기호 설정 (+, -)
        const sign = parseFloat(data.rate) > 0 ? "+" : "";
        rateElement.innerText = `어제보다 ${sign}${data.rate}%`;

        // 색상 변경 로직 (상승: 빨강, 하락: 파랑)
        if (parseFloat(data.rate) > 0) {
            rateElement.style.color = "#ff4d4f"; // 상승 색상
        } else if (parseFloat(data.rate) < 0) {
            rateElement.style.color = "#4096ff"; // 하락 색상
        }
    }
});

// 3. 페이지를 나갈 때 서버에 알림 (스레드 정리 용도)
window.addEventListener('beforeunload', function() {
    socket.emit('leave', { code: STOCK_CODE });
});