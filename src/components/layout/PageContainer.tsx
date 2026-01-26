import { ReactNode } from 'react';
import { AppHeader } from './AppHeader';

interface PageContainerProps {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function PageContainer({ title, children, actions }: PageContainerProps) {
  return (
    <div className="flex flex-col h-full">
      <AppHeader title={title} />
      <div className="flex-1 p-3 sm:p-6">
        {actions && (
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div />
            <div className="flex items-center gap-2 flex-wrap justify-end">{actions}</div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
