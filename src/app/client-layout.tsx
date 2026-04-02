'use client';

import { ToastProvider } from '@/components/ui/Toast';
import { ModalProvider } from '@/components/ui/Modal';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ModalProvider>
        {children}
      </ModalProvider>
    </ToastProvider>
  );
}
