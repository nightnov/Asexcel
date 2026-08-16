import { User as UserIcon } from "lucide-react";

interface UserAvatarProps {
  avatarUrl?: string | null;
  size: number;
  className?: string;
}

/**
 * Shared avatar rendering used anywhere a user's identity shows up
 * (header menu, account page). Shows the uploaded photo when set, a
 * generic person icon otherwise, no name-initial letter.
 */
export default function UserAvatar({ avatarUrl, size, className = "" }: UserAvatarProps) {
  const style = { width: size, height: size };

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        style={style}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <span
      style={style}
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1E8E5A] to-[#166B44] text-white ${className}`}
    >
      <UserIcon style={{ width: size * 0.55, height: size * 0.55 }} strokeWidth={1.75} />
    </span>
  );
}
