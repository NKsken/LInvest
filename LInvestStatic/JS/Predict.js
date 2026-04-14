async function runPrediction(stockCode) {
    const statusContainer = document.getElementById('predict-status');
    const gaugeBar = document.getElementById('gauge-bar');
    
    if (!statusContainer || !gaugeBar) return;

    // 1. 상태 초기화
    statusContainer.innerHTML = `<p>분석 중...</p><div class="loader"></div>`;
    gaugeBar.style.width = '0%';
    gaugeBar.style.left = '50%';
    gaugeBar.className = 'gauge-bar'; 

    try {
        const response = await fetch('/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: stockCode })
        });

        // 응답 자체가 JSON이 아닌 경우(에러 페이지 등)를 대비
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("서버에서 올바른 응답을 받지 못했습니다. (JSON 형식 아님)");
        }

        const data = await response.json();

        if (data.status === "success") {
            const diff = parseFloat(data.diff);
            const isUp = diff >= 0;
            
            const limitedDiff = Math.max(-30, Math.min(30, diff));
            const widthPercentage = (Math.abs(limitedDiff) / 30) * 50;
            const leftPos = isUp ? '50%' : (50 - widthPercentage) + '%';
            
            gaugeBar.classList.add(isUp ? 'gauge-up' : 'gauge-down');
            setTimeout(() => {
                gaugeBar.style.left = leftPos;
                gaugeBar.style.width = widthPercentage + '%';
            }, 50);

            statusContainer.innerHTML = `
                <p style="font-size: 16px; font-weight: bold;">내일은 ${diff}% ${isUp ? '상승' : '하락'}이 예상됩니다.</p>
                <p class = "predicted-value">어제보다 ${isUp ? '+' : '-'}${diff}%로 예측되었어요</p>
                <button onclick="runPrediction('${stockCode}')" class="tab-btn active" style="margin-top: 15px;">재시도</button>
            `;
        } else {
            statusContainer.innerHTML = `
                <p class = "predicted-value">어제보다 +0.00%로 예측되었어요</p>
                <p class="empty-msg" style="color: var(--gray-400);">${data.text || '예측할 수 없습니다.'}</p>
                <button onclick="runPrediction('${stockCode}')" class="tab-btn active" style="margin-top: 15px;">재시도</button>
            `;
        }
    } catch (error) {
        console.error("Prediction error:", error);
        statusContainer.innerHTML = `
            <p class = "predicted-value">어제보다 +0.00%로 예측되었어요</p>
            <p class="empty-msg" style="font-size: 12px;">오류: ${error.message}</p>
            <button onclick="runPrediction('${stockCode}')" class="tab-btn active" style="margin-top: 15px;">재시도</button>
        `;
    }
}
// 예측 결과를 화면에 그리는 전용 함수
function renderPredictionUI(diff, isUp) {
    const statusContainer = document.getElementById('predict-status');
    const gaugeBar = document.getElementById('gauge-bar');
    
    // 현재 종가(가정) - 실제 데이터가 있다면 서버에서 받아와야 합니다.
    // 여기서는 예시로 '199,000'원을 기준으로 계산하는 로직을 넣거나 문구만 처리합니다.
    const mockPrice = 199000; 
    const predictedPrice = Math.round(mockPrice * (1 + diff / 100));

    // 게이지 업데이트
    const limitedDiff = Math.max(-30, Math.min(30, diff));
    const widthPercentage = (Math.abs(limitedDiff) / 30) * 50;
    const leftPos = isUp ? '50%' : (50 - widthPercentage) + '%';
    
    gaugeBar.className = 'gauge-bar ' + (isUp ? 'gauge-up' : 'gauge-down');
    gaugeBar.style.left = leftPos;
    gaugeBar.style.width = widthPercentage + '%';
}

async function runPrediction(stockCode) {
    const statusContainer = document.getElementById('predict-status');
    statusContainer.innerHTML = `<p>AI 분석 중...</p><div class="loader"></div>`;

    try {
        const response = await fetch('/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: stockCode })
        });
        const data = await response.json();

        if (data.status === "success") {
            const diff = parseFloat(data.diff);
            const isUp = diff >= 0;

            // 1. 세션 저장소에 저장 (새로고침해도 유지되도록)
            const predData = { diff, isUp, timestamp: new Date().getTime() };
            sessionStorage.setItem(`pred_${stockCode}`, JSON.stringify(predData));

            // 2. UI 그리기
            renderPredictionUI(diff, isUp);
        } else {
            statusContainer.innerHTML = `<p class="empty-msg">${data.text}</p>`;
        }
    } catch (error) {
        statusContainer.innerHTML = `<p class="empty-msg">서버 연결 실패</p>`;
    }
}