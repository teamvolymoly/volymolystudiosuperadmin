function classes(...values) {
  return values.filter(Boolean).join(" ");
}

export function Button({
  as: Component = "button",
  className = "",
  variant = "default",
  ...props
}) {
  return (
    <Component
      className={classes("ui-button", `ui-button-${variant}`, className)}
      data-slot="button"
      {...props}
    />
  );
}
