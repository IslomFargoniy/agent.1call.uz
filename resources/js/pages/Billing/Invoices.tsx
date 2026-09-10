import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import {
    Receipt,
    Upload,
    CheckCircle2,
    Clock,
    XCircle,
    ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface InvoiceItem {
    id: number;
    invoice_number: string;
    amount: number;
    amount_usd?: number;
    payment_method: string;
    status: string;
    receipt_image_path?: string;
    created_at: string;
    approved_at?: string;
    admin_notes?: string;
}

interface InvoicesProps {
    invoices: {
        data: InvoiceItem[];
        current_page: number;
        last_page: number;
    };
}

export default function InvoicesIndex({ invoices }: InvoicesProps) {
    const [uploadingInvoice, setUploadingInvoice] = useState<InvoiceItem | null>(null);
    const { data, setData, post, processing, reset } = useForm({
        invoice_id: '',
        receipt_image: null as File | null,
    });

    const openUpload = (invoice: InvoiceItem) => {
        setUploadingInvoice(invoice);
        setData('invoice_id', String(invoice.id));
    };

    const handleUploadSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/billing/upload-receipt', {
            onSuccess: () => {
                setUploadingInvoice(null);
                reset();
            },
        });
    };

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            <Head title="Hisob-fakturalar (Invoices)" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Hisob-fakturalar va Cheklar</h2>
                    <p className="text-sm text-muted-foreground">
                        Barcha shakllantirilgan invoyslar va to'lov holatlari tarixi
                    </p>
                </div>

                <Button asChild variant="outline" size="sm">
                    <Link href="/billing">
                        <ArrowLeft className="h-4 w-4 mr-1.5" /> Tariflarga qaytish
                    </Link>
                </Button>
            </div>

            {/* Invoices Table */}
            <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 border-b border-border text-muted-foreground text-xs uppercase font-medium">
                        <tr>
                            <th className="py-3 px-4">Invoys raqami</th>
                            <th className="py-3 px-4">Summa</th>
                            <th className="py-3 px-4">To'lov usuli</th>
                            <th className="py-3 px-4">Holati</th>
                            <th className="py-3 px-4">Sana</th>
                            <th className="py-3 px-4 text-right">Chek / Skrinshot</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {invoices.data.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-8 text-center text-muted-foreground text-sm">
                                    Hozircha hech qanday invoys mavjud emas.
                                </td>
                            </tr>
                        ) : (
                            invoices.data.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="py-3.5 px-4 font-mono font-bold text-xs">
                                        {invoice.invoice_number}
                                    </td>
                                    <td className="py-3.5 px-4">
                                        <span className="font-mono font-bold">
                                            {Number(invoice.amount).toLocaleString('uz-UZ')} UZS
                                        </span>
                                        {invoice.amount_usd && (
                                            <span className="text-xs text-muted-foreground block">
                                                (${invoice.amount_usd})
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3.5 px-4 text-xs capitalize font-medium">
                                        {invoice.payment_method.replace('_', ' ')}
                                    </td>
                                    <td className="py-3.5 px-4">
                                        {invoice.status === 'paid' && (
                                            <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                                                <CheckCircle2 className="h-3 w-3" /> To'langan
                                            </span>
                                        )}
                                        {invoice.status === 'pending' && (
                                            <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded-full font-semibold">
                                                <Clock className="h-3 w-3" /> Kutilmoqda
                                            </span>
                                        )}
                                        {invoice.status === 'rejected' && (
                                            <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 px-2 py-0.5 rounded-full font-semibold" title={invoice.admin_notes || ''}>
                                                <XCircle className="h-3 w-3" /> Rad etilgan
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3.5 px-4 text-xs text-muted-foreground font-mono">
                                        {new Date(invoice.created_at).toLocaleDateString('uz-UZ')}
                                    </td>
                                    <td className="py-3.5 px-4 text-right">
                                        {invoice.payment_method === 'card_transfer' && invoice.status === 'pending' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 text-xs gap-1"
                                                onClick={() => openUpload(invoice)}
                                            >
                                                <Upload className="h-3.5 w-3.5" />
                                                {invoice.receipt_image_path ? "Chekni yangilash" : "Chek yuklash"}
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Receipt Upload Modal */}
            {uploadingInvoice && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <form onSubmit={handleUploadSubmit} className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
                        <h3 className="text-lg font-bold">To'lov chekini yuklash</h3>
                        <p className="text-xs text-muted-foreground">
                            Invoys: <b>{uploadingInvoice.invoice_number}</b> • Summa: <b>{Number(uploadingInvoice.amount).toLocaleString('uz-UZ')} UZS</b>
                        </p>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold">Chek skrinshoti (JPG, PNG yoki PDF):</label>
                            <Input
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={(e) => setData('receipt_image', e.target.files?.[0] || null)}
                                required
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setUploadingInvoice(null)}>
                                Bekor qilish
                            </Button>
                            <Button type="submit" className="flex-1" disabled={processing || !data.receipt_image}>
                                {processing ? 'Yuklanmoqda...' : 'Yuborish'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
