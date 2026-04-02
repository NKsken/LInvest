/**
 * 탭 전환 함수
 * @param {string} type - 'news' 또는 'dart'
 */
function showTab(type) {
    // 1. 모든 컨텐츠(.tab-content) 숨기기
    document.querySelectorAll('.tab-content').forEach(el => {
        el.style.display = 'none';
    });
    
    // 2. 모든 버튼(.tab-btn)에서 active 클래스 제거
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 3. 선택한 탭 컨텐츠 보이기
    const targetContent = document.getElementById(type + '-tab-content');
    if (targetContent) {
        targetContent.style.display = 'block';
    }

    // 4. 클릭된 버튼에 active 클래스 추가
    // event.currentTarget은 인라인 onclick에서 자동으로 전달됩니다.
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}

/**
 * 페이지 로드 시 '이전' 버튼 상태 제어
 */
document.addEventListener("DOMContentLoaded", function() {
    const prevBtn = document.querySelector(".page-btn:first-child");
    
    if (prevBtn && typeof CURRENT_PAGE !== 'undefined') {
        if (CURRENT_PAGE <= 1) {
            // 1페이지일 때는 이전 버튼을 보이지 않게 하고 클릭도 방지
            prevBtn.style.visibility = "hidden";
            prevBtn.style.pointerEvents = "none";
        } else {
            prevBtn.style.visibility = "visible";
            prevBtn.style.pointerEvents = "auto";
        }
    }
});

/**
 * 페이지 이동 함수 (쿼리 파라미터 업데이트)
 * @param {number} step - 이동할 페이지 단계 (-1 또는 1)
 */
function changePage(step) {
    if (typeof CURRENT_PAGE === 'undefined') return;
    
    let newPage = CURRENT_PAGE + step;
    
    if (newPage < 1) return; // 1페이지 미만 이동 방지
    
    // 현재 경로에 page 파라미터를 붙여서 이동
    const currentPath = window.location.pathname;
    window.location.href = `${currentPath}?page=${newPage}`;
}