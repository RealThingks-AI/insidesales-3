
import { Home, Users, DollarSign, Calendar, Settings, UserPlus } from "lucide-react";

export const navItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Leads",
    url: "/leads",
    icon: UserPlus,
  },
  {
    title: "Contacts",
    url: "/contacts",
    icon: Users,
  },
  {
    title: "Deals",
    url: "/deals",
    icon: DollarSign,
  },
  // Meetings module is hidden as requested
  // {
  //   title: "Meetings",
  //   url: "/meetings", 
  //   icon: Calendar,
  // },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];
