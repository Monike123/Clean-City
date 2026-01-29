import React from 'react';


interface DialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: React.ReactNode;
}

export const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            {/* Pass onClose to children via context or just let children control it? 
                 Actually shadcn splits this into DialogTrigger, Content etc. 
                 For simplicity with the user's code structure which expects nested components:
             */}
            <div className="relative z-50">{children}</div>
            <div className="absolute inset-0" onClick={() => onOpenChange && onOpenChange(false)}></div>
        </div>
    );
};

export const DialogContent = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
    <div className={`fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 rounded-xl ${className}`}>
        {children}
    </div>
);

export const DialogHeader = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
    <div className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}>{children}</div>
);

export const DialogFooter = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
    <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`}>{children}</div>
);

export const DialogTitle = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
    <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</h3>
);

export const DialogDescription = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
    <p className={`text-sm text-muted-foreground text-gray-500 ${className}`}>{children}</p>
);
