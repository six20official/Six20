import Link from "next/link";
import type { CSSProperties } from "react";
import {
  ArrowLeft,
  Bell,
  Compass,
  Gamepad2,
  Home,
  MessageCircle,
  Radio,
  User,
} from "lucide-react";

export const btn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "10px 16px",
  borderRadius: "12px",
  background: "#6C3BFF",
  color: "#ffffff",
  fontWeight: 700,
  fontSize: "14px",
  border: "0",
  cursor: "pointer",
};

export const ghost: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "10px 16px",
  borderRadius: "12px",
  background: "#ffffff",
  color: "#17132F",
  fontWeight: 700,
  fontSize: "14px",
  border: "1px solid rgba(0,0,0,0.08)",
  cursor: "pointer",
};

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-black/[0.06] bg-white p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export default function FeatureShell({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#FFFDF8] text-[#17132F]">
      <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-[#FFFDF8]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-5 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 font-black tracking-tight"
          >
            <ArrowLeft size={18} />
            <span>
              SIX<span className="text-[#6C3BFF]">20</span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/notifications"
              className="grid h-10 w-10 place-items-center rounded-xl border border-black/[0.07] bg-white transition hover:shadow-md"
            >
              <Bell size={17} />
            </Link>

            <Link
              href="/profile"
              className="grid h-10 w-10 place-items-center rounded-xl bg-[#17132F] text-white"
            >
              <User size={17} />
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 pb-24 pt-8 lg:px-8">
        {(title || subtitle) && (
          <div className="mb-8">
            {title && (
              <h1 className="text-4xl font-black tracking-[-.05em]">
                {title}
              </h1>
            )}

            {subtitle && (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#756F80]">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {children}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/[0.06] bg-[#FFFDF8]/95 px-2 py-2 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-around">
          <NavItem href="/" label="Home" icon={Home} />
          <NavItem href="/discover" label="Discover" icon={Compass} />
          <NavItem href="/live" label="LIVE" icon={Radio} />
          <NavItem href="/games" label="Play" icon={Gamepad2} />
          <NavItem href="/messages" label="Chat" icon={MessageCircle} />
        </div>
      </nav>
    </main>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: typeof Home;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[10px] font-bold text-[#817A8D] transition hover:text-[#6C3BFF]"
    >
      <Icon size={19} />
      <span>{label}</span>
    </Link>
  );
}
