# 사용 방법
이 가이드는 기본적으로 Windows 11 환경 기준으로 작성되었어요.

### 1. Python 설치
  - Python 버전은 기본적으로 최신 버전으로 깔아도 괜찮아요.
  - 하지만 가장 완벽하게 작동하는 환경은 Python 3.13.7 버전이에요.
  - Python 설치중 뜨는 **Add Python {Python 버전} to PATH** 옵션은 반드시 체크해주세요.
### 2. Python 패키지 설치
  1. 윈도우 + R을 눌러 '실행' 창이 열리면 cmd.exe를 적고 엔터를 눌러 명령 프롬포트를 실행해주세요.
  2. 검정색 바탕에 흰색 글씨가 나오는 콘솔 창이 열리면 다음 명령어를 입력해주세요.
```bash
pip install flask, numpy, pandas, tensorflow, keras, ollama, dotenv, flask-socketio
```
### 3. ollama로 로컬 AI 환경 구축하기
  1. 2.에서 열었던 CMD 창에 다음 명령어를 입력해주세요.
```bash
irm https://ollama.com/install.ps1 | iex
```
  2. 
