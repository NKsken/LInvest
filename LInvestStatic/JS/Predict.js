function renderPredictionUI(stockCode, diff, isUp) {
    const statusContainer = document.getElementById('predict-status');
    const gaugeBar = document.getElementById('gauge-bar');
    
    // [수정된 부분] 계산의 기준이 되는 가격을 전일 종가로 설정합니다.
    const basePrice = typeof PAST_PRICE !== 'undefined' ? PAST_PRICE : 0;
    
    // 변동 금액 계산: 전일 종가 * (예측퍼센트 / 100)
    const wonDiff = Math.abs(Math.round(basePrice * (diff / 100)));
    const wonDiffFormatted = wonDiff.toLocaleString(); // 세자리 콤마 추가
    
    if (!statusContainer || !gaugeBar) return;

    // 1. 게이지 수치 계산 및 최소 너비 보정
    const limitedDiff = Math.max(-30, Math.min(30, diff));
    let widthPercentage = (Math.abs(limitedDiff) / 30) * 50;
    if (widthPercentage > 0 && widthPercentage < 2) widthPercentage = 2;
    
    const leftPos = isUp ? '50%' : (50 - widthPercentage) + '%';
    const targetColor = isUp ? '#f44336' : '#2196f3'; 
    const actionText = isUp ? '오를' : '내릴'; // 상승/하락 문구 선택

    // 2. 애니메이션 초기화 및 실행
    gaugeBar.style.transition = 'none';
    gaugeBar.style.width = '0%';
    gaugeBar.style.left = '50%';
    gaugeBar.style.backgroundColor = '#adb5bd';
    
    setTimeout(() => {
        gaugeBar.style.transition = 'all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)';
        gaugeBar.style.width = widthPercentage + '%';
        gaugeBar.style.left = leftPos;
        gaugeBar.style.backgroundColor = targetColor;
    }, 50);

    // 3. 결과 텍스트 업데이트
    statusContainer.innerHTML = `
        <div style="animation: fadeIn 0.5s ease-out;">
            <p class="predicted-value-enabled">
                어제 종가보다 <span style="font-weight:bold; color:${targetColor}">${isUp ? '+' : ''}${diff.toFixed(2)}%</span>로 예측되어<br>
                <span style="font-weight:bold; color:${targetColor}">${wonDiffFormatted}원</span> ${actionText}것 같아요
            </p>
            <button onclick="runPrediction('${stockCode}')" class="tab-btn active" style="margin-top: 15px;">재분석</button>
        </div>
    `;
}

async function runPrediction(stockCode) {
    const statusContainer = document.getElementById('predict-status');
    const gaugeBar = document.getElementById('gauge-bar');
    
    if (!statusContainer || !gaugeBar) return;

    // 초기 상태: 로딩 표시
    statusContainer.innerHTML = `<p style="padding-top:100px;">분석 중...</p><div class="loader"></div>`;
    gaugeBar.style.width = '0%';
    gaugeBar.style.left = '50%';
    gaugeBar.className = 'gauge-bar';

    try {
        const response = await fetch('/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: stockCode })
        });

        if (!response.ok) throw new Error("서버 응답 오류");

        const data = await response.json();

        if (data.status === "success") {
            const diff = parseFloat(data.diff);
            const isUp = diff >= 0;

            // 세션 저장소에 저장 (새로고침 유지용)
            const predData = { diff, isUp, timestamp: new Date().getTime() };
            sessionStorage.setItem(`pred_${stockCode}`, JSON.stringify(predData));

            // UI 그리기 호출
            renderPredictionUI(stockCode, diff, isUp);
        } else {
            // 서버에서 실패 응답을 보낸 경우 (데이터 부족 등)
            statusContainer.innerHTML = `
                <p class="predicted-value-disabled">어제보다 +0.00%로 예측되었어요</p>
                <p class="empty-msg" style="color: #888;">${data.text || '데이터가 부족하여 예측할 수 없습니다.'}</p>
                <button onclick="runPrediction('${stockCode}')" class="tab-btn active" style="margin-top: 15px;">재시도</button>
            `;
        }
    } catch (error) {
        console.error("Prediction error:", error);
        statusContainer.innerHTML = `
            <p class="predicted-value-disabled">분석에 실패했습니다</p>
            <p class="empty-msg" style="font-size: 12px;">원인: ${error.message}</p>
            <button onclick="runPrediction('${stockCode}')" class="tab-btn active" style="margin-top: 15px;">재시도</button>
        `;
    }
}