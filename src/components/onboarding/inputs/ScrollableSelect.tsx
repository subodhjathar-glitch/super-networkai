import { useState, useMemo } from "react";
import { Check, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  multi?: boolean;
  allowOther?: boolean;
  otherValue?: string;
  onOtherChange?: (val: string) => void;
}

const ScrollableSelect = ({
  options,
  selected,
  onChange,
  placeholder = "Search...",
  multi = false,
  allowOther = true,
  otherValue = "",
  onOtherChange,
}: Props) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => options.filter((o) => o.toLowerCase().includes(search.toLowerCase())),
    [options, search]
  );

  const toggle = (val: string) => {
    if (multi) {
      onChange(
        selected.includes(val)
          ? selected.filter((s) => s !== val)
          : [...selected, val]
      );
    } else {
      onChange(selected.includes(val) ? [] : [val]);
    }
  };

  return (
    <div className="space-y-2">
      {/* Selected tags */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent/15 text-accent border border-accent/20"
            >
              {s}
              <X
                className="w-3 h-3 cursor-pointer hover:text-foreground"
                onClick={() => toggle(s)}
              />
            </span>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className="pl-9 h-10"
        />
      </div>

      {/* Options list */}
      <ScrollArea className="h-[180px] border border-border rounded-lg">
        <div className="p-1">
          {filtered.map((option) => {
            const isSelected = selected.includes(option);
            return (
              <button
                key={option}
                onClick={() => toggle(option)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-left transition-colors
                  ${isSelected ? "bg-accent/10 text-accent" : "text-foreground hover:bg-secondary"}`}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0
                  ${isSelected ? "bg-accent border-accent" : "border-muted-foreground/30"}`}>
                  {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
                {option}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No results found</p>
          )}
        </div>
      </ScrollArea>

      {/* Other */}
      {allowOther && (
        <div>
          <Input
            value={otherValue}
            onChange={(e) => onOtherChange?.(e.target.value)}
            placeholder="Other — describe yours"
            className="h-10"
          />
        </div>
      )}
    </div>
  );
};

export default ScrollableSelect;
