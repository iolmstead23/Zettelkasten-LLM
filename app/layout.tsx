import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import Sidebars from "@/components/ui/Sidebars";
import { UserProvider } from '@auth0/nextjs-auth0/client';
import UIProvider from '@/components/ui/UIProvider';

const inter = Inter({ subsets: ["latin"] });

/** Defines the metadata */
export const metadata: Metadata = {
  title: "Zettelkasten LLM",
  description: "Created by Ian Olmstead",
};

/** Wrap the layout around the children */
export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={inter.className}>
        <UserProvider>
          <UIProvider>
            <Sidebars />
            {children}
          </UIProvider>
        </UserProvider>
      </body>
    </html>
  );
};