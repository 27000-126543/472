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

print("调试新环境数据...")

dispatcher_token = login('dispatcher', 'dispatcher123')
print(f"登录token: {dispatcher_token[:20]}...")

# 查看无人机
print("\n无人机列表:")
resp = requests.get(f'{BASE_URL}/drones', headers={'Authorization': f'Bearer {dispatcher_token}'})
data = resp.json()
if data.get('success'):
    drones = data.get('data', [])
    for d in drones:
        print(f"  - {d['name']}: status={d.get('status')}, battery={d.get('batteryLevel', d.get('battery'))}%, maxPayload={d.get('maxPayload')}kg")

# 测试航线规划
print("\n航线规划测试 (短距离):")
plan_resp = requests.get(f'{BASE_URL}/orders/plan-route?startLat=39.9000&startLng=116.4000&endLat=39.9050&endLng=116.4050&packageWeight=0.5', 
    headers={'Authorization': f'Bearer {login("testuser", "user123")}'})
plan_data = plan_resp.json()
print(f"  成功: {plan_data.get('success')}")
if plan_data.get('success'):
    d = plan_data.get('data', {})
    print(f"  距离: {d.get('distance')}km")
    print(f"  预计时间: {d.get('estimatedDuration')}分钟")
    print(f"  预计电池: {d.get('route', {}).get('estimatedBattery')}%")
    print(f"  可用无人机: {len(d.get('availableDrones', []))}架")
    for drone in d.get('availableDrones', []):
        print(f"    - {drone.get('name')}: battery={drone.get('batteryLevel', drone.get('battery'))}%")
else:
    print(f"  错误: {plan_data.get('message')}")

# 测试航线规划 (较长距离)
print("\n航线规划测试 (长距离):")
plan_resp2 = requests.get(f'{BASE_URL}/orders/plan-route?startLat=39.9000&startLng=116.4000&endLat=39.9800&endLng=116.3200&packageWeight=0.5', 
    headers={'Authorization': f'Bearer {login("testuser", "user123")}'})
plan_data2 = plan_resp2.json()
print(f"  成功: {plan_data2.get('success')}")
if plan_data2.get('success'):
    d = plan_data2.get('data', {})
    print(f"  距离: {d.get('distance')}km")
    print(f"  预计电池: {d.get('route', {}).get('estimatedBattery')}%")
    print(f"  可用无人机: {len(d.get('availableDrones', []))}架")
else:
    print(f"  错误: {plan_data2.get('message')}")
