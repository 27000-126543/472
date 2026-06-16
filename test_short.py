#!/usr/bin/env python3
import requests
import json
import base64

BASE_URL = 'http://localhost:3001/api'

def login(username, password):
    resp = requests.post(f'{BASE_URL}/auth/login', json={
        'username': username,
        'password': password
    })
    data = resp.json()
    return data.get('data', {}).get('token', '') if data.get('success') else ''

user_token = login('testuser', 'user123')
operator_token = login('operator1', 'operator123')
dispatcher_token = login('dispatcher', 'dispatcher123')
admin_token = login('admin', 'admin123')

print("测试短距离下单 (避开机场等禁飞区)...")

# 用更短的距离，并且在非禁飞区
order_data = {
    'senderName': '张三',
    'senderPhone': '13800000001',
    'senderAddress': '测试起点',
    'senderLat': 39.9500,
    'senderLng': 116.4800,
    'receiverName': '李四',
    'receiverPhone': '13800000002',
    'receiverAddress': '测试终点',
    'receiverLat': 39.9550,
    'receiverLng': 116.4850,
    'packageType': 'document',
    'packageWeight': 0.5
}

print("\n创建订单:")
resp = requests.post(f'{BASE_URL}/orders', json=order_data, headers={
    'Authorization': f'Bearer {user_token}'
})
data = resp.json()
print(f"  成功: {data.get('success')}")
if not data.get('success'):
    print(f"  错误: {data.get('message')}")
    # 尝试获取详细错误
    print(f"  完整响应: {json.dumps(data, ensure_ascii=False)[:500]}")
else:
    order = data['data']
    order_id = order['id']
    mission_id = order.get('missionId')
    print(f"  订单ID: {order_id}")
    print(f"  任务ID: {mission_id}")
    print(f"  订单状态: {order.get('status')}")
    
    # 测试时间线
    print("\n测试时间线:")
    tl_resp = requests.get(f'{BASE_URL}/orders/{order_id}/timeline', headers={
        'Authorization': f'Bearer {user_token}'
    })
    tl_data = tl_resp.json()
    print(f"  成功: {tl_data.get('success')}")
    if tl_data.get('success'):
        timeline = tl_data.get('data', [])
        print(f"  事件数: {len(timeline)}")
        for e in timeline:
            print(f"    - [{e['type']}] {e['title']} @ {e['timestamp']}")
