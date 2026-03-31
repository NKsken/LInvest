import requests
import pandas as pd

class KRXFinance:
    def get_market_data(self, url, param):
        """KRX의 api를 이용해 상장 주식의 데이터를 불러와 데이터프레임으로 반환한다.
        ParamInfo.json, URLInfo.json 참조"""

        resp = requests.get(url['url'], param)
        datajs = resp.json()
        df = pd.json_normalize(datajs, record_path = ['response', 'body', 'items', 'item'])
        localizing_info = \
        {
            "basDt": "Date",
            "srtnCd": "Code",           
            "isinCd": "ISINCode",          # 사용하지 않음
            "itmsNm": "Name",            
            "mrktCtg": "MarketCartegory",          # 사용하지 않음
            "clpr": "Close",
            "vs": "Velocity",
            "fltRt": "Diff",              
            "mkp": "Open",
            "hipr": "High",
            "lopr": "Low",
            "trqu": "Volume",
            "trPrc": "거래대금",            # 사용하지 않음
            "lstgStCnt": "상장주식수",      # 사용하지 않음
            "mrktTotAmt": "시가총액"        # 사용하지 않음
        }
        
        df = df.rename(columns = localizing_info)
        df = df.drop(columns=["MarketCartegory", "ISINCode", "거래대금", "상장주식수", "시가총액"])
        return df
