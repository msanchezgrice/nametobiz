import type { Metadata } from "next";
import { JetBrains_Mono, Manrope, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const displayFont = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const monoFont = JetBrains_Mono({
  variable: "--font-code",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "NametoBiz - AI Domain to Prototype Platform",
  description: "Transform domain names into stunning website prototypes using AI",
};

// Add error boundary and logging
if (typeof window !== 'undefined') {
  console.log('🚀 NametoBiz Web App Loading...', {
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  });

  // Global error handler
  window.addEventListener('error', (event) => {
    console.error('🔥 Global Error:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
      timestamp: new Date().toISOString()
    });
  });

  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    console.error('🔥 Unhandled Promise Rejection:', {
      reason: event.reason,
      timestamp: new Date().toISOString()
    });
  });
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} antialiased`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `
              console.log('🎯 NametoBiz Layout Rendered', {
                timestamp: new Date().toISOString(),
                location: window.location.href
              });
            `,
          }}
        />
        {children}
        <Script src="/posthog.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
