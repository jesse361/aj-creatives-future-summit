import { AdminForm } from "@/components/admin-form";
import { getCurrentAdmin } from "@/lib/auth";
import { inputClass, labelClass } from "@/lib/styles";
import { changePassword } from "@/server/actions/admin-settings";

export const instant = false;

export default async function ProfileAdmin() {
  const admin = await getCurrentAdmin();
  return (
    <div>
      <h1 className="font-display text-4xl text-navy">Profile</h1>
      <p className="mt-2 text-sm text-ink-soft">{admin?.email} · {admin?.role}</p>
      <div className="mt-6 max-w-xl">
        <AdminForm action={changePassword} submitLabel="Update password">
          <label className={labelClass}>Name<input className={inputClass} name="name" defaultValue={admin?.name ?? ""} /></label>
          <label className={labelClass}>Current password<input className={inputClass} type="password" name="currentPassword" required /></label>
          <label className={labelClass}>New password<input className={inputClass} type="password" name="nextPassword" minLength={12} required /></label>
        </AdminForm>
      </div>
    </div>
  );
}
