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

def api_request(token, method, endpoint, json_data=None, desc=''):
    headers = {'Authorization': f'Bearer {token}'}
    try:
        if method == 'GET':
            resp = requests.get(f'{BASE_URL}{endpoint}', headers=headers)
        elif method == 'PUT':
            resp = requests.put(f'{BASE_URL}{endpoint}', json=json_data, headers=headers)
        elif method == 'POST':
            resp = requests.post(f'{BASE_URL}{endpoint}', json=json_data, headers=headers)
        else:
            return None
        data = resp.json()
        if data.get('success'):
            if desc:
                print(f"   ✅ {desc}")
            return data
        else:
            if desc:
                print(f"   ❌ {desc}: {data.get('message', data.get('error', '未知错误'))}")
            return data
    except Exception as e:
        print(f"   ❌ 请求异常: {e}")
        return None

print("=" * 70)
print("新环境全流程端到端测试 (短距离航线)")
print("=" * 70)

user_token = login('testuser', 'user123')
operator_token = login('operator1', 'operator123')
dispatcher_token = login('dispatcher', 'dispatcher123')
admin_token = login('admin', 'admin123')

# 1. 用户下单
print("\n📋 步骤1: 用户下单")
order_data = {
    'senderName': '张三',
    'senderPhone': '13800000001',
    'senderAddress': '测试起点大厦',
    'senderLat': 39.9500,
    'senderLng': 116.4800,
    'receiverName': '李四',
    'receiverPhone': '13800000002',
    'receiverAddress': '测试终点大厦',
    'receiverLat': 39.9550,
    'receiverLng': 116.4850,
    'packageType': 'document',
    'packageWeight': 0.5
}
create_resp = api_request(user_token, 'POST', '/orders', order_data, '创建订单')
if not create_resp or not create_resp.get('success'):
    print("   下单失败，终止测试")
    exit(1)

order = create_resp['data']
order_id = order['id']
order_no = order['orderNo']
mission_id = order.get('missionId')
print(f"      订单号: {order_no}")
print(f"      订单ID: {order_id}")
print(f"      任务ID: {mission_id}")
print(f"      订单状态: {order.get('status')}")

# 2. 查看订单时间线（初始状态）
print(f"\n📋 步骤2: 查看订单时间线")
timeline_resp = api_request(user_token, 'GET', f'/orders/{order_id}/timeline', None, '获取时间线')
if timeline_resp and timeline_resp.get('success'):
    timeline = timeline_resp.get('data', [])
    print(f"      时间线事件数: {len(timeline)}")
    for event in timeline:
        drone = event.get('droneName', '')
        op = event.get('operatorName', '')
        extra = ''
        if drone:
            extra += f' [无人机: {drone}]'
        if op:
            extra += f' [操作人: {op}]'
        print(f"         [{event.get('type')}] {event.get('title')} @ {event.get('timestamp')}{extra}")

# 3. 调度员改派无人机
print(f"\n📋 步骤3: 调度员改派无人机")
available_resp = api_request(dispatcher_token, 'GET', f'/missions/{mission_id}/available-drones', None, '查询可用无人机')
if available_resp and available_resp.get('success'):
    drones = available_resp.get('data', [])
    print(f"      可用无人机: {len(drones)} 架")
    if drones:
        new_drone = drones[0]
        reassign_resp = api_request(dispatcher_token, 'PUT', f'/missions/{mission_id}/reassign', {
            'newDroneId': new_drone['id'],
            'reason': '新环境测试 - 优化资源分配'
        }, '改派无人机')
        if reassign_resp and reassign_resp.get('success'):
            print(f"      新无人机: {new_drone.get('name')}")

# 4. 查看改派记录
print(f"\n📋 步骤4: 查看改派记录")
reassign_resp = api_request(dispatcher_token, 'GET', f'/missions/{mission_id}/reassignments', None, '获取改派记录')
if reassign_resp and reassign_resp.get('success'):
    records = reassign_resp.get('data', [])
    print(f"      改派记录数: {len(records)}")
    for r in records:
        print(f"         - {r.get('oldDroneName', '?')} → {r.get('newDroneName', '?')}")
        print(f"           改派人: {r.get('reassignedByName', '?')}")
        print(f"           原因: {r.get('reason', '无')}")
        print(f"           时间: {r.get('createdAt', '?')}")

# 5. 操作员推进任务
print(f"\n📋 步骤5: 操作员推进任务")
api_request(operator_token, 'PUT', f'/missions/{mission_id}/start', None, '开始任务准备')
api_request(operator_token, 'PUT', f'/missions/{mission_id}/takeoff', None, '无人机起飞')

