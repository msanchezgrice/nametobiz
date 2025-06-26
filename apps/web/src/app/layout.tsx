import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
      </body>
    </html>
  );
}
