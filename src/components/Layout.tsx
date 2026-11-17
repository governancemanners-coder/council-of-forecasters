import type { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * App shell. Children pattern — App.tsx wraps `<Routes>` in `<Layout>`.
 * Navbar is sticky in normal flow; pages do not compensate for nav height.
 */
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
