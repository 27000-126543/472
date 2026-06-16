import { useEffect, useState } from 'react';
import {
  MapPin,
  Search,
  Plus,
  Edit,
  Trash2,
  Shield,
  AlertTriangle,
  X,
  Map,
  Ruler,
  Layers,
  Clock,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useNoFlyZoneStore } from '../../stores/noFlyZoneStore';
import { formatDate } from '../../lib/constants';
import { NoFlyZone, NoFlyZoneType, CreateNoFlyZoneRequest } from '../../../shared/types';

const zoneTypeLabels: Record<NoFlyZoneType, string> = {
  [NoFlyZoneType.RESTRICTED]: '限制空域',
  [NoFlyZoneType.WARNING]: '警告区域',
  [NoFlyZoneType.FORBIDDEN]: '禁飞区域',
};

export default function AdminNoFlyZones() {
  const { user } = useAuthStore();
  const {
    noFlyZones,
    fetchNoFlyZones,
    createNoFlyZone,
    updateNoFlyZone,
    deleteNoFlyZone,
    isLoading,
  } = useNoFlyZoneStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<NoFlyZoneType | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingZone, setEditingZone] = useState<NoFlyZone | null>(null);
  const [formData, setFormData] = useState<CreateNoFlyZoneRequest>({
    name: '',
    type: NoFlyZoneType.WARNING,
    coordinates: [
      { lat: 39.9, lng: 116.4 },
      { lat: 39.92, lng: 116.4 },
      { lat: 39.92, lng: 116.42 },
      { lat: 39.9, lng: 116.42 },
    ],
    minAltitude: 0,
    maxAltitude: 500,
    reason: '',
  });

  useEffect(() => {
    if (user) {
      fetchNoFlyZones();
    }
  }, [user]);

  const filteredZones = noFlyZones.filter((z) => {
    const matchesSearch =
      z.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      z.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || z.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleOpenModal = (zone?: NoFlyZone) => {
    if (zone) {
      setEditingZone(zone);
      setFormData({
        name: zone.name,
        type: zone.type,
        coordinates: zone.coordinates,
        minAltitude: zone.minAltitude,
        maxAltitude: zone.maxAltitude,
        reason: zone.reason,
      });
    } else {
      setEditingZone(null);
      setFormData({
        name: '',
        type: NoFlyZoneType.WARNING,
        coordinates: [
          { lat: 39.9, lng: 116.4 },
          { lat: 39.92, lng: 116.4 },
          { lat: 39.92, lng: 116.42 },
          { lat: 39.9, lng: 116.42 },
        ],
        minAltitude: 0,
        maxAltitude: 500,
        reason: '',
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingZone) {
      const updateData: any = {
        name: formData.name,
        type: formData.type,
        coordinates: formData.coordinates,
        minAltitude: formData.minAltitude,
        maxAltitude: formData.maxAltitude,
        reason: formData.reason,
      };
      await updateNoFlyZone(editingZone.id, updateData);
    } else {
      await createNoFlyZone(formData);
    }
    setShowModal(false);
    await fetchNoFlyZones();
  };

  const handleDelete = async (zoneId: string) => {
    if (confirm('确定要删除该禁飞区吗？')) {
      await deleteNoFlyZone(zoneId);
      await fetchNoFlyZones();
    }
  };

  const handleAddPoint = () => {
    const lastPoint = formData.coordinates[formData.coordinates.length - 1];
    setFormData({
      ...formData,
      coordinates: [...formData.coordinates, { lat: lastPoint.lat + 0.01, lng: lastPoint.lng + 0.01 }],
    });
  };

  const handleRemovePoint = (index: number) => {
    if (formData.coordinates.length > 3) {
      setFormData({
        ...formData,
        coordinates: formData.coordinates.filter((_, i) => i !== index),
      });
    }
  };

  const handleUpdatePoint = (index: number, field: 'lat' | 'lng', value: string) => {
    const newCoordinates = [...formData.coordinates];
    newCoordinates[index] = {
      ...newCoordinates[index],
      [field]: parseFloat(value) || 0,
    };
    setFormData({ ...formData, coordinates: newCoordinates });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">
            禁飞区管理
          </h1>
          <p className="text-dark-400 mt-1">
            设置和管理各区域禁飞范围和飞行高度限制
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新增禁飞区
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-danger/20 rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-danger" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {noFlyZones.length}
              </p>
              <p className="text-xs text-dark-400">禁飞区总数</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success/20 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {noFlyZones.filter((z) => z.isActive).length}
              </p>
              <p className="text-xs text-dark-400">已启用</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning/20 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {noFlyZones.filter((z) => !z.isActive).length}
              </p>
              <p className="text-xs text-dark-400">已禁用</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {new Set(noFlyZones.map((z) => z.type)).size}
              </p>
              <p className="text-xs text-dark-400">区域类型</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="text"
              placeholder="搜索禁飞区名称、描述..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as NoFlyZoneType | 'all')}
            className="input w-40"
          >
            <option value="all">全部类型</option>
            {Object.entries(zoneTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-dark-400 mt-2">加载中...</p>
          </div>
        ) : filteredZones.length === 0 ? (
          <div className="p-12 text-center text-dark-400">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-dark-600" />
            <p>暂无禁飞区</p>
          </div>
        ) : (
          <div className="divide-y divide-dark-700/50">
            {filteredZones.map((zone) => (
              <div key={zone.id} className="p-6 hover:bg-dark-800/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          zone.isActive
                            ? 'bg-danger/20'
                            : 'bg-dark-800'
                        }`}
                      >
                        <MapPin
                          className={`w-5 h-5 ${
                            zone.isActive ? 'text-danger' : 'text-dark-500'
                          }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white">
                            {zone.name}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              zone.isActive
                                ? 'bg-success/20 text-success'
                                : 'bg-dark-700 text-dark-400'
                            }`}
                          >
                            {zone.isActive ? '已启用' : '已禁用'}
                          </span>
                        </div>
                        <p className="text-sm text-dark-400 mt-1">
                          {zone.reason || '暂无描述'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-3 text-sm">
                      <div className="flex items-center gap-1 text-dark-400">
                        <Shield className="w-4 h-4" />
                        类型：{zoneTypeLabels[zone.type] || zone.type}
                      </div>
                      <div className="flex items-center gap-1 text-dark-400">
                        <Ruler className="w-4 h-4" />
                        高度：{zone.minAltitude} - {zone.maxAltitude}m
                      </div>
                      <div className="flex items-center gap-1 text-dark-400">
                        <Map className="w-4 h-4" />
                        顶点：{zone.coordinates.length}个
                      </div>
                      <div className="flex items-center gap-1 text-dark-400">
                        <Clock className="w-4 h-4" />
                        {formatDate(zone.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleOpenModal(zone)}
                      className="p-2 text-dark-400 hover:text-primary-400 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(zone.id)}
                      className="p-2 text-dark-400 hover:text-danger transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-dark-700 sticky top-0 bg-dark-900 z-10">
              <h2 className="text-lg font-semibold text-white">
                {editingZone ? '编辑禁飞区' : '新增禁飞区'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-dark-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">区域名称 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="input"
                    placeholder="如：首都机场周边禁飞区"
                    required
                  />
                </div>
                <div>
                  <label className="label">区域类型 *</label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as NoFlyZoneType })
                    }
                    className="input"
                    required
                  >
                    {Object.entries(zoneTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">描述</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  className="input resize-none"
                  rows={2}
                  placeholder="描述该禁飞区的详细信息"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">最低高度 (米)</label>
                  <input
                    type="number"
                    value={formData.minAltitude}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minAltitude: parseInt(e.target.value) || 0,
                      })
                    }
                    className="input"
                    min="0"
                  />
                </div>
                <div>
                  <label className="label">最高高度 (米)</label>
                  <input
                    type="number"
                    value={formData.maxAltitude}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxAltitude: parseInt(e.target.value) || 0,
                      })
                    }
                    className="input"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">多边形顶点坐标</label>
                  <button
                    type="button"
                    onClick={handleAddPoint}
                    className="text-xs text-primary-400 hover:text-primary-300"
                  >
                    + 添加顶点
                  </button>
                </div>
                <div className="text-xs text-dark-400 mb-3">
                  至少需要3个顶点构成多边形区域
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {formData.coordinates.map((point, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-dark-800 p-2 rounded-lg"
                    >
                      <span className="text-dark-400 text-xs w-8">
                        #{index + 1}
                      </span>
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          step="0.0001"
                          value={point.lat}
                          onChange={(e) =>
                            handleUpdatePoint(index, 'lat', e.target.value)
                          }
                          className="input !py-1 !text-sm"
                          placeholder="纬度"
                        />
                        <input
                          type="number"
                          step="0.0001"
                          value={point.lng}
                          onChange={(e) =>
                            handleUpdatePoint(index, 'lng', e.target.value)
                          }
                          className="input !py-1 !text-sm"
                          placeholder="经度"
                        />
                      </div>
                      {formData.coordinates.length > 3 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePoint(index)}
                          className="p-1 text-dark-400 hover:text-danger"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>



              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  取消
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingZone ? '保存修改' : '创建禁飞区'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
