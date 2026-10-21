import "./globals.css";
import type { Metadata } from "next";

import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";



export const metadata: Metadata = {
  title: "Volt Cab",
  description: "Your city. Your ride. Your Volt.",
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    
  <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}
