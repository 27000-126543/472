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

# 先查看所有无人机和任务状态
print("\n0. 当前状态检查")
drones_resp = api_request(dispatcher_token, 'GET', '/drones')
if drones_resp:
    drones = drones_resp.get('data', [])
    print(f"   无人机总数: {len(drones)}")
    for d in drones:
        print(f"      - {d['name']}: status={d.get('status')}, battery={d.get('batteryLevel')}%")

missions_resp = api_request(dispatcher_token, 'GET', '/missions')
if missions_resp:
    missions = missions_resp.get('data', [])
    print(f"   任务总数: {len(missions)}")
    pending = [m for m in missions if m.get('status') in ['pending', 'ready']]
    flying = [m for m in missions if m.get('status') == 'flying']
    completed = [m for m in missions if m.get('status') == 'completed']
    print(f"      待执行: {len(pending)}, 飞行中: {len(flying)}, 已完成: {len(completed)}")

# 找一个pending或ready的任务来测试
test_mission = None
test_order_id = None
for m in missions:
    if m.get('status') in ['pending', 'ready', 'flying']:
        test_mission = m
        break

if not test_mission:
    print("\n没有活跃任务，尝试创建一个...")
    # 尝试重置一些无人机状态
    print("   请先手动释放一些无人机，或者等待之前的任务完成")
    exit(1)

mission_id = test_mission['id']
test_order_id = test_mission.get('orderId')
print(f"\n使用任务: {test_mission.get('missionNo')} (id={mission_id}, status={test_mission.get('status')})")
print(f"关联订单ID: {test_order_id}")

# 步骤1: 测试订单时间线
if test_order_id:
    print(f"\n1. 测试订单时间线")
    timeline_resp = api_request(user_token, 'GET', f'/orders/{test_order_id}/timeline')
    if timeline_resp and timeline_resp.get('success'):
        timeline = timeline_resp.get('data', [])
        print(f"   ✅ 时间线获取成功，共 {len(timeline)} 个事件")
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
        print(f"   ❌ 时间线获取失败: {timeline_resp}")

# 步骤2: 测试改派（如果任务状态允许）
if test_mission.get('status') in ['pending', 'ready', 'flying']:
    print(f"\n2. 测试任务改派")
    available_resp = api_request(dispatcher_token, 'GET', f'/missions/{mission_id}/available-drones')
    if available_resp and available_resp.get('success'):
        drones = available_resp.get('data', [])
        print(f"   可用无人机: {len(drones)}")
        for d in drones:
            print(f"      - {d.get('name')}: status={d.get('status')}")
        
        if drones:
            new_drone = drones[0]
            reassign_resp = api_request(dispatcher_token, 'PUT', f'/missions/{mission_id}/reassign', {
                'newDroneId': new_drone['id'],
                'reason': '测试改派功能 - 优化资源分配'
            })
            print(f"   改派结果: {reassign_resp.get('success')} - {reassign_resp.get('message', '')}")
            if reassign_resp.get('success'):
                data = reassign_resp.get('data', {})
                mission_data = data.get('mission', {})
                print(f"      新无人机ID: {mission_data.get('droneId')}")
                print(f"      任务状态: {mission_data.get('status')}")
            else:
                print(f"      错误: {reassign_resp.get('message')}")

# 步骤3: 测试改派记录
print(f"\n3. 测试改派记录查询")
reassignments_resp = api_request(dispatcher_token, 'GET', f'/missions/{mission_id}/reassignments')
if reassignments_resp and reassignments_resp.get('success'):
    reassignments = reassignments_resp.get('data', [])
    print(f"   ✅ 改派记录: {len(reassignments)} 条")
    for r in reassignments:
        print(f"      - {r.get('oldDroneName', r.get('oldDroneId'))} -> {r.get('newDroneName', r.get('newDroneId'))}")
        print(f"        改派人: {r.get('reassignedByName', r.get('reassignedBy'))}")
        print(f"        原因: {r.get('reason', '无')}")
        print(f"        时间: {r.get('createdAt')}")
else:
    print(f"   ❌ 改派记录获取失败: {reassignments_resp}")

# 步骤4: 测试禁飞区影响预览
print(f"\n4. 测试禁飞区影响预览")
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
        print("      受影响任务列表:")
        for m in preview.get('affectedMissions'):
            print(f"         - {m.get('missionNo')} ({m.get('status')})")
else:
    print(f"   ❌ 影响预览失败: {preview_resp}")

print("\n" + "=" * 60)
print("测试完成")
print("=" * 60)
