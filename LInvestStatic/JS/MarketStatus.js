function updateMarketStatus() {
    const statusEl = document.getElementById('status');
    if (!statusEl) return; // 요소가 없으면 종료

    const now = new Date();
    const day = now.getDay(); // 0: 일, 6: 토
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    // 시간 계산 방식을 더 명확하게 수정 (예: 15시 30분 -> 1530)
    const currentTime = (hours * 100) + minutes;

    let statusText = '';
    let isOpen = false;
    let weekend = false;

    // 1. 주말 체크
    if (day === 0 || day === 6) {
        statusText = "휴장 (주말)";
        isOpen = false;
        weekend = true;
    } else {
        weekend = false;
        // 2. 시간대별 상태 판별
        if (currentTime >= 900 && currentTime < 1530) {
            statusText = "국내 정규장";
            isOpen = true;
        } else if (currentTime >= 800 && currentTime < 900) {
            statusText = "프리마켓";
            isOpen = false;
        } else if (currentTime >= 1530 && currentTime <= 2000) { // 보통 에프터마켓은 18시까지입니다.
            statusText = "애프터마켓";
            isOpen = false;
        } else {
            statusText = "장 종료";
            isOpen = false;
        }
    }

    // 텍스트 및 클래스 적용
    statusEl.innerText = statusText;
    if (isOpen) {
        statusEl.className = "online-status status-open";
    } else if (isOpen || !weekend){
        statusEl.className = "online-status status-close";
    } else{
        statusEl.className = "online-status status-weekend"
    }
}

// 페이지 로드 시 즉시 실행 및 1분마다 업데이트
document.addEventListener('DOMContentLoaded', () => {
    updateMarketStatus();
    setInterval(updateMarketStatus, 60000); // 1분마다 체크 (시간 표시는 없으므로 1초마다 할 필요 없음)
});