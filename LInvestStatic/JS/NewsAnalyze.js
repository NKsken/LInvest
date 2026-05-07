async function runNewsAnalyze(){
    const btn = document.getElementById("newscollect-btn");
    const originaltext = btn.innerText;

    btn.disabled = true;
    btn.innerText = "분석중";

    try{
        const response = await fetch('/code/api/analyze-news', {
            method: 'POST',
            headers: { "Content-Type": 'application/json' },
            body: JSON.stringify({ code: STOCK_CODE })
        });
    } catch{
        alert("서버 통신 실패");
    } finally{
        btn.disabled = false;
        btn.innerText = "뉴스 분석";
    }
}