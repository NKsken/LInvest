import os
import LInvestModule.Predicter as Predicter
import keras
import json
import numpy as np
import LInvestModule.News_Collecter as nc
from datetime import datetime, date, timedelta

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
        except:
            self.ModelFitter(code)
            return np.nan
        
        # 파일의 마지막 수정시간 가져오기
        file_date = datetime.fromtimestamp(os.path.getmtime(file_name)).date()

        # 오늘 날짜
        today = date.today()

        all_data = []
        last_valid_data = None

        if file_date == today:
            model.summary()
            for i in range(window_size):
                target_date = (date.today() - timedelta(days=i)).strftime('%Y%m%d')
                file_path = os.path.join('LInvestModule', 'News', f"{code}_analyzeresult_{target_date}.json")
                
                if os.path.exists(file_path):
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        current_data = [data['positive_count'], data['negative_count']]
                        all_data.append(current_data)
                        last_valid_data = current_data  # 유효한 데이터 갱신
                else:
                    if last_valid_data is not None:
                        all_data.append(last_valid_data)

            all_data.reverse()
            df = np.array(all_data)

            pred_input = df.reshape(sample_number, window_size, dataframe_number)
            prediction = model.predict(pred_input)

            print(prediction)
            return prediction
        elif file_date != today:
            self.ModelFitter(code)
            return np.nan
