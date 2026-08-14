import {
  Heart, Sprout, ShoppingCart, HardHat, GraduationCap, Film, Package,
  Monitor, Factory, Briefcase, Plane, Truck, DollarSign, Target, Megaphone,
  Scale, Network, Users, TrendingUp, BarChart3, type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Heart, Sprout, ShoppingCart, HardHat, GraduationCap, Film, Package,
  Monitor, Factory, Briefcase, Plane, Truck, DollarSign, Target, Megaphone,
  Scale, Network, Users, TrendingUp, BarChart3,
};

export function getIcon(name?: string, fallback: LucideIcon = Briefcase): LucideIcon {
  if (!name) return fallback;
  return ICON_MAP[name] || fallback;
}