# 6. 返航
api_request(operator_token, 'PUT', f'/missions/{mission_id}/return', None, '开始返航')

# 7. 操作员拍照签收
print(f"\n📋 步骤6: 操作员拍照签收")
test_photo_data = base64.b64encode(b'new env test receipt photo').decode()
receipt_resp = api_request(operator_token, 'PUT', f'/missions/{mission_id}/confirm-receipt', {
    'receiptImage': f'data:image/png;base64,{test_photo_data}'
}, '确认签收并生成凭证')

# 8. 再次查看完整时间线
print(f"\n📋 步骤7: 查看完整配送时间线")
timeline_resp2 = api_request(user_token, 'GET', f'/orders/{order_id}/timeline', None, '获取完整时间线')
if timeline_resp2 and timeline_resp2.get('success'):
    timeline = timeline_resp2.get('data', [])
    print(f"      时间线事件数: {len(timeline)}")
    for event in timeline:
        drone = event.get('droneName', '')
        op = event.get('operatorName', '')
        extra = ''
        if drone:
            extra += f' [无人机: {drone}]'
        if op:
            extra += f' [操作人: {op}]'
        print(f"         [{event.get('type')}] {event.get('title')} @ {event.get('timestamp')}{extra}")

# 9. 下载签收凭证
print(f"\n📋 步骤8: 下载签收凭证")
try:
    resp = requests.get(f'{BASE_URL}/orders/{order_id}/receipt/download', headers={
        'Authorization': f'Bearer {user_token}'
    })
    if resp.ok and len(resp.content) > 100:
        print(f"   ✅ 凭证下载成功，大小: {len(resp.content)} bytes")
    else:
        print(f"   ❌ 凭证下载失败: status={resp.status_code}")
except Exception as e:
    print(f"   ❌ 凭证下载异常: {e}")

# 10. 管理员禁飞区影响预览
print(f"\n📋 步骤9: 管理员禁飞区影响预览")
preview_data = {
    'name': '测试禁飞区',
    'type': 'forbidden',
    'coordinates': [
        {'lat': 39.9450, 'lng': 116.4750},
        {'lat': 39.9450, 'lng': 116.4900},
        {'lat': 39.9600, 'lng': 116.4900},
        {'lat': 39.9600, 'lng': 116.4750}
    ],
    'minAltitude': 0,
    'maxAltitude': 500,
    'isActive': True
}
preview_resp = api_request(admin_token, 'POST', '/no-fly-zones/preview-impact', preview_data, '禁飞区影响预览')
if preview_resp and preview_resp.get('success'):
    preview = preview_resp.get('data', {})
    print(f"      影响任务数: {preview.get('missionCount')}")
    print(f"      影响订单数: {preview.get('orderCount')}")
    print(f"      待起飞任务: {preview.get('pendingCount')}")
    print(f"      飞行中任务: {preview.get('flyingCount')}")

# 11. 验证订单最终状态
print(f"\n📋 步骤10: 验证订单和任务状态")
order_resp = api_request(user_token, 'GET', f'/orders/{order_id}', None, '查询订单详情')
if order_resp and order_resp.get('success'):
    final_order = order_resp.get('data', {})
    print(f"      订单状态: {final_order.get('status')}")
    print(f"      签收时间: {final_order.get('receivedAt', '无')}")
    print(f"      有凭证图片: {'是' if final_order.get('receiptImage') else '否'}")
    print(f"      有凭证证明: {'是' if final_order.get('receiptProof') else '否'}")

mission_resp = api_request(dispatcher_token, 'GET', f'/missions/{mission_id}', None, '查询任务详情')
if mission_resp and mission_resp.get('success'):
    mission = mission_resp.get('data', {})
    print(f"      任务状态: {mission.get('status')}")
    print(f"      无人机ID: {mission.get('droneId')}")

# 12. 测试已完成任务不能改派
print(f"\n📋 步骤11: 验证已完成任务不能改派")
reassign_resp2 = api_request(dispatcher_token, 'PUT', f'/missions/{mission_id}/reassign', {
    'newDroneId': 'drone-002',
    'reason': '测试已完成任务改派'
}, '已完成任务改派测试 (期望失败)')
if reassign_resp2 and not reassign_resp2.get('success'):
    print(f"      ✅ 正确拒绝已完成任务的改派请求")
    print(f"      失败信息: {reassign_resp2.get('message')}")

print("\n" + "=" * 70)
print("🎉 全流程测试完成")
print("=" * 70)
