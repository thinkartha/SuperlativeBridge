import { ReactNode } from "react";
import StudentTopNav from "@/components/layouts/StudentTopNav";
import TopNavLayout from "@/components/layouts/TopNavLayout";

const StudentLayout = ({ children }: { children: ReactNode }) => {
  return <TopNavLayout nav={<StudentTopNav />}>{children}</TopNavLayout>;
};

export default StudentLayout;
