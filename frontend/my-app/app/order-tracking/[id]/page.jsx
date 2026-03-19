export default function OrderTrackingPage({ params }) {
  const orderId = params?.id || "";
  return (
    <div className="page-shell">
      <h1>Order Tracking</h1>
      <p>Order tracking details will appear here soon.</p>
      {orderId ? <p>Order ID: {orderId}</p> : null}
    </div>
  );
}
