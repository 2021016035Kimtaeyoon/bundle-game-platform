import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Shipment, ShipmentStatus } from '../types/shipment';

const STATUS_LABELS: Record<ShipmentStatus, string> = {
  PENDING: '배송 대기',
  SHIPPED: '배송중 (자동 확인 대기)',
  DELIVERED: '배송완료',
  CANCELLED: '취소됨',
};

interface CourierOption {
  code: string;
  label: string;
}

function ShipRow({
  shipment,
  couriers,
  onUpdated,
}: {
  shipment: Shipment;
  couriers: CourierOption[];
  onUpdated: (shipment: Shipment) => void;
}) {
  const [courierCompany, setCourierCompany] = useState(couriers[0]?.code ?? '');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleMarkShipped() {
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await api.put(`/api/shipments/${shipment.id}/status`, {
        status: 'SHIPPED',
        courierCompany,
        trackingNumber,
      });
      onUpdated(response.data.shipment);
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        '처리에 실패했습니다.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleMarkDelivered() {
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await api.put(`/api/shipments/${shipment.id}/status`, {
        status: 'DELIVERED',
      });
      onUpdated(response.data.shipment);
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        '처리에 실패했습니다.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <li className="shipment-item">
      <div className="shipment-item-header">
        <strong>{shipment.game.productName}</strong>
        <span className="tag">{STATUS_LABELS[shipment.status]}</span>
      </div>
      <p>당첨자: {shipment.winner?.username ?? '-'}</p>
      <p>배송지: {shipment.shippingAddress || '아직 입력되지 않았습니다.'}</p>
      {shipment.trackingNumber && (
        <p>
          송장번호: {shipment.trackingNumber}
          {shipment.courierCompany &&
            ` (${couriers.find((c) => c.code === shipment.courierCompany)?.label ?? shipment.courierCompany})`}
        </p>
      )}

      {shipment.status === 'PENDING' && (
        <div className="shipment-address-form">
          <select value={courierCompany} onChange={(e) => setCourierCompany(e.target.value)}>
            {couriers.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="송장번호 입력"
          />
          <button
            type="button"
            className="primary"
            onClick={handleMarkShipped}
            disabled={isSubmitting || !shipment.shippingAddress}
          >
            {isSubmitting ? '처리 중...' : '발송 등록'}
          </button>
        </div>
      )}

      {shipment.status === 'SHIPPED' && (
        <>
          <p className="field-hint">
            송장번호로 배송완료 여부를 10분마다 자동 확인합니다. 확인이 늦어지면 아래에서 직접
            처리할 수 있어요.
          </p>
          <button
            type="button"
            className="primary"
            onClick={handleMarkDelivered}
            disabled={isSubmitting}
          >
            {isSubmitting ? '처리 중...' : '수동으로 배송완료 처리'}
          </button>
        </>
      )}

      {error && <p className="auth-error">{error}</p>}
    </li>
  );
}

export function OrganizerShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [couriers, setCouriers] = useState<CourierOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/api/shipments/organizer'), api.get('/api/shipments/couriers')])
      .then(([shipmentsRes, couriersRes]) => {
        setShipments(shipmentsRes.data.shipments);
        setCouriers(couriersRes.data.couriers);
      })
      .finally(() => setIsLoading(false));
  }, []);

  function updateShipment(updated: Shipment) {
    setShipments((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }

  return (
    <div className="page-form game-wide">
      <h1>배송 관리</h1>
      <p>
        송장번호를 등록하면 배송완료 여부가 자동으로 확인되어 정산됩니다. 자동 확인이 어려우면
        수동으로도 처리할 수 있어요.
      </p>
      {isLoading && <p>불러오는 중...</p>}
      {!isLoading && shipments.length === 0 && <p>관리할 배송이 없습니다.</p>}
      <ul className="shipment-list">
        {shipments.map((shipment) => (
          <ShipRow
            key={shipment.id}
            shipment={shipment}
            couriers={couriers}
            onUpdated={updateShipment}
          />
        ))}
      </ul>
    </div>
  );
}
