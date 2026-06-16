import type { Package, LogisticsEvent, PackageStatus } from '@/types';
import { detectCarrier } from './carrierUtils';

const cities = [
  '上海市', '杭州市', '广州市', '深圳市', '成都市',
  '武汉市', '北京市', '南京市', '重庆市', '西安市',
  '苏州市', '东莞市', '佛山市', '郑州市', '长沙市',
];

const eventDescriptions: Record<PackageStatus, string[]> = {
  pending: [
    '等待商家发货',
    '订单已提交，等待发货',
    '商家正在备货中',
  ],
  shipped: [
    '商家已发货，等待快递员揽收',
    '包裹已出库，正在等待揽收',
    '您的订单已发出',
  ],
  in_transit: [
    '包裹已到达【{city}】转运中心',
    '包裹正在【{city}】中转',
    '包裹已离开【{city}】，正在发往下一站',
    '包裹已到达【{city}】分拨中心',
  ],
  out_for_delivery: [
    '包裹正在派送中，快递员正在为您送货',
    '快递员正在派送，请保持电话畅通',
    '包裹已到达【{city}】，正在派送中',
  ],
  delivered: [
    '包裹已签收，签收人：本人签收',
    '您的包裹已签收，感谢使用',
    '包裹已送达，已签收',
  ],
  opened: [
    '包裹已拆包',
  ],
};

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function getRandomCity(): string {
  return cities[Math.floor(Math.random() * cities.length)];
}

function getRandomDescription(status: PackageStatus): string {
  const descriptions = eventDescriptions[status];
  const template = descriptions[Math.floor(Math.random() * descriptions.length)];
  return template.replace('{city}', getRandomCity());
}

