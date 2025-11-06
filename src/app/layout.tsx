import type { Metadata } from "next";
import "@fontsource-variable/onest";
import "./globals.css";
import Navigation from "./_components/navigation";
import AuthMonitor from "./_components/auth-monitor";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "ECMO Bridge 2.0",
  description: "Simplified patient-machine matching for healthcare",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <AuthMonitor />
          <Navigation />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
