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