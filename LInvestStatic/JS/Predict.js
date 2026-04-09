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
                <button onclick="runPrediction('${stockCode}')" class="tab-btn active" style="margin-top: 15px;">재시도</button>
            `;
        } else {
            statusContainer.innerHTML = `
                <p class="empty-msg" style="color: var(--gray-400);">${data.text || '예측할 수 없습니다.'}</p>
                <button onclick="runPrediction('${stockCode}')" class="tab-btn active" style="margin-top: 15px;">재시도</button>
            `;
        }
    } catch (error) {
        console.error("Prediction error:", error);
        statusContainer.innerHTML = `
            <p class="empty-msg" style="font-size: 12px;">오류: ${error.message}</p>
            <button onclick="runPrediction('${stockCode}')" class="tab-btn active" style="margin-top: 15px;">재시도</button>
        `;
    }
}