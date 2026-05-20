import os
import websockets
import json
import requests
import asyncio
import time  # 시간 지연을 위해 추가
from dotenv import load_dotenv

class KISApi:
    def __init__(self):
        """KIS API 키 입력"""
        load_dotenv()
        self.key = os.getenv("KIS_KEY")
        self.secret = os.getenv("KIS_SECRET")
        self.approval = self.get_access_key(key=self.key, secret=self.secret)
        self.token = self.get_token()
        
        # [핵심 추가] 현재 실행 중인 웹소켓과 이벤트 루프를 저장하는 변수
        self.current_ws = None
        self.current_loop = None

    def get_token(self):
        """실시간 주가 조회를 위한 REST API access_token 발급 (유효기간 24시간)"""
        url = "https://openapi.koreainvestment.com:9443/oauth2/tokenP"
        payload = {
            "grant_type": "client_credentials",
            "appkey": self.key,
            "appsecret": self.secret
        }
        headers = {"Content-Type": "application/json"}
        res = requests.post(url, headers=headers, data=json.dumps(payload))
        if res.status_code == 200:
            return res.json()["access_token"]
        else:
            print(f"토큰 발급 실패: {res.text}")
            return None

    def get_access_key(self, key, secret):
        url = "https://openapi.koreainvestment.com:9443/oauth2/Approval"
        payload = {
            "grant_type": "client_credentials",
            "appkey": key,
            "secretkey": secret
        }
        headers = {"Content-Type": "application/json"}
        res = requests.post(url, headers=headers, data=json.dumps(payload))
        if res.status_code == 200:
            return res.json()["approval_key"]
        else:
            print(f"Approval Key 발급 실패: {res.text}")
            return None

    def get_current_price(self, code):
        url = "https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quoting/inquire-price"
        headers = {
            "Content-Type": "application/json",
            "authorization": f"Bearer {self.token}",
            "appkey": self.key,
            "appsecret": self.secret,
            "tr_id": "FHKST01010100"
        }
        params = {
            "fid_cond_mrkt_div_code": "J",
            "fid_input_iscd": code
        }
        res = requests.get(url, headers=headers, params=params)
        if res.status_code == 200:
            data = res.json()
            if data.get('rt_cd') == '0':
                output = data.get('output', {})
                return {
                    'current_price': output.get('stck_prpr'),
                    'change_rate': output.get('prdy_ctrt'),
                    'change_amt': output.get('prdy_vrss')
                }
        return None

    # [핵심 추가] 기존에 켜져 있는 다른 페이지의 웹소켓 연결을 안전하게 폭파시키는 함수
    def stop_current_connection(self):
        if self.current_ws and self.current_loop:
            print("[KIS API] 다른 페이지의 웹소켓이 감지되었습니다. 기존 연결을 끊습니다...")
            try:
                async def _close():
                    if self.current_ws:
                        await self.current_ws.close()
                
                # 다른 스레드의 이벤트 루프에 접속하여 소켓을 완전히 닫음
                future = asyncio.run_coroutine_threadsafe(_close(), self.current_loop)
                future.result(timeout=2) # 2초 대기
                time.sleep(0.5) # KIS 서버가 연결 끊김을 감지할 세션 클리어 타임 제공
                print("[KIS API] 기존 웹소켓 세션 정리 완료.")
            except Exception as e:
                print(f"[KIS API] 웹소켓 종료 처리 중 오류 발생 (무시 가능): {e}")
            finally:
                self.current_ws = None
                self.current_loop = None

    # 1. 상세 페이지용 (단일 종목 연동)
    async def connect_stock_socket(self, code, callback_func):
        self.stop_current_connection() # 연결 전에 무조건 기존 세션 폭파
        
        url = "ws://ops.koreainvestment.com:21000"
        print(f"{code} 종목 단일 데이터 수집 시작")
        
        try:
            async with websockets.connect(url, ping_interval=30, ping_timeout=10) as websocket:
                # [중요] 현재 활성화된 웹소켓과 이벤트 루프 기록
                self.current_ws = websocket
                self.current_loop = asyncio.get_running_loop()

                subscribe_data = {
                    "header": {
                        "approval_key": self.approval,
                        "custtype": "P",
                        "tr_type": "1",
                        "content-type": "utf-8"
                    },
                    "body": {
                        "input": {
                            "tr_id": "H0STCNT0",
                            "tr_key": code
                        }
                    }
                }
                await websocket.send(json.dumps(subscribe_data))
                
                while True:
                    try:
                        data = await asyncio.wait_for(websocket.recv(), timeout=60)
                        if data[0] == '0' or data[0] == '1':
                            parts = data.split('|')
                            if len(parts) >= 4:
                                real_data = parts[3].split('^')
                                price = real_data[2]
                                change = real_data[4]
                                rate = real_data[5]
                                callback_func(code, price, change, rate)
                    except asyncio.TimeoutError:
                        continue
                    except websockets.exceptions.ConnectionClosed:
                        print(f"[{code}] 단일 웹소켓 연결 종료")
                        break
        except Exception as e:
            print(f"단일 웹소켓 연동 오류: {e}")

    # 2. 메인 위시리스트용 (다중 종목 연동)
    async def connect_multiple_stock_socket(self, codes, callback_func):
        self.stop_current_connection() # 연결 전에 무조건 기존 세션 폭파
        
        url = "ws://ops.koreainvestment.com:21000"
        approval_key = self.approval 

        try:
            async with websockets.connect(url, ping_interval=30, ping_timeout=10) as websocket:
                # [중요] 현재 활성화된 웹소켓과 이벤트 루프 기록
                self.current_ws = websocket
                self.current_loop = asyncio.get_running_loop()

                for code in codes:
                    print(f"{code} 종목 데이터 다중 등록 중")
                    subscribe_data = {
                        "header": {
                            "approval_key": approval_key,
                            "custtype": "P",
                            "tr_type": "1",
                            "content-type": "utf-8"
                        },
                        "body": {
                            "input": {
                                "tr_id": "H0STCNT0",
                                "tr_key": code
                            }
                        }
                    }
                    await websocket.send(json.dumps(subscribe_data))
                    await asyncio.sleep(0.1)
                
                while True:
                    try:
                        data = await asyncio.wait_for(websocket.recv(), timeout=60)
                        if data[0] == '0' or data[0] == '1':
                            parts = data.split('|')
                            if len(parts) >= 4:
                                real_data = parts[3].split('^')
                                recv_code = real_data[0]
                                price = real_data[2]
                                change = real_data[4]
                                rate = real_data[5]
                                callback_func(recv_code, price, change, rate)
                                
                    except asyncio.TimeoutError:
                        continue
                    except websockets.exceptions.ConnectionClosed:
                        print("다중 웹소켓 연결 종료")
                        break
        except Exception as e:
            print(f"다중 웹소켓 에러: {e}")

    def get_daily_chart_data(self, code):
        url = "https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quoting/inquire-daily-itemchartprice"
        
        # 1. 먼저 날짜 계산
        from datetime import datetime, timedelta
        today_str = datetime.today().strftime('%Y%m%d')
        start_str = (datetime.today() - timedelta(days=120)).strftime('%Y%m%d')

        # 2. headers 정의
        headers = {
            "Content-Type": "application/json; charset=utf-8",
            "authorization": f"Bearer {self.token}",
            "appkey": self.key,
            "appsecret": self.secret,
            "tr_id": "FHKST03010100",
            "custtype": "P"
        }
        
        # 3. params 정의 (여기서 먼저 정의되어야 함!)
        params = {
            "FID_COND_MRKT_DIV_CODE": "J",
            "FID_INPUT_ISCD": code,
            "FID_INPUT_DATE_1": start_str,
            "FID_INPUT_DATE_2": today_str,
            "FID_PERIOD_DIV_CODE": "D",
            "FID_ORG_ADPR": "0"
        }
        
        # 4. 이제 requests.get 실행
        res = requests.get(url, headers=headers, params=params)
        
        # [디버깅용] 주소가 맞는지 확인하기 위해 url도 출력해 보세요
        print(f"DEBUG: Request URL: {url}")
        print(f"DEBUG: Status Code: {res.status_code}")

        if res.status_code == 200:
            data = res.json()
            if data.get('rt_cd') == '0':
                chart_list = []
                for day in reversed(data.get('output2', [])[:30]):
                    chart_list.append({
                        'date': f"{day['stck_bsop_date'][4:6]}/{day['stck_bsop_date'][6:8]}",
                        'close': int(day['stck_clpr'])
                    })
                return chart_list