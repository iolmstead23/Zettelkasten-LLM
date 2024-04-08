import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import Sidebars from "@/components/ui/Sidebars";
import { UserProvider } from '@auth0/nextjs-auth0/client'
import FileTreeProvider from "@/components/ui/FileTree/FileTreeProvider";
import FileManagerProvider from "@/components/ui/FileTree/FileManagerProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zettelkasten LLM",
  description: "Created by Ian Olmstead",
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={inter.className}>
        <UserProvider>
          <FileTreeProvider>
            <FileManagerProvider>
                <Sidebars />
                {children}
            </FileManagerProvider>
          </FileTreeProvider>
        </UserProvider>
      </body>
    </html>
  );
}
