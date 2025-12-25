// app/layout.js
import "./globals.css";
import Providers from "./providers";
import BottomNav from "../components/BottomNav";
import { getServerSession } from "next-auth";

export const metadata = {
  title: "Gleedz - Multi Vendor Event Platform",
  description: "Create, manage and experience events like never before.",
};

export default async function RootLayout({ children }) {
  const session = await getServerSession();

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Providers session={session}>
          <main className="flex-1 pb-16">{children}</main>

          {/* Global Bottom Navigation (mobile only) */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
            <BottomNav />
          </div>
        </Providers>
      </body>
    </html>
  );
}  