import urllib.request
import json
import re
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta

class NewsManager:
    def __init__(self):
        load_dotenv()
        self.NAVER_KEY = os.getenv("NAVER_KEY") 
        self.NAVER_SECRET = os.getenv("NAVER_SECRET") 
        self.press_data = {}
        with open('Press_List.json', 'r', encoding='utf-8') as f:
            self.press_data = json.load(f)

    def _format_date(self, date_str):
        """RFC 822 날짜 형식을 한글 상대 날짜로 변환"""
        try:
            # 네이버 API 날짜 포맷 파싱
            api_date = datetime.strptime(date_str, '%a, %d %b %Y %H:%M:%S +0900')
            now = datetime.now()
            diff = now - api_date

            if diff < timedelta(minutes=1):
                return "방금 전"
            elif diff < timedelta(hours=1):
                return f"{diff.seconds // 60}분 전"
            elif diff < timedelta(days=1):
                return f"{diff.seconds // 3600}시간 전"
            elif diff < timedelta(days=7):
                return f"{diff.days}일 전"
            else:
                return api_date.strftime('%Y년 %m월 %d일')
        except:
            return date_str # 변환 실패 시 원본 반환

    def get_stock_news(self, stock_name, display_count=5, start_index=1):
        """
        start_index: 검색 시작 위치 (최대 1000)
        """
        encText = urllib.parse.quote(stock_name)
        # start 파라미터 추가
        url = f"https://openapi.naver.com/v1/search/news.json?query={encText}&display={display_count}&start={start_index}&sort=date"
        
        request = urllib.request.Request(url)
        request.add_header("X-Naver-Client-Id", self.NAVER_KEY)
        request.add_header("X-Naver-Client-Secret", self.NAVER_SECRET)
        
        try:
            response = urllib.request.urlopen(request)
            if response.getcode() == 200:
                data = json.loads(response.read().decode('utf-8'))
                return {
                    'items': [self._process_item(item) for item in data['items']],
                    'total': data['total'] # 전체 결과 개수 (페이징 계산용)
                }
            return {'items': [], 'total': 0}
        except Exception as e:
            print(f"News API Error: {e}")
            return {'items': [], 'total': 0}

    def _clean_item(self, item):
        """HTML 태그와 특수 문자를 제거하여 깔끔한 데이터를 만듭니다."""
        # <b>, </b>, &quot; 등을 정규식과 replace로 제거
        title = re.sub(r'<[^>]+>', '', item['title'])
        title = title.replace('&quot;', '"').replace('&apos;', "'").replace('&amp;', '&')
        return {
            'title': title,
            'link': item['link'],
            'pubDate': item['pubDate'] # 날짜 정보도 추가
        }
    
    def _process_item(self, item):
        # 제목 클리닝
        title = re.sub(r'<[^>]+>', '', item['title'])
        title = title.replace('&quot;', '"').replace('&apos;', "'").replace('&amp;', '&')

        # 원문 링크(originallink)가 있으면 그것을 사용하여 도메인 판별
        link_to_check = item.get('originallink', item.get('link', ''))

        source = "뉴스"
        for domain, name in self.press_data.items():
            if domain in link_to_check:
                source = name
                break

        return {
            'title': title,
            'link': item['link'], # 사용자가 클릭 시 이동할 링크
            'source': source,
            'date': self._format_date(item['pubDate']) # 한글 변환 적용
        }