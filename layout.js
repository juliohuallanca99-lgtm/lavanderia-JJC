import './globals.css';

export const metadata = {
  title: 'Boletas de Lavandería — CC0154',
  description: 'Registro y validación de boletas de lavandería del personal de obra.'
};

export const viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
