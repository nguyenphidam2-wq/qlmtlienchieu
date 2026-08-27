interface BadgeProps {
  variant?: "default" | "success" | "warning" | "danger" | "purple";
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  const variants = {
    default: "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700",
    success: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60",
    warning: "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60",
    danger: "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60",
    purple: "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide transition-colors ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

// Status-specific badges for subjects
export function StatusBadge({ status }: { status: string }) {
  const statusVariants: Record<string, BadgeProps["variant"]> = {
    "Nghiện": "danger",
    "Sử dụng": "warning",
    "Sau cai": "success",
    "Khởi tố": "purple",
  };

  return <Badge variant={statusVariants[status] || "default"}>{status}</Badge>;
}

// Risk level badges for businesses
export function RiskBadge({ risk }: { risk: string }) {
  const riskVariants: Record<string, BadgeProps["variant"]> = {
    "Thấp": "success",
    "Trung bình": "warning",
    "Cao": "danger",
    "Rất cao": "danger",
  };

  return <Badge variant={riskVariants[risk] || "default"}>{risk}</Badge>;
}

// Subject type badges
export function SubjectTypeBadge({ type, value }: { type: "is_criminal" | "is_drug" | "is_economic"; value: number }) {
  if (!value) return null;

  const typeConfig = {
    is_criminal: { label: "HÌNH SỰ", variant: "danger" as const },
    is_drug: { label: "MA TÚY", variant: "warning" as const },
    is_economic: { label: "KINH TẾ", variant: "success" as const },
  };

  const config = typeConfig[type];
  return (
    <Badge variant={config.variant} className="text-xs">
      {config.label}
    </Badge>
  );
}