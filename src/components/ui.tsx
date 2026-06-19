import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { twMerge } from 'tailwind-merge';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={twMerge('surface-card', className)} {...props} />;
}

export function Button({ className, variant = 'primary', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  return <button className={twMerge('button', `button-${variant}`, className)} {...props} />;
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: string }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function Avatar({ initials, tone = 'blue' }: { initials: string; tone?: 'blue' | 'purple' | 'green' }) {
  return <span className={`avatar avatar-${tone}`}>{initials}</span>;
}

export function Modal({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose(): void }) {
  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="presentation" onMouseDown={onClose}>
          <motion.div className="modal-panel" initial={{ opacity: 0, y: 30, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.98 }} transition={{ type: 'spring', damping: 30, stiffness: 320 }} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header"><h2>{title}</h2><button className="icon-button" aria-label="Close" onClick={onClose}><X size={18} /></button></div>
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-orbit" /><h3>{title}</h3><p>{body}</p>{action}</div>;
}

export const pageMotion = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } };
