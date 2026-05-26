async function initChart() {
    // flaskStockCode는 stock.html에서 선언된 변수입니다.
    const stockCode = flaskStockCode; 

    try {
        const response = await fetch(`/api/chart/${stockCode}`);
        const result = await response.json();
        
        if (!result.success || !result.data || result.data.length === 0) {
            console.log("데이터 없음");
            return;
        }

        const labels = result.data.map(item => item.date);
        const prices = result.data.map(item => item.close);

        const ctx = document.getElementById('stockChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '종가',
                    data: prices,
                    borderColor: '#0062FF',
                    borderWidth: 2,
                    fill: false
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    } catch (error) {
        console.error("차트 오류:", error);
    }
}

document.addEventListener("DOMContentLoaded", initChart);