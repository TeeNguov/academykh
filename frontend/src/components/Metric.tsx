import { Icon } from "@/components/Icon";

type MetricProps = {
  label: string;
  value: string;
  icon: string;
};

export function Metric({ label, value, icon }: MetricProps) {
  return (
    <div className="card-enter rounded-lg border border-line bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink/58">{label}</p>
          <p className="mt-2 text-3xl font-black">{value}</p>
        </div>
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-mint text-moss">
          <Icon path={icon} size={1} />
        </span>
      </div>
    </div>
  );
}
