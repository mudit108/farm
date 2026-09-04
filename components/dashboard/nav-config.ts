import { LayoutDashboard, Sprout, ClipboardCheck, Activity, User, LifeBuoy } from "lucide-react";

export const dashboardNavGroups = [
  {
    label: "Farm",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/dashboard/my-farm", label: "My Farm", icon: Sprout },
      { href: "/dashboard/select-plot", label: "Select Plan", icon: ClipboardCheck },
      { href: "/dashboard/crop-cycle", label: "Farm Activity", icon: Activity },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/dashboard/account", label: "Account", icon: User },
      { href: "/dashboard/farm-visit", label: "Help", icon: LifeBuoy },
    ],
  },
];

// Flat list — for the mobile bottom bar, which shows all 6 directly now
// that the count is small enough to fit (no "More" overflow needed).
// Defined separately from dashboardNavGroups (rather than derived via
// flatMap) — TypeScript's inference over flatMap on differently-shaped
// readonly tuples doesn't flatten to a clean union type.
export const dashboardNav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/my-farm", label: "My Farm", icon: Sprout },
  { href: "/dashboard/select-plot", label: "Select Plan", icon: ClipboardCheck },
  { href: "/dashboard/crop-cycle", label: "Farm Activity", icon: Activity },
  { href: "/dashboard/account", label: "Account", icon: User },
  { href: "/dashboard/farm-visit", label: "Help", icon: LifeBuoy },
];
