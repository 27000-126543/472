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

# 1. 获取最新的任务列表
print("\n1. 获取所有任务:")
missions_resp = api_request(dispatcher_token, 'GET', '/missions')
all_missions = missions_resp.get('data', [])
print(f"   任务总数: {len(all_missions)}")
pending = [m for m in all_missions if m.get('status') in ['pending', 'ready']]
print(f"   待起飞/准备中: {len(pending)}")
for m in all_missions[-3:]:
    print(f"   - {m.get('missionNo')}: status={m.get('status')}, drone={m.get('droneName')}, droneId={m.get('droneId')}")

if not pending:
    print("\n没有待执行任务，使用最近创建的订单对应的任务")
    pending = [m for m in all_missions if m.get('status') != 'cancelled']

if pending:
    # 2. 测试任务改派
    test_mission = pending[-1]
    mission_id = test_mission['id']
    original_drone_id = test_mission.get('droneId')
    print(f"\n2. 测试任务改派")
    print(f"   任务: {test_mission.get('missionNo')} (id={mission_id})")
    print(f"   原无人机: {test_mission.get('droneName')} (id={original_drone_id})")

    # 获取可用无人机列表
    drones_resp = api_request(dispatcher_token, 'GET', '/drones')
    all_drones = drones_resp.get('data', [])
    available_drones = [d for d in all_drones if d.get('status') == 'ready' and d.get('id') != original_drone_id]
    print(f"   可用无人机: {len(available_drones)}")
    for d in available_drones:
        print(f"     - {d.get('name')}: status={d.get('status')}, battery={d.get('batteryLevel')}%")

    if available_drones:
        new_drone = available_drones[0]
        new_drone_id = new_drone['id']
        print(f"\n   改派到: {new_drone.get('name')} (id={new_drone_id})")
        
        reassign_resp = api_request(dispatcher_token, 'PUT', f'/missions/{mission_id}/reassign', {
            'droneId': new_drone_id
        })
        print(f"   改派结果: {json.dumps(reassign_resp, ensure_ascii=False)[:300]}")
        
        if reassign_resp.get('success'):
            reassign_data = reassign_resp.get('data', {})
            print(f"   ✅ 改派成功!")
            print(f"      新无人机: {reassign_data.get('droneName')} (id={reassign_data.get('droneId')})")
            print(f"      任务状态: {reassign_data.get('status')}")
            
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
        else:
            print(f"   ❌ 改派失败: {reassign_resp.get('message')}")

    # 3. 测试签收流程 - 先把任务流转到delivered状态
    print(f"\n3. 测试签收流程")
    
    # 直接用操作员推进任务
    print(f"   操作员启动任务...")
    start_resp = api_request(operator_token, 'PUT', f'/missions/{mission_id}/start')
    print(f"   启动: {start_resp.get('success')} - {start_resp.get('message', '')}")
    
    print(f"   操作员起飞...")
    takeoff_resp = api_request(operator_token, 'PUT', f'/missions/{mission_id}/takeoff')
    print(f"   起飞: {takeoff_resp.get('success')} - {takeoff_resp.get('message', '')}")
    
    # 直接完成任务（跳过飞行阶段）
    print(f"   完成配送...")
    complete_resp = api_request(operator_token, 'PUT', f'/missions/{mission_id}/complete')
    print(f"   完成: {complete_resp.get('success')} - {complete_resp.get('message', '')}")
    
    # 获取任务详情，看订单ID
    mission_detail = api_request(operator_token, 'GET', f'/missions/{mission_id}')
    if mission_detail and mission_detail.get('success'):
        md = mission_detail.get('data', {})
        order_id = md.get('orderId')
        order_no = md.get('orderNo')
        print(f"\n   任务状态: {md.get('status')}")
        print(f"   关联订单: {order_no} (id={order_id})")
        
        # 现在签收
        print(f"\n   操作员签收确认...")
        test_photo = 'data:image/png;base64,' + base64.b64encode(b'test photo for receipt validation').decode()
        receipt_resp = api_request(operator_token, 'PUT', f'/missions/{mission_id}/confirm-receipt', {
            'receiptImage': test_photo
        })
        print(f"   签收结果: {json.dumps(receipt_resp, ensure_ascii=False)[:400]}")
        
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
            
            # 验证订单详情
            if order_id:
                order_detail = api_request(user_token, 'GET', f'/orders/{order_id}')
                if order_detail and order_detail.get('success'):
                    od = order_detail.get('data', {})
                    print(f"\n      用户端订单详情:")
                    print(f"         状态: {od.get('status')}")
                    print(f"         签收时间: {od.get('receivedAt')}")
                    print(f"         签收照片: {'有' if od.get('receiptImage') else '无'}")
                    print(f"         凭证URL: {od.get('receiptUrl')}")
            
                    # 测试凭证下载
                    headers = {'Authorization': f'Bearer {operator_token}'}
                    download_resp = requests.get(f'{BASE_URL}/orders/{order_id}/receipt/download', headers=headers)
                    content_type = download_resp.headers.get('Content-Type', '')
                    content_length = len(download_resp.content)
                    print(f"\n      凭证下载测试:")
                    print(f"         Content-Type: {content_type}")
                    print(f"         Content-Length: {content_length} bytes")
                    if content_length > 500:  # 图片应该比500字节大
                        print(f"         ✅ 凭证下载成功 (获取到图片数据)")
                    else:
                        print(f"         ⚠️  凭证数据较小: {download_resp.content[:100]}")
        else:
            print(f"   ❌ 签收失败: {receipt_resp.get('message')}")

print("\n" + "=" * 60)
print("测试完成")
print("=" * 60)
