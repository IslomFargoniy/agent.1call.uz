import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Head, router } from '@inertiajs/react';
import {
    Receipt,
    CheckCircle2,
    Clock,
    XCircle,
    Check,
    X,
    Eye,
    ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaginationNav, PaginationLink } from '@/components/ui/pagination-nav';
import { formatDate, formatDateTime } from '@/lib/datetime';

interface InvoiceItem {
    id: number;
    tenant_id: number;
    tenant?: { id: number; name: string };
    invoice_number: string;
    amount: number;
    payment_method: string;
    status: string;
    receipt_image_path?: string;
    created_at: string;
    approved_at?: string;
    approver?: { id: number; name: string };
    admin_notes?: string;
}

interface InvoicesProps {
    invoices: {
        data: InvoiceItem[];
        current_page: number;
        last_page: number;
        from: number | null;
        to: number | null;
        total: number;
        per_page: number;
        links: PaginationLink[];
    };
}

export default function AdminInvoices({ invoices }: InvoicesProps) {
    const { t } = useTranslation();
    const [viewingReceipt, setViewingReceipt] = useState<InvoiceItem | null>(
        null,
    );
    const [rejectingInvoice, setRejectingInvoice] =
        useState<InvoiceItem | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    const handleApprove = (invoice: InvoiceItem) => {
        if (
            !confirm(
                t(
                    'admin.confirmApproveInvoice',
                    'Rostdan ham bu invoysni tasdiqlamoqchimisiz? Tenant obunasi avtomatik faollashadi.',
                ),
            )
        ) {
            return;
        }

        router.post(
            `/admin/invoices/${invoice.id}/approve`,
            {},
            {
                preserveScroll: true,
            },
        );
    };

    const handleRejectSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!rejectingInvoice) return;

        router.post(
            `/admin/invoices/${rejectingInvoice.id}/reject`,
            {
                reason: rejectReason,
            },
            {
                onSuccess: () => {
                    setRejectingInvoice(null);
                    setRejectReason('');
                },
            },
        );
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6 p-6">
            <Head
                title={t('admin.invoicesTitle', "Invoyslar va To'lov Cheklari")}
            />

            <div>
                <h2 className="text-2xl font-bold tracking-tight">
                    {t('admin.invoicesTitle', "Invoyslar va To'lov Cheklari")}
                </h2>
                <p className="text-muted-foreground text-sm">
                    {t(
                        'admin.invoicesDesc',
                        "Mijozlar tomonidan to'langan cheklarni tekshirish va obunalarni tasdiqlash",
                    )}
                </p>
            </div>

            {/* Invoices Table */}
            <div className="bg-card border-border overflow-hidden rounded-xl border shadow-xs">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 border-border text-muted-foreground border-b text-xs font-medium uppercase">
                        <tr>
                            <th className="w-12 px-4 py-3 text-center">№</th>
                            <th className="px-4 py-3">
                                {t('admin.invoiceNumber', 'Invoys #')}
                            </th>
                            <th className="px-4 py-3">
                                {t('admin.company', 'Kompaniya (Tenant)')}
                            </th>
                            <th className="px-4 py-3">
                                {t('billing.amount', 'Summa')}
                            </th>
                            <th className="px-4 py-3">
                                {t('billing.paymentMethod', "To'lov usuli")}
                            </th>
                            <th className="px-4 py-3">
                                {t('billing.status', 'Holati')}
                            </th>
                            <th className="px-4 py-3">
                                {t(
                                    'admin.receiptScreenshot',
                                    'Chek / Skrinshot',
                                )}
                            </th>
                            <th className="px-4 py-3 text-right">
                                {t('devices.actions', 'Amallar')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-border divide-y">
                        {invoices.data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={8}
                                    className="text-muted-foreground py-8 text-center text-sm"
                                >
                                    {t(
                                        'billing.noInvoices',
                                        'Hozircha hech qanday invoys mavjud emas.',
                                    )}
                                </td>
                            </tr>
                        ) : (
                            invoices.data.map((inv, idx) => {
                                const rowNum =
                                    (invoices.current_page - 1) *
                                        (invoices.per_page || 10) +
                                    idx +
                                    1;
                                return (
                                    <tr
                                        key={inv.id}
                                        className="hover:bg-muted/30 transition-colors"
                                    >
                                        <td className="text-muted-foreground px-4 py-3.5 text-center font-mono text-xs">
                                            {rowNum}
                                        </td>
                                        <td className="px-4 py-3.5 font-mono text-xs font-bold">
                                            {inv.invoice_number}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <div className="font-semibold">
                                                {inv.tenant?.name ||
                                                    `Tenant #${inv.tenant_id}`}
                                            </div>
                                            <div className="text-muted-foreground font-mono text-xs">
                                                {formatDate(inv.created_at)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 font-mono font-bold">
                                            {Number(inv.amount).toLocaleString(
                                                'uz-UZ',
                                            )}{' '}
                                            UZS
                                        </td>
                                        <td className="px-4 py-3.5 text-xs capitalize">
                                            {inv.payment_method.replace(
                                                '_',
                                                ' ',
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            {inv.status === 'paid' && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                                    <CheckCircle2 className="h-3 w-3" />{' '}
                                                    {t(
                                                        'billing.paid',
                                                        "To'langan",
                                                    )}
                                                </span>
                                            )}
                                            {inv.status === 'pending' && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                                    <Clock className="h-3 w-3" />{' '}
                                                    {t(
                                                        'billing.pending',
                                                        'Kutilmoqda',
                                                    )}
                                                </span>
                                            )}
                                            {inv.status === 'rejected' && (
                                                <span
                                                    className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950 dark:text-red-300"
                                                    title={
                                                        inv.admin_notes || ''
                                                    }
                                                >
                                                    <XCircle className="h-3 w-3" />{' '}
                                                    {t(
                                                        'billing.rejected',
                                                        'Rad etilgan',
                                                    )}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            {inv.receipt_image_path ? (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        className="group border-border bg-muted/40 hover:ring-primary relative h-11 w-11 shrink-0 cursor-pointer overflow-hidden rounded-lg border shadow-xs transition-all hover:ring-2"
                                                        onClick={() =>
                                                            setViewingReceipt(
                                                                inv,
                                                            )
                                                        }
                                                        title="Chekni kattalashtirib ko'rish"
                                                    >
                                                        <img
                                                            src={`/admin/invoices/${inv.id}/receipt`}
                                                            alt="Chek"
                                                            className="h-full w-full object-cover transition-transform group-hover:scale-110"
                                                        />
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white opacity-0 transition-opacity group-hover:opacity-100">
                                                            <Eye className="h-4 w-4" />
                                                        </div>
                                                    </button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 gap-1 px-2 text-[11px]"
                                                        onClick={() =>
                                                            setViewingReceipt(
                                                                inv,
                                                            )
                                                        }
                                                    >
                                                        <Eye className="h-3 w-3" />{' '}
                                                        {t(
                                                            'admin.view',
                                                            "Ko'rish",
                                                        )}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-xs italic">
                                                    {t(
                                                        'admin.notUploaded',
                                                        'Yuklanmagan',
                                                    )}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-right">
                                            {inv.status === 'pending' && (
                                                <div className="flex justify-end gap-1.5">
                                                    <Button
                                                        size="sm"
                                                        variant="default"
                                                        className="h-8 gap-1 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
                                                        onClick={() =>
                                                            handleApprove(inv)
                                                        }
                                                    >
                                                        <Check className="h-3.5 w-3.5" />{' '}
                                                        {t(
                                                            'admin.approve',
                                                            'Tasdiqlash',
                                                        )}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-destructive hover:bg-destructive/10 h-8 gap-1 text-xs"
                                                        onClick={() =>
                                                            setRejectingInvoice(
                                                                inv,
                                                            )
                                                        }
                                                    >
                                                        <X className="h-3.5 w-3.5" />{' '}
                                                        {t(
                                                            'admin.reject',
                                                            'Rad etish',
                                                        )}
                                                    </Button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                <PaginationNav
                    links={invoices.links}
                    current_page={invoices.current_page}
                    last_page={invoices.last_page}
                    from={invoices.from}
                    to={invoices.to}
                    total={invoices.total}
                    per_page={invoices.per_page}
                />
            </div>

            {/* View Receipt Image Modal */}
            {viewingReceipt && (
                <div
                    className="bg-background/85 animate-in fade-in fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm duration-200"
                    onClick={() => setViewingReceipt(null)}
                >
                    <div
                        className="bg-card border-border animate-in zoom-in-95 flex max-h-[90vh] w-full max-w-3xl flex-col space-y-4 rounded-2xl border p-6 shadow-2xl duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="border-border flex items-center justify-between border-b pb-3">
                            <div className="flex items-center gap-2">
                                <Receipt className="text-primary h-5 w-5" />
                                <div>
                                    <h3 className="text-foreground text-base font-bold">
                                        To'lov cheki #
                                        {viewingReceipt.invoice_number}
                                    </h3>
                                    <p className="text-muted-foreground text-xs">
                                        Kompaniya:{' '}
                                        <b>{viewingReceipt.tenant?.name}</b> •
                                        Summa:{' '}
                                        <b className="text-foreground font-mono">
                                            {Number(
                                                viewingReceipt.amount,
                                            ).toLocaleString('uz-UZ')}{' '}
                                            UZS
                                        </b>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <a
                                    href={`/admin/invoices/${viewingReceipt.id}/receipt`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="border-border hover:bg-muted text-muted-foreground hover:text-foreground inline-flex h-8 items-center justify-center gap-1 rounded-lg border px-2.5 text-xs font-medium transition-colors"
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />{' '}
                                    Yangi oynada
                                </a>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg"
                                    onClick={() => setViewingReceipt(null)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="bg-muted/20 border-border flex min-h-[320px] flex-1 items-center justify-center overflow-auto rounded-xl border p-2">
                            <img
                                src={`/admin/invoices/${viewingReceipt.id}/receipt`}
                                alt="To'lov cheki"
                                className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-sm"
                            />
                        </div>

                        <div className="text-muted-foreground flex items-center justify-between pt-1 text-xs">
                            <span>
                                Sana:{' '}
                                {formatDateTime(viewingReceipt.created_at)}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setViewingReceipt(null)}
                            >
                                {t('devices.closeBtn', 'Yopish')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {rejectingInvoice && (
                <div
                    className="bg-background/80 animate-in fade-in fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs duration-200"
                    onClick={() => setRejectingInvoice(null)}
                >
                    <form
                        onSubmit={handleRejectSubmit}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-card border-border animate-in zoom-in-95 w-full max-w-md space-y-4 rounded-2xl border p-6 shadow-2xl duration-200"
                    >
                        <h3 className="text-lg font-bold">
                            {t(
                                'admin.rejectReasonTitle',
                                'Invoysni rad etish sababi',
                            )}
                        </h3>
                        <p className="text-muted-foreground text-xs">
                            Invoys: <b>{rejectingInvoice.invoice_number}</b>
                        </p>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold">
                                {t('admin.reasonLabel', 'Sabab:')}
                            </label>
                            <textarea
                                className="border-input focus:ring-primary h-24 w-full rounded-md border bg-transparent p-3 text-xs focus:ring-1"
                                placeholder={t(
                                    'admin.rejectReasonPlaceholder',
                                    "To'lov summasi kam yoki chek soxta...",
                                )}
                                value={rejectReason}
                                onChange={(e) =>
                                    setRejectReason(e.target.value)
                                }
                                required
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => setRejectingInvoice(null)}
                            >
                                {t('admin.cancel', 'Bekor qilish')}
                            </Button>
                            <Button
                                type="submit"
                                variant="destructive"
                                className="flex-1"
                            >
                                {t('admin.reject', 'Rad etish')}
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
