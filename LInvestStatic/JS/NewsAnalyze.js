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
    
        if (!response.ok){
            throw new Error(`서버 에러. (상태 : ${response.status}`);
        }
        const data = await response.json();
    } catch (error){
        console.error(error);
        alert("서버 통신에 실패했어요");
    } finally{
        btn.disabled = false;
        btn.innerText = "뉴스 분석";
    }
}