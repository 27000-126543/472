#!/usr/bin/env python3
import requests
import json

BASE_URL = 'http://localhost:3001/api'

def login(username, password):
    resp = requests.post(f'{BASE_URL}/auth/login', json={
        'username': username,
        'password': password
    })
    data = resp.json()
    return data.get('data', {}).get('token', '') if data.get('success') else ''

admin_token = login('admin', 'admin123')

# 现在用正确的参数调用getAll接口
resp = requests.get(f'{BASE_URL}/no-fly-zones?active=true', headers={'Authorization': f'Bearer {admin_token}'})
result = resp.json()
print(f"使用?active=true调用: 成功={result.get('success')}, 数量={len(result.get('data', []))}")
for z in result.get('data', []):
    print(f"  - {z['name']}: isActive={z.get('isActive')}")

# 再不加active参数
resp2 = requests.get(f'{BASE_URL}/no-fly-zones', headers={'Authorization': f'Bearer {admin_token}'})
all_zones = resp2.json().get('data', [])
print(f"\n不加active参数: 数量={len(all_zones)}")
