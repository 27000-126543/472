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
print("完整测试: 任务改派 + 签收流程")
print("=" * 60)

user_token = login('testuser', 'user123')
operator_token = login('operator1', 'operator123')
dispatcher_token = login('dispatcher', 'dispatcher123')

# 首先创建一个新订单
print("\n1. 创建新订单")
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
    print(f"   ✅ 订单创建成功: {order.get('orderNo')}")
    print(f"      订单ID: {order.get('id')}")
    print(f"      关联任务ID: {order.get('missionId')}")
    print(f"      无人机ID: {order.get('droneId')}")
    order_id = order.get('id')
else:
    print(f"   ❌ 订单创建失败: {create_result}")
    exit(1)

# 获取最新任务
print("\n2. 获取任务列表")
missions_resp = api_request(dispatcher_token, 'GET', '/missions')
all_missions = missions_resp.get('data', [])
pending = [m for m in all_missions if m.get('id') == order.get('missionId')]
if not pending:
    pending = [m for m in all_missions if m.get('status') in ['pending', 'ready']]

if not pending:
    print("   ❌ 没有待执行任务")
    exit(1)

test_mission = pending[0]
mission_id = test_mission['id']
original_drone_id = test_mission.get('droneId')
print(f"   任务: {test_mission.get('missionNo')} (id={mission_id})")
print(f"   原无人机: {test_mission.get('droneName')} (id={original_drone_id})")

# 获取可用无人机列表
print("\n3. 获取可改派的无人机列表")
drones_resp = api_request(dispatcher_token, 'GET', f'/missions/{mission_id}/available-drones')
if drones_resp and drones_resp.get('success'):
    available_drones = drones_resp.get('data', [])
    print(f"   可用无人机数量: {len(available_drones)}")
    for d in available_drones:
        print(f"     - {d.get('name')}: status={d.get('status')}, battery={d.get('batteryLevel')}%")
else:
    print(f"   ❌ 获取可用无人机失败: {drones_resp}")
    # 退而求其次获取所有ready状态无人机
    all_drones_resp = api_request(dispatcher_token, 'GET', '/drones')
    all_drones = all_drones_resp.get('data', [])
    available_drones = [d for d in all_drones if d.get('status') == 'ready' and d.get('id') != original_drone_id]
    print(f"   可用无人机(备选): {len(available_drones)}")

if available_drones:
    new_drone = available_drones[0]
    new_drone_id = new_drone['id']
    print(f"\n4. 测试任务改派到: {new_drone.get('name')} (id={new_drone_id})")
    
    reassign_resp = api_request(dispatcher_token, 'PUT', f'/missions/{mission_id}/reassign', {
        'newDroneId': new_drone_id,
        'reason': '测试改派功能'
    })
    print(f"   改派结果: {json.dumps(reassign_resp, ensure_ascii=False)[:300]}")
    
    if reassign_resp.get('success'):
        reassign_data = reassign_resp.get('data', {})
        mission_data = reassign_data.get('mission', {})
        print(f"   ✅ 改派成功!")
        print(f"      新无人机ID: {mission_data.get('droneId')}")
        print(f"      任务状态: {mission_data.get('status')}")
        
        # 检查原无人机状态
        original_drone = api_request(dispatcher_token, 'GET', f'/drones/{original_drone_id}')
        if original_drone and original_drone.get('success'):
            od = original_drone.get('data', {})
            print(f"      原无人机状态: {od.get('status')}")
        
        # 检查新无人机状态
        new_drone_info = api_request(dispatcher_token, 'GET', f'/drones/{new_drone_id}')
        if new_drone_info and new_drone_info.get('success'):
            nd = new_drone_info.get('data', {})
            print(f"      新无人机状态: {nd.get('status')}")
        
        # 检查订单关联无人机是否更新
        order_check = api_request(user_token, 'GET', f'/orders/{order_id}')
        if order_check and order_check.get('success'):
            oc = order_check.get('data', {})
            print(f"      订单关联无人机: {oc.get('droneId')}")
            if oc.get('droneId') == new_drone_id:
                print(f"      ✅ 订单关联无人机已同步更新")
            else:
                print(f"      ❌ 订单关联无人机未同步更新")
    else:
        print(f"   ❌ 改派失败: {reassign_resp.get('message')}")

# 5. 测试签收流程
print(f"\n5. 测试签收流程")

# 先用操作员推进任务
print(f"   操作员启动任务...")
start_resp = api_request(operator_token, 'PUT', f'/missions/{mission_id}/start')
print(f"   启动: {start_resp.get('success')} - {start_resp.get('message', '')}")

print(f"   操作员起飞...")
takeoff_resp = api_request(operator_token, 'PUT', f'/missions/{mission_id}/takeoff')
print(f"   起飞: {takeoff_resp.get('success')} - {takeoff_resp.get('message', '')}")

