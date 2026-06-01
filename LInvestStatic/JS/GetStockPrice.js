// GetStockPrice.js

let socket = typeof io !== 'undefined' ? (window.socket || io()) : null;
if (socket) window.socket = socket;

function initStockPriceSocket() {
    const priceElement = document.getElementById('realtime-price');
    const rateElement = document.getElementById('realtime-rate');

    if (typeof NOW_PRICE !== 'undefined' && NOW_PRICE > 0) {
        if (priceElement) priceElement.innerText = NOW_PRICE.toLocaleString() + "원";
    }

    if (typeof PAST_PRICE !== 'undefined' && typeof NOW_PRICE !== 'undefined' && NOW_PRICE > 0 && PAST_PRICE > 0) {
        if (rateElement) {
            const diffPrice = NOW_PRICE - PAST_PRICE;
            const diffRate = ((diffPrice / PAST_PRICE) * 100).toFixed(2);
            const sign = diffPrice > 0 ? "+" : "";
            rateElement.innerHTML = `${sign}${diffPrice.toLocaleString()}원(${sign}${diffRate}%)`;
            if (diffPrice > 0) rateElement.style.color = "#ff4d4f"; 
            else if (diffPrice < 0) rateElement.style.color = "#4096ff"; 
            else rateElement.style.color = "#888888";
        }
    }

    // 종목 코드 방어 로직 통일
    let targetCode = typeof STOCK_CODE !== 'undefined' ? STOCK_CODE : null;
    if (!targetCode) {
        const match = window.location.href.match(/\b\d{6}\b/);
        if (match) targetCode = match[0];
    }

    if (socket && targetCode) {
        socket.emit('join', { code: targetCode });
    }

    if (socket) {
        socket.on('price_update', function(data) {
            const priceElementLive = document.getElementById('realtime-price');
            const rateElementLive = document.getElementById('realtime-rate');

            if (priceElementLive) priceElementLive.innerText = data.current + "원";

            if (rateElementLive) {
                const rateNum = parseFloat(data.rate);
                const sign = rateNum > 0 ? "+" : "";
                rateElementLive.innerHTML = `${sign}${data.diff}원(${sign}${data.rate}%)`;
                if (rateNum > 0) rateElementLive.style.color = "#ff4d4f";
                else if (rateNum < 0) rateElementLive.style.color = "#4096ff";
                else rateElementLive.style.color = "#888";
            }
            if (window.mainCandleSeries) {
                try {
                    const liveClosePrice = parseInt(data.current.replace(/,/g, ''));
                    
                    // 현재 Unix 타임스탬프 (초)
                    const currentUnix = Math.floor(Date.now() / 1000);
                    // 1분(60초) 단위로 시간을 묶음
                    const roundedTime = Math.floor(currentUnix / 60) * 60;

                    // 1. 현재 차트 시리즈에서 가장 최근(마지막) 캔들의 데이터를 가져옵니다.
                    //    (Lightweight Charts v4 API 기준)
                    const dataList = window.mainCandleSeries.data();
                    const lastCandle = dataList.length > 0 ? dataList[dataList.length - 1] : null;

                    let newCandle;

                    // 2. 만약 가장 마지막 캔들이 방금 들어온 실시간 데이터와 같은 1분(roundedTime) 내에 있다면
                    if (lastCandle && lastCandle.time === roundedTime) {
                        // 같은 1분 봉 안이므로: 시가는 유지하고 고/저/종가만 새 가격과 비교해서 갱신! (몸통이 생기는 원리)
                        newCandle = {
                            time: roundedTime,
                            open: lastCandle.open, 
                            high: Math.max(lastCandle.high, liveClosePrice), // 더 큰 가격 갱신
                            low: Math.min(lastCandle.low, liveClosePrice),   // 더 작은 가격 갱신
                            close: liveClosePrice                            // 현재가를 종가로
                        };
                    } else {
                        // 3. 시간이 지나서 새로운 1분 봉이 시작될 경우
                        // 이전 캔들의 '종가'를 이번 새 캔들의 '시가'로 부드럽게 이어받습니다.
                        const previousClose = lastCandle ? lastCandle.close : liveClosePrice;
                        
                        newCandle = {
                            time: roundedTime,
                            open: previousClose, // 점프 방지: 이전 봉의 끝점을 시작점으로
                            high: Math.max(previousClose, liveClosePrice),
                            low: Math.min(previousClose, liveClosePrice),
                            close: liveClosePrice
                        };
                    }

                    // 4. 차트에 뚱뚱해지는 캔들 데이터 밀어 넣기
                    window.mainCandleSeries.update(newCandle);
                    
                } catch (chartError) {
                    console.error("[차트 라이브 연동 에러]:", chartError);
                }
            }
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStockPriceSocket);
} else {
    initStockPriceSocket();
}