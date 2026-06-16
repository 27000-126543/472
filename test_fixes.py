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
print("无人机配送调度平台 - 修复功能测试")
print("=" * 60)

# 测试1: 禁飞区停用
print("\n1. 测试禁飞区停用功能")
admin_token = login('admin', 'admin123')
if admin_token:
    zones = api_request(admin_token, 'GET', '/no-fly-zones')
    if zones and zones.get('success'):
        all_zones = zones.get('data', [])
        print(f"   所有禁飞区数量: {len(all_zones)}")
        if all_zones:
            first_zone = all_zones[0]
            zone_id = first_zone['id']
            original_active = first_zone['isActive']
            print(f"   测试区域: {first_zone['name']} (原状态: {'启用' if original_active else '停用'})")
            
            # 切换状态
            result = api_request(admin_token, 'PUT', f'/no-fly-zones/{zone_id}/toggle-active', {'isActive': not original_active})
            if result and result.get('success'):
                new_state = result['data']['isActive']
                print(f"   切换后状态: {'启用' if new_state else '停用'} ✅")
                
                # 验证生效列表
                active_zones = api_request(admin_token, 'GET', '/no-fly-zones/active')
                if active_zones and active_zones.get('success'):
                    active_count = len(active_zones.get('data', []))
                    print(f"   生效禁飞区数量: {active_count}")
                    active_ids = [z['id'] for z in active_zones.get('data', [])]
                    if not new_state:
                        if zone_id not in active_ids:
                            print(f"   ✅ 停用后不在生效列表中")
                        else:
                            print(f"   ❌ 停用后仍在生效列表中!")
                    else:
                        if zone_id in active_ids:
                            print(f"   ✅ 启用后在生效列表中")
else:
    print("   管理员登录失败 ❌")

# 测试2: 任务改派
print("\n2. 测试任务改派功能")
dispatcher_token = login('dispatcher', 'dispatcher123')
if dispatcher_token:
    missions = api_request(dispatcher_token, 'GET', '/missions')
    if missions and missions.get('success'):
        all_missions = missions.get('data', [])
        pending_missions = [m for m in all_missions if m.get('status') in ['pending', 'ready', 'flying']]
        print(f"   待改派任务数量: {len(pending_missions)}")
        if pending_missions:
            test_mission = pending_missions[0]
            mission_id = test_mission['id']
            old_drone = test_mission.get('droneId', 'N/A')
            print(f"   测试任务: {test_mission.get('missionNo')} (当前无人机: {old_drone})")
            
            # 获取可用无人机
            drones = api_request(dispatcher_token, 'GET', f'/missions/{mission_id}/available-drones')
            if drones and drones.get('success'):
                available = drones.get('data', [])
                print(f"   可改派无人机数量: {len(available)}")
                if available:
                    new_drone = available[0]
                    print(f"   选择目标无人机: {new_drone.get('name')} ({new_drone.get('id')})")
                    
                    # 执行改派
                    result = api_request(dispatcher_token, 'PUT', f'/missions/{mission_id}/reassign', {
                        'newDroneId': new_drone['id'],
                        'reason': '测试改派功能'
                    })
                    if result and result.get('success'):
                        print(f"   ✅ 改派成功!")
                        
                        # 验证任务更新
                        updated_missions = api_request(dispatcher_token, 'GET', '/missions')
                        if updated_missions and updated_missions.get('success'):
                            updated = [m for m in updated_missions.get('data', []) if m['id'] == mission_id]
                            if updated:
                                updated_drone = updated[0].get('droneId', 'N/A')
                                if updated_drone == new_drone['id']:
                                    print(f"   ✅ 任务无人机ID已更新为: {updated_drone}")
                                else:
                                    print(f"   ❌ 任务无人机ID未更新! 期望: {new_drone['id']}, 实际: {updated_drone}")
                    else:
                        print(f"   ❌ 改派失败: {result.get('message', '未知错误')}")
else:
    print("   调度员登录失败 ❌")

# 测试3: 签收流程
print("\n3. 测试签收流程")
operator_token = login('operator1', 'operator123')
if operator_token:
    missions = api_request(operator_token, 'GET', '/missions')
    if missions and missions.get('success'):
        all_missions = missions.get('data', [])
        delivered_missions = [m for m in all_missions if m.get('status') in ['delivered', 'returning']]
        
        # 如果没有delivered的任务，找一个pending的手动创建订单
        if not delivered_missions:
            print(f"   没有已送达任务，尝试先创建一个测试订单")
            # 先找个已送达或已完成的订单
            orders = api_request(operator_token, 'GET', '/orders')
            if orders and orders.get('success'):
                all_orders = orders.get('data', [])
                delivered_orders = [o for o in all_orders if o.get('status') in ['delivered', 'received']]
                print(f"   已送达/已签收订单数量: {len(delivered_orders)}")
                if delivered_orders:
                    test_order = delivered_orders[0]
                    print(f"   测试订单: {test_order.get('orderNo')} (状态: {test_order.get('status')})")
                    print(f"   已存在签收照片: {bool(test_order.get('receiptImage'))}")
                    print(f"   签收时间: {test_order.get('receivedAt', '无')}")
        else:
            print(f"   可签收任务数量: {len(delivered_missions)}")
            test_mission = delivered_missions[0]
            mission_id = test_mission['id']
            print(f"   测试任务: {test_mission.get('missionNo')}")
            
            # 测试拍照
            import base64
            test_photo = 'data:image/png;base64,' + base64.b64encode(b'test photo data').decode()
            photo_result = api_request(operator_token, 'PUT', f'/missions/{mission_id}/photo', {
                'photoData': test_photo
            })
            if photo_result and photo_result.get('success'):
                print(f"   ✅ 拍照成功")
                
                # 测试签收确认
                receipt_result = api_request(operator_token, 'PUT', f'/missions/{mission_id}/confirm-receipt', {
                    'receiptImage': test_photo
                })
                if receipt_result and receipt_result.get('success'):
                    order_data = receipt_result.get('data', {}).get('order', {})
                    print(f"   ✅ 签收成功")
                    print(f"   订单状态: {order_data.get('status')}")
                    print(f"   签收时间: {order_data.get('receivedAt')}")
                    
                    # 测试凭证下载
                    order_id = order_data.get('id')
                    if order_id:
                        headers = {'Authorization': f'Bearer {operator_token}'}
                        resp = requests.get(f'{BASE_URL}/orders/{order_id}/receipt/download', headers=headers)
                        content_type = resp.headers.get('Content-Type', '')
                        content_length = len(resp.content)
                        print(f"   凭证下载: Content-Type={content_type}, Size={content_length} bytes")
                        if 'image' in content_type or content_length > 0:
                            print(f"   ✅ 凭证下载成功")
                        else:
                            print(f"   ❌ 凭证下载异常")
                else:
                    print(f"   ❌ 签收失败: {receipt_result.get('message', '未知错误')}")
else:
    print("   操作员登录失败 ❌")

print("\n" + "=" * 60)
print("测试完成")
print("=" * 60)
