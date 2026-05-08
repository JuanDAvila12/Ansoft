import Link from "next/link";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "../../database.types";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
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

  // Get user profile to determine role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  const isDoctor = profile?.role === "doctor";

  // Get today's appointments count
  const today = new Date().toISOString().split("T")[0];
  const { count: todayAppointments } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .gte("scheduled_at", `${today}T00:00:00`)
    .lte("scheduled_at", `${today}T23:59:59`);

  // Get pending appointments count
  const { count: pendingAppointments } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  // Get total patients count
  const { count: totalPatients } = await supabase
    .from("patients")
    .select("*", { count: "exact", head: true });

  // Get total doctors count
  const { count: totalDoctors } = await supabase
    .from("doctors")
    .select("*", { count: "exact", head: true });

  const adminCards = [
    { title: "Pacientes", description: "Gestionar información de pacientes", link: "/dashboard/patients", count: totalPatients || 0, color: "bg-blue-500" },
    { title: "Doctores", description: "Gestionar información de doctores", link: "/dashboard/doctors", count: totalDoctors || 0, color: "bg-green-500" },
    { title: "Agenda", description: "Administrar horarios de doctores", link: "/dashboard/schedules", color: "bg-purple-500" },
    { title: "Citas", description: "Revisar y gestionar citas", link: "/dashboard/appointments", count: pendingAppointments || 0, color: "bg-orange-500" },
    { title: "Estados de Cuenta", description: "Controlar pagos a doctores", link: "/dashboard/billing", color: "bg-teal-500" },
  ];

  const doctorCards = [
    { title: "Mi Agenda", description: "Ver mis horarios de atención", link: "/dashboard/mi-agenda", color: "bg-purple-500", count: 0 },
    { title: "Mis Citas", description: "Ver mis citas programadas", link: "/dashboard/mis-citas", color: "bg-orange-500", count: 0 },
  ];

  const cards = isAdmin ? adminCards : doctorCards;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8">Panel de {isAdmin ? "Administración" : "Doctor"}</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-600">Citas Hoy</h3>
          <p className="text-3xl font-bold text-blue-600">{todayAppointments || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-600">Citas Pendientes</h3>
          <p className="text-3xl font-bold text-orange-600">{pendingAppointments || 0}</p>
        </div>
        {isAdmin && (
          <>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-600">Total Pacientes</h3>
              <p className="text-3xl font-bold text-green-600">{totalPatients || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-600">Total Doctores</h3>
              <p className="text-3xl font-bold text-purple-600">{totalDoctors || 0}</p>
            </div>
          </>
        )}
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {cards.map((card) => (
          <Link key={card.title} href={card.link} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200 border-l-4 border-blue-500">
            <h3 className="text-xl font-semibold mb-2">{card.title}</h3>
            <p className="text-gray-600">{card.description}</p>
            {card.count !== undefined && (
              <p className="text-sm text-gray-500 mt-2">Registros: {card.count}</p>
            )}
          </Link>
        ))}
      </div>

      {/* Today's Appointments Summary */}
      <section className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-2xl font-bold mb-4">Resumen de Citas del Día</h3>
        <p className="text-gray-600">
          {todayAppointments && todayAppointments > 0
            ? `Hay ${todayAppointments} cita(s) programada(s) para hoy.`
            : "No hay citas programadas para hoy."}
        </p>
      </section>
    </div>
  );
}
