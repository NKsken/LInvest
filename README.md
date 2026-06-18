# 사용 방법
이 가이드는 기본적으로 Windows 11 환경 기준으로 작성되었어요.

### 0. 사전 준비
네이버 OpenAPI : https://developers.naver.com/main/</br>
한국거래소(KRX) 상장종목 OpenAPI : https://www.data.go.kr/data/15094775/openapi.do</br>
한국거래소(KRX) 기본시세 OpenAPI : https://www.data.go.kr/data/15094808/openapi.do</br>
한국투자증권(KIS) Dveloper OpenAPI : https://apiportal.koreainvestment.com/intro</br>
</br>
위의 4개의 API를 모두 신청하신 후 해당 프로젝트를 다운받은 폴더에 .env 파일(확장자 보기를 클릭한 후 전체 파일 이름을 바꿔주세요)을 생성해 아래의 텍스트를 복사해 붙여넣어주세요.
```
KRX_API = 기본시세 API 키
KRX_LIST_KEY = 상장종목 API 키
NAVER_KEY = 네이버 뉴스 API 키
NAVER_SECRET = 네이버 뉴스 API 시크릿 키
KIS_API = 한국투자증권 API 키
KIS_SECRET = 한국투자증권 API 시크릿 키
```

### 1. Python 설치
  - Python 버전은 기본적으로 최신 버전으로 깔아도 괜찮아요.
  - 하지만 가장 완벽하게 작동하는 환경은 Python 3.13.7 버전이에요.
  - Python 설치중 뜨는 **Add Python {Python 버전} to PATH** 옵션은 반드시 체크해주세요.
### 2. Python 패키지 설치
  1. 윈도우 + R을 눌러 '실행' 창이 열리면 cmd.exe를 적고 엔터를 눌러 명령 프롬포트를 실행해주세요.
  2. 검정색 바탕에 흰색 글씨가 나오는 콘솔 창이 열리면 다음 명령어를 입력해주세요.
```bash
pip install flask, numpy, pandas, tensorflow, keras, ollama, dotenv, flask-socketio, websockets
```
### 3. ollama로 로컬 AI 환경 구축하기 (Gemma4)
  1. 2-1에서 열었던 CMD 창에 다음 명령어를 입력해주세요.
```bash
curl -fsSL https://ollama.com/install.sh | sh
```
  2. Gemma4 E4B 모델을 설치하기 위해 CMD 창에 다음 명령어를 입력해주세요.
```bash
ollama run gemma4:e4b
```
### 4. Python으로 서버 실행하기
  1. Release의 파일을 압축 해제해주세요.
  
