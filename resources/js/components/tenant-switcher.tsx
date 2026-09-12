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
            },
        );
    };

    const filteredTenants = tenants.filter(
        (t) =>
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.email &&
                t.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (t.slug &&
                t.slug.toLowerCase().includes(searchQuery.toLowerCase())),
    );

    return (
        <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="border-border bg-card text-foreground hover:bg-accent h-9 cursor-pointer gap-2 rounded-lg border px-3 shadow-xs"
                >
                    <Building2 className="text-primary h-4 w-4 shrink-0" />
                    <span className="max-w-[130px] truncate text-xs font-medium">
                        {selectedTenant
                            ? selectedTenant.name
                            : t('superadmin.allTenants', 'Barcha kompaniyalar')}
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-base font-semibold">
                        {t(
                            'superadmin.filterByTenant',
                            "Kompaniya bo'yicha saralash",
                        )}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        {t(
                            'superadmin.filterByTenantDesc',
                            'Select a company to filter the panel context.',
                        )}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="relative">
                        <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                        <Input
                            type="search"
                            placeholder={t(
                                'superadmin.searchTenants',
                                "Kompaniya yoki email bo'yicha qidirish...",
                            )}
                            className="h-9 pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="max-h-[300px] space-y-1 overflow-y-auto pr-1">
                        {/* Default: All Tenants / Platform Main option */}
                        <button
                            type="button"
                            onClick={() => handleSelectTenant(null)}
                            className="hover:bg-muted text-foreground flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-sm font-medium transition-colors"
                        >
                            <span>
                                {t(
                                    'superadmin.allTenants',
                                    'Barcha kompaniyalar',
                                )}
                            </span>
                            {!selectedTenant && (
                                <Check className="text-primary animate-in fade-in zoom-in h-4 w-4 duration-200" />
                            )}
                        </button>

                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <div className="border-primary h-5 w-5 animate-spin rounded-full border-b-2" />
                            </div>
                        ) : filteredTenants.length > 0 ? (
                            filteredTenants.map((tenant) => (
                                <button
                                    key={tenant.id}
                                    type="button"
                                    onClick={() =>
                                        handleSelectTenant(tenant.id)
                                    }
                                    className="hover:bg-muted text-foreground flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors"
                                >
                                    <div className="truncate">
                                        <div className="truncate font-medium">
                                            {tenant.name}
                                        </div>
                                        <div className="text-muted-foreground truncate text-xs">
                                            {tenant.email}
                                        </div>
                                    </div>
                                    {selectedTenant?.id === tenant.id && (
                                        <Check className="text-primary animate-in fade-in zoom-in h-4 w-4 shrink-0 duration-200" />
                                    )}
                                </button>
                            ))
                        ) : (
                            searchQuery && (
                                <div className="text-muted-foreground py-6 text-center text-sm">
                                    {t(
                                        'superadmin.noTenantsFound',
                                        'Kompaniyalar topilmadi',
                                    )}
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
