<<<<<<< HEAD
    // 현재 페이지의 종목 코드 (Flask 변수 바인딩)
    const stockCode = "{{ code }}"; 

    async function initChart() {
        try {
            // 1. 백엔드 API로부터 최근 30일 데이터 요청
            const response = await fetch(`/api/chart/${stockCode}`);
            const result = await response.json();
            
            if (!result.success || result.data.length === 0) return;

            const labels = result.data.map(item => item.date);  // 날짜 배열
            const prices = result.data.map(item => item.close); // 종가 배열

            // 2. Chart.js 설정 및 렌더링
            const ctx = document.getElementById('stockChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: '종가 (원)',
                        data: prices,
                        borderColor: '#0062FF', // 브랜드 메인 블루 컬러
                        backgroundColor: 'rgba(0, 98, 255, 0.05)',
                        borderWidth: 2,
                        pointRadius: 2,
                        tension: 0.1, // 선의 부드러움 정도
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            grid: { display: false } // X축 격자 숨기기
                        },
                        y: {
                            grid: { color: '#eef2f6' },
                            ticks: {
                                callback: function(value) {
                                    return value.toLocaleString() + '원'; // Y축 단위 컴마 포맷팅
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: { display: false } // 범례 숨겨서 깔끔하게 처리
                    }
                }
            });
        } catch (error) {
            console.error("차트를 그리는 중 오류 발생:", error);
        }
    }

    // 페이지 로드 시 차트 초기화 함수 실행
    document.addEventListener("DOMContentLoaded", initChart);
=======
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
>>>>>>> f5769a6544e5ae0ca087ed3899aef820f3b4b3b3
