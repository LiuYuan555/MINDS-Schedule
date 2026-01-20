import type { Metadata } from "next";
import { Inter } from "next/font/google";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import "./globals.css";
import { AccessControlWrapper } from "@/components/AccessControlWrapper";
import { LanguageProvider } from "@/components/LanguageProvider";
import { LogoWithHiddenAccess } from "@/components/Logo";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MINDS Singapore - Events Schedule",
  description: "Browse and sign up for events and activities organized by MINDS Singapore",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <LanguageProvider>
            <AccessControlWrapper>
              <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
                  <LogoWithHiddenAccess />
                  <div className="flex items-center space-x-4">
                    <SignedIn>
                      <a href="/my-events" className="text-gray-700 hover:text-blue-600 text-sm font-medium">
                        My Events
                      </a>
                    </SignedIn>
                    <SignedOut>
                      <SignInButton />
                      <SignUpButton />
                    </SignedOut>
                    <SignedIn>
                      <UserButton />
                    </SignedIn>
                  </div>
                </div>
              </header>
              {children}
            </AccessControlWrapper>
          </LanguageProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
