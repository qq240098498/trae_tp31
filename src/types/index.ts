export type PackageStatus = 'shipped' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'opened';

export interface LogisticsEvent {
  id: string;
  packageId: string;
  status: PackageStatus;
  location: string;
  description: string;
  timestamp: Date;
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
  notes: string;
  parentId: string | null;
  childIds: string[];
  createdAt: Date;
  updatedAt: Date;
  logisticsEvents: LogisticsEvent[];
}

export type FilterStatus = PackageStatus | 'all';

export interface PackageStore {
  packages: Package[];
  selectedPackageId: string | null;
  filterStatus: FilterStatus;
  searchQuery: string;
  selectedIds: string[];
  batchMode: boolean;
  addPackage: (pkg: Omit<Package, 'id' | 'createdAt' | 'updatedAt' | 'logisticsEvents'>) => void;
  updatePackage: (id: string, updates: Partial<Package>) => void;
  deletePackage: (id: string) => void;
  markAsOpened: (id: string) => void;
  updateStatus: (id: string, status: PackageStatus) => void;
  mergePackages: (parentId: string, childIds: string[]) => void;
  unmergePackage: (id: string) => void;
  batchAddPackages: (pkgs: Omit<Package, 'id' | 'createdAt' | 'updatedAt' | 'logisticsEvents'>[]) => void;
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
};
