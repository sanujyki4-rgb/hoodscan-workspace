/**
 * Deterministic color avatar for an address — same address always
 * produces the same color, so users can visually recognize repeat
 * addresses at a glance while scanning a table (a pattern borrowed
 * from Etherscan/Blockscout's "blockie" icons, simplified to a
 * gradient chip since we don't need a full identicon library here).
 */
function hueFromAddress(address: string): number {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = (hash << 5) - hash + address.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 360;
}

export function AddressChip({ address, size = 18 }: { address: string; size?: number }) {
  const hue = hueFromAddress(address.toLowerCase());

  return (
    <span
      className="inline-block shrink-0 rounded-full ring-1 ring-black/10"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, hsl(${hue} 85% 60%), hsl(${(hue + 40) % 360} 85% 45%))`,
      }}
    />
  );
}
