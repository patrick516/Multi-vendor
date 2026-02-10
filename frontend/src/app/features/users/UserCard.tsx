// // src/app/features/users/UserCard.tsx
// import type { User } from "./userSlice";
// import { formatDate } from "../../utils/formatDate";

// interface UserCardProps {
//   user: User;
//   onDelete?: () => void;
// }

// export default function UserCard({ user, onDelete }: UserCardProps) {
//   const isVendor = user.role === "VENDOR";
//   const isActiveVendor = isVendor && user.subscriptionActive !== false;

//   return (
//     <div className="flex flex-col gap-2 p-4 border rounded-lg shadow-sm border-border bg-card">
//       <div className="flex items-center justify-between">
//         <h3 className="text-sm font-semibold">{user.name || user.email}</h3>
//         <span className="text-[10px] px-2 py-1 rounded-full bg-accent text-accent-foreground uppercase">
//           {user.role}
//         </span>
//       </div>
//       <p className="text-xs text-muted-foreground">{user.email}</p>
//       {user.createdAt && (
//         <p className="text-[11px] text-muted-foreground">
//           Joined: {formatDate(user.createdAt)}
//         </p>
//       )}

//       {isVendor && (
//         <p className="text-[11px]">
//           <span
//             className={[
//               "inline-flex items-center rounded-full px-2 py-[2px] text-[10px] font-medium",
//               isActiveVendor
//                 ? "bg-emerald-50 text-emerald-700"
//                 : "bg-red-50 text-red-700",
//             ].join(" ")}
//           >
//             {isActiveVendor ? "Subscription active" : "Blocked / inactive"}
//           </span>
//         </p>
//       )}

//       {onDelete && (
//         <div className="flex justify-end mt-2">
//           <button
//             type="button"
//             onClick={onDelete}
//             className="px-2 py-1 rounded-md bg-red-600 text-white text-[11px] hover:bg-red-700"
//           >
//             Delete user
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }
