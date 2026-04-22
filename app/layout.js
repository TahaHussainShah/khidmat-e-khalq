// app/layout.js
import './globals.css' // <- points to styles/globals.css via Next.js convention
import { AuthProvider } from '@/context/AuthContext'
import Navbar from '@/components/Navbar/Navbar'
import Footer from '@/components/Footer/Footer'

export const metadata = {
  title:       'Khidmat e Khalq — Civic Issue Reporter',
  description: 'Report and track civic problems in your city. Roads, garbage, sewage, streetlights and more.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          crossOrigin=""
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#fdf6e3]">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
