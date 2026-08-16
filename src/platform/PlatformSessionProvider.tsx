"use client";

import { createContext, useContext } from "react";
import { getPlatformSession, type PlatformSession } from "./session";

const PlatformSessionContext = createContext<PlatformSession | null>(null);

/**
 * Makes the server-resolved platform session (see `RootLayout` and
 * `src/platform/whop.ts`) available to client components. Mounted once, at
 * the root, around the whole app.
 */
export function PlatformSessionProvider({
  session,
  children,
}: {
  session: PlatformSession;
  children: React.ReactNode;
}) {
  return (
    <PlatformSessionContext.Provider value={session}>
      {children}
    </PlatformSessionContext.Provider>
  );
}

/**
 * The current platform session — server-verified against Whop when embedded
 * with a valid member token, the inert standalone session otherwise. Falls
 * back to client-only iframe detection if read outside the provider, which
 * shouldn't happen since `RootLayout` always mounts one.
 */
export function usePlatformSession(): PlatformSession {
  const context = useContext(PlatformSessionContext);
  return context ?? getPlatformSession();
}
