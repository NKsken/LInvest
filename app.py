import pandas as pd
import numpy as np
import threading
import time
import asyncio
from datetime import datetime
from News import NewsManager
from KIS_API import KISApi
from list import list_request
from LInvestModule.Printer import Print
from LInvestModule.DataFrameRequest import Request
from LInvestModule.News_Collecter import NewsCollector
from flask import Flask, render_template, redirect, url_for, request, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room

news_manager = NewsManager()
req = Request()
app = Flask(__name__, template_folder='LInvestFrontend', static_folder='LInvestStatic')
krx_list = list_request()
pred = Print()
news_collecter = NewsCollector()
kis = KISApi()
socketio = SocketIO(app, cors_allowed_origins = "*")

active_threads = {}

# 주식 데이터
STOCK_DATA = krx_list.load()

# 메인 페이지
@app.route('/')
def index():
    return render_template('index.html', 
                           stock_names=STOCK_DATA)

# 검색창
@app.route('/search')
def search():
    query = request.args.get('query', '').strip()
    # 종목명인지 코드(숫자 6자리)인지 판별
    if query in STOCK_DATA:
        code = STOCK_DATA[query]
    elif query.isdigit() and len(query) == 6:
        code = query
    else:
        return redirect(url_for('index'))
    return redirect(f'/code/{code}')

# 주가/예측 창 (첫 접속용)
@app.route('/code/<code_tag>')
def stock_page(code_tag):
    stock_name = next((k for k, v in STOCK_DATA.items() if v == code_tag), "알 수 없는 종목")

    page = request.args.get('page', 1, type=int)
    display_count = 5
    start_index = ((page - 1) * display_count) + 1

    # 첫 로딩 시 보여줄 뉴스 데이터 가져오기
    news_data = news_manager.get_stock_news(stock_name, display_count=display_count, start_index=start_index)
    
    # 주가 불러오기
    now_price = "0"
    prdy_vrss = "0"
    prdy_ctrt = "0.00"
    past_price = "0"
    
    try:
        # 처음 접속 시점에만 REST API로 현재가 정보를 가져옴
        price_info = kis.get_current_price(code_tag) 
        
        if price_info:
            if price_info:
                now_price = format(int(price_info['current_price']), ',')
                prdy_ctrt = price_info['change_rate']
                prdy_vrss = format(int(price_info['prdy_vrss']), ',')
                past_price = format(int(price_info['past_price']), ',')
    except Exception as e:
        print(f"초기 로딩 실패: {e}")
    
    return render_template('stock.html', 
                            code=code_tag,
                            stock_names=STOCK_DATA,
                            code_value=stock_name,
                            news_list=news_data.get('items', []),
                            now_price=now_price,
                            prdy_ctrt=prdy_ctrt,
                            prdy_vrss=prdy_vrss,
                            past_price=past_price,
                            current_page=page)

def background_price_update(stock_code):
    # 웹소켓에서 데이터를 받을 때마다 실행될 내부 콜백 함수
    def handle_ws_data(code, price, diff, rate):
        # 1. 콤마 포맷팅
        formatted_price = format(int(price), ',')
        
        # 2. Socket.IO를 통해 프론트엔드로 실시간 전송
        # 'price_update'라는 이벤트 이름으로 데이터를 보냄
        socketio.emit('price_update', {
            'code': code,
            'current': formatted_price,
            'diff': diff,
            'rate':rate
        }, room=code)

    # 비동기 루프 실행
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    try:
        # KISApi 클래스에 완성한 웹소켓 함수 호출
        # (주의: KISApi 내부에서 callback_func(code, price, diff, rate)를 호출해야 함)
        loop.run_until_complete(kis.connect_stock_socket(stock_code, handle_ws_data))
        asyncio.run(kis.connect_stock_socket())
    except Exception as e:
        print(f"웹소켓 연동 오류: {e}")
    finally:
        loop.close()

@socketio.on('join')
def on_join(data):
    code = data['code']
    join_room(code)
    
    # 해당 종목에 대한 스레드가 이미 실행 중인지 확인
    if code in active_threads and active_threads[code].is_alive():
        print(f"[{code}] 이미 데이터 수집 스레드가 실행 중입니다.")
        return 

    # 실행 중이 아닐 때만 새 스레드 생성
    thread = threading.Thread(target=background_price_update, args=(code,))
    thread.daemon = True
    active_threads[code] = thread
    thread.start()

