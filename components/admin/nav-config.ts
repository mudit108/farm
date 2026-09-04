import {
  LayoutDashboard,
  Users,
  Video,
  Leaf,
  MapPin,
  MessageCircle,
} from "lucide-react";

export const adminNav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/communications", label: "Communications", icon: MessageCircle },
  { href: "/admin/cctv", label: "CCTV", icon: Video },
  { href: "/admin/crops", label: "Crops & Season", icon: Leaf },
  { href: "/admin/visits", label: "Visit Requests", icon: MapPin },
] as const;
