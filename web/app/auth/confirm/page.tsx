import type { Metadata } from "next";
import { ConfirmClient } from "./ConfirmClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Confirm sign in - Prompt Goblin",
  robots: {
    index: false,
    follow: false,
  },
};

type AuthConfirmPageProps = {
  searchParams: Promise<{
    token_hash?: string | string[];
    type?: string | string[];
  }>;
};

function firstParam(value: string | string[] | undefined): string | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default async function AuthConfirmPage({
  searchParams,
}: AuthConfirmPageProps) {
  const params = await searchParams;
  return (
    <ConfirmClient
      tokenHash={firstParam(params.token_hash)}
      type={firstParam(params.type)}
    />
  );
}
