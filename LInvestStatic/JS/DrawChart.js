// DrawChart.js

let globalChartInstance = null;
let globalCandleSeriesInstance = null;

async function initTradingViewChart() {
    const container = document.getElementById('tv_chart_container');
    if (!container) return;

    const parentContainer = container.parentElement;
    const initialWidth = container.clientWidth || 700;
    const initialHeight = parentContainer.clientHeight || 450; 
    
    container.innerHTML = ''; 

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

    const candleSeries = chart.addCandlestickSeries({
        upColor: colors.upRed,
        downColor: colors.downBlue,
        borderUpColor: colors.upRed,
        borderDownColor: colors.downBlue,
        wickUpColor: colors.upRed,
        wickDownColor: colors.downBlue,
    });

    globalChartInstance = chart;
    globalCandleSeriesInstance = candleSeries;

    window.addEventListener('resize', () => {
        chart.resize(container.clientWidth, parentContainer.clientHeight || 450);
    });

    const themeObserver = new MutationObserver(() => {
        if (!globalChartInstance || !globalCandleSeriesInstance) return;
        const newColors = getThemeColors();
        
        globalChartInstance.applyOptions({
            layout: { background: { type: 'solid', color: newColors.bgColor }, textColor: newColors.textColor },
            grid: { vertLines: { color: newColors.gridColor }, horzLines: { color: newColors.gridColor } }
        });

        globalCandleSeriesInstance.applyOptions({
            upColor: newColors.upRed, downColor: newColors.downBlue,
            borderUpColor: newColors.upRed, borderDownColor: newColors.downBlue,
            wickUpColor: newColors.upRed, wickDownColor: newColors.downBlue,
        });
    });

    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] });

    // [수정 핵심 1] 오직 "숫자 6자리"만 종목코드로 확실하게 인식합니다.
    let stockCode = "";
    if (typeof STOCK_CODE !== 'undefined' && STOCK_CODE) {
        stockCode = STOCK_CODE;
    } else {
        const match = window.location.href.match(/\b\d{6}\b/);
        if (match) stockCode = match[0];
    }

    if (!stockCode) {
        console.error("❌ 종목코드를 찾을 수 없어 차트를 그릴 수 없습니다.");
        return;
    }

    try {
        const response = await fetch(`/api/chart/${stockCode}`);
        const result = await response.json();
        
        let chartData = [];
        if (Array.isArray(result)) chartData = result;
        else if (result && Array.isArray(result.data)) chartData = result.data;

        if (chartData.length > 0) {
            const uniqueTimes = new Set();
            const validatedData = [];
            
            // [수정 핵심 2] TradingView가 에러를 뿜는 '중복 시간 데이터' 강제 제거 및 안전한 숫자 파싱
            chartData.forEach(item => {
                const t = parseInt(item.time);
                if (!isNaN(t) && !uniqueTimes.has(t)) {
                    uniqueTimes.add(t);
                    validatedData.push({
                        time: t, 
                        open: Number(item.open),
                        high: Number(item.high),
                        low: Number(item.low),
                        close: Number(item.close)
                    });
                }
            });

            // 과거 -> 미래 순서로 무조건 오름차순 정렬
            validatedData.sort((a, b) => a.time - b.time);

            try {
                candleSeries.setData(validatedData);
                window.mainCandleSeries = candleSeries;
                console.log(`차트 로드 성공(정상 캔들: ${validatedData.length}개)`);
                // 차트 데이터를 그린 후 최신 봉(우측 끝)으로 자동 스크롤
                chart.timeScale().scrollToPosition(0, false);
                
                // 차트 배율 수정
                const defaultVisibleCandles = 30;
                chart.timeScale().setVisibleLogicalRange({
                    from: validatedData.length - defaultVisibleCandles,
                    to: validatedData.length - 1
                });
            } catch (err) {
                console.error("차트 setData 실패 (데이터 규칙 위반):", err);
            }
        } else {
            console.warn("백엔드에서 넘어온 차트 데이터가 0개입니다. (장이 안 열렸거나 에러)");
        }
    } catch (error) {
        console.error("백엔드 통신 실패:", error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", initTradingViewChart);
} else {
    initTradingViewChart();
}