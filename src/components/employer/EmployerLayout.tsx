import { ReactNode } from "react";
import EmployerTopNav from "@/components/layouts/EmployerTopNav";
import TopNavLayout from "@/components/layouts/TopNavLayout";

const EmployerLayout = ({ children }: { children: ReactNode }) => {
  return <TopNavLayout nav={<EmployerTopNav />}>{children}</TopNavLayout>;
};

export default EmployerLayout;
