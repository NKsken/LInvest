/**
 * 탭 전환 함수
 * @param {string} type - 'news' 또는 'dart'
 */
function showTab(type) {
    // 모든 컨텐츠 숨기기
    document.querySelectorAll('.tab-content').forEach(el => {
        el.style.display = 'none';
    });
    
    // 모든 버튼 비활성화
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 선택한 탭 보이기 및 버튼 활성화
    const targetContent = document.getElementById(type + '-tab-content');
    if (targetContent) {
        targetContent.style.display = 'block';
    }
    event.currentTarget.classList.add('active');
}

document.addEventListener("DOMContentLoaded", function() {
    const prevBtn = document.querySelector(".page-btn:first-child");
    
    if (prevBtn) {
        if (CURRENT_PAGE <= 1) {
            // 공간은 남겨두고 모습만 숨깁니다.
            prevBtn.style.visibility = "hidden";
            prevBtn.style.pointerEvents = "none"; // 클릭 방지
        } else {
            prevBtn.style.visibility = "visible";
            prevBtn.style.pointerEvents = "auto";
        }
    }
});

/**
 * 페이지 이동 함수
 */
function changePage(step) {
    let newPage = CURRENT_PAGE + step;
    
    if (newPage < 1) return;
    
    const currentPath = window.location.pathname;
    window.location.href = `${currentPath}?page=${newPage}`;
}