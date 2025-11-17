// src/app/features/users/UserCard.tsx
import type { User } from "./userSlice";
import { formatDate } from "../../utils/formatDate";

interface UserCardProps {
  user: User;
}

export default function UserCard({ user }: UserCardProps) {
  return (
    <div className="border border-border bg-card rounded-lg p-4 flex flex-col gap-2 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">{user.name || user.email}</h3>
        <span className="text-[10px] px-2 py-1 rounded-full bg-accent text-accent-foreground uppercase">
          {user.role}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{user.email}</p>
      {user.createdAt && (
        <p className="text-[11px] text-muted-foreground">
          Joined: {formatDate(user.createdAt)}
        </p>
      )}
    </div>
  );
}
