import { Outlet } from "react-router-dom";
import { TopNav } from "./TopNav";
import { MobileNav } from "./MobileNav";
import { Footer } from "./Footer";
import { BackToTop } from "./BackToTop";
import { ToastContainer } from "../ui/ToastContainer";

export function AppShell() {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <div className="flex flex-1 flex-col pb-20 md:pb-0">
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
      <MobileNav />
      <BackToTop />
      <ToastContainer />
    </div>
  );
}
