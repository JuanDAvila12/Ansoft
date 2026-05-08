import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Database } from "../../database.types";
import Link from "next/link";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
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

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", session.user.id)
    .single();

  if (error || !profile) {
    console.error("Error fetching profile:", error);
    redirect("/login");
  }

  const isAdmin = profile.role === "admin";
  const isDoctor = profile.role === "doctor";

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white flex flex-col p-4">
        <div className="text-2xl font-bold mb-8">Ansoft Dashboard</div>
        <nav className="flex-grow">
          <ul>
            <li>
              <Link href="/dashboard" className="block py-2 px-4 rounded hover:bg-gray-700">
                Inicio
              </Link>
            </li>
            {isAdmin && (
              <>
                <li>
                  <Link href="/dashboard/patients" className="block py-2 px-4 rounded hover:bg-gray-700">
                    Pacientes
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/doctors" className="block py-2 px-4 rounded hover:bg-gray-700">
                    Doctores
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/schedules" className="block py-2 px-4 rounded hover:bg-gray-700">
                    Agenda
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/appointments" className="block py-2 px-4 rounded hover:bg-gray-700">
                    Citas
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/billing" className="block py-2 px-4 rounded hover:bg-gray-700">
                    Estados de Cuenta
                  </Link>
                </li>
              </>
            )}
            {isDoctor && (
              <>
                <li>
                  <Link href="/dashboard/mi-agenda" className="block py-2 px-4 rounded hover:bg-gray-700">
                    Mi Agenda
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/mis-citas" className="block py-2 px-4 rounded hover:bg-gray-700">
                    Mis Citas
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
        <div className="mt-8">
          <form action="/auth/sign-out" method="post">
            <button type="submit" className="block w-full text-left py-2 px-4 rounded bg-red-600 hover:bg-red-700">
              Cerrar Sesión
            </button>
          </form>
          <Link href="/" className="block w-full text-left py-2 px-4 rounded mt-2 bg-blue-600 hover:bg-blue-700">
            Sitio Público
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-grow p-8">
        <header className="bg-white shadow-md rounded-lg p-4 mb-8 flex justify-between items-center">
          <h2 className="text-3xl font-bold">Bienvenido, {profile.full_name || "Usuario"}!</h2>
        </header>
        {children}
      </div>
    </div>
  );
}
