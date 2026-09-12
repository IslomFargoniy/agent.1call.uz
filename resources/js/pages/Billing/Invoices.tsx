import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    Receipt,
    CheckCircle2,
    Clock,
    XCircle,
    ArrowLeft,
    Upload,
    FileText,
    Eye,
    X,
    ExternalLink,
    CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaginationNav, PaginationLink } from '@/components/ui/pagination-nav';
import { formatDate } from '@/lib/datetime';

interface InvoiceItem {
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

export default function InvoicesIndex({ invoices }: InvoicesProps) {
    const { t } = useTranslation();
    const { auth, superadmin } = usePage<any>().props;
    const isSuperAdmin = auth?.user?.role === 'superadmin';
    const isAllTenants = isSuperAdmin && !superadmin?.selected_tenant;
    const [uploadingInvoice, setUploadingInvoice] =
        useState<InvoiceItem | null>(null);
    const [viewingReceipt, setViewingReceipt] = useState<InvoiceItem | null>(
        null,
    );
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, reset } = useForm<{
        receipt_image: File | null;
        invoice_id: number | null;
    }>({
        receipt_image: null,
        invoice_id: null,
    });

    const openUpload = (inv: InvoiceItem) => {
        setUploadingInvoice(inv);
        setData({
            receipt_image: null,
            invoice_id: inv.id,
        });
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
    };

