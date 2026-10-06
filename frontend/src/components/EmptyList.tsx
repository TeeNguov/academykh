import { mdiInboxOutline } from "@mdi/js";
import { Icon } from "@/components/Icon";

export function EmptyList({ title, text }: { title: string; text: string }) {
  return (
    <div className="card-enter rounded-lg border border-dashed border-line bg-white p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-mint text-moss">
          <Icon path={mdiInboxOutline} size={1} />
        </span>
        <div>
          <p className="font-black">{title}</p>
          <p className="mt-1 text-sm font-semibold text-ink/58">{text}</p>
        </div>
      </div>
    </div>
  );
}
