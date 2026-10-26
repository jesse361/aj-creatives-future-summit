import { inputClass, labelClass } from "@/lib/styles";

function linksOf(value: unknown) {
  if (!Array.isArray(value)) return [] as { label: string; url: string }[];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    return [{ label: "label" in item ? String(item.label) : "", url: "url" in item ? String(item.url) : "" }];
  });
}

export function SocialLinkFields({ links }: { links: unknown }) {
  const rows = [...linksOf(links), { label: "", url: "" }];
  return (
    <fieldset className="grid gap-3">
      <legend className={labelClass}>Social links</legend>
      {rows.map((link, index) => (
        <div key={`${link.url}-${index}`} className="grid gap-2 sm:grid-cols-2">
          <label className={labelClass}>
            Label
            <input className={inputClass} name="socialLabel" defaultValue={link.label} />
          </label>
          <label className={labelClass}>
            URL
            <input className={inputClass} name="socialUrl" defaultValue={link.url} placeholder="https://" />
          </label>
        </div>
      ))}
    </fieldset>
  );
}
