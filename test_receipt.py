#!/usr/bin/env python3
import requests

BASE_URL = 'http://localhost:3001/api'

def login(username, password):
    resp = requests.post(f'{BASE_URL}/auth/login', json={'username': username, 'password': password})
    return resp.json().get('data', {}).get('token', '')

user_token = login('testuser', 'user123')

resp = requests.get(f'{BASE_URL}/orders', headers={'Authorization': f'Bearer {user_token}'})
orders = resp.json().get('data', [])
if orders:
    order = orders[0]
    print(f'订单: {order["orderNo"]}')
    print(f'状态: {order.get("status")}')
    print(f'有receiptImage: {bool(order.get("receiptImage"))}')
    print(f'有receiptUrl: {bool(order.get("receiptUrl"))}')
    print(f'有receiptProof: {bool(order.get("receiptProof"))}')
    
    dl_resp = requests.get(f'{BASE_URL}/orders/{order["id"]}/receipt/download', 
        headers={'Authorization': f'Bearer {user_token}'})
    print(f'\n下载状态: {dl_resp.status_code}')
    print(f'Content-Type: {dl_resp.headers.get("Content-Type")}')
    print(f'内容大小: {len(dl_resp.content)} bytes')
    
    if dl_resp.content:
        print(f'前20字节: {dl_resp.content[:20]}')
