"use client";

import { createBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import { updateAppointmentStatus, deleteAppointment } from "./actions";
import { Database } from "../../../../database.types";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"] & {
  patients: { full_name: string; email: string; phone: string | null };
  doctors: { profiles: { full_name: string }[] };
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDoctor, setFilterDoctor] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("");
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, []);

  async function fetchAppointments() {
    setLoading(true);
    setError(null);
    let query = supabase
      .from("appointments")
      .select("*, patients(full_name, email, phone), doctors(profiles(full_name))")
      .order("scheduled_at", { ascending: false });

    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }
    if (filterDoctor !== "all") {
      query = query.eq("doctor_id", filterDoctor);
    }
    if (filterDate) {
      query = query.gte("scheduled_at", `${filterDate}T00:00:00`).lte("scheduled_at", `${filterDate}T23:59:59`);
    }

    const { data, error } = await query;
    if (error) {
      setError(error.message);
    } else {
      setAppointments(data || []);
    }
    setLoading(false);
  }

  async function fetchDoctors() {
    const { data } = await supabase
      .from("doctors")
      .select("id, profiles(full_name)");
    setDoctors(
      (data || []).map((d: any) => ({
        id: d.id,
        name: d.profiles?.[0]?.full_name || "Unknown",
      }))
    );
  }

  async function handleStatusChange(id: string, status: "confirmed" | "cancelled") {
    setActionError(null);
    setActionSuccess(null);
    const result = await updateAppointmentStatus(id, status);
    if (result.error) {
      setActionError(result.error);
    } else {
      setActionSuccess(`Cita ${status === "confirmed" ? "confirmada" : "cancelada"} exitosamente.`);
      fetchAppointments();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de eliminar esta cita?")) return;
    setActionError(null);
    setActionSuccess(null);
    const result = await deleteAppointment(id);
    if (result.error) {
      setActionError(result.error);
    } else {
      setActionSuccess("Cita eliminada exitosamente.");
      fetchAppointments();
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Gestión de Citas</h2>

      {actionError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{actionError}</div>
      )}
      {actionSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">{actionSuccess}</div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="confirmed">Confirmadas</option>
            <option value="cancelled">Canceladas</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
          <select
            value={filterDoctor}
            onChange={(e) => setFilterDoctor(e.target.value)}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={fetchAppointments}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Filtrar
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-600">Cargando citas...</p>
      ) : error ? (
        <p className="text-red-600">Error: {error}</p>
      ) : appointments.length === 0 ? (
        <p className="text-gray-600">No hay citas registradas.</p>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha/Hora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium">{appointment.patients?.full_name}</div>
                    <div className="text-sm text-gray-500">{appointment.patients?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{appointment.doctors?.profiles?.[0]?.full_name}</td>
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
                  <td className="px-6 py-4 whitespace-nowrap space-x-2">
                    {appointment.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleStatusChange(appointment.id, "confirmed")}
                          className="text-green-600 hover:text-green-800"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => handleStatusChange(appointment.id, "cancelled")}
                          className="text-red-600 hover:text-red-800"
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                    <button onClick={() => handleDelete(appointment.id)} className="text-gray-600 hover:text-gray-800">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
