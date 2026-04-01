const stockInput = document.getElementById('stockInput');

if (stockInput) {
    stockInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter' && this.value.trim().length > 0) {
            // form이 자동으로 action="/search"로 제출됩니다.
            console.log("Searching for:", this.value);
        }
    });
}