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
    elif method == 'POST':
        resp = requests.post(f'{BASE_URL}{endpoint}', json=json_data, headers=headers)
    else:
        return None
    return resp.json()

print("=" * 60)
print("验证禁飞区停用功能")
print("=" * 60)

admin_token = login('admin', 'admin123')
zones = api_request(admin_token, 'GET', '/no-fly-zones')
all_zones = zones.get('data', [])
print(f"所有禁飞区 ({len(all_zones)}):")
for z in all_zones:
    print(f"  - {z['name']}: isActive={z['isActive']}")

active_zones = api_request(admin_token, 'GET', '/no-fly-zones/active')
active_list = active_zones.get('data', [])
print(f"\n生效禁飞区 ({len(active_list)}):")
for z in active_list:
    print(f"  - {z['name']}: isActive={z['isActive']}")

all_ids = [z['id'] for z in all_zones if not z['isActive']]
active_ids = [z['id'] for z in active_list]
for inactive_id in all_ids:
    if inactive_id in active_ids:
        print(f"\n❌ BUG: 停用的禁飞区 {inactive_id} 仍在生效列表中!")
    else:
        name = [z['name'] for z in all_zones if z['id'] == inactive_id][0]
        print(f"\n✅ 验证通过: 停用区域 '{name}' 不在生效列表中")

print("\n" + "=" * 60)
print("创建测试订单并测试签收流程")
print("=" * 60)

# 用普通用户登录创建一个订单
user_token = login('testuser', 'user123')
print(f"\n用户登录: {'成功' if user_token else '失败'}")

# 创建订单
order_data = {
    'senderName': '张三',
    'senderPhone': '13800000001',
    'senderAddress': '北京市朝阳区望京SOHO',
    'senderLat': 40.0029,
    'senderLng': 116.4700,
    'receiverName': '李四',
    'receiverPhone': '13800000002',
    'receiverAddress': '北京市海淀区中关村',
    'receiverLat': 39.9847,
    'receiverLng': 116.3046,
    'packageType': 'document',
    'packageWeight': 0.5
}
create_result = api_request(user_token, 'POST', '/orders', order_data)
if create_result and create_result.get('success'):
    order = create_result.get('data', {})
    print(f"✅ 订单创建成功: {order.get('orderNo')}")
    print(f"   订单状态: {order.get('status')}")
    print(f"   关联任务ID: {order.get('missionId', '无')}")
    order_id = order.get('id')
    
    # 用调度员获取任务列表
    dispatcher_token = login('dispatcher', 'dispatcher123')
    missions = api_request(dispatcher_token, 'GET', '/missions')
    all_missions = missions.get('data', [])
    pending_missions = [m for m in all_missions if m.get('status') in ['pending', 'ready']]
    print(f"\n待执行任务: {len(pending_missions)}")
    
    # 用操作员登录，获取任务并模拟起飞
    operator_token = login('operator1', 'operator123')
    if pending_missions:
        test_mission = pending_missions[-1]
        mission_id = test_mission['id']
        print(f"\n选择任务: {test_mission.get('missionNo')} (状态: {test_mission.get('status')})")
        
        # 启动任务
        start_result = api_request(operator_token, 'PUT', f'/missions/{mission_id}/start')
        print(f"启动任务: {'成功' if start_result and start_result.get('success') else '失败'}")
        
        # 起飞
        takeoff_result = api_request(operator_token, 'PUT', f'/missions/{mission_id}/takeoff')
        print(f"无人机起飞: {'成功' if takeoff_result and takeoff_result.get('success') else '失败'}")
        
        # 直接更新订单状态到delivered（模拟飞行完成）
        # 手动测试拍照和签收
        import base64
        test_photo = 'data:image/png;base64,' + base64.b64encode(b'test photo for receipt').decode()
        
        # 先获取最新任务
        mission_detail = api_request(operator_token, 'GET', f'/missions/{mission_id}')
        if mission_detail and mission_detail.get('success'):
            m = mission_detail.get('data', {})
            print(f"当前任务状态: {m.get('status')}")
        
        # 签收确认（即使任务还在飞行，测试API是否正常）
        receipt_result = api_request(operator_token, 'PUT', f'/missions/{mission_id}/confirm-receipt', {
            'receiptImage': test_photo
        })
        print(f"签收确认API结果: {json.dumps(receipt_result, ensure_ascii=False)[:200]}")
        
        if receipt_result and receipt_result.get('success'):
            order_data = receipt_result.get('data', {}).get('order', {})
            print(f"\n✅ 签收成功!")
            print(f"   订单状态: {order_data.get('status')}")
            print(f"   签收时间: {order_data.get('receivedAt')}")
            print(f"   签收照片: {'已保存' if order_data.get('receiptImage') else '未保存'}")
            
            # 测试凭证下载
            test_order_id = order_data.get('id')
            if test_order_id:
                headers = {'Authorization': f'Bearer {operator_token}'}
                resp = requests.get(f'{BASE_URL}/orders/{test_order_id}/receipt/download', headers=headers)
                content_type = resp.headers.get('Content-Type', '')
                content_length = len(resp.content)
                print(f"   凭证下载: Type={content_type}, Size={content_length} bytes")
                if content_length > 0:
                    print(f"   ✅ 凭证下载成功")
                else:
                    print(f"   ❌ 凭证下载失败")
else:
    print(f"订单创建失败: {json.dumps(create_result, ensure_ascii=False)}")

print("\n" + "=" * 60)
print("测试完成")
print("=" * 60)