# 现在直接调用签收（即使还在飞行，测试API是否正常工作）
print(f"\n6. 操作员签收确认")
test_photo_data = base64.b64encode(b'valid test photo data for receipt').decode()
test_photo = f'data:image/png;base64,{test_photo_data}'

receipt_resp = api_request(operator_token, 'PUT', f'/missions/{mission_id}/confirm-receipt', {
    'receiptImage': test_photo
})
print(f"   签收结果: {json.dumps(receipt_resp, ensure_ascii=False)[:500]}")

if receipt_resp.get('success'):
    receipt_data = receipt_resp.get('data', {})
    order = receipt_data.get('order', {})
    mission = receipt_data.get('mission', {})
    
    print(f"\n   ✅ 签收成功!")
    print(f"      订单状态: {order.get('status')}")
    print(f"      签收时间: {order.get('receivedAt')}")
    print(f"      签收照片: {'已保存' if order.get('receiptImage') else '未保存'}")
    print(f"      凭证URL: {order.get('receiptUrl')}")
    print(f"      任务状态: {mission.get('status')}")
    
    # 验证订单详情（用户端）
    if order_id:
        order_detail = api_request(user_token, 'GET', f'/orders/{order_id}')
        if order_detail and order_detail.get('success'):
            od = order_detail.get('data', {})
            print(f"\n   用户端订单详情验证:")
            print(f"      状态: {od.get('status')}")
            print(f"      签收时间: {od.get('receivedAt')}")
            print(f"      签收照片: {'有' if od.get('receiptImage') else '无'}")
            print(f"      凭证URL: {od.get('receiptUrl')}")
            
            all_ok = (
                od.get('status') == 'received' and
                od.get('receivedAt') is not None and
                od.get('receiptImage') is not None and
                od.get('receiptUrl') is not None
            )
            if all_ok:
                print(f"      ✅ 用户端订单数据完整!")
            else:
                print(f"      ❌ 用户端订单数据不完整")
    
            # 测试凭证下载
            headers = {'Authorization': f'Bearer {operator_token}'}
            download_resp = requests.get(f'{BASE_URL}/orders/{order_id}/receipt/download', headers=headers)
            content_type = download_resp.headers.get('Content-Type', '')
            content_length = len(download_resp.content)
            print(f"\n   凭证下载测试:")
            print(f"      Content-Type: {content_type}")
            print(f"      Content-Length: {content_length} bytes")
            if content_length > 0 and 'image' in content_type:
                print(f"      ✅ 凭证下载成功 (获取到图片数据)")
            else:
                print(f"      ❌ 凭证下载失败")
    
    # 验证任务状态
    if mission.get('status') == 'completed':
        print(f"\n   ✅ 任务状态已更新为 completed")
    else:
        print(f"\n   ❌ 任务状态未更新: {mission.get('status')}")
        
    # 验证无人机状态
    if mission.get('droneId'):
        drone_after = api_request(dispatcher_token, 'GET', f'/drones/{mission.get("droneId")}')
        if drone_after and drone_after.get('success'):
            da = drone_after.get('data', {})
            print(f"   无人机状态: {da.get('status')}")
            if da.get('status') == 'idle':
                print(f"   ✅ 无人机已恢复为 idle 状态")
else:
    print(f"   ❌ 签收失败: {receipt_resp.get('message')}")

# 7. 测试禁飞区停用
print(f"\n7. 测试禁飞区停用")
admin_token = login('admin', 'admin123')
zones_resp = api_request(admin_token, 'GET', '/no-fly-zones')
all_zones = zones_resp.get('data', [])
active_zones_before = [z for z in all_zones if z.get('isActive')]
print(f"   停用前激活禁飞区: {len(active_zones_before)}")

if active_zones_before:
    test_zone = active_zones_before[0]
    print(f"   停用禁飞区: {test_zone['name']}")
    
    toggle_resp = api_request(admin_token, 'PUT', f'/no-fly-zones/{test_zone["id"]}/toggle-active', {
        'isActive': False
    })
    print(f"   停用结果: {toggle_resp.get('success')}")
    
    if toggle_resp.get('success'):
        # 验证激活列表
        active_resp = api_request(admin_token, 'GET', '/no-fly-zones?active=true')
        active_after = active_resp.get('data', [])
        active_ids = [z['id'] for z in active_after]
        
        if test_zone['id'] not in active_ids:
            print(f"   ✅ 停用后不在激活列表中 (激活列表 {len(active_after)} 个)")
        else:
            print(f"   ❌ 停用后仍在激活列表中!")
        
        # 恢复
        api_request(admin_token, 'PUT', f'/no-fly-zones/{test_zone["id"]}/toggle-active', {
            'isActive': True
        })
        print(f"   已恢复为激活状态")

print("\n" + "=" * 60)
print("测试完成")
print("=" * 60)
