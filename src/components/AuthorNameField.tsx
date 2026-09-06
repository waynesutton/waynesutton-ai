import { useId, useState } from "react";
import { filterAuthorSuggestions, type AuthorSuggestion } from "../utils/authorSuggestions";

// Editable credit with keyboard navigation; choosing history never restricts a new name.
export function AuthorNameField({ value, authors, onChange, onSelect }: {
  value: string;
  authors: readonly AuthorSuggestion[];
  onChange: (value: string) => void;
  onSelect: (author: AuthorSuggestion) => void;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const matches = filterAuthorSuggestions(authors, value);
  const expanded = open && matches.length > 0;
  const choose = (author: AuthorSuggestion) => {
    onSelect(author);
    setOpen(false);
    setActive(-1);
  };
  return (
    <div className="fmf-field fmf-author-field">
      <label className="fmf-label" htmlFor={id}>Author name</label>
      <span className="fmf-hint" id={`${id}-hint`}>Type a name or @ to find past authors. New names work too.</span>
      <input
        id={id}
        className="fmf-input"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={expanded ? `${id}-options` : undefined}
        aria-activedescendant={expanded && active >= 0 && active < matches.length ? `${id}-option-${active}` : undefined}
        aria-describedby={`${id}-hint`}
        value={value}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onChange={(event) => { onChange(event.target.value); setActive(-1); setOpen(true); }}
        onKeyDown={(event) => {
          if (event.key === "Escape") { event.stopPropagation(); setOpen(false); setActive(-1); }
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            if (!matches.length) return;
            event.preventDefault();
            setOpen(true);
            setActive((index) => event.key === "ArrowDown"
              ? (index + 1) % matches.length
              : (index <= 0 ? matches.length - 1 : index - 1));
          }
          if (event.key === "Enter" && expanded && active >= 0 && matches[active]) {
            event.preventDefault(); choose(matches[active]);
          }
        }}
      />
      {expanded && (
        <ul id={`${id}-options`} className="fmf-author-options" role="listbox" aria-label="Past authors">
          {matches.map((author, index) => (
            <li
              key={author.name}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={index === active}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => choose(author)}>
              <span>{author.name}</span>
              {author.image && <span className="fmf-hint">Saved avatar</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
