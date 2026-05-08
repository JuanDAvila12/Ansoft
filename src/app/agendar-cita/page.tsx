"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Specialty = {
  id: string;
  name: string;
};

type Doctor = {
  id: string;
  full_name: string;
  specialty_id: string;
};

type Schedule = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
};

export default function AgendarCitaPage() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [patientName, setPatientName] = useState<string>("");
  const [patientEmail, setPatientEmail] = useState<string>("");
  const [patientPhone, setPatientPhone] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchSpecialties() {
      const { data, error } = await supabase.from("specialties").select("id, name");
      if (error) {
        console.error("Error fetching specialties:", error);
        setError("Error al cargar especialidades.");
      } else {
        setSpecialties(data);
      }
    }
    fetchSpecialties();
  }, []);

  useEffect(() => {
    async function fetchDoctors() {
      if (selectedSpecialty) {
        const { data, error } = await supabase
          .from("doctors")
          .select("id, profiles(full_name)")
          .eq("specialty_id", selectedSpecialty);
        if (error) {
          console.error("Error fetching doctors:", error);
          setError("Error al cargar doctores.");
          setDoctors([]);
        } else {
          setDoctors(data.map(d => ({ id: d.id, full_name: d.profiles!.full_name, specialty_id: selectedSpecialty } as Doctor)));
        }
      } else {
        setDoctors([]);
      }
      setSelectedDoctor(null);
      setSchedules([]);
      setAvailableTimes([]);
      setSelectedTime(null);
    }
    fetchDoctors();
  }, [selectedSpecialty]);

  useEffect(() => {
    async function fetchSchedules() {
      if (selectedDoctor) {
        const { data, error } = await supabase
          .from("schedules")
          .select("id, day_of_week, start_time, end_time")
          .eq("doctor_id", selectedDoctor);
        if (error) {
          console.error("Error fetching schedules:", error);
          setError("Error al cargar horarios.");
          setSchedules([]);
        } else {
          setSchedules(data);
        }
      } else {
        setSchedules([]);
      }
      setAvailableTimes([]);
      setSelectedTime(null);
    }
    fetchSchedules();
  }, [selectedDoctor]);

  useEffect(() => {
    if (selectedDoctor && selectedDate && schedules.length > 0) {
      const dayOfWeek = new Date(selectedDate).getDay(); // Sunday is 0, Monday is 1
      const daySchedules = schedules.filter(s => s.day_of_week === (dayOfWeek === 0 ? 7 : dayOfWeek));

      const generateTimeSlots = (start: string, end: string) => {
        const slots = [];
        let current = new Date(`2000-01-01T${start}:00`);
        const endTime = new Date(`2000-01-01T${end}:00`);

        while (current < endTime) {
          slots.push(current.toTimeString().substring(0, 5));
          current.setMinutes(current.getMinutes() + 30); // 30 minute slots
        }
        return slots;
      };

      let possibleTimes: string[] = [];
      daySchedules.forEach(s => {
        possibleTimes = possibleTimes.concat(generateTimeSlots(s.start_time, s.end_time));
      });

      async function fetchOccupiedAppointments() {
        if (!selectedDoctor || !selectedDate) return;
        // Fetch appointments for the selected doctor on the selected date
        const startOfDay = `${selectedDate}T00:00:00`;
        const endOfDay = `${selectedDate}T23:59:59`;
        const { data: appointments, error } = await supabase
          .from("appointments")
          .select("scheduled_at")
          .eq("doctor_id", selectedDoctor)
          .gte("scheduled_at", startOfDay)
          .lte("scheduled_at", endOfDay)
          .in("status", ["pending", "confirmed"]);

        if (error) {
          console.error("Error fetching occupied appointments:", error);
          setError("Error al cargar citas ocupadas.");
          setAvailableTimes([]);
          return;
        }

        const occupiedTimes = new Set(appointments.map(app => new Date(app.scheduled_at).toTimeString().substring(0, 5)));
        const filteredTimes = possibleTimes.filter(time => !occupiedTimes.has(time));
        setAvailableTimes(filteredTimes.sort());
      }

      fetchOccupiedAppointments();
    } else {
      setAvailableTimes([]);
    }
    setSelectedTime(null);
  }, [selectedDoctor, selectedDate, schedules]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!selectedSpecialty || !selectedDoctor || !selectedDate || !selectedTime || !patientName || !patientEmail || !patientPhone) {
      setError("Todos los campos son requeridos.");
      setLoading(false);
      return;
    }

    try {
      // Check if patient exists, create if not
      let patientId: string;
      const { data: existingPatient, error: patientError } = await supabase
        .from("patients")
        .select("id")
        .eq("email", patientEmail)
        .single();

      if (patientError && patientError.code !== "PGRST116") { // PGRST116 means no rows found
        throw patientError;
      }

      if (existingPatient) {
        patientId = existingPatient.id;
      } else {
        const { data: newPatient, error: newPatientError } = await supabase
          .from("patients")
          .insert({
            full_name: patientName,
            email: patientEmail,
            phone: patientPhone,
          })
          .select("id")
          .single();
        if (newPatientError) throw newPatientError;
        patientId = newPatient.id;
      }

      // Create appointment
      const scheduledDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
      const { error: appointmentError } = await supabase.from("appointments").insert({
        patient_id: patientId,
        doctor_id: selectedDoctor,
        scheduled_at: scheduledDateTime.toISOString(),
        status: "pending",
        notes: "Cita agendada desde el sitio público",
      });

      if (appointmentError) throw appointmentError;

      setSuccess(true);
      setPatientName("");
      setPatientEmail("");
      setPatientPhone("");
      setSelectedSpecialty(null);
      setSelectedDoctor(null);
      setSelectedDate("");
      setSelectedTime(null);
      router.refresh(); // Refresh to clear form and update availability
    } catch (err: any) {
      console.error("Error scheduling appointment:", err);
      setError(err.message || "Error al agendar la cita.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <nav className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Clínica Ansoft</h1>
          <ul className="flex space-x-4">
            <li><Link href="/" className="hover:underline">Inicio</Link></li>
            <li><Link href="/especialidades" className="hover:underline">Especialidades</Link></li>
            <li><Link href="/agendar-cita" className="hover:underline">Agendar Cita</Link></li>
            <li><Link href="/contacto" className="hover:underline">Contacto</Link></li>
            <li><Link href="/login" className="bg-white text-blue-600 px-3 py-1 rounded-md hover:bg-gray-100">Login</Link></li>
          </ul>
        </nav>
      </header>

      <main className="container mx-auto my-8 p-4 flex-grow">
        <h2 className="text-3xl font-bold text-center mb-8">Agendar Cita</h2>
        <form onSubmit={handleSubmit} className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow-md">
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">¡Éxito!</strong>
              <span className="block sm:inline"> Su cita ha sido agendada con éxito.</span>
            </div>
          )}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">¡Error!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="specialty" className="block text-gray-700 text-sm font-bold mb-2">Especialidad:</label>
            <select
              id="specialty"
              value={selectedSpecialty || ""}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="">Seleccione una especialidad</option>
              {specialties.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="doctor" className="block text-gray-700 text-sm font-bold mb-2">Doctor:</label>
            <select
              id="doctor"
              value={selectedDoctor || ""}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              disabled={!selectedSpecialty}
              required
            >
              <option value="">Seleccione un doctor</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.full_name}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="date" className="block text-gray-700 text-sm font-bold mb-2">Fecha:</label>
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              min={new Date().toISOString().split("T")[0]} // Prevent selecting past dates
              disabled={!selectedDoctor}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="time" className="block text-gray-700 text-sm font-bold mb-2">Hora Disponible:</label>
            <select
              id="time"
              value={selectedTime || ""}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              disabled={!selectedDate || availableTimes.length === 0}
              required
            >
              <option value="">Seleccione una hora</option>
              {availableTimes.length > 0 ? (
                availableTimes.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))
              ) : (
                <option value="" disabled>No hay horarios disponibles para esta fecha</option>
              )}
            </select>
          </div>

          <h3 className="text-xl font-bold mb-4 mt-8">Datos del Paciente</h3>

          <div className="mb-4">
            <label htmlFor="patientName" className="block text-gray-700 text-sm font-bold mb-2">Nombre Completo:</label>
            <input
              type="text"
              id="patientName"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="patientEmail" className="block text-gray-700 text-sm font-bold mb-2">Email:</label>
            <input
              type="email"
              id="patientEmail"
              value={patientEmail}
              onChange={(e) => setPatientEmail(e.target.value)}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="patientPhone" className="block text-gray-700 text-sm font-bold mb-2">Teléfono:</label>
            <input
              type="tel"
              id="patientPhone"
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={loading}
          >
            {loading ? "Agendando..." : "Agendar Cita"}
          </button>
        </form>
      </main>

      <footer className="bg-gray-800 text-white p-4 text-center">
        <p>&copy; 2023 Clínica Ansoft. Todos los derechos reservados.</p>
        <p>Dirección: Calle Falsa 123, Ciudad, País</p>
        <p>Teléfono: +123 456 7890 | Email: info@clinicaansoft.com</p>
      </footer>
    </div>
  );
}
