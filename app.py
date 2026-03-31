from flask import Flask, render_template, redirect, url_for, request

app = Flask(__name__, template_folder='LInvestFrontend', static_folder='LInvestStatic')

# 주식 데이터 (예시)
STOCK_DATA = {
    "삼성전자": "005930",
    "SK하이닉스": "000660"
}

# [메인 페이지] 코드를 입력하기 전
@app.route('/')
def index():
    stock_names = list(STOCK_DATA.keys())
    # index.html 파일에는 검색창과 서비스 소개가 들어갑니다.
    return render_template('index.html', stock_names=stock_names)

# [검색 처리] 검색창에서 입력 후 넘어오는 곳
@app.route('/search')
def search():
    query = request.args.get('query', '').strip()
    if query in STOCK_DATA:
        code = STOCK_DATA[query]
    elif query.isdigit() and len(query) == 6:
        code = query
    else:
        return redirect(url_for('index'))
    return redirect(url_for('stock_page', code_tag=code))

# [상세 페이지] 코드를 입력했을 때 보이는 페이지
@app.route('/<code_tag>')
def stock_page(code_tag):
    # stock.html 파일에는 차트와 예측 결과가 들어갑니다.
    # code_tag를 넘겨주어 화면에서 어떤 종목인지 알 수 있게 합니다.
    return render_template('stock.html', code=code_tag)

if __name__ == '__main__':
    app.run(debug=True)