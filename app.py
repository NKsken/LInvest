from list import list_request
from flask import Flask, render_template, redirect, url_for, request

app = Flask(__name__, template_folder='LInvestFrontend', static_folder='LInvestStatic')
krx_list = list_request()

# 주식 데이터
STOCK_DATA = krx_list.load()

# [메인 페이지] 코드를 입력하기 전
@app.route('/')
def index():
    # 자동완성을 위해 종목명 리스트 전달
    return render_template('index.html', stock_names=STOCK_DATA)

# [검색 처리] 검색창에서 입력 후 넘어오는 곳
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
    return redirect(f'/{code}')

# [상세 페이지] 코드를 입력했을 때 보이는 페이지
@app.route('/<code_tag>')
def stock_page(code_tag):
    # 실제 예측 로직이 들어갈 자리
    stock_name = next((k for k, v in STOCK_DATA.items() if v == code_tag), "알 수 없는 종목")
    return render_template('stock.html', code=code_tag, stock_names = STOCK_DATA, code_value = stock_name)

if __name__ == '__main__':
    app.run(debug=True)