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
// NewsPage.js
async function changePage(offset) {
    // 1. 현재 페이지와 종목 코드 가져오기
    // HTML에 <p class="compCode">{{code}}</p> 같은 요소가 있다고 가정
    const stockCode = document.querySelector('.compCode')?.innerText || ""; 
    const nextPage = CURRENT_PAGE + offset;

    if (nextPage < 1) return;

    try {
        // 2. 여기서 Flask에 작성한 /api/news를 호출합니다 (이게 핵심!)
        const response = await fetch(`/api/news?code=${stockCode}&page=${nextPage}`);
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();

        if (data.success) {
            // 3. 화면의 뉴스 리스트만 갈아끼우기
            const newsListUl = document.getElementById('news-list');
            newsListUl.innerHTML = data.news_list.map(news => `
                <li>
                    <div class="meta-info">
                        <span class="source-tag">${news.source}</span>
                        <span class="date-tag">${news.date}</span>
                    </div>
                    <a href="${news.link}" target="_blank" class="news-title">${news.title}</a>
                </li>
            `).join('');

            // 4. 페이지 번호 상태 업데이트 (새로고침 없이)
            CURRENT_PAGE = nextPage;
            document.getElementById('current-page-num').innerText = CURRENT_PAGE;

            // 5. 버튼 가시성 제어
            const prevBtn = document.querySelector('.page-btn:first-child');
            if (prevBtn) {
                prevBtn.style.visibility = (CURRENT_PAGE <= 1) ? 'hidden' : 'visible';
                prevBtn.style.pointerEvents = (CURRENT_PAGE <= 1) ? 'none' : 'auto';
            }
        }
    } catch (e) {
        console.error("비동기 뉴스 로딩 실패:", e);
    }
}

