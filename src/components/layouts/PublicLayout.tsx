import { ReactNode } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const PublicLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16 pb-12 w-[90%] mx-auto">{children}</main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
