import pandas as pd
import numpy as np
from datetime import datetime
from News import NewsManager
from list import list_request
from LInvestModule.Printer import Predicter
from LInvestModule.DataFrameRequest import Request
from flask import Flask, render_template, redirect, url_for, request, jsonify

news_manager = NewsManager()
req = Request()
app = Flask(__name__, template_folder='LInvestFrontend', static_folder='LInvestStatic')
krx_list = list_request()
pred = Predicter.Fitter()

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
    now_price = 199000
    
    return render_template('stock.html', 
                            code=code_tag,
                            stock_names=STOCK_DATA,
                            code_value=stock_name,
                            news_list=news_data.get('items', []), # 이 주석을 풀어주세요!
                            now_price=now_price,
                            current_page=page)

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

    diff = pred.pred(code=stock_code)

    if isinstance(diff, type) and diff == FileNotFoundError:
        return jsonify({
            "status": "noNews",
            "text": "수집된 뉴스가 없습니다.",
            "diff": 0
        })

    if isinstance(diff, pd.Series):
        return jsonify({
            "status": "noNews",
            "text": "일부 날짜 뉴스 분석 데이터가 없어 예측할 수 없습니다.",
            "diff": 0,
            "missing": diff.to_dict()
        })

    if isinstance(diff, np.ndarray):
        if diff.size == 0:
            return jsonify({
                "status": "error",
                "text": "예측 결과가 비어 있습니다.",
                "diff": 0
            }), 500
        diff_value = float(np.asarray(diff).reshape(-1)[0])
    else:
        try:
            if pd.isna(diff):
                return jsonify({
                    "status": "outOfDate",
                    "text": "학습 모델을 최신 날짜로 변경했습니다. 다시 시도해주십시오.",
                    "diff": 0
                })
        except TypeError:
            pass

        try:
            diff_value = float(diff)
        except (TypeError, ValueError):
            return jsonify({
                "status": "error",
                "text": f"JSON 변환 불가한 예측 결과입니다: {type(diff).__name__}",
                "diff": 0
            }), 500

    return jsonify({
        "status": "success",
        "text": "",
        "diff": diff_value
    })

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
    
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)