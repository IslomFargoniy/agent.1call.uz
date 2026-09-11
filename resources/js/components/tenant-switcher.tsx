import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';
import { Building2, Check, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

interface TenantItem {
    id: number;
    name: string;
    email: string;
    slug?: string;
    is_active?: boolean;
}

export function TenantSwitcher() {
    const { t } = useTranslation();
    const { auth, superadmin } = usePage<any>().props;

    const user = auth?.user;
    const isSuperadmin = user?.role === 'superadmin';
    const selectedTenant = superadmin?.selected_tenant;

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [tenants, setTenants] = useState<TenantItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isFilterOpen && isSuperadmin) {
            setIsLoading(true);
            fetch('/api/superadmin/tenants')
                .then((res) => res.json())
                .then((data) => {
                    setTenants(data);
                    setIsLoading(false);
                })
                .catch((err) => {
                    console.error('Failed to fetch tenants:', err);
                    setIsLoading(false);
                });
        }
    }, [isFilterOpen, isSuperadmin]);

    if (!isSuperadmin) {
        return null;
    }

    const handleSelectTenant = (tenantId: number | null) => {
        router.post(
            '/api/superadmin/select-tenant',
            { tenant_id: tenantId },
            {
                onSuccess: () => {
                    setIsFilterOpen(false);
                },
            }
        );
    };

    const filteredTenants = tenants.filter(
        (t) =>
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.email && t.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (t.slug && t.slug.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 gap-2 px-3 rounded-lg border border-border bg-card shadow-xs cursor-pointer text-foreground hover:bg-accent"
                >
                    <Building2 className="h-4 w-4 shrink-0 text-primary" />
                    <span className="max-w-[130px] truncate text-xs font-medium">
                        {selectedTenant ? selectedTenant.name : t('superadmin.allTenants', 'Barcha kompaniyalar')}
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-base font-semibold">
                        {t('superadmin.filterByTenant', "Kompaniya bo'yicha saralash")}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        {t('superadmin.filterByTenantDesc', 'Select a company to filter the panel context.')}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder={t('superadmin.searchTenants', "Kompaniya yoki email bo'yicha qidirish...")}
                            className="pl-9 h-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="max-h-[300px] overflow-y-auto space-y-1 pr-1">
                        {/* Default: All Tenants / Platform Main option */}
                        <button
                            type="button"
                            onClick={() => handleSelectTenant(null)}
                            className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors hover:bg-muted text-left font-medium text-foreground cursor-pointer"
                        >
                            <span>{t('superadmin.allTenants', 'Barcha kompaniyalar')}</span>
                            {!selectedTenant && (
                                <Check className="h-4 w-4 text-primary animate-in fade-in zoom-in duration-200" />
                            )}
                        </button>

                        {isLoading ? (
                            <div className="py-8 flex justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                            </div>
                        ) : filteredTenants.length > 0 ? (
                            filteredTenants.map((tenant) => (
                                <button
                                    key={tenant.id}
                                    type="button"
                                    onClick={() => handleSelectTenant(tenant.id)}
                                    className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors hover:bg-muted text-left text-foreground cursor-pointer"
                                >
                                    <div className="truncate">
                                        <div className="font-medium truncate">{tenant.name}</div>
                                        <div className="text-xs text-muted-foreground truncate">{tenant.email}</div>
                                    </div>
                                    {selectedTenant?.id === tenant.id && (
                                        <Check className="h-4 w-4 text-primary shrink-0 animate-in fade-in zoom-in duration-200" />
                                    )}
                                </button>
                            ))
                        ) : (
                            searchQuery && (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                    {t('superadmin.noTenantsFound', 'Kompaniyalar topilmadi')}
                                </div>
                            )
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default TenantSwitcher;
