import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Head, useForm, router } from '@inertiajs/react';
import {
    Receipt,
    CheckCircle2,
    XCircle,
    Clock,
    Eye,
    Check,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminInvoiceItem {
    id: number;
    invoice_number: string;
    amount: number;
    amount_usd?: number;
    payment_method: string;
    status: string;
    receipt_image_path?: string;
    created_at: string;
    admin_notes?: string;
    tenant?: { id: number; name: string };
    approver?: { id: number; name: string };
}

interface InvoicesProps {
    invoices: {
        data: AdminInvoiceItem[];
        current_page: number;
        last_page: number;
    };
}

export default function AdminInvoices({ invoices }: InvoicesProps) {
    const { t } = useTranslation();
    const [viewingReceipt, setViewingReceipt] = useState<AdminInvoiceItem | null>(null);
    const [rejectingInvoice, setRejectingInvoice] = useState<AdminInvoiceItem | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    const handleApprove = (invoice: AdminInvoiceItem) => {
        if (confirm(`Invoys #${invoice.invoice_number} tasdiqlansinmi va obuna faollashtirilsinmi?`)) {
            router.post(`/admin/invoices/${invoice.id}/approve`);
        }
    };

    const handleRejectSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!rejectingInvoice) return;
        router.post(`/admin/invoices/${rejectingInvoice.id}/reject`, {
            reason: rejectReason,
        }, {
            onSuccess: () => {
                setRejectingInvoice(null);
                setRejectReason('');
            },
        });
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <Head title="Superadmin — Invoyslar va Cheklar" />

            <div>
                <h2 className="text-2xl font-bold tracking-tight">Invoyslar va To'lov Cheklari</h2>
                <p className="text-sm text-muted-foreground">
                    Barcha kompaniyalar to'lovlari va yuklangan karta skrinshotlarini tasdiqlash
                </p>
            </div>

            {/* Table */}
            <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 border-b border-border text-muted-foreground text-xs uppercase font-medium">
                        <tr>
                            <th className="py-3 px-4">Invoys raqami</th>
                            <th className="py-3 px-4">Kompaniya</th>
                            <th className="py-3 px-4">Summa</th>
                            <th className="py-3 px-4">To'lov usuli</th>
                            <th className="py-3 px-4">Holati</th>
                            <th className="py-3 px-4">Chek</th>
                            <th className="py-3 px-4 text-right">Amallar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {invoices.data.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-8 text-center text-muted-foreground text-sm">
                                    Hozircha hech qanday invoys topilmadi.
                                </td>
                            </tr>
                        ) : (
                            invoices.data.map((inv) => (
                                <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="py-3.5 px-4 font-mono font-bold text-xs">
                                        {inv.invoice_number}
                                    </td>
                                    <td className="py-3.5 px-4 text-xs font-semibold">
                                        {inv.tenant?.name || '—'}
                                    </td>
                                    <td className="py-3.5 px-4">
                                        <span className="font-mono font-bold">
                                            {Number(inv.amount).toLocaleString('uz-UZ')} UZS
                                        </span>
                                        {inv.amount_usd && (
                                            <span className="text-xs text-muted-foreground block font-mono">
                                                (${inv.amount_usd})
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3.5 px-4 text-xs capitalize">
                                        {inv.payment_method.replace('_', ' ')}
                                    </td>
                                    <td className="py-3.5 px-4">
                                        {inv.status === 'paid' && (
                                            <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                                                <CheckCircle2 className="h-3 w-3" /> To'langan
                                            </span>
                                        )}
                                        {inv.status === 'pending' && (
                                            <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded-full font-semibold">
                                                <Clock className="h-3 w-3" /> Kutilmoqda
                                            </span>
                                        )}
                                        {inv.status === 'rejected' && (
                                            <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 px-2 py-0.5 rounded-full font-semibold">
                                                <XCircle className="h-3 w-3" /> Rad etilgan
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3.5 px-4">
                                        {inv.receipt_image_path ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-xs gap-1"
                                                onClick={() => setViewingReceipt(inv)}
                                            >
                                                <Eye className="h-3.5 w-3.5" /> Ko'rish
                                            </Button>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">Yuklanmagan</span>
                                        )}
                                    </td>
                                    <td className="py-3.5 px-4 text-right">
                                        {inv.status === 'pending' && (
                                            <div className="flex justify-end gap-1.5">
                                                <Button
                                                    size="sm"
                                                    variant="default"
                                                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                                    onClick={() => handleApprove(inv)}
                                                >
                                                    <Check className="h-3.5 w-3.5" /> Tasdiqlash
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 text-xs text-destructive hover:bg-destructive/10 gap-1"
                                                    onClick={() => setRejectingInvoice(inv)}
                                                >
                                                    <X className="h-3.5 w-3.5" /> Rad etish
                                                </Button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* View Receipt Image Modal */}
            {viewingReceipt && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold">To'lov cheki skrinshoti</h3>
                            <Button variant="ghost" size="icon" onClick={() => setViewingReceipt(null)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="border border-border rounded-xl p-2 bg-muted/40 max-h-[70vh] overflow-auto flex justify-center">
                            <img
                                src={`/storage/${viewingReceipt.receipt_image_path}`}
                                alt="To'lov cheki"
                                className="max-w-full h-auto rounded-lg object-contain"
                            />
                        </div>
                        <div className="flex justify-between items-center text-xs text-muted-foreground pt-2">
                            <span>Invoys: <b>{viewingReceipt.invoice_number}</b></span>
                            <Button variant="outline" size="sm" onClick={() => setViewingReceipt(null)}>
                                Yopish
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {rejectingInvoice && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <form onSubmit={handleRejectSubmit} className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
                        <h3 className="text-lg font-bold">Invoysni rad etish sababi</h3>
                        <p className="text-xs text-muted-foreground">Invoys: {rejectingInvoice.invoice_number}</p>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold">Sabab:</label>
                            <textarea
                                className="w-full h-24 rounded-md border border-input bg-transparent p-3 text-xs"
                                placeholder="To'lov summasi kam yoki chek soxta..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                required
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setRejectingInvoice(null)}>
                                Bekor qilish
                            </Button>
                            <Button type="submit" variant="destructive" className="flex-1">
                                Rad etish
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
