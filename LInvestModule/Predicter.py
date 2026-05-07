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
            """

            # 주가 데이터프레임 요청
            BDate = (datetime.today() - BDay(length)).strftime("%Y%m%d")
            df = self.callback.Requester(compinfo = code, Date = BDate)

            # 호재, 악재 데이터를 담을 칼럼 초기화 (기본값 NaN)
            df['Pos'] = np.nan
            df['Neg'] = np.nan

            # 뉴스 데이터를 찾아 매칭
            for i in range(len(df)):
                minus_dt = df.loc[i, 'Date']
                # NewsCollector 저장 경로에 맞춰 수정 (LInvestModule/News 인지 News 인지 확인 필요)
                file_path = os.path.join('LInvestModule/News', f"{code}_analyzeresult_{minus_dt}.json")

                try:
                    with open(file_path, encoding='utf-8') as f:
                        data = json.load(f)
                        df.loc[i, 'Pos'] = data["positive_count"]
                        df.loc[i, 'Neg'] = data["negative_count"]
                except (FileNotFoundError, json.JSONDecodeError):
                    # 파일이 없거나 내용이 비어있으면 그대로 둠 (NaN 유지)
                    pass

            # [수정 포인트] 뉴스가 없어서 NaN인 행을 한꺼번에 삭제
            # 'Pos'나 'Neg' 칼럼이 비어있는(뉴스를 찾지 못한) 날짜를 모두 제거합니다.
            df.dropna(subset=['Pos', 'Neg'], inplace=True)

            # 데이터가 너무 많이 삭제되어 학습이 불가능한 경우 방지
            if len(df) <= window_size:
                return f"에러: 수집된 뉴스 데이터가 부족하여 학습을 진행할 수 없습니다. (현재 데이터 수: {len(df)})"
            
            # 데이터프레임 재정렬 및 가공
            df = df.sort_values('Date').reset_index(drop=True)
            df['Diff'] = df['Diff'].astype(str).str.replace(' ', '').astype(float)

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
            model_dir = 'Models'
            # 폴더가 없으면 생성 (exist_ok=True를 쓰면 이미 있어도 에러가 나지 않습니다)
            if not os.path.exists(model_dir):
                os.makedirs(model_dir)

            model_path = os.path.join(model_dir, f"{code}.keras")
            model.save(model_path)

            return f"{code} 학습완료. {model_path}에 모델 저장 완료"