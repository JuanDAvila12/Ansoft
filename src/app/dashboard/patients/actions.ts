"use server";

import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "../../../../database.types";
import { revalidatePath } from "next/cache";

export async function createPatient(formData: FormData) {
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

  const fullName = formData.get("fullName") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;

  if (!fullName || !email) {
    return { error: "Nombre completo y email son requeridos." };
  }

  // Basic email validation
  if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
    return { error: "Email no válido." };
  }

  const { error } = await supabase.from("patients").insert({ full_name: fullName, email, phone });

  if (error) {
    console.error("Error creating patient:", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/patients");
  return { success: true };
}

export async function updatePatient(formData: FormData) {
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

  const id = formData.get("id") as string;
  const fullName = formData.get("fullName") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;

  if (!id || !fullName || !email) {
    return { error: "ID, nombre completo y email son requeridos." };
  }

  // Basic email validation
  if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
    return { error: "Email no válido." };
  }

  const { error } = await supabase
    .from("patients")
    .update({ full_name: fullName, email, phone: phone || null })
    .eq("id", id);

  if (error) {
    console.error("Error updating patient:", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/patients");
  return { success: true };
}

export async function deletePatient(id: string) {
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

  const { error } = await supabase.from("patients").delete().eq("id", id);

  if (error) {
    console.error("Error deleting patient:", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/patients");
  return { success: true };
}

export async function updateProfileStatus(userId: string, status: "active" | "inactive") {
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

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    return { error: "No autorizado para realizar esta acción." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ status: status })
    .eq("id", userId);

  if (error) {
    console.error("Error updating profile status:", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/patients");
  return { success: true };
}
