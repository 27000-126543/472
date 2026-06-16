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

# 测试用不同方式获取，通过修改active API调用看看
# 我们尝试通过修改no_fly_zones给第一个设置effective_from和effective_to来看看
zones_resp = requests.get(f'{BASE_URL}/no-fly-zones', headers={'Authorization': f'Bearer {admin_token}'})
all_zones = zones_resp.json().get('data', [])
first_zone = all_zones[0]

# 更新第一个禁飞区，设置一个过去的开始日期和未来的结束日期
update_data = {
    'name': first_zone['name'],
    'type': first_zone['type'],
    'coordinates': first_zone['coordinates'],
    'minAltitude': first_zone['minAltitude'],
    'maxAltitude': first_zone['maxAltitude'],
    'reason': first_zone['reason'],
    'isActive': True,
    'effectiveFrom': '2020-01-01T00:00:00.000Z',
    'effectiveTo': '2030-01-01T00:00:00.000Z'
}
resp = requests.put(
    f'{BASE_URL}/no-fly-zones/{first_zone["id"]}',
    json=update_data,
    headers={'Authorization': f'Bearer {admin_token}'}
)
print(f"更新第一个禁飞区: {resp.json().get('success')}")

# 再看active列表
active_resp = requests.get(f'{BASE_URL}/no-fly-zones/active', headers={'Authorization': f'Bearer {admin_token}'})
active_data = active_resp.json()
print(f"设置日期后，生效禁飞区数量: {len(active_data.get('data', []))}")
for z in active_data.get('data', []):
    print(f"  - {z['name']}: effectiveFrom={z.get('effectiveFrom')}, effectiveTo={z.get('effectiveTo')}")
