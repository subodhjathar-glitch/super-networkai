import ChipSelector from "./ChipSelector";
import { Textarea } from "@/components/ui/textarea";

interface ChipOption {
  value: string;
  label: string;
}

interface Props {
  question: string;
  options: ChipOption[];
  selected: string | string[];
  onChange: (selected: string | string[]) => void;
  multi?: boolean;
  allowOther?: boolean;
  otherValue?: string;
  onOtherChange?: (val: string) => void;
  detailPrompt?: string;
  detailValue?: string;
  onDetailChange?: (val: string) => void;
}

const HybridInput = ({
  question,
  options,
  selected,
  onChange,
  multi = false,
  allowOther = true,
  otherValue = "",
  onOtherChange,
  detailPrompt,
  detailValue = "",
  onDetailChange,
}: Props) => {
  const hasSelection = Array.isArray(selected) ? selected.length > 0 : !!selected;

  return (
    <div className="space-y-4">
      <p className="text-lg font-medium text-foreground leading-relaxed">{question}</p>
      
      <ChipSelector
        options={options}
        selected={selected}
        onChange={onChange}
        multi={multi}
        allowOther={allowOther}
        otherValue={otherValue}
        onOtherChange={onOtherChange}
      />

      {/* Optional detail / AI follow-up */}
      {detailPrompt && hasSelection && (
        <div className="pt-2">
          <p className="text-sm text-muted-foreground mb-2">{detailPrompt}</p>
          <Textarea
            value={detailValue}
            onChange={(e) => onDetailChange?.(e.target.value)}
            placeholder="Optional — takes 10 seconds"
            className="min-h-[80px] resize-none"
          />
        </div>
      )}
    </div>
  );
};

export default HybridInput;
