'use client'

import { AuthProvider } from '@/lib/auth/context/AuthContext';
import { ReactNode } from 'react';
import ModalProvider from './modals/modal-provider';
import { ToastContainer } from 'react-toastify';
import { ReduxProvider } from "@/lib/redux/provider"

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
  <AuthProvider>
    <ReduxProvider>
      {children}
      <ModalProvider />
      <ToastContainer />
    </ReduxProvider>
  </AuthProvider>
  );
}