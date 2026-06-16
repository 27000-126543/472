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

def api_request(token, method, endpoint, json_data=None):
    headers = {'Authorization': f'Bearer {token}'}
    if method == 'GET':
        resp = requests.get(f'{BASE_URL}{endpoint}', headers=headers)
    elif method == 'PUT':
        resp = requests.put(f'{BASE_URL}{endpoint}', json=json_data, headers=headers)
    elif method == 'POST':
        resp = requests.post(f'{BASE_URL}{endpoint}', json=json_data, headers=headers)
    else:
        return None
    return resp.json()

print("=" * 60)
print("新功能综合测试")
print("=" * 60)

user_token = login('testuser', 'user123')
operator_token = login('operator1', 'operator123')
dispatcher_token = login('dispatcher', 'dispatcher123')
admin_token = login('admin', 'admin123')

# 步骤1: 创建订单
print("\n1. 创建测试订单")
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
create_result = api_request(user_token, 'POST', '/orders', order_data)
if create_result and create_result.get('success'):
    order = create_result.get('data', {})
    order_id = order.get('id')
    mission_id = order.get('missionId')
    print(f"   ✅ 订单创建成功: {order.get('orderNo')}")
    print(f"      订单ID: {order_id}")
    print(f"      任务ID: {mission_id}")
else:
    print(f"   ❌ 订单创建失败: {create_result}")
    exit(1)

# 步骤2: 测试订单时间线（初始状态）
print(f"\n2. 测试订单时间线（创建后）")
timeline_resp = api_request(user_token, 'GET', f'/orders/{order_id}/timeline')
if timeline_resp and timeline_resp.get('success'):
    timeline = timeline_resp.get('data', [])
    print(f"   ✅ 时间线获取成功，共 {len(timeline)} 个事件")
    for event in timeline:
        print(f"      - [{event.get('type')}] {event.get('title')} @ {event.get('timestamp')}")
else:
    print(f"   ❌ 时间线获取失败: {timeline_resp}")

# 步骤3: 测试改派
print(f"\n3. 测试任务改派")
available_resp = api_request(dispatcher_token, 'GET', f'/missions/{mission_id}/available-drones')
if available_resp and available_resp.get('success'):
    drones = available_resp.get('data', [])
    print(f"   可用无人机: {len(drones)}")
    if drones:
        new_drone = drones[0]
        reassign_resp = api_request(dispatcher_token, 'PUT', f'/missions/{mission_id}/reassign', {
            'newDroneId': new_drone['id'],
            'reason': '测试改派功能 - 优化资源分配'
        })
        print(f"   改派结果: {reassign_resp.get('success')} - {reassign_resp.get('message', '')}")
        if reassign_resp.get('success'):
            data = reassign_resp.get('data', {})
            print(f"      新无人机: {data.get('mission', {}).get('droneId')}")
        else:
            print(f"      错误: {reassign_resp.get('message')}")

# 步骤4: 测试改派记录
print(f"\n4. 测试改派记录查询")
reassignments_resp = api_request(dispatcher_token, 'GET', f'/missions/{mission_id}/reassignments')
if reassignments_resp and reassignments_resp.get('success'):
    reassignments = reassignments_resp.get('data', [])
    print(f"   ✅ 改派记录: {len(reassignments)} 条")
    for r in reassignments:
        print(f"      - {r.get('oldDroneName')} -> {r.get('newDroneName')}")
        print(f"        改派人: {r.get('reassignedByName')}")
        print(f"        原因: {r.get('reason', '无')}")
        print(f"        时间: {r.get('createdAt')}")
else:
    print(f"   ❌ 改派记录获取失败: {reassignments_resp}")

# 步骤5: 操作员推进任务并签收
print(f"\n5. 推进任务并签收")
api_request(operator_token, 'PUT', f'/missions/{mission_id}/start')
api_request(operator_token, 'PUT', f'/missions/{mission_id}/takeoff')
print("   任务已起飞")

test_photo_data = base64.b64encode(b'test receipt photo for timeline test').decode()
receipt_resp = api_request(operator_token, 'PUT', f'/missions/{mission_id}/confirm-receipt', {
    'receiptImage': f'data:image/png;base64,{test_photo_data}'
})
print(f"   签收: {'成功' if receipt_resp.get('success') else '失败'}")

# 步骤6: 再次查看时间线
print(f"\n6. 测试完整订单时间线")
timeline_resp2 = api_request(user_token, 'GET', f'/orders/{order_id}/timeline')
if timeline_resp2 and timeline_resp2.get('success'):
    timeline = timeline_resp2.get('data', [])
    print(f"   ✅ 时间线共 {len(timeline)} 个事件:")
    for event in timeline:
        drone = event.get('droneName', '')
        op = event.get('operatorName', '')
        extra = ''
        if drone:
            extra += f' [无人机: {drone}]'
        if op:
            extra += f' [操作人: {op}]'
        print(f"      [{event.get('type')}] {event.get('title')} @ {event.get('timestamp')}{extra}")
else:
    print(f"   ❌ 时间线获取失败")

# 步骤7: 测试禁飞区影响预览
print(f"\n7. 测试禁飞区影响预览")
preview_data = {
    'name': '测试预览区域',
    'type': 'forbidden',
    'coordinates': [
        {'lat': 39.8950, 'lng': 116.3950},
        {'lat': 39.8950, 'lng': 116.4150},
        {'lat': 39.9150, 'lng': 116.4150},
        {'lat': 39.9150, 'lng': 116.3950}
    ],
    'minAltitude': 0,
    'maxAltitude': 120,
    'isActive': True
}
preview_resp = api_request(admin_token, 'POST', '/no-fly-zones/preview-impact', preview_data)
if preview_resp and preview_resp.get('success'):
    preview = preview_resp.get('data', {})
    print(f"   ✅ 影响预览成功")
    print(f"      影响任务数: {preview.get('missionCount')}")
    print(f"      影响订单数: {preview.get('orderCount')}")
    print(f"      待起飞任务: {preview.get('pendingCount')}")
    print(f"      飞行中任务: {preview.get('flyingCount')}")
    if preview.get('affectedMissions'):
        for m in preview.get('affectedMissions'):
            print(f"         - {m.get('missionNo')} ({m.get('status')})")
else:
    print(f"   ❌ 影响预览失败: {preview_resp}")

print("\n" + "=" * 60)
print("测试完成")
print("=" * 60)
