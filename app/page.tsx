import { redirect } from "next/navigation";

export default function Home() {
  // trailingSlash: true (next.config.ts) exports /overview/index.html on
  // disk, but redirect() targets are used verbatim - they aren't run
  // through Next's trailing-slash normalization the way next/link hrefs
  // are - so the trailing slash must be explicit here to avoid the client
  // router navigating to a path that doesn't exist in the static export.
  redirect("/overview/");
}
