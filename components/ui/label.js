function classes(...values) {
  return values.filter(Boolean).join(" ");
}

export function Label({ className = "", ...props }) {
  return <label className={classes("ui-label", className)} data-slot="label" {...props} />;
}
