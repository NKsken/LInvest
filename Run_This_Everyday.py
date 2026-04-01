import LInvestModule.News_Collecter as nc
import time

a = nc.NewsCollector()
inital = a.auto_analyze_stock(code = '005930')
time.sleep(65)
initialb = a.auto_analyze_stock(code = '000660')