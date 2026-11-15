"use client";

import { Children, isValidElement, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";

type Option = { value: string; label: string; disabled?: boolean };

function readOptions(children: ReactNode): Option[] {
  const out: Option[] = [];
  Children.toArray(children).forEach((node) => {
    if (!isValidElement(node) || node.type !== "option") return;
    const props = node.props as { value?: string | number; children?: ReactNode; disabled?: boolean };
    const label = Children.toArray(props.children).join("");
    out.push({ value: String(props.value ?? label), label, disabled: props.disabled });
  });
  return out;
}

export type DropdownProps = {
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
  children: ReactNode;
  className?: string;
  buttonClassName?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  /** Larger rounded style used in the customer forms. */
  tall?: boolean;
  /** Shows a search box at the top of the list to filter long lists. */
  searchable?: boolean;
  searchPlaceholder?: string;
  "aria-label"?: string;
};

/** Themed replacement for a native <select>. Takes <option> children and an onChange that receives event.target.value. */
export function Dropdown({ value, defaultValue, onChange, children, className = "", buttonClassName = "", name, required, disabled, placeholder = "Select", tall = false, searchable = false, searchPlaceholder = "Search…", ...rest }: DropdownProps) {
  const options = useMemo(() => readOptions(children), [children]);
  const [inner, setInner] = useState(String(defaultValue ?? ""));
  const current = value !== undefined ? String(value) : inner;
  const selected = options.find((option) => option.value === current);
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [active, setActive] = useState(-1);
  const [box, setBox] = useState<{ left: number; top?: number; bottom?: number; width: number; maxH: number } | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const items = useRef<HTMLUListElement>(null);
  const search = useRef<HTMLInputElement>(null);

  // options that match the search text (the empty placeholder option is hidden while searching)
  const visible = useMemo(() => {
    const text = term.trim().toLowerCase();
    if (!text) return options;
    return options.filter((option) => option.value !== "" && option.label.toLowerCase().includes(text));
  }, [options, term]);

  const place = useCallback(() => {
    const el = trigger.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const extra = searchable ? 52 : 0;
    const below = window.innerHeight - rect.bottom - 12;
    const above = rect.top - 12;
    const wanted = Math.min(300, options.length * 36 + 12 + extra);
    const up = below < Math.min(wanted, 180) && above > below;
    const width = Math.max(rect.width, 180);
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
    setBox(up ? { left, bottom: window.innerHeight - rect.top + 6, width, maxH: Math.min(320, above) } : { left, top: rect.bottom + 6, width, maxH: Math.min(320, below) });
  }, [options.length, searchable]);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (trigger.current?.contains(target) || panel.current?.contains(target)) return;
      setOpen(false);
    };
    const onScroll = (event: Event) => {
      if (panel.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, place]);

  // when opening: clear the search, highlight the selected row, and focus the search box if there is one
  useEffect(() => {
    if (!open) return;
    setTerm("");
    const index = options.findIndex((option) => option.value === current);
    setActive(Math.max(0, index));
    if (searchable) setTimeout(() => search.current?.focus(), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // while typing in the search box, highlight the first match
  useEffect(() => {
    if (open && term) setActive(0);
  }, [term, open]);

  useEffect(() => {
    if (open && active >= 0) items.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function choose(option: Option) {
    if (option.disabled) return;
    setInner(option.value);
    setOpen(false);
    onChange?.({ target: { value: option.value, name }, currentTarget: { value: option.value, name } } as unknown as ChangeEvent<HTMLSelectElement>);
    trigger.current?.focus();
  }

  function onKey(event: KeyboardEvent, fromSearch = false) {
    if (disabled) return;
    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      trigger.current?.focus();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(visible.length - 1, index + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(0, index - 1));
    } else if (event.key === "Enter" || (event.key === " " && !fromSearch)) {
      event.preventDefault();
      if (visible[active]) choose(visible[active]);
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={current} />}
      {required && <input tabIndex={-1} aria-hidden required value={current} onChange={() => {}} className="pointer-events-none absolute inset-0 h-full w-full opacity-0" />}
      <button
        ref={trigger}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={rest["aria-label"]}
        onClick={() => setOpen((state) => !state)}
        onKeyDown={(event) => onKey(event)}
        className={`flex w-full items-center justify-between gap-2 border text-left outline-none ${tall ? "min-h-[46px] rounded-xl bg-background px-3 py-2.5 text-sm" : "h-9 rounded-lg bg-surface px-3 text-[13.5px] text-inkstone"} transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          open ? "border-harbor-600 shadow-[0_0_0_3px_rgba(79,70,229,0.18)]" : "border-harbor-200 hover:border-harbor-300 focus-visible:border-harbor-600"
        } ${buttonClassName}`}
      >
        <span className={`truncate ${selected && selected.value !== "" ? "" : "text-inkmute"}`}>{selected && selected.value !== "" ? selected.label : placeholder}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-inkmute transition-transform duration-200 ${open ? "rotate-180 text-brand" : ""}`} />
      </button>
      {open && box && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panel}
            style={{ position: "fixed", left: box.left, top: box.top, bottom: box.bottom, width: box.width, maxHeight: box.maxH }}
            className="z-[70] flex flex-col overflow-hidden rounded-xl border border-harbor-200 bg-surface shadow-[0_18px_40px_-14px_rgba(30,27,75,0.45)]"
          >
            {searchable && (
              <div className="relative shrink-0 border-b border-harbor-100 p-2">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-inkmute" />
                <input
                  ref={search}
                  value={term}
                  onChange={(event) => setTerm(event.target.value)}
                  onKeyDown={(event) => onKey(event, true)}
                  placeholder={searchPlaceholder}
                  autoComplete="off"
                  className="h-9 w-full rounded-lg border border-harbor-200 bg-surface pl-9 pr-3 text-[13.5px] text-inkstone outline-none placeholder:text-inkmute focus:border-harbor-600"
                />
              </div>
            )}
            <ul ref={items} role="listbox" className="admin-scroll min-h-0 flex-1 overflow-y-auto p-1.5">
              {visible.map((option, index) => {
                const isSelected = option.value === current;
                return (
                  <li
                    key={`${option.value}-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={option.disabled}
                    onMouseEnter={() => setActive(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => choose(option)}
                    className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-[13px] ${
                      option.disabled ? "cursor-not-allowed opacity-40" : isSelected ? "bg-harbor-100 font-semibold text-brand" : index === active ? "bg-harbor-50 text-brand" : "text-inkstone"
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && <Check className="h-4 w-4 shrink-0" />}
                  </li>
                );
              })}
              {visible.length === 0 && <li className="px-3 py-3 text-center text-[13px] text-inkmute">No matches for “{term}”</li>}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  );
}
