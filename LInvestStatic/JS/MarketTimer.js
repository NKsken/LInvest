function updateMarketTimer() {
    const now = new Date();
    const day = now.getDay(); // 0: 일, 6: 토
    const display = document.getElementById('countdown');

    // 1. 주말 체크 (토요일=6, 일요일=0)
    if (day === 0 || day === 6) {
        display.innerText = "시장 휴장 (주말)";
        return;
    }

    // 2. 장 종료 시간 설정 (오후 3시 30분)
    const closeTime = new Date();
    closeTime.setHours(15, 30, 0);

    // 3. 현재 시간과 종료 시간 비교
    const diff = closeTime - now;

    if (diff > 0) {
        // 장 중일 때: 남은 시간 계산
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        // 한 자리 수일 때 앞에 0 붙이기
        const h = hours < 10 ? '0' + hours : hours;
        const m = minutes < 10 ? '0' + minutes : minutes;
        const s = seconds < 10 ? '0' + seconds : seconds;

        display.innerText = `${h}:${m}:${s}`;
    } else {
        // 장 종료 후 또는 장 시작 전 (오전 9시 이전 체크 로직 추가 가능)
        if (now.getHours() < 9) {
            display.innerText = "장 시작 대기 중";
        } else {
            display.innerText = "오늘 장 종료";
            display.style.color = "var(--gray-400)";
        }
    }
}

// 1초마다 업데이트
setInterval(updateMarketTimer, 1000);
// 페이지 로드 시 즉시 실행
window.onload = updateMarketTimer;