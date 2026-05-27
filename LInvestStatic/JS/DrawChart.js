// DrawChart.js
async function initTradingViewChart() {
    const container = document.getElementById('tv_chart_container');
    if (!container) {
        console.error("tv_chart_container 요소를 찾을 수 없습니다.");
        return;
    }

    // 1. [핵심] 부모 컨테이너(.chart-container)의 현재 렌더링된 높이를 동적으로 가져옵니다.
    // 부모 높이가 제대로 안 잡혀있을 때를 대비해 기본값(450)을 백업으로 둡니다.
    const parentContainer = container.parentElement;
    const initialWidth = container.clientWidth || 700;
    const initialHeight = parentContainer.clientHeight || 450; 
    
    container.innerHTML = ''; // 중복 생성 방지 청소

    // 2. 부모의 100% 크기로 차트 초기화
    const chart = LightweightCharts.createChart(container, {
        width: initialWidth,
        height: initialHeight, // 100% 높이 반영
        layout: {
            background: { type: 'solid', color: 'var(--background-color)' },
            textColor: 'var(--text-main)',
        },
        grid: {
            vertLines: { color: 'var(--text-sub)' },
            horzLines: { color: 'var(--text-sub)' },
        },
        timeScale: {
            timeVisible: true,
            secondsVisible: false,
        }
    });

    // 3. 캔들스틱 시리즈 추가
    const candleSeries = chart.addCandlestickSeries({
        upColor: '#ef5350',
        downColor: '#26a69a',
        borderUpColor: '#ef5350',
        borderDownColor: '#26a69a',
        wickUpColor: '#ef5350',
        wickDownColor: '#26a69a',
    });

    // 4. [핵심] 브라우저 창 크기가 변할 때, 높이와 너비 모두 부모의 100%로 재조정합니다.
    window.addEventListener('resize', () => {
        chart.resize(container.clientWidth, parentContainer.clientHeight || 450);
    });

    // 5. Flask REST API 백엔드 데이터 동기화
    const stockCode = flaskStockCode;
    try {
        const response = await fetch(`/api/chart/${stockCode}`);
        const result = await response.json();
        
        let chartData = [];
        if (result && result.success && Array.isArray(result.data)) {
            chartData = result.data;
        } else if (Array.isArray(result)) {
            chartData = result;
        }

        if (chartData && chartData.length > 0) {
            candleSeries.setData(chartData);
            window.mainCandleSeries = candleSeries;
            console.log("TradingView 100% 반응형 차트 로드 완료!");
        } else {
            console.warn("차트 데이터 포맷 오류 또는 빈 배열");
        }
    } catch (error) {
        console.error("백엔드 차트 API 통신 실패:", error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", initTradingViewChart);
} else {
    initTradingViewChart();
}