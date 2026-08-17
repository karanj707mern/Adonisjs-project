"use client";

import { ThemeProvider } from "./ThemeProvider";
import MainNavbar from "./MainNavbar";
import Footer from "./Footer";
import { ToastProvider } from "./ToastProvider";

export default function SiteChrome({
  children,
  hideChrome = false,
}: {
  children: React.ReactNode;
  hideChrome?: boolean;
}) {
  return (
    <ThemeProvider>
      {!hideChrome && <MainNavbar />}
      <main id="main-content">{children}</main>
      {!hideChrome && <Footer />}
      <ToastProvider />
    </ThemeProvider>
  );
}
