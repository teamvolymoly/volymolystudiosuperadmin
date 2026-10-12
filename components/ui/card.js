function classes(...values) {
  return values.filter(Boolean).join(" ");
}

export function Card({ as: Component = "div", className = "", size = "default", ...props }) {
  return (
    <Component
      className={classes("ui-card", className)}
      data-size={size}
      data-slot="card"
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }) {
  return <div className={classes("ui-card-header", className)} data-slot="card-header" {...props} />;
}

export function CardTitle({ as: Component = "h3", className = "", ...props }) {
  return <Component className={classes("ui-card-title", className)} data-slot="card-title" {...props} />;
}

export function CardDescription({ className = "", ...props }) {
  return <p className={classes("ui-card-description", className)} data-slot="card-description" {...props} />;
}

export function CardAction({ className = "", ...props }) {
  return <div className={classes("ui-card-action", className)} data-slot="card-action" {...props} />;
}

export function CardContent({ className = "", ...props }) {
  return <div className={classes("ui-card-content", className)} data-slot="card-content" {...props} />;
}

export function CardFooter({ className = "", ...props }) {
  return <div className={classes("ui-card-footer", className)} data-slot="card-footer" {...props} />;
}
