import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Renders a form field label. If `label` ends with " *", the asterisk is split
 * out and rendered in the destructive color so required-field markers look
 * identical everywhere in the app.
 */
export function FieldLabel({
  label,
  required,
  className,
  htmlFor,
}: {
  label: string;
  required?: boolean;
  className?: string;
  htmlFor?: string;
}) {
  let text = label;
  // Healthcare policy: every form field is mandatory unless explicitly opted out
  // by passing `required={false}`.
  let isRequired = required ?? true;
  if (text.endsWith(" *")) {
    text = text.slice(0, -2);
    isRequired = true;
  } else if (text.endsWith("*")) {
    text = text.slice(0, -1);
    isRequired = true;
  }
  return (
    <Label htmlFor={htmlFor} className={cn(className)}>
      {text}
      {isRequired && (
        <span aria-hidden="true" className="text-destructive ml-0.5">
          *
        </span>
      )}
      {isRequired && <span className="sr-only"> (required)</span>}
    </Label>
  );
}