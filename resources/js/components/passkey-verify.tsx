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
                    className="group border-border bg-background hover:border-primary/50 hover:bg-accent/50 relative flex w-full cursor-pointer items-center justify-between rounded-xl border p-3.5 text-left text-sm font-medium transition-all duration-200 hover:shadow-md disabled:opacity-60"
                >
                    <div className="flex items-center gap-3">
                        <div className="border-border/60 bg-muted text-primary group-hover:bg-primary/10 flex h-9 w-9 items-center justify-center rounded-lg border shadow-xs transition-colors">
                            {isLoading ? (
                                <Spinner className="h-5 w-5" />
                            ) : (
                                <KeyRound className="h-5 w-5" />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-foreground font-semibold">
                                {label ?? 'Passkey (Biometriya)'}
                            </span>
                            <span className="text-muted-foreground text-xs">
                                Touch ID, Face ID yoki Windows Hello
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="hidden rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 sm:inline-flex dark:text-emerald-400">
                            Xavfsiz
                        </span>
                        <KeyRound className="text-muted-foreground group-hover:text-primary h-4 w-4 transition-transform group-hover:scale-110" />
                    </div>
                </button>
                {error && (
                    <InputError
                        message={error}
                        className="mt-2 text-center text-xs"
                    />
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
