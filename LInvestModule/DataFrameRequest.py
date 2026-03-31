import os
import json
import LInvestModule.KRX_Finance as KF
from dotenv import load_dotenv, find_dotenv

class Request():
    def __init__(self):
        """생성자. JSON을 파싱해 URL과 param 정보를 딕셔너리 형태로 반환"""
        load_dotenv(find_dotenv())
        self.url = {}
        self.param = {}
        self.key = os.getenv("KRX_API")

        # 현재 파일의 절대 경로
        current_file_path = os.path.abspath(__file__)
        # 현재 파일이 속한 디렉토리
        current_dir = os.path.dirname(current_file_path)
        # json 파일의 절대 경로를 조합합니다.
        json_path = os.path.join(current_dir, 'jsons')

        with open(json_path + '/URLInfo.json', 'r', encoding = 'utf-8') as f:
            self.url = json.load(f)

        with open(json_path + '/ParamInfo.json', 'r', encoding = 'utf-8') as f:
            self.param = json.load(f)

    def Requester(self, compinfo, Date):
        """
        compinfo : 종목코드.
        Date : 데이터를 불러올 오늘로부터의 날짜"""
        LoadFinance = KF.KRXFinance()
        self.param['serviceKey'] = f"{self.key}"
        self.param['likeIsinCd'] = f"{compinfo}"
        self.param['beginBasDt'] = f"{Date}"
        df = LoadFinance.get_market_data(self.url, self.param)
        return df