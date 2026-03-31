import os
import json
import numpy as np
import LInvestModule.DataFrameRequest as DFR
import tensorflow as tf
import numpy as np
import LInvestModule.News_Collecter as nc
from keras.models import Sequential
from keras.layers import GRU, Dense, Dropout
from pandas.tseries.offsets import BDay
from datetime import datetime

class Fitter():
    def __init__(self):
        self.callback = DFR.Request()
        self.NewsCollecter = nc.NewsCollector()

    def NewsAutoCollecter(self, code):
        """
        뉴스 자동 수집기
        code : 종목코드
        """
        self.NewsCollecter.auto_analyze_stock(code=code)
        return
    
    def create_sequences(self, x_data, y_data, window_size):
        x, y = [], []
        for i in range(len(x_data) - window_size):
            x.append(x_data[i : i + window_size])           # i 부터 window_size일치 호재, 악재 데이터를 묶음.
            y.append(y_data[i + window_size])               # window_size번째 날의 주가를 정답으로 설정
        return np.array(x), np.array(y)
    
    def pred(self, code, length = 30, epochs = 100, verbose = 1, window_size = 5):
        """
        code : 종목코드
        length : 오늘 - length영업일 (기본값 30)
        epochs : 반복 학습 횟수 (기본값 100)
        verbose : 모델 학습 출력 레벨 (기본값 1)
        window_size : N일치 씩 학습 데이터 자르기(기본값 5)
        """

        # 주가 데이터프레임 요청
        BDate = (datetime.today() - BDay(length)).strftime("%Y%m%d")
        df = self.callback.Requester(compinfo = code, Date = BDate)

        # 호재, 악재 분석데이터 요청
        for i in range(0, len(df)):
            minus_dt = df.loc[i, 'Date'] # 데이터프레임의 i번째 열의 Date 값 가져오기
            file_path = os.path.join('News', f"{code}_analyzeresult_{minus_dt}.json")

            try:
                with open(file_path, encoding='utf-8') as f:
                    data = json.load(f)
                    df.loc[i, 'Pos'] = data["positive_count"]
                    df.loc[i, 'Neg'] = data["negative_count"]
            except FileNotFoundError:
                if i == length:
                    self.NewsAutoCollecter(code)
                    with open(file_path, encoding='utf-8') as f:
                        data = json.load(f)
                        df.loc[i, 'Pos'] = data["positive_count"]
                        df.loc[i, 'Neg'] = data["negative_count"]
                else:
                    df.loc[i, 'Pos'] = np.nan
                    df.loc[i, 'Neg'] = np.nan
                pass

        if df[['Pos', 'Neg']].isnull().values.any():
            return df[['Pos', 'Neg']].isnull().sum()
        
        # 데이터프레임 가공
        df = df.sort_values('Date').reset_index(drop=True)
        df['Diff'] = df['Diff'].astype(str).str.replace(' ', '').astype(float) # 등락률 실수화 처리

        dfx = df[['Pos', 'Neg']].to_numpy()
        dfy = df[['Diff']].to_numpy()

        x_train, y_train = self.create_sequences(dfx, dfy, window_size)

        model = Sequential([
            GRU(units=32, input_shape=(window_size, x_train.shape[2]), return_sequences=True),
            Dropout(0.1),
            GRU(units=256, return_sequences=False),
            Dropout(0.2),
            Dense(units=1)
        ])

        # 모델 컴파일
        model.compile(
        optimizer='adam',
        loss = 'mse',
        metrics = ['mse'])

        # 모델 학습
        model.fit(x_train, y_train,
        epochs=epochs,
        verbose=verbose,
        batch_size = 8,
        validation_split=0.2)

        # 모델 저장
        model_path = os.path.join('Models', f"{code}.keras")
        model.save(model_path)

        return f"{code}학습완료. {model_path}에 모델 저장 완료"