    const closeUpload = () => {
        setUploadingInvoice(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        reset();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            setData('receipt_image', file);
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const clearSelectedFile = () => {
        setData('receipt_image', null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleUploadSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadingInvoice || !data.receipt_image) return;

        post(`/billing/invoices/${uploadingInvoice.id}/upload-receipt`, {
            forceFormData: true,
            onSuccess: () => {
                closeUpload();
            },
        });
    };

    return (
        <div className="mx-auto max-w-6xl space-y-6 p-6">
            <Head
                title={t(
                    'billing.invoicesTitle',
                    'Hisob-fakturalar (Invoices)',
                )}
            />

            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        {t(
                            'billing.invoicesTitle',
                            'Hisob-fakturalar va Cheklar',
                        )}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        {t(
                            'billing.invoicesDesc',
                            "Barcha shakllantirilgan invoyslar va to'lov holatlari tarixi",
                        )}
                    </p>
                </div>

                <Button asChild variant="outline" size="sm">
                    <Link href="/billing">
                        <ArrowLeft className="mr-1.5 h-4 w-4" />{' '}
                        {t('billing.backToTariffs', 'Tariflarga qaytish')}
                    </Link>
                </Button>
            </div>

            {/* Invoices Table */}
            <div className="bg-card border-border overflow-hidden rounded-xl border shadow-xs">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 border-border text-muted-foreground border-b text-xs font-medium uppercase">
                        <tr>
                            <th className="w-12 px-4 py-3 text-center">№</th>
                            <th className="px-4 py-3">
                                {t('billing.invoiceNumber', 'Invoys raqami')}
                            </th>
                            {isAllTenants && (
                                <th className="px-4 py-3">
                                    {t('billing.company', 'Kompaniya')}
                                </th>
                            )}
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
                                {t('billing.date', 'Sana')}
                            </th>
                            <th className="px-4 py-3 text-right">
                                {t(
                                    'billing.receiptScreenshot',
                                    'Chek / Skrinshot',
                                )}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-border divide-y">
                        {invoices.data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={isAllTenants ? 8 : 7}
                                    className="text-muted-foreground py-8 text-center text-sm"
                                >
                                    {t(
                                        'billing.noInvoices',
                                        'Hozircha hech qanday invoys mavjud emas.',
                                    )}
                                </td>
                            </tr>
                        ) : (
                            invoices.data.map((invoice, idx) => {
                                const rowNum =
                                    (invoices.current_page - 1) *
                                        (invoices.per_page || 10) +
                                    idx +
                                    1;
                                return (
                                    <tr
                                        key={invoice.id}
                                        className="hover:bg-muted/30 transition-colors"
                                    >
                                        <td className="text-muted-foreground px-4 py-3.5 text-center font-mono text-xs">
                                            {rowNum}
                                        </td>
                                        <td className="px-4 py-3.5 font-mono text-xs font-bold">
                                            {invoice.invoice_number}
                                        </td>
                                        {isAllTenants && (
                                            <td className="px-4 py-3.5 text-xs font-medium">
                                                <span className="bg-primary/10 text-primary border-primary/20 inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium">
                                                    {invoice.tenant?.name ||
                                                        '-'}
                                                </span>
                                            </td>
                                        )}
                                        <td className="px-4 py-3.5">
                                            <span className="font-mono font-bold">
                                                {Number(
                                                    invoice.amount,
                                                ).toLocaleString('uz-UZ')}{' '}
                                                UZS
                                            </span>
                                            {invoice.amount_usd && (
                                                <span className="text-muted-foreground block font-mono text-xs">
                                                    (${invoice.amount_usd})
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-xs font-medium capitalize">
                                            {invoice.payment_method.replace(
                                                '_',
                                                ' ',
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            {invoice.status === 'paid' && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />{' '}
                                                    {t(
                                                        'billing.paid',
                                                        "To'langan",
                                                    )}
                                                </span>
                                            )}
                                            {invoice.status === 'pending' && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                                    <Clock className="h-3.5 w-3.5" />{' '}
                                                    {t(
                                                        'billing.pending',
                                                        'Kutilmoqda',
                                                    )}
                                                </span>
                                            )}
                                            {invoice.status === 'rejected' && (
                                                <span
                                                    className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950 dark:text-red-300"
                                                    title={
                                                        invoice.admin_notes ||
                                                        ''
                                                    }
                                                >
                                                    <XCircle className="h-3.5 w-3.5" />{' '}
                                                    {t(
                                                        'billing.rejected',
                                                        'Rad etilgan',
                                                    )}
                                                </span>
                                            )}
                                        </td>
                                        <td className="text-muted-foreground px-4 py-3.5 font-mono text-xs">
                                            {formatDate(invoice.created_at)}
                                        </td>
                                        <td className="px-4 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {invoice.receipt_image_path ? (
                                                    <button
                                                        type="button"
                                                        className="group border-border bg-muted/40 hover:ring-primary relative h-11 w-11 shrink-0 cursor-pointer overflow-hidden rounded-lg border shadow-xs transition-all hover:ring-2"
                                                        onClick={() =>
                                                            setViewingReceipt(
                                                                invoice,
                                                            )
                                                        }
                                                        title="Chekni kattalashtirib ko'rish"
                                                    >
                                                        <img
                                                            src={`/billing/invoices/${invoice.id}/receipt`}
                                                            alt="Chek"
                                                            className="h-full w-full object-cover transition-transform group-hover:scale-110"
                                                        />
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white opacity-0 transition-opacity group-hover:opacity-100">
                                                            <Eye className="h-4 w-4" />
                                                        </div>
                                                    </button>
                                                ) : null}

                                                {['click', 'payme'].includes(
                                                    invoice.payment_method,
                                                ) &&
                                                    invoice.status ===
                                                        'pending' && (
                                                        <a
                                                            href={`/pay/${invoice.payment_method}/${invoice.id}`}
                                                            className="focus-visible:ring-ring border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-8 items-center justify-center gap-1.5 rounded-md border px-3 text-xs font-medium shadow-xs transition-colors focus-visible:ring-1 focus-visible:outline-hidden"
                                                        >
                                                            <CreditCard className="text-primary h-3.5 w-3.5" />
                                                            {t(
                                                                'billing.payNow',
                                                                'To\x27lash',
                                                            )}
                                                        </a>
                                                    )}

                                                {invoice.payment_method ===
                                                    'card_transfer' &&
                                                    invoice.status ===
                                                        'pending' && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 gap-1.5 text-xs"
                                                            onClick={() =>
                                                                openUpload(
                                                                    invoice,
                                                                )
                                                            }
                                                        >
                                                            <Upload className="h-3.5 w-3.5" />
                                                            {invoice.receipt_image_path
                                                                ? t(
                                                                      'billing.updateReceipt',
                                                                      'Chekni yangilash',
                                                                  )
                                                                : t(
                                                                      'billing.uploadReceipt',
                                                                      'Chek yuklash',
                                                                  )}
                                                        </Button>
                                                    )}
                                            </div>
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

            {/* Receipt Upload Modal with Large Image Preview */}
            {uploadingInvoice && (
                <div
                    className="bg-background/80 animate-in fade-in fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs duration-200"
                    onClick={closeUpload}
                >
                    <form
                        onSubmit={handleUploadSubmit}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-card border-border animate-in zoom-in-95 w-full max-w-lg space-y-5 rounded-2xl border p-6 shadow-2xl duration-200"
                    >
                        <div className="border-border flex items-center justify-between border-b pb-3">
                            <div>
                                <h3 className="text-foreground text-lg font-bold">
                                    {t(
                                        'billing.uploadReceiptModalTitle',
                                        "To'lov chekini yuklash",
                                    )}
                                </h3>
                                <p className="text-muted-foreground mt-0.5 text-xs">
                                    Invoys:{' '}
                                    <b className="text-foreground font-mono">
                                        {uploadingInvoice.invoice_number}
                                    </b>{' '}
                                    • Summa:{' '}
                                    <b className="text-foreground font-mono">
                                        {Number(
                                            uploadingInvoice.amount,
                                        ).toLocaleString('uz-UZ')}{' '}
                                        UZS
                                    </b>
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-foreground h-8 w-8 rounded-lg"
                                onClick={closeUpload}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Hidden file input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/jpeg,image/png,image/jpg,image/webp,application/pdf"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        {/* Large Image Preview or Upload Selector */}
                        {previewUrl ? (
                            <div className="space-y-3">
                                <div className="border-border/80 bg-muted/20 relative flex max-h-[360px] min-h-[220px] items-center justify-center overflow-hidden rounded-2xl border p-2">
                                    <img
                                        src={previewUrl}
                                        alt="Tanlangan chek"
                                        className="max-h-[340px] max-w-full rounded-xl object-contain shadow-md"
                                    />
                                    <button
                                        type="button"
                                        className="bg-background/90 text-muted-foreground hover:text-destructive hover:bg-background absolute top-3 right-3 rounded-full p-1.5 shadow-sm transition-colors"
                                        onClick={clearSelectedFile}
                                        title="Boshqa rasm tanlash"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="text-muted-foreground flex items-center justify-between px-1 text-xs">
                                    <span className="max-w-[280px] truncate font-mono text-[11px]">
                                        {data.receipt_image?.name}
                                    </span>
                                    <button
                                        type="button"
                                        className="text-primary text-xs font-semibold hover:underline"
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                    >
                                        Boshqa fayl tanlash
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer space-y-2.5 rounded-2xl border-2 border-dashed p-8 text-center transition-all"
                            >
                                <div className="bg-primary/10 text-primary mb-1 inline-flex rounded-2xl p-3">
                                    <Upload className="h-6 w-6" />
                                </div>
                                <div className="text-foreground text-sm font-bold">
                                    {t(
                                        'billing.clickToSelectFile',
                                        'Chek rasmini yuklash uchun bosing',
                                    )}
                                </div>
                                <p className="text-muted-foreground mx-auto max-w-xs text-xs">
                                    To'lov amalga oshirilganini tasdiqlovchi
                                    kvitansiya yoki skrinshot (JPG, PNG, WEBP)
                                </p>
                                <div className="pt-2">
                                    <span className="bg-secondary text-secondary-foreground inline-block rounded-full px-3 py-1 text-[11px] font-medium">
                                        Fayl tanlash (maks. 10 MB)
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="border-border flex gap-2.5 border-t pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={closeUpload}
                            >
                                {t('billing.cancel', 'Bekor qilish')}
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1"
                                disabled={processing || !data.receipt_image}
                            >
                                {processing ? (
                                    t('billing.loading', 'Yuklanmoqda...')
                                ) : (
                                    <>
                                        <Upload className="mr-1.5 h-4 w-4" />
                                        {t('billing.submit', 'Yuborish')}
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Lightbox Modal for Full-Size Receipt */}
            {viewingReceipt && (
                <div
                    className="bg-background/85 animate-in fade-in fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm duration-200"
                    onClick={() => setViewingReceipt(null)}
                >
                    <div
                        className="bg-card border-border animate-in zoom-in-95 flex max-h-[90vh] w-full max-w-3xl flex-col space-y-4 rounded-2xl border p-5 shadow-2xl duration-200"
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
                                        Summa:{' '}
                                        <span className="text-foreground font-mono font-semibold">
                                            {Number(
                                                viewingReceipt.amount,
                                            ).toLocaleString('uz-UZ')}{' '}
                                            UZS
                                        </span>{' '}
                                        •{' '}
                                        {formatDate(viewingReceipt.created_at)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <a
                                    href={`/billing/invoices/${viewingReceipt.id}/receipt`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="border-border hover:bg-muted text-muted-foreground hover:text-foreground inline-flex h-8 items-center justify-center gap-1 rounded-lg border px-2.5 text-xs font-medium transition-colors"
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />{' '}
                                    Ochish
                                </a>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-foreground h-8 w-8 rounded-lg"
                                    onClick={() => setViewingReceipt(null)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="bg-muted/20 border-border flex min-h-[300px] flex-1 items-center justify-center overflow-auto rounded-xl border p-2">
                            <img
                                src={`/billing/invoices/${viewingReceipt.id}/receipt`}
                                alt={`Chek ${viewingReceipt.invoice_number}`}
                                className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-sm"
                            />
                        </div>

                        <div className="flex justify-end pt-1">
                            <Button
                                size="sm"
                                variant="outline"
                                className="text-xs font-medium"
                                onClick={() => setViewingReceipt(null)}
                            >
                                Yopish
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
