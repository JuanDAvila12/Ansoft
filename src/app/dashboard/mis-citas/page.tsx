"use client";

import { createBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import { Database } from "../../../../database.types";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"] & {
  patients: { full_name: string; email: string; phone: string | null };
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    getDoctorId();
  }, []);

  useEffect(() => {
    if (doctorId) {
      fetchAppointments();
    }
  }, [doctorId, filterStatus]);

  async function getDoctorId() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("doctors")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (data) {
      setDoctorId(data.id);
    }
  }

  async function fetchAppointments() {
    if (!doctorId) return;
    setLoading(true);
    setError(null);

    let query = supabase
      .from("appointments")
      .select("*, patients(full_name, email, phone)")
      .eq("doctor_id", doctorId)
      .order("scheduled_at", { ascending: false });

    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }

    const { data, error } = await query;
    if (error) {
      setError(error.message);
    } else {
      setAppointments(data || []);
    }
    setLoading(false);
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Mis Citas</h2>

      {/* Filter */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas</option>
            <option value="pending">Pendientes</option>
            <option value="confirmed">Confirmadas</option>
            <option value="cancelled">Canceladas</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-600">Cargando citas...</p>
      ) : error ? (
        <p className="text-red-600">Error: {error}</p>
      ) : appointments.length === 0 ? (
        <p className="text-gray-600">No tienes citas registradas.</p>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha/Hora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notas</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{appointment.patients?.full_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{appointment.patients?.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{appointment.patients?.phone || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(appointment.scheduled_at).toLocaleDateString("es-MX", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[appointment.status]}`}>
                      {appointment.status === "pending" ? "Pendiente" : appointment.status === "confirmed" ? "Confirmada" : "Cancelada"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{appointment.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
