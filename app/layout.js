import './globals.css'
import Providers from './providers'
export const metadata = { title: 'SKAM CITY' }
export default function Layout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lalezar&family=IBM+Plex+Sans+Arabic:wght@400;600&display=swap" />
      </head>
      <body><Providers>{children}</Providers></body>
    </html>
  )
}
