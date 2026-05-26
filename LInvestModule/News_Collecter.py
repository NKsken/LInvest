import os
import json
import requests
import ollama
from dotenv import load_dotenv, find_dotenv
import urllib.parse
import datetime

class NewsCollector:
    def __init__(self):
        # 1. 경로 설정 및 API 키 로드
        load_dotenv(find_dotenv())
        self.NAVER_KEY = os.getenv("NAVER_KEY")
        self.NAVER_SECRET = os.getenv("NAVER_SECRET")

    def sanitize_news(self, text):
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

    def auto_analyze_stock(self, code, display=100, date = datetime.datetime.now().strftime("%Y%m%d")):
        encoded_query = urllib.parse.quote(f"{code}")
        url = f"https://openapi.naver.com/v1/search/news.json?query={encoded_query}&display={display}&sort=date"

        headers = {
            "X-Naver-Client-Id": self.NAVER_KEY,
            "X-Naver-Client-Secret": self.NAVER_SECRET
        }

        naver_res = requests.get(url, headers=headers)
        if naver_res.status_code != 200:
            print(f"네이버 API 호출 실패: {naver_res.status_code}")
            return None

        news_items = naver_res.json().get('items', [])
        master_details = []
        positive_count = 0
        negative_count = 0
        number = 0

        print(f"총 {len(news_items)}개의 뉴스 분석을 시작합니다.")

        for r in news_items:
            number += 1
            full_text = ''
            title = r['title'].replace('<b>','').replace('</b>','').replace('&quot;','"')
            description = r['description'].replace('<b>','').replace('</b>','').replace('&quot;','"')

            context = f"제목 : {title}\n내용 : {description}"

            prompt = f"""
            당신은 금융 분석가입니다. 다음 1개의 뉴스 검색 결과를 바탕으로 '{code}'의 호재와 악재를 분석하세요.
            오늘의 날짜는 {date}입니다.
            반드시 아래의 JSON 형식으로만 응답하세요.

            {{
                "date": "YYYY-MM-DD",
                "sentiment": "호재",
            }}

            검색결과:
            {context}
            """

            try:
                # AI 분석 요청
                if (r != display):
                    resp = ollama.chat(
                        model = "gemma4:E4b",
                        messages = 
                        [
                            {
                            'role': 'system',
                            'content': prompt
                            }
                        ]
                    )
                    full_text = resp['message']['content']
                else:
                    resp = ollama.chat(
                        model = "gemma4:E4b",
                        messages = 
                        [
                            {
                            'role': 'system',
                            'content': prompt
                            }
                        ],
                        options =  # 답변이 끝나면 더이상 답변을 하지 않음으로 모델 Kill
                        {
                            "keep_alive": '0'
                        }
                    )
                    full_text = resp['message']['content']

                clean_text = full_text.replace("```json", "").replace("```", "")
                item_data = json.loads(clean_text)
                sentiment = item_data.get("sentiment", "중립")
                print(clean_text)
                print(f"{number}/{display}")
                
                if sentiment == "호재":
                    positive_count += 1
                elif sentiment == "악재":
                    negative_count += 1

                master_details.append({
                    "date": item_data.get("date", "None"),
                    "title": title,
                    "sentiment": sentiment,
                    "reason": item_data.get("reason", "이유 없음"),
                    "link": r['link']
                })

            except Exception as e:
                # 토큰 초과나 기타 에러 발생 시 현재까지의 결과만 저장하기 위해 루프 탈출
                print(f"중단 사유 (에러 혹은 토큰 초과): {e}")
                continue

        # 최종 데이터 구성 (루프가 정상 종료되거나 중간에 break 되어도 실행됨)
        final_data = {
            "code": code,
            "positive_count": positive_count,
            "negative_count": negative_count,
            "details": master_details
        }

        # 결과 저장
        if master_details:
            try:
                save_dir = "LInvestModule/News"
                os.makedirs(save_dir, exist_ok=True)
                
                file_name = f"{code}_analyzeresult_{date}.json"
                file_path = os.path.join(save_dir, file_name)
                
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(final_data, f, ensure_ascii=False, indent=4)
                
                print(f"분석 결과가 저장되었습니다: {file_name} (총 {len(master_details)}건)")
            except Exception as e:
                print(f"파일 저장 중 에러 발생: {e}")
        else:
            print("분석된 기사가 없어 파일을 저장하지 않았습니다.")