import {
  LayoutDashboard,
  Users,
  Video,
  Leaf,
  MapPin,
  MessageCircle,
  IndianRupee,
  PieChart,
  type LucideIcon,
} from "lucide-react";

type AdminNavItem = { href: string; label: string; icon: LucideIcon };

/** Sidebar groups. A null label renders the items without a heading. */
export const adminNavGroups: { label: string | null; items: AdminNavItem[] }[] = [
  { label: null, items: [{ href: "/admin", label: "Overview", icon: LayoutDashboard }] },
  {
    label: "Money",
    items: [
      { href: "/admin/income", label: "Finance", icon: IndianRupee },
      { href: "/admin/budget", label: "Budget", icon: PieChart },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/members", label: "Members", icon: Users },
      { href: "/admin/communications", label: "Communications", icon: MessageCircle },
      { href: "/admin/visits", label: "Visit Requests", icon: MapPin },
    ],
  },
  {
    label: "Farm",
    items: [
      { href: "/admin/crops", label: "Crops & Season", icon: Leaf },
      { href: "/admin/cctv", label: "CCTV", icon: Video },
    ],
  },
];

export const adminNav: AdminNavItem[] = adminNavGroups.flatMap((g) => g.items);
