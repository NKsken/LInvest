import urllib.request
import json
import re
from dotenv import load_dotenv
import os

class NewsManager:
    def __init__(self):
        load_dotenv()
        self.NAVER_KEY = os.getenv("NAVER_KEY") 
        self.NAVER_SECRET = os.getenv("NAVER_SECRET") 
        self.press_data = {}
        with open('Press_List.json', 'r', encoding='utf-8') as f:
            self.press_data = json.load(f)

    def get_stock_news(self, stock_name, display_count=5, start_index=1):
        """
        start_index: 검색 시작 위치 (최대 1000)
        """
        encText = urllib.parse.quote(stock_name)
        # start 파라미터 추가
        url = f"https://openapi.naver.com/v1/search/news.json?query={encText}&display={display_count}&start={start_index}&sort=sim"
        
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
            'date': item['pubDate'][:16]
        }