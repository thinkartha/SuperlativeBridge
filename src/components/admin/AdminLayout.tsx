import { ReactNode } from "react";
import AdminTopNav from "@/components/layouts/AdminTopNav";
import TopNavLayout from "@/components/layouts/TopNavLayout";

const AdminLayout = ({ children }: { children: ReactNode }) => {
  return <TopNavLayout nav={<AdminTopNav />}>{children}</TopNavLayout>;
};

export default AdminLayout;
