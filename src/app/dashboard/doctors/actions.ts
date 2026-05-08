"use server";

import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "../../../../database.types";
import { revalidatePath } from "next/cache";

export async function createDoctor(formData: FormData) {
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
  const password = formData.get("password") as string;
  const specialtyId = formData.get("specialtyId") as string;
  const consultingRoom = formData.get("consultingRoom") as string;
  const licenseNumber = formData.get("licenseNumber") as string;
  const city = formData.get("city") as string;
  const phone = formData.get("phone") as string;

  if (!fullName || !email || !password || !specialtyId || !licenseNumber) {
    return { error: "Los campos obligatorios deben ser completados." };
  }

  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (authError) throw new Error(authError.message);

    const userId = authData.user!.id;

    // 2. Create profile
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      full_name: fullName,
      role: "doctor",
      phone: phone || null,
      status: "active",
    });

    if (profileError) throw new Error(profileError.message);

    // 3. Create doctor record
    const { error: doctorError } = await supabase.from("doctors").insert({
      profile_id: userId,
      specialty_id: specialtyId,
      consulting_room: consultingRoom || null,
      license_number: licenseNumber,
      city: city || null,
    });

    if (doctorError) throw new Error(doctorError.message);

    revalidatePath("/dashboard/doctors");
    return { success: true };
  } catch (err: any) {
    console.error("Error creating doctor:", err);
    return { error: err.message || "Error al crear el doctor." };
  }
}

export async function updateDoctor(formData: FormData) {
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
  const specialtyId = formData.get("specialtyId") as string;
  const consultingRoom = formData.get("consultingRoom") as string;
  const licenseNumber = formData.get("licenseNumber") as string;
  const city = formData.get("city") as string;
  const phone = formData.get("phone") as string;

  if (!id || !fullName || !specialtyId || !licenseNumber) {
    return { error: "Los campos obligatorios deben ser completados." };
  }

  try {
    // Get profile_id from doctor record
    const { data: doctor, error: doctorFetchError } = await supabase
      .from("doctors")
      .select("profile_id")
      .eq("id", id)
      .single();

    if (doctorFetchError || !doctor) {
      return { error: "Doctor no encontrado." };
    }

    // Update profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone: phone || null })
      .eq("id", doctor.profile_id);

    if (profileError) throw new Error(profileError.message);

    // Update doctor record
    const { error: doctorError } = await supabase
      .from("doctors")
      .update({
        specialty_id: specialtyId,
        consulting_room: consultingRoom || null,
        license_number: licenseNumber,
        city: city || null,
      })
      .eq("id", id);

    if (doctorError) throw new Error(doctorError.message);

    revalidatePath("/dashboard/doctors");
    return { success: true };
  } catch (err: any) {
    console.error("Error updating doctor:", err);
    return { error: err.message || "Error al actualizar el doctor." };
  }
}

export async function deleteDoctor(id: string) {
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

  try {
    // Get profile_id from doctor record
    const { data: doctor, error: doctorFetchError } = await supabase
      .from("doctors")
      .select("profile_id")
      .eq("id", id)
      .single();

    if (doctorFetchError || !doctor) {
      return { error: "Doctor no encontrado." };
    }

    // Delete doctor record (schedules will cascade)
    const { error: doctorDeleteError } = await supabase
      .from("doctors")
      .delete()
      .eq("id", id);

    if (doctorDeleteError) throw new Error(doctorDeleteError.message);

    // Delete profile
    const { error: profileDeleteError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", doctor.profile_id);

    if (profileDeleteError) throw new Error(profileDeleteError.message);

    // Delete auth user (admin API)
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(doctor.profile_id);
    if (authDeleteError) throw new Error(authDeleteError.message);

    revalidatePath("/dashboard/doctors");
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting doctor:", err);
    return { error: err.message || "Error al eliminar el doctor." };
  }
}
