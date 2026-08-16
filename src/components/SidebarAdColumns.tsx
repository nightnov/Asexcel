import AdBanner from "./AdBanner";

/**
 * Fills the empty left/right margins around the centered page content with
 * ad slots, on viewports wide enough that they never overlap the content
 * (the content column plus two 300px sidebar slots needs roughly 1800px).
 * Renders nothing on narrower screens, and nothing at all for Pro accounts
 * since AdBanner already hides itself for them.
 */
export default function SidebarAdColumns() {
  return (
    <>
      <div className="fixed left-6 top-1/2 hidden -translate-y-1/2 min-[1800px]:block">
        <AdBanner slot="sidebar" />
      </div>
      <div className="fixed right-6 top-1/2 hidden -translate-y-1/2 min-[1800px]:block">
        <AdBanner slot="sidebar" />
      </div>
    </>
  );
}
