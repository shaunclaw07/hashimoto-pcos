import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { BottomNav } from "@/components/bottom-nav";
import { OnboardingGuard } from "@/components/onboarding-guard";
import { ProfileHeader } from "@/components/profile-header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hashimoto & PCOS Ernährungs-Tool",
  description: "Finde heraus welche Lebensmittel bei Hashimoto und PCOS für dich geeignet sind",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <OnboardingGuard>
            <ProfileHeader />
            <main className="min-h-screen pb-20 pt-14">
              {children}
            </main>
            <BottomNav />
          </OnboardingGuard>
        </ThemeProvider>
      </body>
    </html>
  );
}
