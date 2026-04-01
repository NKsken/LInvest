const input = document.getElementById("stockInput");
const listContainer = document.getElementById("autocomplete-list");

input.addEventListener("input", function() {
    const val = this.value;
    listContainer.innerHTML = ''; 
    
    if (!val) { 
        listContainer.style.display = "none";
        return; 
    }

    // 1. 종목명 리스트 추출
    const names = Object.keys(stockData);

    // 2. 입력값이 포함된 종목 필터링
    const matches = names.filter(name => name.includes(val)).slice(0, 10);

    if (matches.length > 0) {
        matches.forEach(name => {
            const item = document.createElement("div");
            item.className = "autocomplete-item";
            
            // 3. 해당 종목명에 맞는 코드를 가져옴
            const code = stockData[name];

            // 4. 화면에 종목명과 코드를 함께 출력
            item.innerHTML = `
                <span>${name}</span>
                <span class="item-code">${code}</span>
            `;
            
            item.addEventListener("click", function() {
                input.value = name;
                input.form.submit();
            });
            listContainer.appendChild(item);
        });
        listContainer.style.display = "block";
    } else {
        listContainer.style.display = "none";
    }
});