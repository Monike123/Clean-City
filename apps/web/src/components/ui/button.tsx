import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';
    size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
        const baseStyles = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50';

        const variants = {
            default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90 bg-green-600 text-white hover:bg-green-700',
            destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 bg-red-600 text-white hover:bg-red-700',
            outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground border-gray-200 hover:bg-gray-100 text-gray-800',
            secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 bg-gray-100 text-gray-900',
            ghost: 'hover:bg-accent hover:text-accent-foreground hover:bg-gray-100 text-gray-600',
        };

        const sizes = {
            default: 'h-9 px-4 py-2',
            sm: 'h-8 px-3 text-xs',
            lg: 'h-10 rounded-md px-8',
            icon: 'h-9 w-9',
        };

        return (
            <button
                ref={ref}
                className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
                {...props}
            />
        );
    }
);
Button.displayName = 'Button';