@socketio.on('leave')
def handle_leave(data):
    code = data.get('code')
    if code:
        leave_room(code)
        if code in active_threads:
            active_threads.pop(code)

# 뉴스 수집 버튼
@app.route('/code/api/analyze-news', methods=['POST'])
def news_collect():
    data = request.get_json()
    stock_code = data.get('code')

    if not stock_code:
        return jsonify({
            "status":"error",
            "message":"종목 코드가 없습니다."
        }), 400
    # 종목 코드가 없으면 오류 메세지와 함께 400 에러 Return
    try:
        news_collecter.auto_analyze_stock(code = stock_code)
        return jsonify({
            "status":"success",
            "message":"뉴스 분석이 완료되었습니다."
        })
    except Exception as e:
        return jsonify({
            "status":"error",
            "message":f"오류 발생! {str(e)}"
        })

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json(silent=True) or {}
    stock_code = data.get('code')

    if not stock_code:
        return jsonify({
            "status": "invalidRequest",
            "text": "종목 코드가 없습니다.",
            "diff": 0
        }), 400

    try:
        # AI 예측 실행
        diff = pred.Predict(code=stock_code)

        # 1. 넘파이 배열인 경우 처리
        if isinstance(diff, np.ndarray):
            if diff.size == 0:
                return jsonify({
                    "status": "error",
                    "text": "예측 결과 데이터가 없습니다.",
                    "diff": 0
                }), 500
            # 넘파이 배열을 파이썬 float으로 변환
            diff_value = float(diff.flatten()[0])

        # 2. 결과가 NaN(학습 부족 등)인 경우 처리
        elif pd.isna(diff):
            return jsonify({
                "status": "outOfDate",
                "text": "학습 모델이 최신이 아닙니다.",
                "diff": 0
            })

        # 3. 그 외 일반 수치형인 경우
        else:
            diff_value = float(diff)

        print(diff_value)

        # 최종 성공 응답 (반드시 변환된 diff_value를 보낼 것)
        return jsonify({
            "status": "success",
            "text": "분석 완료",
            "diff": diff_value  # [중요] 넘파이 객체가 아닌 일반 숫자를 전달
        })

    except Exception as e:
        # 서버 내부에서 에러가 나면 "분석 중" 텍스트를 에러 메시지로 교체해줌
        print(f"Predict Error: {str(e)}")
        return jsonify({
            "status": "error",
            "text": f"예측 중 오류 발생: {str(e)}",
            "diff": 0
        }), 500

@app.route('/api/news')
def get_news_api():
    # 1. URL 파라미터 읽기
    code_tag = request.args.get('code')
    page = request.args.get('page', 1, type=int)
    
    # 2. 종목명 매칭 (STOCK_DATA는 전역변수여야 함)
    stock_name = next((k for k, v in STOCK_DATA.items() if v == code_tag), None)
    
    if not stock_name:
        return jsonify({"success": False, "message": "종목을 찾을 수 없습니다."}), 404

    display_count = 5
    start_index = ((page - 1) * display_count) + 1

    try:
        # 3. NewsManager 호출
        news_data = news_manager.get_stock_news(stock_name, display_count=display_count, start_index=start_index)
        
        # 4. JSON으로 반환
        return jsonify({
            "success": True,
            "news_list": news_data.get('items', []),
            "current_page": page
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    
# 관심종목
@app.route('/api/wishlist-info', methods=['POST'])
def get_wishlist_info():
    data = request.get_json()
    codes = data.get('codes', [])
    
    result = []
    for code in codes:
            name = next((k for k, v in STOCK_DATA.items() if v == code), code)
            price_info = kis.get_current_price(code)
            if price_info:
                # format(..., ',') 만 사용해서 숫자와 콤마만 남깁니다. ("원" 제거)
                price = format(int(price_info['current_price']), ',')
                change_rate = price_info['change_rate']
            else:
                price = "0"
                change_rate = "0.00"
            
            result.append({
                'code': code,
                'name': name,
                'price': price,        # "199,000" 형태로 들어감
                'change_rate': change_rate
        })
    return jsonify(result)
    
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)