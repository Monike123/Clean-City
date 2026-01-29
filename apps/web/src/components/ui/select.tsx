import React from 'react';

// Simplified Select to work with the provided code structure:
// <Select value={...} onValueChange={...}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem ... /></SelectContent></Select>
// Implementing this fully without Radix is complex. I'll make a simplified version that actually just renders a Native Select for now, 
// OR I'll try to support the composable API with React Context. 
// Let's use React Context for the Composable API to match the user's code.

interface SelectContextType {
    value?: string;
    onValueChange?: (value: string) => void;
    open: boolean;
    setOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextType | null>(null);

export const Select = ({ value, onValueChange, children }: { value?: string, onValueChange?: (v: string) => void, children: React.ReactNode }) => {
    const [open, setOpen] = React.useState(false);
    return (
        <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
            <div className="relative inline-block w-full">{children}</div>
        </SelectContext.Provider>
    );
};

export const SelectTrigger = ({ className = '', children, ...props }: any) => {
    const ctx = React.useContext(SelectContext);
    return (
        <button
            type="button"
            className={`flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 ${className}`}
            onClick={() => ctx?.setOpen(!ctx.open)}
            {...props}
        >
            {children}
        </button>
    );
};

export const SelectValue = ({ placeholder }: { placeholder?: string }) => {
    const ctx = React.useContext(SelectContext);
    return <span>{ctx?.value || placeholder}</span>;
}

export const SelectContent = ({ className = '', children }: any) => {
    const ctx = React.useContext(SelectContext);
    if (!ctx?.open) return null;
    return (
        <div className={`absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md bg-white border-gray-200 mt-1 w-full ${className}`}>
            <div className="p-1">{children}</div>
            {/* Backdrop to close */}
            <div className="fixed inset-0 z-[-1]" onClick={() => ctx.setOpen(false)}></div>
        </div>
    );
}

export const SelectItem = ({ value, children, className = '' }: any) => {
    const ctx = React.useContext(SelectContext);
    return (
        <div
            className={`relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-gray-100 cursor-pointer ${className}`}
            onClick={() => {
                ctx?.onValueChange?.(value);
                ctx?.setOpen(false);
            }}
        >
            <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                {/* Checkmark if selected? */}
            </span>
            <span className="truncate">{children}</span>
        </div>
    )
}
