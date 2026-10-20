// 스마트택배(SweetTracker) 조회 API 연동. 무료 키 발급: https://tracker.sweettracker.co.kr
// SWEETTRACKER_API_KEY가 없으면 자동 조회를 건너뛰고, 주최자가 수동으로 배송완료 처리해야 한다.

export const COURIER_OPTIONS = [
  { code: '04', label: 'CJ대한통운' },
  { code: '05', label: '한진택배' },
  { code: '01', label: '우체국택배' },
  { code: '06', label: '로젠택배' },
  { code: '08', label: '롯데택배' },
  { code: '46', label: '경동택배' },
] as const;

interface DeliveryCheckResult {
  checked: boolean;
  delivered: boolean;
}

export async function checkDeliveryStatus(
  courierCompany: string,
  trackingNumber: string,
): Promise<DeliveryCheckResult> {
  const apiKey = process.env.SWEETTRACKER_API_KEY;
  if (!apiKey || !courierCompany || !trackingNumber) {
    return { checked: false, delivered: false };
  }

  try {
    const url = `https://info.sweettracker.co.kr/api/v1/trackingInfo?t_key=${encodeURIComponent(apiKey)}&t_code=${encodeURIComponent(courierCompany)}&t_invoice=${encodeURIComponent(trackingNumber)}`;
    const response = await fetch(url);
    if (!response.ok) {
      return { checked: false, delivered: false };
    }
    const data = (await response.json()) as { complete?: boolean; level?: number };
    // SweetTracker: level 6 = 배송완료
    const delivered = data.complete === true || data.level === 6;
    return { checked: true, delivered };
  } catch (error) {
    console.error('[deliveryTracking] check failed:', error);
    return { checked: false, delivered: false };
  }
}
