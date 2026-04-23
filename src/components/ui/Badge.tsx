interface BadgeProps {
  variant?: "default" | "success" | "warning" | "danger" | "purple";
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  const variants = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
    purple: "bg-purple-100 text-purple-800",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
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