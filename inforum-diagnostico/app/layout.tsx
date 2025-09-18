import "./globals.css";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Diagnóstico • Grupo Inforum",
  description: "Cuestionario de diagnóstico para Radiografía de Software de Gestión Empresarial",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`min-h-dvh antialiased ${montserrat.className}`}>
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-gradient-to-br from-blue-700 to-cyan-400" />
              <div>
                <p className="text-sm text-slate-500 leading-tight">Grupo Inforum</p>
                <h1 className="text-base font-semibold leading-tight">Diagnóstico</h1>
              </div>
            </div>
            <a href="/" className="text-sm text-slate-600 hover:text-slate-900">Inicio</a>
          </div>
        </header>
        <div className="mx-auto max-w-5xl px-6 py-8">
          {children}
        </div>
      </body>
    </html>
  );
}
