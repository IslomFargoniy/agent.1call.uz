import type { ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export default function AppLogoIcon({
    className,
    alt = 'Agent1Call Logo',
    ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="/images/1call_logo.png"
            alt={alt}
            className={cn('object-contain rounded-md', className)}
            {...props}
        />
    );
}
