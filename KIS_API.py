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
        url = "https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/inquire-price"
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
            print("조회 성공")
            data = res.json()
            if data.get('rt_cd') == '0':
                output = data.get('output', {})
                return {
                    'current_price': output.get('stck_prpr'), # 현재가
                    'change_rate': output.get('prdy_ctrt'), # 등락률
                    'change_amt': output.get('prdy_vrss') # 등락가
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
        """당일 분봉 차트 데이터를 시간 구분 없이 안전하게 전체 조회"""
        url = "https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/inquire-time-itemchartprice"

        headers = {
            "content_type": "application/json; charset=utf-8",
            "authorization": f"Bearer {self.token}",
            "appkey": self.key,
            "appsecret": self.secret,
            "tr_id": "FHKST03010200",
            "custtype": "P"
        }

        # FID_INPUT_HOUR_1을 비워두거나 현재 시간 기준으로 맞추어야 장 마감 후에도 안전하게 데이터를 당겨옵니다.
        params = {
            "FID_COND_MRKT_DIV_CODE": "J",  # 국내주식 시장 구분은 대문자 'J'가 표준 규격입니다.
            "FID_INPUT_ISCD": code,
            "FID_INPUT_HOUR_1": "",         # 공백으로 전송 시 최신 시점부터 역산하여 전체 분봉을 가져옵니다.
            "FID_PW_DATA_INCU_YN": "Y",
            "FID_ETC_CLS_CODE": "0"
        }

        try:
            res = requests.get(url=url, headers=headers, params=params)
            if res.status_code == 200:
                data = res.json()
                
                if data.get('rt_cd') == '0' and "output2" in data:
                    chart_list = data["output2"]
                    
                    # 데이터가 유효한지 검증
                    if not chart_list:
                        print("한투 API 응답 성공했으나 데이터 내용이 비어있습니다.")
                        return []
                        
                    # TradingView 호환성을 위해 과거 -> 미래 순서로 역순 정렬
                    chart_list = chart_list[::-1]
                    
                    processed_data = []
                    import datetime
                    for item in chart_list:
                        if not item.get('stck_bsop_date') or not item.get('stck_cntg_hour'):
                            continue
                            
                        # 일자(YYYYMMDD) + 체결시각(HHMMSS) 결합
                        dt_str = f"{item['stck_bsop_date']}{item['stck_cntg_hour']}"
                        try:
                            dt = datetime.datetime.strptime(dt_str, '%Y%m%d%H%M%S')
                            ts = int(dt.timestamp())
                        except Exception:
                            continue
                        
                        processed_data.append({
                            "time": ts,
                            "open": int(item['stck_oprc']),
                            "high": int(item['stck_hgpr']),
                            "low": int(item['stck_lwpr']),
                            "close": int(item['stck_prpr'])  # 현재가를 종가로 활용
                        })
                    print(f"성공적으로 {len(processed_data)}개의 분봉 데이터를 가공했습니다.")
                    return processed_data
                else:
                    print("한투 API 오류 응답:", data.get('msg1'))
            else:
                print(f"네트워크 오류 상태코드: {res.status_code}")
        except Exception as e:
            print(f"데이터 파싱 중 에러 발생: {e}")
        return []