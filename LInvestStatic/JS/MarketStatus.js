function updateMarketTimer() {
    const statusEl = document.getElementById('online-status');
    const statusT = document.getElementById("statusText");

    const now = new Date();
    const day = now.getDay(); // 0: 일, 6: 토
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hours * 100 - (-minutes);

    let statusText = '';
    let isOpen = false;  // 장이 열려있는지 닫혀있는지 판단.

    if (day == 0 || day == 6){
        isOpen = false;
        statusText = "장 종료"
    } else{
        if (currentTime >= 900 && currentTime <= 1520){
            statusText = "국내 정규장"
            isOpen = true
        } else if(currentTime >= 800 && currentTime <= 900){
            statusText = "프리마켓"
            isOpen = false;
        }
        else if(currentTime >= 1530 && currentTime <= 2000){
            statusText = "에프터마켓"
            isOpen = false;
        }
        else{
            statusText = "장 종료"
            isOpen = false;
        }
    }
    statusT.innerText = statusText
    if (isOpen){
        statusEl.className = "online-status status-open"
    }
    else{
        statusEl.className = "online-status status-close"
    }
}