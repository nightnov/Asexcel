import type { SVGProps } from "react";

/**
 * Minimal hand-authored stroke icon set (24x24, currentColor) — kept
 * dependency-free rather than pulling an icon library, since the set needed
 * here is small and fixed.
 */
function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  );
}

export function ChatSparkleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      <path d="M13 8.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6.6-1.4z" />
    </Icon>
  );
}

export function WandIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4 20l9-9" />
      <path d="M15.5 3.5l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" />
      <path d="M19 9l.6 1.4L21 11l-1.4.6-.6 1.4-.6-1.4L17 11l1.4-.6.6-1.4z" />
      <path d="M9 20l2-2" />
    </Icon>
  );
}

export function MergeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M6 3v7a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V3" />
      <path d="M6 3v6M18 3v6" />
      <path d="M12 13v8" />
      <path d="M9 18l3 3 3-3" />
    </Icon>
  );
}

export function CompareIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3" y="4" width="8" height="16" rx="1.5" />
      <rect x="13" y="4" width="8" height="16" rx="1.5" />
      <path d="M7 9h0M7 13h0" />
      <path d="M17 9h0M17 13h0" />
    </Icon>
  );
}

export function ConvertIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4 7h13l-3-3" />
      <path d="M20 17H7l3 3" />
    </Icon>
  );
}

export function TranslateIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M3 6h9" />
      <path d="M7.5 4v2.5C7.5 10 5.5 12.5 3 13.5" />
      <path d="M5 10c1.5 1.6 3.6 2.5 6 2.5" />
      <path d="M14 21l4-9 4 9" />
      <path d="M15.3 18h5.4" />
    </Icon>
  );
}

export function BroomIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M19 5l-8.5 8.5" />
      <path d="M14 4l2 2M17 7l2 2" />
      <path d="M10.5 13.5L4 20l1-4.5L9 12z" />
      <path d="M5 21l2-2" />
    </Icon>
  );
}

export function FolderIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
    </Icon>
  );
}

export function SparklesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 4l1.4 3.6L17 9l-3.6 1.4L12 14l-1.4-3.6L7 9l3.6-1.4L12 4z" />
      <path d="M19 15l.7 1.8L21.5 17.5l-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7L19 15z" />
    </Icon>
  );
}

export function ShieldIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </Icon>
  );
}

export function LockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="4" y="10.5" width="16" height="9.5" rx="1.5" />
      <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" />
      <path d="M12 14.5v2.5" />
    </Icon>
  );
}

export function ArrowRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </Icon>
  );
}

export function SupportIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.3 9.3a2.7 2.7 0 1 1 3.9 2.4c-.8.4-1.2.9-1.2 1.8v.3" />
      <path d="M12 17h0" />
    </Icon>
  );
}
