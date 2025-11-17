// src/app/components/layout/TopBar.tsx
interface UserInfo {
  name: string;
  email: string;
  role: string;
}

interface TopBarProps {
  currentPath: string;
  user: UserInfo;
}

function pageTitle(path: string): string {
  if (path.startsWith("/products")) return "Products";
  if (path.startsWith("/orders")) return "Orders";
  if (path.startsWith("/users")) return "Users";
  if (path.startsWith("/commissions")) return "Commissions";
  return "Admin Dashboard";
}

export function TopBar({ currentPath, user }: TopBarProps) {
  return (
    <header className="w-full border-b border-border bg-card px-4 py-3 flex items-center justify-between">
      <h2 className="font-semibold text-base md:text-lg">
        {pageTitle(currentPath)}
      </h2>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col items-end leading-tight text-xs">
          <span className="font-medium text-foreground">{user.name}</span>
          <span className="text-muted-foreground">{user.role}</span>
        </div>
        <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
          {user.name.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
