// static/js/Theme.js

function toggleTheme() {
    const checkbox = document.getElementById('checkbox');
    // 체크박스 ON -> dark, OFF -> light
    const targetTheme = checkbox.checked ? 'dark' : 'light';
    
    setTheme(targetTheme);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    const checkbox = document.getElementById('checkbox');
    const icon = document.getElementById('theme-icon');
    
    if (checkbox) {
        // theme이 'dark'일 때만 체크 표시
        checkbox.checked = (theme === 'dark');
    }
    
    if (icon) {
        // 다크모드, 라이트모드 표시
        icon.innerText = (theme === 'dark' ? '다크 모드' : '라이트 모드');
    }
}

// 초기 로드 시 실행
document.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
});