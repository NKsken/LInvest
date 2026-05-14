import os
import websockets
import json
import requests
import asyncio
from dotenv import load_dotenv

class KISApi:
    def __init__(self):
        """KIS API 키 입력"""
        load_dotenv()
        self.key = os.getenv("KIS_KEY")
        self.secret = os.getenv("KIS_SECRET")
        self.approval = self.get_access_key(key=self.key, secret=self.secret)
        self.token = self.get_token()

    def get_token(self):
        """실시간 주가 조회를 위한 REST API access_token 발급 (유효기간 24시간)"""
        url = "https://openapi.koreainvestment.com:9443/oauth2/tokenP"
        payload = {
            "grant_type": "client_credentials",
            "appkey": self.key,
            "appsecret": self.secret
        }
        # 헤더 설정 필수
        headers = {"Content-Type": "application/json"}
        res = requests.post(url, headers=headers, data=json.dumps(payload))
        
        if res.status_code == 200:
            return res.json()["access_token"]
        else:
            print(f"토큰 발급 실패: {res.text}")
            return None

    def get_access_key(self, key, secret):
        """
        :param key:  kis api key
        :param secret: kis api secret
        :return: kis approval key
        """
        URL_BASE = "https://openapi.koreainvestment.com:9443"
        url = f"{URL_BASE}/oauth2/Approval"
        
        # 헤더에 JSON 전송임을 명시
        headers = {"Content-Type": "application/json; charset=UTF-8"}
        
        payload = {
            "grant_type": "client_credentials",
            "appkey": key,
            "secretkey": secret
        }
        
        # headers 인자 추가
        res = requests.post(url, headers=headers, data=json.dumps(payload))
        return res.json()["approval_key"]
    
    def get_current_price(self, code):
        """페이지 초기 로딩 시 현재가를 한 번 가져오는 함수"""
        token = self.token() # 호출할 때마다 받거나, __init__에서 저장 후 사용 가능
        if not token: return None

        URL_BASE = "https://openapi.koreainvestment.com:9443"
        url = f"{URL_BASE}/uapi/domestic-stock/v1/quotations/inquire-price"
        
        headers = {
            "Content-Type": "application/json",
            "authorization": f"Bearer {token}",
            "appkey": self.key,
            "appsecret": self.secret,
            "tr_id": "FHKST01010100" # 주식 현재가 시세 TR ID
        }
        
        params = {
            "fid_cond_mrkt_div_code": "J",
            "fid_input_iscd": code
        }
        
        res = requests.get(url, headers=headers, params=params)
        data = res.json()
        
        if data.get('rt_cd') == '0':
            return {
                'current_price': data['output']['stck_prpr'], # 현재가
                'change_rate': data['output']['prdy_ctrt']    # 전일 대비율
            }
        return None
    
    async def connect_stock_socket(self, code, callback_func):
        """실제로 접속하여 주가 불러오기"""

        url = "ws://ops.koreainvestment.com:21000"

        async with websockets.connect(url, ping_interval=30, ping_timeout=10) as websocket:
            subscribe_data = {
                "header": {
                    "approval_key": self.approval,
                    "custtype":"P", # P : 개인 B : 법인
                    "tr_type": "1", # 1 : 등록 2 : 해제
                    "content-type": "utf-8"
                },
                "body": {
                    "input": {
                        "tr_id": "H0STCNT0", # 실시간 주식 채결가 ID
                        "tr_key": code       # 종목 코드
                    }
                }
            }
        
            await websocket.send(json.dumps(subscribe_data))
            print(f"{code} 종목 데이터 가져오는중")

            while True:
                data = await websocket.recv()

                if data[0] == '0' or data[0] == '1': # 실시간 데이터인 경우
                    parts = data.split('|')
                    raw_data = parts[-1].split('^')
                    
                    price = raw_data[2]
                    change = raw_data[4]
                    rate = raw_data[5]
                    callback_func(code, price, change, rate)
                else:
                    # 초기 접속 응답 출력
                    print(f"Response: {data}")


