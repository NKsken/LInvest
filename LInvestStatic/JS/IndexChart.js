document.addEventListener('DOMContentLoaded', () => {
    // 공통 차트 설정
    const commonChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                mode: 'index',
                intersect: false,
            }
        },
        scales: {
            x: { display: false }, // X축 (시간) 숨기기
            y: { display: false }  // Y축 (가격) 숨기기
        },
        elements: {
            point: { radius: 0 }, // 선에 달린 점 숨기기 (마우스 올릴때만 보임)
            line: { tension: 0.4 } // 선을 부드러운 곡선으로 만들기
        }
    };

    // 차트를 그리는 범용 함수
    async function drawIndexChart(canvasId, valueId, apiCode, title) {
        try {
            // [주의] 백엔드 API 라우터 구조에 맞게 URL 변경 필요
            const response = await fetch(`/api/chart/${apiCode}`);
            const data = await response.json();

            if (data && data.length > 0) {
                // 과거에서 미래로 시간순 정렬
                const sortedData = data.sort((a, b) => parseInt(a.time) - parseInt(b.time));
                
                const labels = sortedData.map(item => item.time);
                const prices = sortedData.map(item => parseFloat(item.close));

                // 현재가와 전일대비 계산 (마지막 봉과 첫 봉 비교)
                const currentPrice = prices[prices.length - 1];
                const firstPrice = prices[0];
                const diff = currentPrice - firstPrice;

                // 타이틀 업데이트 (코스피 지수 텍스트)
                const valueEl = document.getElementById(valueId);
                valueEl.innerText = currentPrice.toLocaleString(undefined, {minimumFractionDigits: 2});
                
                // 상승 하락에 따른 색상 결정
                let lineColor = '#888888';
                let gradientStart = 'rgba(136, 136, 136, 0.2)';
                
                if (diff > 0) {
                    valueEl.className = 'up';
                    lineColor = '#ff4d4f'; // 빨간색
                    gradientStart = 'rgba(255, 77, 79, 0.2)';
                } else if (diff < 0) {
                    valueEl.className = 'down';
                    lineColor = '#4096ff'; // 파란색
                    gradientStart = 'rgba(64, 150, 255, 0.2)';
                }

                // 차트 컨텍스트 및 그라데이션 효과 생성
                const ctx = document.getElementById(canvasId).getContext('2d');
                const gradient = ctx.createLinearGradient(0, 0, 0, 150);
                gradient.addColorStop(0, gradientStart);
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: prices,
                            borderColor: lineColor,
                            backgroundColor: gradient,
                            borderWidth: 2,
                            fill: true, // 선 아래 색칠하기
                        }]
                    },
                    options: commonChartOptions
                });
            }
        } catch (error) {
            console.error(`${title} 차트 로딩 실패:`, error);
            document.getElementById(valueId).innerText = "오류";
        }
    }

    // 코스피, 코스닥 차트 그리기 실행
    drawIndexChart('kospiChart', 'kospi-value', '1001', '코스피');
    drawIndexChart('kosdaqChart', 'kosdaq-value', '1002', '코스닥');
});