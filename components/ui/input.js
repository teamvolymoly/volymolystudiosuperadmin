function classes(...values) {
  return values.filter(Boolean).join(" ");
}

export function Input({ className = "", ...props }) {
  return <input className={classes("ui-input", className)} data-slot="input" {...props} />;
}
