import { ReactNode } from "react";

interface TopNavLayoutProps {
  nav: ReactNode;
  children: ReactNode;
}

const TopNavLayout = ({ nav, children }: TopNavLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      {nav}
      <main className="p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
};

export default TopNavLayout;
