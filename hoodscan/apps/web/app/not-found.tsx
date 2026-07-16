import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="font-mono text-sm text-muted">404</p>
      <h1 className="font-display text-xl font-bold">Nothing here</h1>
      <p className="max-w-sm text-sm text-muted">
        That block, transaction, or address hasn&apos;t been indexed yet — or
        doesn&apos;t exist.
      </p>
      <Link href="/" className="text-sm text-lime hover:underline">
        Back to latest blocks
      </Link>
    </div>
  );
}
