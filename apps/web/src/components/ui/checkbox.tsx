import React from 'react';

// Simplified Checkbox using native input
// Real shadcn uses Radix Checkbox, but we use native for speed/stability without deps
interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onCheckedChange?: (checked: boolean) => void;
    checked?: boolean; // native uses checked
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className = '', onCheckedChange, onChange, ...props }, ref) => {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (onChange) onChange(e);
            if (onCheckedChange) onCheckedChange(e.target.checked);
        };

        return (
            <input
                type="checkbox"
                ref={ref}
                onChange={handleChange}
                className={`h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary ${className}`}
                {...props}
            />
        );
    }
);
Checkbox.displayName = 'Checkbox';
