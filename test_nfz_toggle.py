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

# 1. 获取所有禁飞区
zones_resp = requests.get(f'{BASE_URL}/no-fly-zones', headers={'Authorization': f'Bearer {admin_token}'})
all_zones = zones_resp.json().get('data', [])
print(f"1. 所有禁飞区 ({len(all_zones)}):")
for z in all_zones:
    print(f"   - {z['name']}: isActive={z.get('isActive')}")

# 2. 停用天安门广场限制区
tiananmen = [z for z in all_zones if '天安门' in z['name']][0]
print(f"\n2. 停用 '{tiananmen['name']}' (id={tiananmen['id']})")
toggle_resp = requests.put(
    f'{BASE_URL}/no-fly-zones/{tiananmen["id"]}/toggle-active',
    json={'isActive': False},
    headers={'Authorization': f'Bearer {admin_token}'}
)
toggle_result = toggle_resp.json()
print(f"   操作成功: {toggle_result.get('success')}")
print(f"   新状态: isActive={toggle_result.get('data', {}).get('isActive')}")

# 3. 获取激活的禁飞区
active_resp = requests.get(f'{BASE_URL}/no-fly-zones?active=true', headers={'Authorization': f'Bearer {admin_token}'})
active_zones = active_resp.json().get('data', [])
print(f"\n3. 激活的禁飞区 ({len(active_zones)}):")
for z in active_zones:
    print(f"   - {z['name']}: isActive={z.get('isActive')}")

# 4. 验证天安门是否在激活列表中
active_ids = [z['id'] for z in active_zones]
if tiananmen['id'] not in active_ids:
    print(f"\n✅ 验证通过: 停用的 '{tiananmen['name']}' 不在激活列表中")
else:
    print(f"\n❌ 验证失败: 停用的 '{tiananmen['name']}' 仍在激活列表中!")

# 5. 现在测试任务改派
print("\n" + "=" * 60)
print("测试任务改派")
print("=" * 60)

# 先把天安门禁飞区恢复
requests.put(
    f'{BASE_URL}/no-fly-zones/{tiananmen["id"]}/toggle-active',
    json={'isActive': True},
    headers={'Authorization': f'Bearer {admin_token}'}
)
print("已恢复天安门禁飞区为激活状态")
