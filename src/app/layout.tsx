import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import Navigation from "@/components/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "G-Cal 仮押さえ君",
  description: "Google Calendarの仮押さえと日程確定をスマートに管理します",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <AuthProvider>
          <Navigation />
          <main className="animate-fade-in">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
