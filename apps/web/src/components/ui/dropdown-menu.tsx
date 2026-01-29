import React, { useRef, useState, useEffect, useContext, createContext } from 'react';
import { createPortal } from 'react-dom';

// Portal-based DropdownMenu
interface DropdownContextType {
    open: boolean;
    setOpen: (open: boolean) => void;
    triggerRef: React.RefObject<HTMLElement>;
}
const DropdownContext = createContext<DropdownContextType | null>(null);

export const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLElement>(null);

    return (
        <DropdownContext.Provider value={{ open, setOpen, triggerRef }}>
            <div className="relative inline-block text-left">{children}</div>
        </DropdownContext.Provider>
    );
};

export const DropdownMenuTrigger = ({ children, asChild, ...props }: any) => {
    const ctx = useContext(DropdownContext);

    return (
        <div
            ref={ctx?.triggerRef as React.RefObject<HTMLDivElement>}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                ctx?.setOpen(!ctx.open);
            }}
            className="inline-block cursor-pointer"
            {...props}
        >
            {children}
        </div>
    );
};

export const DropdownMenuContent = ({ align = 'end', className = '', children }: { align?: 'start' | 'end', className?: string, children: React.ReactNode }) => {
    const ctx = useContext(DropdownContext);

    if (!ctx?.open) return null;

    // Use Portal to render into body with fixed positioning
    return (
        <>
            {createPortal(
                <PortalContent align={align} className={className} ctx={ctx}>
                    {children}
                </PortalContent>,
                document.body
            )}
        </>
    );
};

const PortalContent = ({ align, className, ctx, children }: any) => {
    const [style, setStyle] = useState<React.CSSProperties>({ opacity: 0 }); // Start hidden to prevent flash
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ctx.triggerRef.current || !ref.current) return;

        const triggerRect = ctx.triggerRef.current.getBoundingClientRect();
        const contentRect = ref.current.getBoundingClientRect(); // Need explicit measurement

        // Fixed positioning logic
        // default: below the trigger
        let top = triggerRect.bottom + 4;

        // Viewport Logic
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        // Vertical collision: if not enough space below, flip up
        if (top + contentRect.height > viewportHeight - 10) {
            // check if space above
            const spaceAbove = triggerRect.top;
            if (spaceAbove > contentRect.height + 10) {
                top = triggerRect.top - contentRect.height - 4;
            }
        }

        if (align === 'end') {
            const distanceRight = window.innerWidth - triggerRect.right;
            setStyle({
                top: `${top}px`,
                right: `${distanceRight}px`,
                position: 'fixed',
                opacity: 1,
                zIndex: 9999,
                minWidth: '8rem'
            });
            return;
        }

        let left = triggerRect.left;

        // Horizontal collision (just in case)
        if (left + contentRect.width > viewportWidth) {
            left = viewportWidth - contentRect.width - 10;
        }
        if (left < 10) {
            left = 10;
        }

        setStyle({
            top: `${top}px`,
            left: `${left}px`,
            position: 'fixed', // Use fixed to ignore scroll offsets complications
            opacity: 1,
            zIndex: 9999,
            minWidth: '8rem'
        });

        // Close on scroll (optional, but good for fixed menus attached to scrolling elements)
        const handleScroll = () => {
            // simplified: just close on scroll to avoid detached menus
            ctx.setOpen(false);
        };
        window.addEventListener('scroll', handleScroll, true);
        return () => window.removeEventListener('scroll', handleScroll, true);

    }, [ctx.open, align]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node) &&
                ctx.triggerRef.current && !ctx.triggerRef.current.contains(e.target as Node)) {
                ctx.setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [ctx]);

    return (
        <div
            ref={ref}
            style={style}
            className={`overflow-hidden rounded-md border bg-white p-1 text-slate-950 shadow-md ${className}`}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside menu
        >
            {children}
        </div>
    );
};


export const DropdownMenuItem = ({ className = '', onClick, children, ...props }: any) => {
    const ctx = useContext(DropdownContext);
    return (
        <div
            className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 hover:text-gray-900 cursor-pointer ${className}`}
            onClick={(e) => {
                e.stopPropagation();
                onClick?.(e);
                ctx?.setOpen(false);
            }}
            {...props}
        >
            {children}
        </div>
    );
};
