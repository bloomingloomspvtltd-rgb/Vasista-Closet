export default function AdminTopbar({ title, subtitle, actionLabel, onAction }) {
  return (
    <div className="admin-topbar">
      <div>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actionLabel ? (
        <button className="admin-action" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
