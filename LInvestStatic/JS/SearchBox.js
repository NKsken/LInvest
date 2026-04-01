// Flask에서 넘겨준 stock_names 데이터를 JS 변수로 받아야 합니다.
// index.html 하단에 <script>const stockNames = {{ stock_names|tojson }};</script> 추가 필요

const input = document.getElementById("stockInput");
const listContainer = document.getElementById("autocomplete-list");

input.addEventListener("input", function() {
    const val = this.value;
    listContainer.innerHTML = ''; // 이전 결과 초기화
    
    if (!val) { 
        listContainer.style.display = "none";
        return; 
    }

    // 입력값과 일치하는 종목 필터링 (최대 10개만)
    const matches = stockNames.filter(name => name.includes(val)).slice(0, 10);

    if (matches.length > 0) {
        matches.forEach(name => {
            const item = document.createElement("div");
            item.className = "autocomplete-item";
            item.innerHTML = `<span>${name}</span><span class="item-code">KOSPI/KOSDAQ</span>`;
            
            // 클릭 시 해당 종목으로 바로 이동
            item.addEventListener("click", function() {
                input.value = name;
                input.form.submit(); // 폼 제출
            });
            listContainer.appendChild(item);
        });
        listContainer.style.display = "block";
    } else {
        listContainer.style.display = "none";
    }
});

// 외부 클릭 시 리스트 닫기
document.addEventListener("click", function (e) {
    if (e.target !== input) {
        listContainer.style.display = "none";
    }
});