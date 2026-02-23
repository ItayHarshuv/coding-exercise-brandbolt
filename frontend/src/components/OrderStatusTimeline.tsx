import { OrderStatus } from "../types";

const STATUS_FLOW: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
];

type OrderStatusTimelineProps = {
  currentStatus: OrderStatus;
};

export default function OrderStatusTimeline({
  currentStatus,
}: OrderStatusTimelineProps) {
  const timelineProgress = (status: OrderStatus) => {
    const currentIndex = STATUS_FLOW.indexOf(currentStatus);
    const itemIndex = STATUS_FLOW.indexOf(status);
    if (status === currentStatus) return "current";
    if (itemIndex <= currentIndex && currentStatus !== OrderStatus.CANCELLED)
      return "passed";
    if (
      status === OrderStatus.CANCELLED &&
      currentStatus === OrderStatus.CANCELLED
    )
      return "passed";
    return "pending";
  };

  return (
    <div className="detail-section mb-lg">
      <div className="detail-section-title">Status Timeline</div>
      <div className="timeline">
        {STATUS_FLOW.map((statusStep) => (
          <div
            key={statusStep}
            className={`timeline-step ${timelineProgress(statusStep)}`}
          >
            <div className="timeline-dot">
              {timelineProgress(statusStep) === "passed" ? "\u2713" : ""}
            </div>
            <span className="timeline-label">{statusStep}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
