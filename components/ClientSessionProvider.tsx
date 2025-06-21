'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

import { IUserSession } from '../app/store/sessionStore';

interface ClientSessionProviderProps {
  children: ReactNode;
  sessionData: IUserSession | null;
}

const DynamicSessionProvider = dynamic(() => import('./SessionProvider'), {
  ssr: false,
  loading: () => null,
});

export default function ClientSessionProvider(props: ClientSessionProviderProps) {
  return <DynamicSessionProvider {...props} />;
}
