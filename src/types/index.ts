export type PackageStatus = 'pending' | 'shipped' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'opened';

export type ReturnStatus = 'none' | 'return_pending' | 'return_shipped' | 'returned';

export interface LogisticsEvent {
  id: string;
  packageId: string;
  status: PackageStatus;
  location: string;
  description: string;
  timestamp: Date;
}

export interface AccessoryItem {
  id: string;
  name: string;
  checked: boolean;
  remark?: string;
}

export interface AccessoryChecklist {
  items: AccessoryItem[];
  templateId?: string | null;
  completed: boolean;
  completedAt?: Date | null;
}

export interface AccessoryTemplate {
  id: string;
  name: string;
  category: string;
  items: string[];
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
}

export interface Package {
  id: string;
  trackingNumber: string;
  carrier: string;
  platform: string;
  productName: string;
  status: PackageStatus;
  estimatedArrival: Date | null;
  shippedDate: Date | null;
  deliveredDate: Date | null;
  openedDate: Date | null;
  isOpened: boolean;
  returnStatus: ReturnStatus;
  notes: string;
  parentId: string | null;
  childIds: string[];
  createdAt: Date;
  updatedAt: Date;
  logisticsEvents: LogisticsEvent[];
  accessoryChecklist: AccessoryChecklist;
}

export type FilterStatus = PackageStatus | 'all';

export interface PackageStore {
  packages: Package[];
  selectedPackageId: string | null;
  filterStatus: FilterStatus;
  searchQuery: string;
  selectedIds: string[];
  batchMode: boolean;
  addPackage: (pkg: Omit<Package, 'id' | 'createdAt' | 'updatedAt' | 'logisticsEvents' | 'accessoryChecklist'>) => void;
  updatePackage: (id: string, updates: Partial<Package>) => void;
  deletePackage: (id: string) => void;
  markAsOpened: (id: string) => void;
  updateStatus: (id: string, status: PackageStatus) => void;
  mergePackages: (parentId: string, childIds: string[]) => void;
  unmergePackage: (id: string) => void;
  batchAddPackages: (pkgs: Omit<Package, 'id' | 'createdAt' | 'updatedAt' | 'logisticsEvents' | 'accessoryChecklist'>[]) => void;
  batchUpdateStatus: (ids: string[], status: PackageStatus) => void;
  batchDelete: (ids: string[]) => void;
  setFilterStatus: (status: FilterStatus) => void;
  setSearchQuery: (query: string) => void;
  selectPackage: (id: string | null) => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
  setBatchMode: (enabled: boolean) => void;
  exportData: () => string;
  importData: (json: string) => boolean;
  updateReturnStatus: (id: string, returnStatus: ReturnStatus) => void;
  updateAccessoryChecklist: (id: string, checklist: AccessoryChecklist) => void;
}

export interface AccessoryTemplateStore {
  templates: AccessoryTemplate[];
  addTemplate: (template: Omit<AccessoryTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => AccessoryTemplate;
  updateTemplate: (id: string, updates: Partial<Omit<AccessoryTemplate, 'id' | 'createdAt'>>) => void;
  deleteTemplate: (id: string) => void;
  incrementUsage: (id: string) => void;
  getSuggestedTemplates: (productName: string) => AccessoryTemplate[];
}

export type CarrierInfo = {
  name: string;
  patterns: RegExp[];
  color: string;
};

export type PlatformInfo = {
  name: string;
  icon: string;
  color: string;
  defaultReturnDays?: number;
  returnPolicyLabel?: string;
};

export interface ReturnSettings {
  platformReturnDays: Record<string, number>;
  remindersEnabled: boolean;
  reminderDaysBefore: number[];
}

export interface ReturnDeadlineInfo {
  remainingDays: number;
  deadlineDate: Date;
  isExpired: boolean;
  isUrgent: boolean;
  needsReminder: boolean;
  reminderLevel: 'none' | 'warning' | 'critical';
  returnPolicyLabel: string;
  returnDays: number;
}
