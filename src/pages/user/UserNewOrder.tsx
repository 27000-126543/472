import { useState } from 'react';
import { MapPin, Package, Phone, User, MessageSquare, AlertCircle, CheckCircle, Loader2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '../../stores/orderStore';
import { ROUTES, formatCurrency } from '../../lib/constants';
import { CreateOrderRequest, FlightRoute } from '../../../shared/types';

type Step = 1 | 2 | 3;

interface FormData {
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverLat: number;
  receiverLng: number;
  packageWeight: number;
  packageDescription: string;
  notes: string;
}

const defaultFormData: FormData = {
  receiverName: '',
  receiverPhone: '',
  receiverAddress: '',
  receiverLat: 39.9042,
  receiverLng: 116.4074,
  packageWeight: 1,
  packageDescription: '',
  notes: '',
};

export default function UserNewOrder() {
  const navigate = useNavigate();
  const { createOrder, planRoute, isPlanning, isCreating, planningResult, createError } = useOrderStore();
  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const validateStep1 = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.receiverName.trim()) newErrors.receiverName = '请输入收件人姓名';
    if (!formData.receiverPhone.trim()) newErrors.receiverPhone = '请输入联系电话';
    else if (!/^1[3-9]\d{9}$/.test(formData.receiverPhone)) newErrors.receiverPhone = '手机号格式不正确';
    if (!formData.receiverAddress.trim()) newErrors.receiverAddress = '请输入详细地址';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (formData.packageWeight <= 0 || formData.packageWeight > 20) {
      newErrors.packageWeight = '包裹重量必须在0.1-20kg之间';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      await planRoute({
        startLat: 39.9042,
        startLng: 116.4074,
        endLat: formData.receiverLat,
        endLng: formData.receiverLng,
        packageWeight: formData.packageWeight,
      });
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    const orderData: CreateOrderRequest = {
      senderName: '配送中心',
      senderPhone: '400-123-4567',
      senderAddress: '配送中心',
      senderLat: 39.9042,
      senderLng: 116.4074,
      receiverName: formData.receiverName,
      receiverPhone: formData.receiverPhone,
      receiverAddress: formData.receiverAddress,
      receiverLat: formData.receiverLat,
      receiverLng: formData.receiverLng,
      packageType: formData.packageDescription || 'standard',
      packageWeight: formData.packageWeight,
      remark: formData.notes,
    };
    const result = await createOrder(orderData);
    if (result) {
      navigate(ROUTES.USER_ORDERS);
    }
  };

  const handleRandomAddress = () => {
    const addresses = [
      { addr: '北京市朝阳区建国门外大街1号', lat: 39.9087, lng: 116.4412 },
      { addr: '北京市海淀区中关村大街1号', lat: 39.9832, lng: 116.3160 },
      { addr: '北京市西城区金融街15号', lat: 39.9128, lng: 116.3554 },
      { addr: '北京市东城区王府井大街88号', lat: 39.9147, lng: 116.4104 },
      { addr: '北京市丰台区丰台路5号', lat: 39.8587, lng: 116.2875 },
    ];
    const random = addresses[Math.floor(Math.random() * addresses.length)];
    setFormData((prev) => ({
      ...prev,
      receiverAddress: random.addr,
      receiverLat: random.lat,
      receiverLng: random.lng,
    }));
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
              step >= s
                ? 'bg-primary-500 text-white'
                : 'bg-dark-800 text-dark-400 border border-dark-700'
            }`}
          >
            {step > s ? <CheckCircle className="w-5 h-5" /> : s}
          </div>
          {s < 3 && (
            <div
              className={`w-16 sm:w-24 h-1 mx-2 transition-all ${
                step > s ? 'bg-primary-500' : 'bg-dark-700'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStepLabels = () => (
    <div className="flex justify-center gap-8 sm:gap-16 mb-8 text-sm">
      <span className={step >= 1 ? 'text-primary-400' : 'text-dark-500'}>
        收件信息
      </span>
      <span className={step >= 2 ? 'text-primary-400' : 'text-dark-500'}>
        包裹信息
      </span>
      <span className={step >= 3 ? 'text-primary-400' : 'text-dark-500'}>
        确认下单
      </span>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white font-display">
          新建配送订单
        </h1>
        <p className="text-dark-400 mt-1">填写信息，智能规划最优航线</p>
      </div>

      {renderStepIndicator()}
      {renderStepLabels()}

      {createError && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{createError}</p>
        </div>
      )}

      <div className="card p-6">
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="w-5 h-5 text-primary-400" />
              <h2 className="text-lg font-semibold text-white">收件人信息</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <User className="w-4 h-4 mr-1" />
                  收件人姓名 *
                </label>
                <input
                  type="text"
                  value={formData.receiverName}
                  onChange={(e) =>
                    setFormData({ ...formData, receiverName: e.target.value })
                  }
                  placeholder="请输入收件人姓名"
                  className={`input ${errors.receiverName ? 'border-red-500' : ''}`}
                />
                {errors.receiverName && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.receiverName}
                  </p>
                )}
              </div>

              <div>
                <label className="label">
                  <Phone className="w-4 h-4 mr-1" />
                  联系电话 *
                </label>
                <input
                  type="tel"
                  value={formData.receiverPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, receiverPhone: e.target.value })
                  }
                  placeholder="请输入手机号"
                  className={`input ${errors.receiverPhone ? 'border-red-500' : ''}`}
                />
                {errors.receiverPhone && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.receiverPhone}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="label">
                <MapPin className="w-4 h-4 mr-1" />
                详细地址 *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.receiverAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, receiverAddress: e.target.value })
                  }
                  placeholder="请输入详细地址"
                  className={`input flex-1 ${errors.receiverAddress ? 'border-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={handleRandomAddress}
                  className="btn-secondary whitespace-nowrap"
                >
                  随机地址
                </button>
              </div>
              {errors.receiverAddress && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.receiverAddress}
                </p>
              )}
              <p className="text-dark-500 text-xs mt-2">
                提示：系统会自动解析地址坐标进行航线规划
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-6">
              <Package className="w-5 h-5 text-primary-400" />
              <h2 className="text-lg font-semibold text-white">包裹信息</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <Package className="w-4 h-4 mr-1" />
                  包裹重量 (kg) *
                </label>
                <input
                  type="number"
                  min="0.1"
                  max="20"
                  step="0.1"
                  value={formData.packageWeight}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      packageWeight: parseFloat(e.target.value) || 0,
                    })
                  }
                  className={`input ${errors.packageWeight ? 'border-red-500' : ''}`}
                />
                {errors.packageWeight && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.packageWeight}
                  </p>
                )}
                <p className="text-dark-500 text-xs mt-2">
                  最大载重 20kg
                </p>
              </div>

              <div>
                <label className="label">
                  <MessageSquare className="w-4 h-4 mr-1" />
                  物品描述
                </label>
                <input
                  type="text"
                  value={formData.packageDescription}
                  onChange={(e) =>
                    setFormData({ ...formData, packageDescription: e.target.value })
                  }
                  placeholder="如：文件、电子产品等"
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="label">
                <MessageSquare className="w-4 h-4 mr-1" />
                备注信息
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="特殊要求或注意事项（选填）"
                rows={3}
                className="input resize-none"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle className="w-5 h-5 text-primary-400" />
              <h2 className="text-lg font-semibold text-white">确认订单信息</h2>
            </div>

            {isPlanning ? (
              <div className="p-8 text-center">
                <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
                <p className="text-white font-medium">正在规划最优航线...</p>
                <p className="text-dark-400 text-sm mt-2">
                  系统正在分析禁飞区、计算最短路径、匹配无人机
                </p>
              </div>
            ) : planningResult ? (
              <div className="space-y-6">
                <div className="bg-dark-800/50 rounded-xl p-6 border border-primary-500/30">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary-400" />
                    航线规划结果
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-dark-400 text-xs">飞行距离</p>
                      <p className="text-white text-xl font-semibold mt-1">
                        {(planningResult.distance / 1000).toFixed(2)} km
                      </p>
                    </div>
                    <div>
                      <p className="text-dark-400 text-xs">预计飞行时间</p>
                      <p className="text-white text-xl font-semibold mt-1">
                        {Math.round(planningResult.estimatedDuration / 60)} 分钟
                      </p>
                    </div>
                    <div>
                      <p className="text-dark-400 text-xs">预计高度</p>
                      <p className="text-white text-xl font-semibold mt-1">
                        {planningResult.waypoints[0]?.altitude || 120} m
                      </p>
                    </div>
                    <div>
                      <p className="text-dark-400 text-xs">航线点数</p>
                      <p className="text-white text-xl font-semibold mt-1">
                        {planningResult.waypoints.length} 个
                      </p>
                    </div>
                  </div>

                  {planningResult.avoidedZones && planningResult.avoidedZones.length > 0 && (
                    <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-lg">
                      <p className="text-warning text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        已避开 {planningResult.avoidedZones.length} 个禁飞区域
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-dark-800 rounded-xl p-6">
                  <h3 className="font-semibold text-white mb-4">订单信息</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-dark-400">收件人</span>
                      <span className="text-white">{formData.receiverName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">联系电话</span>
                      <span className="text-white">{formData.receiverPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">配送地址</span>
                      <span className="text-white text-right max-w-[60%]">
                        {formData.receiverAddress}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">包裹重量</span>
                      <span className="text-white">{formData.packageWeight} kg</span>
                    </div>
                    {formData.packageDescription && (
                      <div className="flex justify-between">
                        <span className="text-dark-400">物品描述</span>
                        <span className="text-white">{formData.packageDescription}</span>
                      </div>
                    )}
                    <div className="border-t border-dark-700 pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-dark-400">配送费用</span>
                        <span className="text-2xl font-bold text-primary-400">
                          {formatCurrency(planningResult.estimatedCost)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="flex gap-4">
        {step > 1 && (
          <button
            onClick={() => setStep((s) => (s - 1) as Step)}
            className="btn-secondary flex-1"
            disabled={isPlanning || isCreating}
          >
            上一步
          </button>
        )}
        {step < 3 ? (
          <button
            onClick={handleNext}
            className="btn-primary flex-1"
            disabled={isPlanning}
          >
            下一步 <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isPlanning || isCreating || !planningResult}
            className="btn-primary flex-1"
          >
            {isCreating ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                创建订单中...
              </span>
            ) : (
              '确认下单'
            )}
          </button>
        )}
      </div>
    </div>
  );
}
