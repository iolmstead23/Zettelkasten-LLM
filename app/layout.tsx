import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import Sidebars from "@/components/ui/Sidebars";
import { UserProvider } from '@auth0/nextjs-auth0/client'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zettelkasten LLM",
  description: "Created by Ian Olmstead",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <UserProvider>
        <body className={`${inter.className} h-full`}>
          <Sidebars />
          {children}
        </body>
      </UserProvider>
    </html>
  );
}
