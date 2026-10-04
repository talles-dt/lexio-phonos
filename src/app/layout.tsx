import { Syne, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SWRegister from "@/components/SWRegister";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata = {
  title: "Lexio Phonos — Pronunciation Trainer",
  description:
    "Practise English pronunciation with private recordings, guided listening and a local practice journal.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-180.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${sourceSerif.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-[#0D0D0F] text-[#F5F0E8] font-serif">
        <SWRegister />
        {children}
      </body>
    </html>
  );
}
