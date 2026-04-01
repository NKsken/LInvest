import os
import requests
import pandas as pd
from dotenv import load_dotenv

class list_request:
    def __init__(self):
        load_dotenv()
        key = os.getenv('KRX_LIST_KEY')
        self.url = 'https://apis.data.go.kr/1160100/service/GetKrxListedInfoService/getItemInfo'
        self.param = {
            'serviceKey':key,
            'numOfRows':'1000000',
            'resultType':'json'
        }
    def load(self):
        krx_list = requests.get(self.url, params=self.param)
        datajs = krx_list.json()
        df = pd.json_normalize(datajs, record_path = ['response', 'body', 'items', 'item'])
        return df.to_dict()