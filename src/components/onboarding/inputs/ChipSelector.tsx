import { useState } from "react";
import { Input } from "@/components/ui/input";

interface ChipOption {
  value: string;
  label: string;
}

interface Props {
  options: ChipOption[];
  selected: string | string[];
  onChange: (selected: string | string[]) => void;
  multi?: boolean;
  allowOther?: boolean;
  otherValue?: string;
  onOtherChange?: (val: string) => void;
}

const ChipSelector = ({
  options,
  selected,
  onChange,
  multi = false,
  allowOther = false,
  otherValue = "",
  onOtherChange,
}: Props) => {
  const selectedArr = Array.isArray(selected) ? selected : selected ? [selected] : [];

  const toggle = (val: string) => {
    if (multi) {
      const next = selectedArr.includes(val)
        ? selectedArr.filter((s) => s !== val)
        : [...selectedArr, val];
      onChange(next);
    } else {
      onChange(selectedArr.includes(val) ? "" : val);
    }
  };

  const isOtherSelected = selectedArr.includes("other");

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2">
        {options.map((opt) => {
          const active = selectedArr.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-all border text-left leading-relaxed
                ${active
                  ? "bg-accent/15 border-accent/40 text-accent shadow-sm"
                  : "bg-card border-border text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
                }`}
            >
              {opt.label}
            </button>
          );
        })}
        {allowOther && (
          <button
            onClick={() => toggle("other")}
            className={`px-4 py-3 rounded-xl text-sm font-medium transition-all border text-left leading-relaxed
              ${isOtherSelected
                ? "bg-accent/15 border-accent/40 text-accent shadow-sm"
                : "bg-card border-border text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
              }`}
          >
            Other
          </button>
        )}
      </div>

      {allowOther && isOtherSelected && (
        <Input
          value={otherValue}
          onChange={(e) => onOtherChange?.(e.target.value)}
          placeholder="Tell us more..."
          className="h-10"
          autoFocus
        />
      )}
    </div>
  );
};

export default ChipSelector;
