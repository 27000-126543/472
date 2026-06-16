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

def api_request(token, method, endpoint, json_data=None):
    headers = {'Authorization': f'Bearer {token}'}
    if method == 'GET':
        resp = requests.get(f'{BASE_URL}{endpoint}', headers=headers)
    elif method == 'PUT':
        resp = requests.put(f'{BASE_URL}{endpoint}', json=json_data, headers=headers)
    else:
        return None
    return resp.json()

admin_token = login('admin', 'admin123')

# 先恢复首都机场禁飞区
zones = api_request(admin_token, 'GET', '/no-fly-zones')
all_zones = zones.get('data', [])
beijing = [z for z in all_zones if '首都' in z['name']][0]
print(f"恢复 '{beijing['name']}' 为启用状态")
result = api_request(admin_token, 'PUT', f'/no-fly-zones/{beijing["id"]}/toggle-active', {'isActive': True})
print(f"恢复结果: {result.get('success')}, 状态: {result.get('data', {}).get('isActive')}")

# 现在查看所有禁飞区的详细信息
zones = api_request(admin_token, 'GET', '/no-fly-zones')
all_zones = zones.get('data', [])
print(f"\n所有禁飞区详细信息:")
for z in all_zones:
    print(f"  - {z['name']}")
    print(f"    isActive: {z.get('isActive')}")
    print(f"    effectiveFrom: {z.get('effectiveFrom')}")
    print(f"    effectiveTo: {z.get('effectiveTo')}")
    print(f"    createdAt: {z.get('createdAt')}")

# 再看active列表
active = api_request(admin_token, 'GET', '/no-fly-zones/active')
print(f"\n生效禁飞区数量: {len(active.get('data', []))}")
for z in active.get('data', []):
    print(f"  - {z['name']} (isActive={z.get('isActive')})")

# 测试获取无人机列表，看看为什么创建订单说没有可用无人机
print("\n获取所有无人机:")
disp_token = login('dispatcher', 'dispatcher123')
drones_resp = api_request(disp_token, 'GET', '/drones')
drones = drones_resp.get('data', [])
for d in drones:
    print(f"  - {d['name']}: status={d.get('status')}, battery={d.get('batteryLevel')}%, payload={d.get('maxPayload')}kg")
