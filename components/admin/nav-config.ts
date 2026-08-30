import {
  LayoutDashboard,
  Sprout,
  Users,
  Video,
  Leaf,
  Bell,
  MapPin,
} from "lucide-react";

export const adminNav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/farms", label: "Farm & Plots", icon: Sprout },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/cctv", label: "CCTV", icon: Video },
  { href: "/admin/crops", label: "Crops", icon: Leaf },
  { href: "/admin/updates", label: "Farm Updates", icon: Bell },
  { href: "/admin/visits", label: "Visit Requests", icon: MapPin },
] as const;
