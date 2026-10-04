import localFont from "next/font/local";
import "./globals.css";
import SWRegister from "@/components/SWRegister";

const syne = localFont({
  src: "./fonts/syne.woff2",
  display: "swap",
  variable: "--font-syne",
  weight: "400 800",
});

const sourceSerif = localFont({
  src: "./fonts/source-serif-4.woff2",
  display: "swap",
  variable: "--font-source-serif",
  weight: "200 900",
});

const jetbrainsMono = localFont({
  src: "./fonts/jetbrains-mono.woff2",
  display: "swap",
  variable: "--font-jetbrains-mono",
  weight: "100 800",
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
