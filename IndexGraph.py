import yfinance as yf
import json

class IndexData:
    def __init__(self):
        ksp = yf.Ticker("")