"use server";

import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "../../../../database.types";
import { revalidatePath } from "next/cache";

export async function updateAppointmentStatus(id: string, status: "confirmed" | "cancelled") {
  const cookieStore = await cookies();
  
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          cookieStore.set(name, value);
        },
        remove(name: string, options: Record<string, unknown>) {
          cookieStore.set(name, "");
        },
      },
    }
  );

  const { error } = await supabase
    .from("appointments")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Error updating appointment:", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/appointments");
  return { success: true };
}

export async function deleteAppointment(id: string) {
  const cookieStore = await cookies();
  
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          cookieStore.set(name, value);
        },
        remove(name: string, options: Record<string, unknown>) {
          cookieStore.set(name, "");
        },
      },
    }
  );

  const { error } = await supabase.from("appointments").delete().eq("id", id);

  if (error) {
    console.error("Error deleting appointment:", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/appointments");
  return { success: true };
}
