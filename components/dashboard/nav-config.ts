import {
  LayoutDashboard,
  Sprout,
  Video,
  Activity,
  Bell,
  FileText,
  MapPin,
  CreditCard,
  User,
  LifeBuoy,
} from "lucide-react";

export const dashboardNav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/my-farm", label: "My Farm", icon: Sprout },
  { href: "/dashboard/live-camera", label: "Live Camera", icon: Video },
  { href: "/dashboard/crop-cycle", label: "Crop Cycle", icon: Activity },
  { href: "/dashboard/updates", label: "Farm Updates", icon: Bell },
  { href: "/dashboard/documents", label: "Documents", icon: FileText },
  { href: "/dashboard/farm-visit", label: "Farm Visit", icon: MapPin },
  { href: "/dashboard/membership", label: "Membership", icon: CreditCard },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/support", label: "Support", icon: LifeBuoy },
] as const;

// Primary items for the mobile bottom nav (max 5)
export const bottomNav = [
  dashboardNav[0],
  dashboardNav[1],
  dashboardNav[2],
  dashboardNav[4],
  dashboardNav[8],
];
