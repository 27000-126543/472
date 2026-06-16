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

user_token = login('testuser', 'user123')
admin_token = login('admin', 'admin123')

# 测试航线规划API
route_data = {
    'startLat': 40.0029,
    'startLng': 116.4700,
    'endLat': 39.9847,
    'endLng': 116.3046,
    'packageWeight': 0.5
}

# 直接访问航线规划（如果有公开接口），否则检查禁飞区
zones_resp = requests.get(f'{BASE_URL}/no-fly-zones', headers={'Authorization': f'Bearer {admin_token}'})
zones = zones_resp.json().get('data', [])
for z in zones:
    print(f"禁飞区: {z['name']}")
    print(f"  坐标: {z.get('coordinates')[:2]}...")
    # 检查起点终点是否在禁飞区内
    from math import radians, sin, cos, sqrt, atan2
    coords = z.get('coordinates', [])
    
    # 简单的点在多边形检测
    def point_in_polygon(point, polygon):
        x, y = point['lat'], point['lng']
        inside = False
        n = len(polygon)
        j = n - 1
        for i in range(n):
            xi, yi = polygon[i]['lat'], polygon[i]['lng']
            xj, yj = polygon[j]['lat'], polygon[j]['lng']
            if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi) + xi):
                inside = not inside
            j = i
        return inside
    
    start = {'lat': 40.0029, 'lng': 116.4700}
    end = {'lat': 39.9847, 'lng': 116.3046}
    mid = {'lat': (40.0029 + 39.9847) / 2, 'lng': (116.4700 + 116.3046) / 2}
    
    print(f"  起点在区域内: {point_in_polygon(start, coords)}")
    print(f"  中点在区域内: {point_in_polygon(mid, coords)}")
    print(f"  终点在区域内: {point_in_polygon(end, coords)}")
    print()

# 现在尝试用一个非常简单的地点创建订单
print("\n尝试用更简单的坐标创建订单:")
order_data = {
    'senderName': '张三',
    'senderPhone': '13800000001',
    'senderAddress': '测试起点',
    'senderLat': 39.9000,
    'senderLng': 116.4000,
    'receiverName': '李四',
    'receiverPhone': '13800000002',
    'receiverAddress': '测试终点',
    'receiverLat': 39.9100,
    'receiverLng': 116.4100,
    'packageType': 'document',
    'packageWeight': 0.5
}
resp = requests.post(f'{BASE_URL}/orders', json=order_data, headers={'Authorization': f'Bearer {user_token}'})
result = resp.json()
print(f"结果: {json.dumps(result, ensure_ascii=False)[:300]}")
