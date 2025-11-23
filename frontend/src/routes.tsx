// frontend/src/routes.tsx
import AdminDashboard from "./app/components/dashboard/AdminDashboard";
import OrderList from "./app/features/orders/OrderList";
import ProductList from "@/app/features/products/ProductList";
import UserList from "@/app/features/users/UserList";
import CommissionPage from "@/app/features/commissions/CommissionPage";
import SubscriptionPage from "@/app/features/subscriptions/SubscriptionPage"; // 👈 NEW

export type AppRole = "SUPER_ADMIN" | "VENDOR" | "CUSTOMER";

export interface AppRoute {
  path: string;
  label: string;
  component: React.ComponentType<any>;
  roles?: AppRole[]; // optional: which roles can see this in the sidebar
}

export const routes: AppRoute[] = [
  {
    path: "/dashboard",
    label: "Dashboard",
    component: AdminDashboard,
    roles: ["SUPER_ADMIN", "VENDOR", "CUSTOMER"],
  },
  {
    path: "/products",
    label: "Products",
    component: ProductList,
    roles: ["SUPER_ADMIN", "VENDOR"],
  },
  {
    path: "/orders",
    label: "Orders",
    component: OrderList,
    roles: ["SUPER_ADMIN", "VENDOR"],
  },
  {
    path: "/users",
    label: "Users",
    component: UserList,
    roles: ["SUPER_ADMIN"], // admin only
  },
  {
    path: "/commissions",
    label: "Commissions",
    component: CommissionPage,
    roles: ["SUPER_ADMIN"], // admin only
  },
  {
    path: "/subscriptions",
    label: "Subscriptions",
    component: SubscriptionPage, // 👈 NEW
    roles: ["SUPER_ADMIN"], // admin only
  },
];
