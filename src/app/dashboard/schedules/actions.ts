"use server";

import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "../../../../database.types";
import { revalidatePath } from "next/cache";

export async function createSchedule(formData: FormData) {
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
  const dayOfWeek = parseInt(formData.get("dayOfWeek") as string);
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;

  if (!doctorId || !dayOfWeek || !startTime || !endTime) {
    return { error: "Todos los campos son requeridos." };
  }

  if (dayOfWeek < 1 || dayOfWeek > 7) {
    return { error: "Día de la semana inválido." };
  }

  if (startTime >= endTime) {
    return { error: "La hora de inicio debe ser menor a la hora de fin." };
  }

  const { error } = await supabase.from("schedules").insert({
    doctor_id: doctorId,
    day_of_week: dayOfWeek,
    start_time: startTime,
    end_time: endTime,
  });

  if (error) {
    console.error("Error creating schedule:", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/schedules");
  return { success: true };
}

export async function deleteSchedule(id: string) {
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

  const { error } = await supabase.from("schedules").delete().eq("id", id);

  if (error) {
    console.error("Error deleting schedule:", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/schedules");
  return { success: true };
}
