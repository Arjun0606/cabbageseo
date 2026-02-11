import { redirect } from "next/navigation";

/**
 * TEASER PAGE — Server component redirect
 * The teaser route now only serves shareable reports at /teaser/[id]
 */

export default async function TeaserPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const params = await searchParams;
  const domain = params.domain;

  if (!domain) {
    redirect("/");
  }

  redirect(`/?domain=${encodeURIComponent(domain)}`);
}
