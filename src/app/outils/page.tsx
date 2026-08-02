import { redirect } from "next/navigation";

/**
 * The tools dashboard was merged into the homepage's "Outils" section.
 * This route is kept (rather than deleted) so old links/bookmarks to
 * /outils still resolve, instead of 404ing.
 */
export default function ToolsIndexRedirect() {
  redirect("/");
}
