import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Package, PackageStatus, FilterStatus, PackageStore } from '@/types';
import { createMockPackage, createManualPackage, addLogisticsEvent, generateSamplePackages } from '@/utils/mockData';

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function reviveDates(pkg: Package): Package {
  return {
    ...pkg,
    estimatedArrival: pkg.estimatedArrival ? new Date(pkg.estimatedArrival) : null,
    shippedDate: pkg.shippedDate ? new Date(pkg.shippedDate) : null,
    deliveredDate: pkg.deliveredDate ? new Date(pkg.deliveredDate) : null,
    openedDate: pkg.openedDate ? new Date(pkg.openedDate) : null,
    createdAt: new Date(pkg.createdAt),
    updatedAt: new Date(pkg.updatedAt),
    logisticsEvents: pkg.logisticsEvents.map(event => ({
      ...event,
      timestamp: new Date(event.timestamp),
    })),
  };
}

export const usePackageStore = create<PackageStore>()(
  persist(
    (set, get) => ({
      packages: generateSamplePackages(),
      selectedPackageId: null,
      filterStatus: 'all',
      searchQuery: '',
      selectedIds: [],
      batchMode: false,

      addPackage: (pkgData) => {
        let newPkg: Package;
        
        if (pkgData.trackingNumber) {
          newPkg = createMockPackage(
            pkgData.trackingNumber,
            pkgData.platform,
            pkgData.productName,
            3
          );
        } else {
          newPkg = createManualPackage(
            pkgData.platform,
            pkgData.productName,
            pkgData.estimatedArrival,
            pkgData.notes
          );
        }

        newPkg = {
          ...newPkg,
          ...pkgData,
          id: generateId(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          packages: [newPkg, ...state.packages],
        }));
      },

      updatePackage: (id, updates) => {
        set((state) => ({
          packages: state.packages.map((pkg) =>
            pkg.id === id ? { ...pkg, ...updates, updatedAt: new Date() } : pkg
          ),
        }));
      },

      deletePackage: (id) => {
        set((state) => {
          const pkg = state.packages.find(p => p.id === id);
          let updatedPackages = state.packages.filter(p => p.id !== id);
          
          if (pkg?.parentId) {
            updatedPackages = updatedPackages.map(p => 
              p.id === pkg.parentId 
                ? { ...p, childIds: p.childIds.filter(cid => cid !== id), updatedAt: new Date() }
                : p
            );
          }
          
          if (pkg?.childIds.length > 0) {
            updatedPackages = updatedPackages.map(p =>
              pkg.childIds.includes(p.id)
                ? { ...p, parentId: null, updatedAt: new Date() }
                : p
            );
          }
          
          return {
            packages: updatedPackages,
            selectedIds: state.selectedIds.filter(sid => sid !== id),
            selectedPackageId: state.selectedPackageId === id ? null : state.selectedPackageId,
          };
        });
      },

      markAsOpened: (id) => {
        set((state) => ({
          packages: state.packages.map((pkg) =>
            pkg.id === id
              ? addLogisticsEvent(pkg, 'opened', '包裹已拆包')
              : pkg
          ),
        }));
      },

      updateStatus: (id, status) => {
        set((state) => ({
          packages: state.packages.map((pkg) =>
            pkg.id === id
              ? addLogisticsEvent(pkg, status, getStatusDescription(status))
              : pkg
          ),
        }));
      },

      mergePackages: (parentId, childIds) => {
        set((state) => ({
          packages: state.packages.map((pkg) => {
            if (pkg.id === parentId) {
              return {
                ...pkg,
                childIds: [...new Set([...pkg.childIds, ...childIds])],
                updatedAt: new Date(),
              };
            }
            if (childIds.includes(pkg.id)) {
              return {
                ...pkg,
                parentId,
                updatedAt: new Date(),
              };
            }
            return pkg;
          }),
          selectedIds: [],
          batchMode: false,
        }));
      },

      unmergePackage: (id) => {
        set((state) => {
          const pkg = state.packages.find(p => p.id === id);
          if (!pkg?.parentId) return state;
          
          return {
            packages: state.packages.map((p) => {
              if (p.id === id) {
                return { ...p, parentId: null, updatedAt: new Date() };
              }
              if (p.id === pkg.parentId) {
                return {
                  ...p,
                  childIds: p.childIds.filter(cid => cid !== id),
                  updatedAt: new Date(),
                };
              }
              return p;
            }),
          };
        });
      },

      batchAddPackages: (pkgsData) => {
        const newPkgs: Package[] = pkgsData.map((pkgData) => {
          let newPkg: Package;
          
          if (pkgData.trackingNumber) {
            newPkg = createMockPackage(
              pkgData.trackingNumber,
              pkgData.platform,
              pkgData.productName,
              3
            );
          } else {
            newPkg = createManualPackage(
              pkgData.platform,
              pkgData.productName,
              pkgData.estimatedArrival,
              pkgData.notes
            );
          }

          return {
            ...newPkg,
            ...pkgData,
            id: generateId(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        });

        set((state) => ({
          packages: [...newPkgs, ...state.packages],
        }));
      },

      batchUpdateStatus: (ids, status) => {
        set((state) => ({
          packages: state.packages.map((pkg) =>
            ids.includes(pkg.id)
              ? addLogisticsEvent(pkg, status, getStatusDescription(status))
              : pkg
          ),
          selectedIds: [],
        }));
      },

      batchDelete: (ids) => {
        set((state) => ({
          packages: state.packages.filter((p) => !ids.includes(p.id)),
          selectedIds: [],
          batchMode: false,
        }));
      },

      setFilterStatus: (status) => {
        set({ filterStatus: status });
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      selectPackage: (id) => {
        set({ selectedPackageId: id });
      },

      toggleSelection: (id) => {
        set((state) => ({
          selectedIds: state.selectedIds.includes(id)
            ? state.selectedIds.filter((sid) => sid !== id)
            : [...state.selectedIds, id],
        }));
      },

      clearSelection: () => {
        set({ selectedIds: [] });
      },

      selectAll: () => {
        const { packages, filterStatus, searchQuery } = get();
        const filtered = getFilteredPackages(packages, filterStatus, searchQuery);
        const topLevelIds = filtered.filter(p => !p.parentId).map(p => p.id);
        
        set((state) => ({
          selectedIds: state.selectedIds.length === topLevelIds.length ? [] : topLevelIds,
        }));
      },

      setBatchMode: (enabled) => {
        set({ batchMode: enabled, selectedIds: [] });
      },

      exportData: () => {
        const { packages } = get();
        return JSON.stringify(packages, null, 2);
      },

      importData: (json) => {
        try {
          const importedPackages = JSON.parse(json) as Package[];
          const revivedPackages = importedPackages.map(reviveDates);
          set({ packages: revivedPackages });
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'package-tracker-storage',
      partialize: (state) => ({
        packages: state.packages,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.packages = state.packages.map(reviveDates);
        }
      },
    }
  )
);

function getStatusDescription(status: PackageStatus): string {
  const descriptions: Record<PackageStatus, string> = {
    shipped: '商家已发货',
    in_transit: '包裹运输中',
    out_for_delivery: '包裹正在派送中',
    delivered: '包裹已签收',
    opened: '包裹已拆包',
  };
  return descriptions[status];
}

function getFilteredPackages(
  packages: Package[],
  filterStatus: FilterStatus,
  searchQuery: string
): Package[] {
  return packages.filter((pkg) => {
    if (filterStatus !== 'all' && pkg.status !== filterStatus) {
      return false;
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        pkg.productName.toLowerCase().includes(query) ||
        pkg.trackingNumber.toLowerCase().includes(query) ||
        pkg.carrier.toLowerCase().includes(query) ||
        pkg.platform.toLowerCase().includes(query)
      );
    }
    
    return true;
  });
}

export function useFilteredPackages() {
  const { packages, filterStatus, searchQuery } = usePackageStore();
  return getFilteredPackages(packages, filterStatus, searchQuery);
}

export function useTopLevelPackages() {
  const filtered = useFilteredPackages();
  return filtered.filter(pkg => !pkg.parentId);
}

export function useChildPackages(parentId: string) {
  const { packages } = usePackageStore();
  return packages.filter(pkg => pkg.parentId === parentId);
}

export function useStatusCounts() {
  const { packages } = usePackageStore();
  
  return {
    total: packages.length,
    shipped: packages.filter(p => p.status === 'shipped').length,
    in_transit: packages.filter(p => p.status === 'in_transit').length,
    out_for_delivery: packages.filter(p => p.status === 'out_for_delivery').length,
    delivered: packages.filter(p => p.status === 'delivered').length,
    opened: packages.filter(p => p.status === 'opened').length,
  };
}

export function usePackageById(id: string | undefined) {
  const { packages } = usePackageStore();
  return id ? packages.find(p => p.id === id) : undefined;
}
