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

    def get_stock_news(self, code, display_count=5):
        """네이버 뉴스 API를 통해 뉴스 리스트를 반환합니다."""
        encText = urllib.parse.quote(code)
        url = f"https://openapi.naver.com/v1/search/news.json?query={encText}&display={display_count}&sort=date"
        
        request = urllib.request.Request(url)
        request.add_header("X-Naver-Client-Id", self.NAVER_KEY)
        request.add_header("X-Naver-Client-Secret", self.NAVER_SECRET)
        
        try:
            response = urllib.request.urlopen(request)
            if response.getcode() == 200:
                data = json.loads(response.read().decode('utf-8'))
                return [self._clean_item(item) for item in data['items']]
            return []
        except Exception as e:
            print(f"News API Error: {e}")
            return []

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