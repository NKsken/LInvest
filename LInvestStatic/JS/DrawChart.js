// DrawChart.js

// 1. 전역 인스턴스로 관리하여 실시간 테마 전환기(Observer)가 언제든 접근할 수 있게 합니다.
let globalChartInstance = null;
let globalCandleSeriesInstance = null;

async function initTradingViewChart() {
    const container = document.getElementById('tv_chart_container');
    if (!container) {
        console.error("tv_chart_container 요소를 찾을 수 없습니다.");
        return;
    }

    const parentContainer = container.parentElement;
    const initialWidth = container.clientWidth || 700;
    const initialHeight = parentContainer.clientHeight || 450; 
    
    container.innerHTML = ''; // 중복 생성 방지 청소

    // 2. [실시간 연동 핵심] stock.css의 실제 변수값을 읽어오는 함수 정의
    function getThemeColors() {
        const cssVars = getComputedStyle(document.documentElement);
        return {
            bgColor: cssVars.getPropertyValue('--bg-color').trim() || '#ffffff',
            textColor: cssVars.getPropertyValue('--dark-navy').trim() || '#333333',
            gridColor: cssVars.getPropertyValue('--border-color').trim() || '#eef2f6',
            upRed: cssVars.getPropertyValue('--up-red').trim() || '#ff8484',
            downBlue: cssVars.getPropertyValue('--down-blue').trim() || '#0062FF'
        };
    }

    let colors = getThemeColors();

    // 3. 부모의 100% 크기로 차트 초기화
    const chart = LightweightCharts.createChart(container, {
        width: initialWidth,
        height: initialHeight,
        layout: {
            background: { type: 'solid', color: colors.bgColor },
            textColor: colors.textColor,
        },
        grid: {
            vertLines: { color: colors.gridColor },
            horzLines: { color: colors.gridColor },
        },
        timeScale: {
            timeVisible: true,
            secondsVisible: false,
        }
    });

    // 4. 캔들스틱 데이터 시리즈 추가
    const candleSeries = chart.addCandlestickSeries({
        upColor: colors.upRed,
        downColor: colors.downBlue,
        borderUpColor: colors.upRed,
        borderDownColor: colors.downBlue,
        wickUpColor: colors.upRed,
        wickDownColor: colors.downBlue,
    });

    // 테마 체인저가 인지할 수 있도록 전역 저장
    globalChartInstance = chart;
    globalCandleSeriesInstance = candleSeries;

    // 창 크기 변동 시 자동 대응
    window.addEventListener('resize', () => {
        chart.resize(container.clientWidth, parentContainer.clientHeight || 450);
    });

    // 5. [F5 생략의 주역] MutationObserver 설정
    // 사용자가 웹 화면에서 테마 토글(클릭)을 할 때 HTML/BODY 태그의 클래스 변화를 실시간으로 감시합니다.
    const themeObserver = new MutationObserver(() => {
        if (!globalChartInstance || !globalCandleSeriesInstance) return;
        
        // 바뀐 CSS 테마 색깔을 즉시 재계산
        const newColors = getThemeColors();
        
        // 차트 옵션에 즉시 때려 박기 (새로고침 불필요)
        globalChartInstance.applyOptions({
            layout: {
                background: { type: 'solid', color: newColors.bgColor },
                textColor: newColors.textColor
            },
            grid: {
                vertLines: { color: newColors.gridColor },
                horzLines: { color: newColors.gridColor }
            }
        });

        // 캔들 옵션도 즉시 때려 박기
        globalCandleSeriesInstance.applyOptions({
            upColor: newColors.upRed,
            downColor: newColors.downBlue,
            borderUpColor: newColors.upRed,
            borderDownColor: newColors.downBlue,
            wickUpColor: newColors.upRed,
            wickDownColor: newColors.downBlue,
        });
    });

    // HTML 속성 변경점 추적 시작
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] });

    // 6. Flask REST API 백엔드 데이터 동기화
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
            console.log("TradingView 100% 실시간 테마 감지 차트 셋팅 대성공!");
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