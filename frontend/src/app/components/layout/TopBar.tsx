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
    <header className="relative flex items-center justify-between p-2 mx-4 mt-1 border-b rounded-sm bg-brand-blue border-border">
      <h2 className="absolute text-base font-semibold transform -translate-x-1/2 left-1/2 md:text-lg">
        {pageTitle(currentPath)}
      </h2>

      <div className="flex items-center gap-3 ml-auto">
        <div className="flex-col items-end hidden text-xs leading-tight sm:flex">
          <span className="font-medium text-foreground">{user.name}</span>
          <span className="text-muted-foreground">{user.role}</span>
        </div>
        <div className="flex items-center justify-center text-xs font-bold rounded-full h-9 w-9 bg-primary text-primary-foreground">
          {user.name.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
