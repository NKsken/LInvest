function goToPredict() {
    const code = document.getElementById('stockInput').value;
        if (code.trim().length > 0) {
            window.location.href = "/" + code;
        } 
        }

        document.getElementById('stockInput').addEventListener('keypress', function (e) {
            if (e.key === 'Enter') goToPredict();
        });