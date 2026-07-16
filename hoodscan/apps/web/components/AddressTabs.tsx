import Link from "next/link";

export type AddressTabId =
  | "transactions"
  | "internal"
  | "token-erc20"
  | "other"
  | "analytics"
  | "assets"
  | "cards";

/** Base Arbiscan-style address tabs (no EIP-7702 — only when we have that data later). */
export const ADDRESS_TABS: {
  id: AddressTabId;
  label: string;
  /** Real data available in hoodscan today */
  available: boolean;
}[] = [
  { id: "transactions", label: "Transactions", available: true },
  { id: "internal", label: "Internal Transactions", available: false },
  { id: "token-erc20", label: "Token Transfers (ERC-20)", available: false },
  { id: "other", label: "Other Transactions", available: false },
  { id: "analytics", label: "Analytics", available: false },
  { id: "assets", label: "Assets", available: false },
  { id: "cards", label: "Cards", available: false },
];

export function parseAddressTab(raw: string | undefined): AddressTabId {
  const id = (raw ?? "transactions") as AddressTabId;
  return ADDRESS_TABS.some((t) => t.id === id) ? id : "transactions";
}

export function AddressTabs({
  address,
  active,
}: {
  address: string;
  active: AddressTabId;
}) {
  return (
    <div className="overflow-x-auto border-b border-border">
      <nav className="flex min-w-max gap-0" aria-label="Address activity">
        {ADDRESS_TABS.map((tab) => {
          const isActive = tab.id === active;
          const href =
            tab.id === "transactions"
              ? `/address/${address}`
              : `/address/${address}?tab=${tab.id}`;

          return (
            <Link
              key={tab.id}
              href={href}
              className={`relative px-3.5 py-2.5 text-sm font-medium transition sm:px-4 ${
                isActive
                  ? "text-ink"
                  : "text-muted hover:text-ink"
              }`}
            >
              {tab.label}
              {!tab.available && (
                <span className="ml-1 text-[10px] font-normal text-muted/70">·</span>
              )}
              {isActive && (
                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-lime-bright" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
