import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Shipment, ShipmentStatus } from '../types/shipment';

const STATUS_LABELS: Record<ShipmentStatus, string> = {
  PENDING: '배송 대기',
  SHIPPED: '배송중',
  DELIVERED: '배송완료',
  CANCELLED: '취소됨',
};

function AddressForm({
  shipment,
  onSaved,
}: {
  shipment: Shipment;
  onSaved: (shipment: Shipment) => void;
}) {
  const [address, setAddress] = useState(shipment.shippingAddress);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setError(null);
    setIsSaving(true);
    try {
      const response = await api.put(`/api/shipments/${shipment.id}/address`, {
        shippingAddress: address,
      });
      onSaved(response.data.shipment);
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        '저장에 실패했습니다.';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="shipment-address-form">
      <input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="배송받을 주소를 입력하세요"
      />
      <button type="button" className="primary" onClick={handleSave} disabled={isSaving}>
        {isSaving ? '저장 중...' : '배송지 저장'}
      </button>
      {error && <p className="auth-error">{error}</p>}
    </div>
  );
}

export function MyShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get('/api/shipments/mine')
      .then((response) => setShipments(response.data.shipments))
      .finally(() => setIsLoading(false));
  }, []);

  function updateShipment(updated: Shipment) {
    setShipments((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }

  return (
    <div className="page-form game-wide">
      <h1>당첨 내역</h1>
      {isLoading && <p>불러오는 중...</p>}
      {!isLoading && shipments.length === 0 && <p>아직 당첨된 상품이 없습니다.</p>}
      <ul className="shipment-list">
        {shipments.map((shipment) => (
          <li key={shipment.id} className="shipment-item">
            <div className="shipment-item-header">
              <strong>{shipment.game.productName}</strong>
              <span className="tag">{STATUS_LABELS[shipment.status]}</span>
            </div>
            {shipment.status === 'PENDING' && !shipment.shippingAddress ? (
              <AddressForm shipment={shipment} onSaved={updateShipment} />
            ) : (
              <p>배송지: {shipment.shippingAddress}</p>
            )}
            {shipment.trackingNumber && <p>송장번호: {shipment.trackingNumber}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
