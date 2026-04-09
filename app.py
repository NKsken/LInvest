import pandas as pd
from News import NewsManager
from list import list_request
from LInvestModule.Printer import Predicter
from flask import Flask, render_template, redirect, url_for, request, jsonify

news_manager = NewsManager()
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

# 주가/예측 창
@app.route('/code/<code_tag>')
def stock_page(code_tag):
    # result_value = Predicter()
    stock_name = next((k for k, v in STOCK_DATA.items() if v == code_tag), "알 수 없는 종목")

    page = request.args.get('page', 1, type=int)
    display_count = 5
    start_index = ((page - 1) * display_count) + 1

    # NewsManager에서 반환하는 딕셔너리에서 'items'만 추출하여 전달
    news_data = news_manager.get_stock_news(stock_name, display_count=display_count, start_index=start_index)
    
    return render_template('stock.html', 
                            code=code_tag,
                            stock_names=STOCK_DATA,
                            code_value=stock_name,
                            news_list=news_data['items'], # 리스트만 추출
                            # predict_result = dummy_stock_predict_result,
                            current_page=page)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    stock_code = data.get('code')
    
    diff = pred.pred(code=stock_code)
    
    try:
        if diff == FileNotFoundError:
            return jsonify({
                "status":"noNews",
                "text":"수집된 뉴스가 없습니다.",
                "diff":0
            })
        elif pd.isna(diff):
            return jsonify({
                "status":"outOfDate",
                "text":"학습 모델을 최신 날짜로 변경했습니다. 다시 시도해주십시오.",
                "diff":0
            })
        else:
            return jsonify({
                "status":"success",
                "text":"",
                "diff":diff
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "text": str(e),
            "diff": 0
        }), 500
    
if __name__ == '__main__':
    app.run(debug=True)