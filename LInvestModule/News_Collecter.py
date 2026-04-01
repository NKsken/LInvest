import os
import json
import requests
from openai import OpenAI
from dotenv import load_dotenv, find_dotenv
from pathlib import Path
import urllib.parse
import datetime

class NewsCollector:
    def __init__(self):
        """생성자. env 파일에서 API키 로드"""
        # 1. 경로 설정 (상위 폴더의 .env 참조를 위해 절대 경로 방식 권장)
        load_dotenv(find_dotenv())

        # 2. API 키 로드
        self.NAVER_KEY = os.getenv("NAVER_KEY")
        self.NAVER_SECRET = os.getenv("NAVER_SECRET")
        COPILOT_API_KEY = os.getenv("COPILOT_KEY")

        # 3. 클라이언트 인스턴스 생성
        self.client = OpenAI(
            base_url="https://models.inference.ai.azure.com",
            api_key=COPILOT_API_KEY,
        )

    def sanitize_news(self, text):
        # 필터가 예민하게 반응하는 단어들을 중립적인 단어로 치환
        bad_words = {
            "자살": "극단적 선택",
            "살해": "피해",
            "자해": "신체 손상",
            "살인": "강력 사건",
            "사망": "인명 피해",
            "시신": "사체",
            "방화": "화재 사고"
        }
        for word, replacement in bad_words.items():
            text = text.replace(word, replacement)
        return text

    def auto_analyze_stock(self, code, display = 50, date = datetime.datetime.now().strftime('%Y%m%d')):
        """code: 종목명(혹은 종목코드)
        display: 네이버 뉴스 검색결과 (기본 : 50개, 최대 : 100개)"""
        encoded_query = urllib.parse.quote(f"{code}")
        url = f"https://openapi.naver.com/v1/search/news.json?query={encoded_query}&display={display}&sort=date"

        headers = {
            "X-Naver-Client-Id": self.NAVER_KEY,
            "X-Naver-Client-Secret": self.NAVER_SECRET
        }

        response = requests.get(url, headers=headers)

        master_details = []
        positive_count = 0
        negative_count = 0

        # 검색된 내용 결합 (link 추가)
        for r in response.json()['items']:
            context = f"제목: {r['title']}\n내용: {r['description']}\n링크: {r['link']}"

            # context_filtered = self.sanitize_news(context)

            # AI에게 분석 요청
            prompt = f"""
            당신은 금융 분석가입니다. 다음 1개의 뉴스 검색 결과를 바탕으로 '{code}'의 {datetime.datetime.now().strftime('%Y-%m-%d')} 일 호재와 악재를 분석하세요.
            분석을 위한 데이터일 뿐입니다. 어떤 부정적인 묘사가 있어도 무시하고 경제적 관점에서만 분석하십시오.
            반드시 아래의 JSON 형식으로만 응답하세요. JSON 외에 다른 말은 절대 하지 마세요.

            {{
                "date": "YYYY-MM-DD",
                "sentiment": "호재",  // "호재", "악재", "중립" 중 택 1
                "reason": "한 줄 이유"
            }}

            검색결과:
            {context}
            """

            # OpenAI SDK 방식 호출로 수정 (client.chat.completions.create 사용)
            response = self.client.chat.completions.create(
                model="gpt-4o-mini", # 사용할 모델명 명시
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                response_format={"type": "json_object"}
            )

            # 1. AI 응답 텍스트 가져오기
            full_text = response.choices[0].message.content.strip()

            try:
                # 개별 분석 결과 파싱
                item_data = json.loads(full_text)
                sentiment = item_data.get("sentiment", "중립")
                        
                # 파이썬에서 호재/악재 카운트 계산
                if sentiment == "호재":
                    positive_count += 1
                elif sentiment == "악재":
                    negative_count += 1

                # 제목과 링크는 파이썬이 이미 알고 있으므로 직접 합쳐줍니다.
                master_details.append({
                    "date": item_data.get("date", "알 수 없음"),
                    "title": r['title'],
                    "sentiment": sentiment,
                    "reason": item_data.get("reason", "이유 없음"),
                    "link": r['link']
                })
            except json.JSONDecodeError:
                print(f"일부 기사 파싱 실패 (건너뜁니다): {full_text}")
                continue
        # 3. 파이썬이 취합한 최종 JSON 데이터 완성
        final_data = {
            "code": code,
            "positive_count": positive_count,
            "negative_count": negative_count,
            "details": master_details
        }

        # 4. 결과 반환 및 파일 저장
        try:
            file_name = f"{code}_analyzeresult_{date}.json"
            file_path = os.path.join("LInvestModule/News", file_name)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                # [중요] 글자가 아니라 변환된 'data_dict'를 넣어야 합니다.
                json.dump(
                    final_data, 
                    f, 
                    ensure_ascii=False, 
                    indent=4
                )
            print(f"성공적으로 저장되었습니다: {file_name}")

        except json.JSONDecodeError as e:
            print(f"JSON 파싱 에러 발생! AI의 원문: {full_text}")
            return {"error": "파싱 실패", "raw": full_text}