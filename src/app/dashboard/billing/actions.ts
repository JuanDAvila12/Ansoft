"use server";

import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "../../../../database.types";
import { revalidatePath } from "next/cache";

export async function createBillingRecord(formData: FormData) {
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

  const doctorId = formData.get("doctorId") as string;
  const period = formData.get("period") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const paymentDate = formData.get("paymentDate") as string | null;
  const status = formData.get("status") as "pending" | "paid";
  const notes = formData.get("notes") as string;

  if (!doctorId || !period || !amount || !status) {
    return { error: "Doctor, período, monto y estado son requeridos." };
  }

  const { error } = await supabase.from("billing").insert({
    doctor_id: doctorId,
    period,
    amount,
    payment_date: paymentDate || null,
    status,
    notes: notes || null,
  });

  if (error) {
    console.error("Error creating billing record:", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/billing");
  return { success: true };
}

export async function updateBillingStatus(id: string, status: "paid") {
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
    .from("billing")
    .update({ status, payment_date: new Date().toISOString().split("T")[0] })
    .eq("id", id);

  if (error) {
    console.error("Error updating billing status:", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/billing");
  return { success: true };
}

export async function deleteBillingRecord(id: string) {
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

  const { error } = await supabase.from("billing").delete().eq("id", id);

  if (error) {
    console.error("Error deleting billing record:", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/billing");
  return { success: true };
}
