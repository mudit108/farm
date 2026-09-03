import {
  LayoutDashboard,
  Users,
  Video,
  Leaf,
  Bell,
  MapPin,
  ClipboardList,
  MessageCircle,
  Wheat,
} from "lucide-react";

export const adminNav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/registrations", label: "Plot Registrations", icon: ClipboardList },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/harvest", label: "Harvest Deliveries", icon: Wheat },
  { href: "/admin/whatsapp", label: "WhatsApp", icon: MessageCircle },
  { href: "/admin/cctv", label: "CCTV", icon: Video },
  { href: "/admin/crops", label: "Crops & Season", icon: Leaf },
  { href: "/admin/updates", label: "Farm Updates", icon: Bell },
  { href: "/admin/visits", label: "Visit Requests", icon: MapPin },
] as const;
