"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc" | null;

/** رأس عمود قابل للفرز — يُستخدم مع أي state خارجي من نمط `{ key, direction }`. */
export function SortableTableHead<Key extends string>({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
  align = "start",
  className,
}: {
  label: string;
  sortKey: Key;
  activeKey: Key | null;
  direction: SortDirection;
  onSort: (key: Key) => void;
  align?: "start" | "end";
  className?: string;
}) {
  const isActive = activeKey === sortKey;
  const Icon = isActive ? (direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <TableHead className={cn("text-xs whitespace-nowrap", align === "end" && "text-end", className)}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 outline-none hover:text-foreground focus-visible:text-foreground",
          isActive ? "text-foreground" : "text-muted-foreground",
          align === "end" && "flex-row-reverse",
        )}
      >
        {label}
        <Icon aria-hidden="true" className={cn("size-3.5", !isActive && "opacity-40")} />
      </button>
    </TableHead>
  );
}

/** يُبدّل الاتجاه دوريًا: asc → desc → بلا فرز، يُستخدم من onSort. */
export function nextSortState<Key extends string>(
  activeKey: Key | null,
  direction: SortDirection,
  key: Key,
): { key: Key | null; direction: SortDirection } {
  if (activeKey !== key) return { key, direction: "asc" };
  if (direction === "asc") return { key, direction: "desc" };
  return { key: null, direction: null };
}
