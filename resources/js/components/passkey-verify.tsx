import type { UrlMethodPair } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import { usePasskeyVerify } from '@laravel/passkeys/react';
import { KeyRound } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';

type Props = {
    routes?: {
        options: UrlMethodPair;
        submit: UrlMethodPair;
    };
    label?: string;
    loadingLabel?: string;
    separator?: string;
    showSeparator?: boolean;
    variant?: 'default' | 'card';
};

export default function PasskeyVerify({
    routes,
    label,
    loadingLabel,
    separator,
    showSeparator = true,
    variant = 'default',
}: Props = {}) {
    const { verify, isLoading, error, isSupported } = usePasskeyVerify({
        ...(routes && {
            routes: {
                options: routes.options.url,
                submit: routes.submit.url,
            },
        }),
        onSuccess: (response) => {
            router.visit(response.redirect ?? '/dashboard');
        },
    });

    if (!isSupported) {
        return null;
    }

    if (variant === 'card') {
        return (
            <div className="w-full">
                <button
                    type="button"
                    onClick={verify}
                    disabled={isLoading}
                    className="group relative flex w-full items-center justify-between rounded-xl border border-border bg-background p-3.5 text-sm font-medium transition-all duration-200 hover:border-primary/50 hover:bg-accent/50 hover:shadow-md disabled:opacity-60 cursor-pointer text-left"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-muted text-primary shadow-xs transition-colors group-hover:bg-primary/10">
                            {isLoading ? (
                                <Spinner className="h-5 w-5" />
                            ) : (
                                <KeyRound className="h-5 w-5" />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold text-foreground">
                                {label ?? 'Passkey (Biometriya)'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                Touch ID, Face ID yoki Windows Hello
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="hidden sm:inline-flex rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            Xavfsiz
                        </span>
                        <KeyRound className="h-4 w-4 text-muted-foreground transition-transform group-hover:scale-110 group-hover:text-primary" />
                    </div>
                </button>
                {error && (
                    <InputError message={error} className="mt-2 text-center text-xs" />
                )}
            </div>
        );
    }

    return (
        <>
            <div className="grid gap-2">
                <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={verify}
                    disabled={isLoading}
                >
                    {isLoading ? <Spinner /> : <KeyRound className="h-4 w-4" />}
                    {isLoading
                        ? (loadingLabel ?? 'Authenticating...')
                        : (label ?? 'Sign in with a passkey')}
                </Button>
                {error && (
                    <InputError message={error} className="text-center" />
                )}
            </div>

            {showSeparator && (
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background text-muted-foreground px-2">
                            {separator ?? 'Or continue with email'}
                        </span>
                    </div>
                </div>
            )}
        </>
    );
}
