import { useState, useMemo } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Props {
  suggestions: string[];
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

const TagInput = ({
  suggestions,
  tags,
  onChange,
  placeholder = "Type to search or add...",
  maxTags = 10,
}: Props) => {
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);

  const filtered = useMemo(
    () =>
      input.trim()
        ? suggestions
            .filter(
              (s) =>
                s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s)
            )
            .slice(0, 6)
        : [],
    [suggestions, input, tags]
  );

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed) && tags.length < maxTags) {
      onChange([...tags, trimmed]);
      setInput("");
    }
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="space-y-2">
      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent/15 text-accent border border-accent/20"
            >
              {tag}
              <X
                className="w-3 h-3 cursor-pointer hover:text-foreground"
                onClick={() => removeTag(tag)}
              />
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={tags.length >= maxTags ? `Max ${maxTags} tags` : placeholder}
          disabled={tags.length >= maxTags}
          className="h-10"
        />

        {/* Suggestions dropdown */}
        {focused && filtered.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-10 mt-1 border border-border rounded-lg bg-card shadow-lg overflow-hidden">
            {filtered.map((s) => (
              <button
                key={s}
                onMouseDown={(e) => {
                  e.preventDefault();
                  addTag(s);
                }}
                className="w-full px-3 py-2 text-sm text-left text-foreground hover:bg-secondary transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {input.trim() && !suggestions.includes(input.trim()) && (
        <p className="text-xs text-muted-foreground">
          Press Enter to add "{input.trim()}" as a custom tag
        </p>
      )}
    </div>
  );
};

export default TagInput;
