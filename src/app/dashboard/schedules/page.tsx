"use client";

import { createBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import { createSchedule, deleteSchedule } from "./actions";
import { Database } from "../../../../database.types";

type Schedule = Database["public"]["Tables"]["schedules"]["Row"] & {
  doctors: { profiles: { full_name: string }[] } | null;
};

type DoctorSimple = {
  id: string;
  profiles: { full_name: string }[] | null;
};

const DAY_NAMES: Record<number, string> = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo",
};

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [doctors, setDoctors] = useState<DoctorSimple[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    doctorId: "",
    dayOfWeek: "",
    startTime: "",
    endTime: "",
  });
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchSchedules();
    fetchDoctors();
  }, []);

  async function fetchSchedules() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("schedules")
      .select("*, doctors(profiles(full_name))")
      .order("day_of_week")
      .order("start_time");
    if (error) {
      setError(error.message);
    } else {
      setSchedules(data || []);
    }
    setLoading(false);
  }

  async function fetchDoctors() {
    const { data } = await supabase
      .from("doctors")
      .select("id, profiles(full_name)")
      .order("created_at");
    setDoctors(data || []);
  }

  function resetForm() {
    setFormData({ doctorId: "", dayOfWeek: "", startTime: "", endTime: "" });
    setShowForm(false);
    setActionError(null);
    setActionSuccess(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    const form = new FormData();
    form.append("doctorId", formData.doctorId);
    form.append("dayOfWeek", formData.dayOfWeek);
    form.append("startTime", formData.startTime);
    form.append("endTime", formData.endTime);

    const result = await createSchedule(form);

    if (result.error) {
      setActionError(result.error);
    } else {
      setActionSuccess("Horario creado exitosamente.");
      resetForm();
      fetchSchedules();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de eliminar este horario?")) return;
    setActionError(null);
    setActionSuccess(null);
    const result = await deleteSchedule(id);
    if (result.error) {
      setActionError(result.error);
    } else {
      setActionSuccess("Horario eliminado exitosamente.");
      fetchSchedules();
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gestión de Agenda (Horarios)</h2>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          {showForm ? "Cancelar" : "Nuevo Horario"}
        </button>
      </div>

      {actionError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{actionError}</div>
      )}
      {actionSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">{actionSuccess}</div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-xl font-semibold mb-4">Nuevo Horario</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Doctor *</label>
              <select
                value={formData.doctorId}
                onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Seleccionar doctor</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.profiles?.[0]?.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Día de la Semana *</label>
              <select
                value={formData.dayOfWeek}
                onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Seleccionar día</option>
                {Object.entries(DAY_NAMES).map(([key, name]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora Inicio *</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora Fin *</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
            Crear Horario
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-600">Cargando horarios...</p>
      ) : error ? (
        <p className="text-red-600">Error: {error}</p>
      ) : schedules.length === 0 ? (
        <p className="text-gray-600">No hay horarios registrados.</p>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Día</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora Inicio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora Fin</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schedules.map((schedule) => (
                <tr key={schedule.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{schedule.doctors?.profiles?.[0]?.full_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{DAY_NAMES[schedule.day_of_week]}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{schedule.start_time}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{schedule.end_time}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button onClick={() => handleDelete(schedule.id)} className="text-red-600 hover:text-red-800">Eliminar</button>
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
