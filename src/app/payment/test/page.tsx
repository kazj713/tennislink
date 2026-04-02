'use client';

import { useState } from 'react';

export default function PaymentTestPage() {
  const [amount, setAmount] = useState('0.01');
  const [description, setDescription] = useState('测试订单');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const createTestOrder = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // 生成测试订单号
      const orderId = `TEST_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      // 转换为分
      const amountInCents = Math.round(parseFloat(amount) * 100);

      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          amount: amountInCents,
          description,
          paymentMethod: 'alipay',
          userId: 'test_user_001',
          returnUrl: `${window.location.origin}/payment/success`,
          notifyUrl: `${window.location.origin}/api/payments/notify/alipay`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        // 自动跳转到支付宝支付页面
        if (data.data.paymentUrl) {
          window.open(data.data.paymentUrl, '_blank');
        }
      } else {
        setError(data.error || '创建订单失败');
      }
    } catch (err: any) {
      setError(err.message || '请求失败');
    } finally {
      setLoading(false);
    }
  };

  const checkOrderStatus = async (orderId: string) => {
    try {
      const response = await fetch(`/api/payment/query?orderId=${orderId}`);
      const data = await response.json();
      alert(JSON.stringify(data, null, 2));
    } catch (err: any) {
      alert('查询失败: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          支付宝支付测试
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">创建测试订单</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                支付金额（元）
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                建议测试金额：0.01元（1分钱）
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                订单描述
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <button
              onClick={createTestOrder}
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {loading ? '创建中...' : '创建订单并支付'}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="font-semibold text-green-900 mb-2">订单创建成功</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">订单号:</span> {result.orderId}</p>
                <p><span className="font-medium">交易号:</span> {result.transactionId}</p>
                <p><span className="font-medium">金额:</span> {(result.amount / 100).toFixed(2)} 元</p>
                <p><span className="font-medium">状态:</span> {result.status}</p>
              </div>
              
              <div className="mt-4 space-y-2">
                {result.paymentUrl && (
                  <a
                    href={result.paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                  >
                    打开支付宝支付页面
                  </a>
                )}
                
                <button
                  onClick={() => checkOrderStatus(result.orderId)}
                  className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
                >
                  查询订单状态
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">配置检查</h2>
          <div className="space-y-2 text-sm">
            <ConfigCheckItem name="ALIPAY_APP_ID" />
            <ConfigCheckItem name="ALIPAY_PRIVATE_KEY" />
            <ConfigCheckItem name="ALIPAY_PUBLIC_KEY" />
            <ConfigCheckItem name="ALIPAY_GATEWAY" />
            <ConfigCheckItem name="NEXT_PUBLIC_DOMAIN" />
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>测试说明：</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>请确保已配置支付宝开放平台账号</li>
            <li>应用已上线或处于沙箱测试模式</li>
            <li>回调地址已正确配置</li>
            <li>建议使用0.01元进行测试</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function ConfigCheckItem({ name }: { name: string }) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');

  useState(() => {
    // 检查配置状态
    fetch('/api/payment/config-check')
      .then(res => res.json())
      .then(data => {
        setStatus(data.configured?.includes(name) ? 'ok' : 'error');
      })
      .catch(() => setStatus('error'));
  });

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="font-mono text-gray-700">{name}</span>
      <span className={`px-2 py-1 rounded text-xs font-medium ${
        status === 'ok' 
          ? 'bg-green-100 text-green-800' 
          : status === 'error'
          ? 'bg-red-100 text-red-800'
          : 'bg-gray-100 text-gray-800'
      }`}>
        {status === 'ok' ? '已配置' : status === 'error' ? '未配置' : '检查中'}
      </span>
    </div>
  );
}