function generateLogisticsEvents(
  packageId: string,
  targetStatus: PackageStatus,
  shippedDate: Date
): LogisticsEvent[] {
  const events: LogisticsEvent[] = [];
  const statusOrder: PackageStatus[] = ['pending', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'opened'];
  const targetIndex = statusOrder.indexOf(targetStatus);
  
  let currentDate = new Date(shippedDate);
  
  for (let i = 0; i <= targetIndex; i++) {
    const status = statusOrder[i];
    const eventCount = status === 'in_transit' ? Math.floor(Math.random() * 3) + 2 : 1;
    
    for (let j = 0; j < eventCount; j++) {
      const event: LogisticsEvent = {
        id: generateId(),
        packageId,
        status,
        location: getRandomCity(),
        description: getRandomDescription(status),
        timestamp: new Date(currentDate),
      };
      
      events.push(event);
      
      const hoursIncrement = status === 'in_transit' 
        ? Math.random() * 12 + 6 
        : Math.random() * 24 + 12;
      currentDate = new Date(currentDate.getTime() + hoursIncrement * 60 * 60 * 1000);
    }
  }
  
  return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

export function createMockPackage(
  trackingNumber: string,
  platform: string = '淘宝',
  productName: string = '网购商品',
  estimatedDays: number = 3
): Package {
  const id = generateId();
  const shippedDate = new Date();
  shippedDate.setDate(shippedDate.getDate() - Math.floor(Math.random() * 3));
  
  const estimatedArrival = new Date(shippedDate);
  estimatedArrival.setDate(estimatedArrival.getDate() + estimatedDays);
  
  const statuses: PackageStatus[] = ['pending', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'];
  const statusWeights = [0.1, 0.1, 0.35, 0.25, 0.2];
  
  let random = Math.random();
  let targetStatus: PackageStatus = 'shipped';
  let cumulative = 0;
  
  for (let i = 0; i < statuses.length; i++) {
    cumulative += statusWeights[i];
    if (random < cumulative) {
      targetStatus = statuses[i];
      break;
    }
  }
  
  const logisticsEvents = generateLogisticsEvents(id, targetStatus, shippedDate);
  const lastEvent = logisticsEvents[logisticsEvents.length - 1];
  
  let deliveredDate: Date | null = null;
  let openedDate: Date | null = null;
  let isOpened = false;
  
  if (targetStatus === 'delivered' || targetStatus === 'opened') {
    deliveredDate = lastEvent.timestamp;
    if (targetStatus === 'opened') {
      openedDate = new Date(deliveredDate.getTime() + Math.random() * 24 * 60 * 60 * 1000);
      isOpened = true;
    }
  }
  
  return {
    id,
    trackingNumber: trackingNumber.replace(/\s/g, ''),
    carrier: detectCarrier(trackingNumber),
    platform,
    productName,
    status: targetStatus,
    estimatedArrival,
    shippedDate,
    deliveredDate,
    openedDate,
    isOpened,
    returnStatus: 'none' as const,
    notes: '',
    parentId: null,
    childIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    logisticsEvents,
  };
}

export function createManualPackage(
  platform: string,
  productName: string,
  estimatedArrival: Date | null,
  notes: string = ''
): Package {
  const id = generateId();
  const createdAt = new Date();
  
  return {
    id,
    trackingNumber: '',
    carrier: '',
    platform,
    productName,
    status: 'pending',
    estimatedArrival,
    shippedDate: null,
    deliveredDate: null,
    openedDate: null,
    isOpened: false,
    returnStatus: 'none' as const,
    notes,
    parentId: null,
    childIds: [],
    createdAt,
    updatedAt: createdAt,
    logisticsEvents: [
      {
        id: generateId(),
        packageId: id,
        status: 'pending',
        location: '',
        description: '等待商家发货',
        timestamp: createdAt,
      },
    ],
  };
}

export function createDeliveredPackage(
  platform: string,
  productName: string,
  daysAgo: number
): Package {
  const id = generateId();
  const deliveredDate = new Date();
  deliveredDate.setDate(deliveredDate.getDate() - daysAgo);
  deliveredDate.setHours(10, 0, 0, 0);

  const shippedDate = new Date(deliveredDate);
  shippedDate.setDate(shippedDate.getDate() - 3);

  const estimatedArrival = new Date(shippedDate);
  estimatedArrival.setDate(estimatedArrival.getDate() + 3);

  const events = generateLogisticsEvents(id, 'delivered', shippedDate);
  const lastEvent = events[events.length - 1];

  return {
    id,
    trackingNumber: `SF${Math.floor(Math.random() * 10000000000000)}`,
    carrier: '顺丰速运',
    platform,
    productName,
    status: 'delivered',
    estimatedArrival,
    shippedDate,
    deliveredDate: lastEvent ? lastEvent.timestamp : deliveredDate,
    openedDate: null,
    isOpened: false,
    returnStatus: 'none',
    notes: '',
    parentId: null,
    childIds: [],
    createdAt: shippedDate,
    updatedAt: new Date(),
    logisticsEvents: events,
  };
}

export function generateSamplePackages(): Package[] {
  const sampleData = [
    { tracking: 'SF1234567890123', platform: '天猫', product: 'iPhone 15 Pro', days: 2 },
    { tracking: 'JT1234567890123', platform: '拼多多', product: '家居收纳套装', days: 4 },
    { tracking: '77123456789012', platform: '淘宝', product: '夏季连衣裙', days: 3 },
    { tracking: 'JD1234567890123', platform: '京东', product: '索尼WH-1000XM5耳机', days: 1 },
    { tracking: '881234567890', platform: '抖音', product: '零食大礼包', days: 5 },
    { tracking: '3123456789012', platform: '淘宝', product: '图书：深入理解计算机系统', days: 3 },
  ];
  
  const mockPackages = sampleData.map(data => 
    createMockPackage(data.tracking, data.platform, data.product, data.days)
  );
  
  const pendingPackage = createManualPackage(
    '淘宝',
    '预售商品：限定版手办',
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    '预售商品，预计2周后发货'
  );

  const deliveredPkg = createDeliveredPackage('淘宝', '纯棉T恤', 5);
  const deliveredPkg2 = createDeliveredPackage('京东', '机械键盘', 1);
  const deliveredPkg3 = createDeliveredPackage('天猫', '护肤品套装', 3);
  
  return [pendingPackage, deliveredPkg, deliveredPkg2, deliveredPkg3, ...mockPackages];
}

export function addLogisticsEvent(
  pkg: Package,
  status: PackageStatus,
  description: string
): Package {
  const newEvent: LogisticsEvent = {
    id: generateId(),
    packageId: pkg.id,
    status,
    location: getRandomCity(),
    description,
    timestamp: new Date(),
  };
  
  let updatedPkg = {
    ...pkg,
    status,
    logisticsEvents: [...pkg.logisticsEvents, newEvent],
    updatedAt: new Date(),
  };
  
  if (status === 'shipped') {
    updatedPkg.shippedDate = newEvent.timestamp;
  } else if (status === 'delivered') {
    updatedPkg.deliveredDate = newEvent.timestamp;
  } else if (status === 'opened') {
    updatedPkg.openedDate = newEvent.timestamp;
    updatedPkg.isOpened = true;
  }
  
  return updatedPkg;
}
