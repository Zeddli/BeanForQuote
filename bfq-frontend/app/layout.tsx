import type { Metadata } from "next";
import { Cormorant_Garamond, Instrument_Sans } from "next/font/google";
import { FlowProvider } from "@/components/flow-provider";
import { Web3Provider } from "@/components/web3-provider";
import "./globals.css";

const displayFont = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const bodyFont = Instrument_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "BeanForQuote — CoffeeRFQ",
  description:
    "RFQ-based settlement for tokenized coffee lots with verified counterparties, compliance checks, and audit-ready execution.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${bodyFont.variable} h-full`}
    >
      <body>
        <Web3Provider>
          <FlowProvider>{children}</FlowProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
