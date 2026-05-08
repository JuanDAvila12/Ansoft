"use client";

import { createBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import { Database } from "../../../../database.types";

type Schedule = Database["public"]["Tables"]["schedules"]["Row"];

const DAY_NAMES: Record<number, string> = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo",
};

export default function MySchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    getDoctorId();
  }, []);

  useEffect(() => {
    if (doctorId) {
      fetchSchedules();
    }
  }, [doctorId]);

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

  async function fetchSchedules() {
    if (!doctorId) return;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("schedules")
      .select("*")
      .eq("doctor_id", doctorId)
      .order("day_of_week")
      .order("start_time");

    if (error) {
      setError(error.message);
    } else {
      setSchedules(data || []);
    }
    setLoading(false);
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Mi Agenda (Horarios)</h2>

      {loading ? (
        <p className="text-gray-600">Cargando horarios...</p>
      ) : error ? (
        <p className="text-red-600">Error: {error}</p>
      ) : schedules.length === 0 ? (
        <p className="text-gray-600">No tienes horarios asignados. Contacta al administrador.</p>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Día</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora Inicio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora Fin</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schedules.map((schedule) => (
                <tr key={schedule.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{DAY_NAMES[schedule.day_of_week]}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{schedule.start_time}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{schedule.end_time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
