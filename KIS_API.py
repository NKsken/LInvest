import requests
import json
import os
from dotenv import load_dotenv

class KISApi:
    def __init__(self):
        load_dotenv()
        self.KIS_KEY = os.getenv("KIS_API")
        self.KIS_SECRET = os.getenv("KIS_SECRET")
        self.KIS_URL = "https://openapi.koreainvestment.com:9443"
        self.Access_Token = self.get_access_token()

    def get_access_token(self):
        """접근 토큰 발급"""
        path = '/oauth2/tokenP'
        url = f"{self.KIS_URL}{path}"
        headers = {"content-type": "application/json"}
        data = {
            "grant_type": "client_credentials",
            "appkey": self.KIS_KEY,
            "appsecret": self.KIS_SECRET
        }
        res = requests.post(url, headers=headers, data=json.dumps(data))
        return res.json().get("access_token")
    
    def get_current_price(self, stock_code):
        """현재가 조회
        stock_code : 종목 코드"""
        path = '/uapi/doemstic-stock/v1/quotations/inquire-price'
        url = f"{self.KIS_URL}{path}"

        headers = {
            "Content-Type": "application/json",
            "authorization": f"Bearer {self.Access_Token}",
            "appkey":self.KIS_KEY,
            "appsecret":self.KIS_SECRET,
            "tr_id":"FHKST01010100"     # 현재가 상세 수집용 ID
        }

        params = {
            "fid_cond_mrkt_div_code": "J",  # 시장 분류 (J: 주식)
            "fid_input_iscd": stock_code    # 종목 코드
        }

        res = requests.get(url, headers = headers, params = params)
        data = res.json()

        if data.get('rt_cd') == 0:      # 성공했을 떄
            output = data['output']
            return{
                "current_price": output['stck_prpr'],
                "yesterday_price": output['stck_sdpr'],
                "change_rate": output['prdy_ctrt'],
                "change": output['prdy_vrss']
            }
        else:
            return {"error": data.get('msg1')}