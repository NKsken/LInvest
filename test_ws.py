import asyncio, websockets, json, os
from dotenv import load_dotenv

load_dotenv()
async def test():
    import requests
    url = "https://openapi.koreainvestment.com:9443/oauth2/Approval"
    payload = {"grant_type": "client_credentials", "appkey": os.getenv("KIS_KEY"), "secretkey": os.getenv("KIS_SECRET")}
    res = requests.post(url, headers={"Content-Type": "application/json"}, data=json.dumps(payload))
    approval = res.json()["approval_key"]
    
    url = "ws://ops.koreainvestment.com:21000"
    async with websockets.connect(url, ping_interval=None) as ws:
        sub2 = {
            "header": {"approval_key": approval, "custtype": "P", "tr_type": "1", "content-type": "utf-8"},
            "body": {"input": {"tr_id": "H0UPCNT0", "tr_key": "0001"}}
        }
        await ws.send(json.dumps(sub2))
        print("Success response:", await ws.recv())
        for _ in range(3):
            data = await ws.recv()
            if "PING" not in data:
                print("Data:", data)

asyncio.run(test())
