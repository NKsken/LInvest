async function initChart() {
    const stockCode = flaskStockCode; 

    try {
        const response = await fetch(`/api/chart/${stockCode}`);
        const result = await response.json();
        
        if (!result.success || result.data.length === 0) return;

        // 1. 차트가 들어갈 DIV 요소 찾기
        const chartContainer = document.getElementById('stockChart');
        
        // 2. TradingView 차트 껍데기 생성
        const chart = LightweightCharts.createChart(chartContainer, {
            layout: {
                background: { type: 'solid', color: 'transparent' }, // 배경 투명 (다크모드 대응)
                textColor: '#5f6d84',
            },
            grid: {
                vertLines: { color: '#eef2f6' },
                horzLines: { color: '#eef2f6' },
            },
            rightPriceScale: {
                borderVisible: false, // 테두리 선 숨김
            },
            timeScale: {
                borderVisible: false,
            },
        });

        // 3. 캔들스틱 차트 추가 (한국식 색상 적용)
        const candleSeries = chart.addCandlestickSeries({
            upColor: '#f44336',       // 상승 캔들 (빨강)
            downColor: '#2196f3',     // 하락 캔들 (파랑)
            borderVisible: false,
            wickUpColor: '#f44336',   // 상승 꼬리 (빨강)
            wickDownColor: '#2196f3', // 하락 꼬리 (파랑)
        });

        // 4. KIS_API에서 받아온 OHLC 데이터 넣기
        candleSeries.setData(result.data);

        // 5. 화면 크기가 변할 때 차트 사이즈 자동 조절 (반응형)
        new ResizeObserver(entries => {
            if (entries.length === 0 || entries[0].target !== chartContainer) { return; }
            const newRect = entries[0].contentRect;
            chart.applyOptions({ height: newRect.height, width: newRect.width });
        }).observe(chartContainer);

        // 차트가 화면에 딱 맞게 꽉 차도록 설정
        chart.timeScale().fitContent();

    } catch (error) {
        console.error("차트를 그리는 중 오류 발생:", error);
    }
}

document.addEventListener("DOMContentLoaded", initChart);