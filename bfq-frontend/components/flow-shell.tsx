"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AccessGate } from "@/components/access-gate";
import { flowPages, shellRoles } from "@/components/flow-config";
import { IdentityPanel } from "@/components/identity-panel";
import { useFlow } from "@/components/flow-provider";
import type { ParticipantRole } from "@/types/domain";
import { useState } from "react";

type FlowShellProps = {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
  hideDemoIdentityDrawer?: boolean;
};

export function FlowShell({ eyebrow, title, intro, children, hideDemoIdentityDrawer = false }: FlowShellProps) {
  const pathname = usePathname();
  const { activeParticipant, participants, setActiveParticipantId } = useFlow();
  const [showIdentityModal, setShowIdentityModal] = useState(false);

  // Filter navigation items by role
  const navItems = flowPages.filter((page) => {
    if (!page.allowedRoles) return true;
    return page.allowedRoles.includes(activeParticipant.role);
  });

  const shouldHideDrawer = hideDemoIdentityDrawer || pathname === "/audit";

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] lg:flex">
      {/* Persistent Left Sidebar */}
      <aside className="w-full border-r border-[var(--line)] bg-[var(--paper)] lg:w-72 lg:flex-shrink-0">
        <div className="flex h-full flex-col justify-between p-6">
          <div className="space-y-8">
            {/* Header / Brand */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[0.7rem] font-bold uppercase tracking-[0.25em] text-[var(--accent-strong)]">
                  CLEANVERSE
                </span>
                <span className="rounded-full border border-[var(--line-strong)] bg-[var(--paper-soft)] px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  Monad 10143
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-[var(--ink-strong)]">
                BeanForQuote
              </h1>
              <p className="text-[0.75rem] text-[var(--muted-strong)]">Institutional Commodity RFQ</p>
            </div>

            {/* Navigation Section */}
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
                WORKSPACE
              </p>
              <nav className="mt-4 flex flex-col gap-1.5">
                {navItems.map((page) => {
                  const isActive = pathname === page.href;
                  return (
                    <Link
                      key={page.slug}
                      href={page.href}
                      className={`flex items-center justify-between rounded-md px-3.5 py-2.5 text-sm font-semibold transition-all ${
                        isActive
                          ? "bg-[var(--accent-strong)] text-white shadow-sm"
                          : "text-[var(--ink-strong)] hover:bg-[var(--paper-soft)] hover:text-[var(--accent-strong)]"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="text-[0.7rem] opacity-75">{page.step}</span>
                        {page.title}
                      </span>
                      {isActive && <span className="h-1.5 w-1.5 rounded-full bg-white"></span>}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Identity Footer in Sidebar */}
          <div className="mt-8 border-t border-[var(--line)] pt-6">
            <div className="flex items-center justify-between">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
                ACTIVE IDENTITY
              </p>
              {!shouldHideDrawer && (
                <button
                  onClick={() => setShowIdentityModal(!showIdentityModal)}
                  className="text-[0.7rem] font-bold text-[var(--accent-strong)] hover:underline"
                >
                  Switch
                </button>
              )}
            </div>

            <div className="mt-3 rounded-lg border border-[var(--line-strong)] bg-[var(--paper-soft)] p-3.5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--ink-strong)]">
                  {activeParticipant.role.toUpperCase()} · {activeParticipant.verificationStatus.toUpperCase()}
                </p>
              </div>
              <p className="mt-1 text-sm font-semibold text-[var(--ink-strong)] truncate">{activeParticipant.name}</p>
              <p className="mt-0.5 text-[0.72rem] font-mono text-[var(--muted-strong)] truncate">
                {activeParticipant.walletAddress}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="border-b border-[var(--line)] bg-[var(--paper)] px-6 py-5 lg:px-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                {eyebrow}
              </p>
              <h2 className="text-xl font-bold tracking-[-0.03em] text-[var(--ink-strong)] lg:text-2xl">
                {title}
              </h2>
            </div>
            {!shouldHideDrawer && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowIdentityModal(!showIdentityModal)}
                  className="rounded-md border border-[var(--line-strong)] bg-[var(--paper-soft)] px-3.5 py-1.5 text-xs font-semibold text-[var(--ink-strong)] hover:bg-[var(--paper)] transition-colors"
                >
                  Role: <span className="font-bold text-[var(--accent-strong)]">{activeParticipant.name}</span>
                </button>
              </div>
            )}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted-strong)] max-w-3xl">
            {intro}
          </p>
        </header>

        {/* Identity Selector Modal / Drawer */}
        {!shouldHideDrawer && showIdentityModal && (
          <div className="border-b border-[var(--line-strong)] bg-[var(--paper-soft)] p-6 shadow-inner">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--ink-strong)]">
                  Select Demo Identity (Pre-registered on Monad Testnet)
                </h3>
                <button
                  onClick={() => setShowIdentityModal(false)}
                  className="text-xs font-bold text-[var(--muted)] hover:text-[var(--ink)]"
                >
                  ✕ Close
                </button>
              </div>
              <IdentityPanel
                activeParticipant={activeParticipant}
                availableParticipants={participants}
                availableRoles={[...shellRoles]}
                onSelectParticipant={(id) => {
                  setActiveParticipantId(id);
                  setShowIdentityModal(false);
                }}
              />
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-10 max-w-6xl w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

export function GatedStorySection({
  label,
  requiredRole,
  allowedRoles,
  children,
}: {
  label: string;
  requiredRole?: ParticipantRole;
  allowedRoles?: ParticipantRole[];
  children: React.ReactNode;
}) {
  const { activeParticipant } = useFlow();

  return (
    <AccessGate
      label={label}
      requiredRole={requiredRole}
      allowedRoles={allowedRoles}
      activeRole={activeParticipant.role}
      verificationStatus={activeParticipant.verificationStatus}
    >
      {children}
    </AccessGate>
  );
}
