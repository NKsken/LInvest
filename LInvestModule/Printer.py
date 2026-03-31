import os
import LInvestModule.Predicter as Predicter
import datetime
import keras
import json
import numpy as np
import LInvestModule.News_Collecter as nc

class Print:
    def __init__(self):
        self.Pred = Predicter.Fitter()
        self.Folder_name = 'Models'
        self.News = nc.NewsCollector()

    def ModelFitter(self, code):
        """
        code : 종목코드
        """

        # 모델 학습
        result = self.Pred.pred(code=code)
        return result

    def Predict(self, code, window_size = 5):
        """
        code : 종목코드
        """
        sample_number = 1
        dataframe_number = 2
        # 모델 열기
        file_name = os.path.join(self.Folder_name, f"{code}.keras")

        try:
            model = keras.models.load_model(file_name)
        except FileNotFoundError:
            self.ModelFitter(code)
            return "모델이 존재하지 않아 새로 학습을 시작합니다. 다시 시도해주세요."
        
        # 파일의 마지막 수정시간 가져오기
        file_date = datetime.datetime.fromtimestamp(os.path.getmtime(file_name)).date()

        # 오늘 날짜
        today = datetime.date.today()
        
        # 호재/악재 분석
        self.News.auto_analyze_stock(code=code)

        if file_date == today:
            model.summary()
            with open(os.path.join('News', f"{code}_analyzeresult_{datetime.datetime.now().strftime('%Y%m%d')}.json", encoding = 'utf-8')) as f:
                data = json.load(f)
                Pos = data['positive_count']
                Neg = data['negative_count']
                df = np.array([[Pos, Neg]])

            prediction_shape = df[-window_size:]
            pred_input = prediction_shape.reshape(sample_number, window_size, dataframe_number)
            prediction = model.predict(pred_input)

            return prediction
        elif file_date != today:
            self.ModelFitter(code)
            return "모델이 최신이 아니어서 새로 학습을 시작합니다. 다시 시도해주세요."
