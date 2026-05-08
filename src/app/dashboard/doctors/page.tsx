"use client";

import { createBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import { createDoctor, updateDoctor, deleteDoctor } from "./actions";
import { Database } from "../../../../database.types";

type Doctor = Database["public"]["Tables"]["doctors"]["Row"] & {
  profiles: { full_name: string; phone: string | null };
  specialties: { name: string };
};

type Specialty = Database["public"]["Tables"]["specialties"]["Row"];

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    specialtyId: "",
    consultingRoom: "",
    licenseNumber: "",
    city: "",
    phone: "",
  });
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchDoctors();
    fetchSpecialties();
  }, []);

  async function fetchDoctors() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("doctors")
      .select("*, profiles(full_name, phone), specialties(name)")
      .order("created_at", { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setDoctors(data || []);
    }
    setLoading(false);
  }

  async function fetchSpecialties() {
    const { data } = await supabase.from("specialties").select("*").order("name");
    setSpecialties(data || []);
  }

  function resetForm() {
    setFormData({ fullName: "", email: "", password: "", specialtyId: "", consultingRoom: "", licenseNumber: "", city: "", phone: "" });
    setEditingDoctor(null);
    setShowForm(false);
    setActionError(null);
    setActionSuccess(null);
  }

  function handleEdit(doctor: Doctor) {
    setEditingDoctor(doctor);
    setFormData({
      fullName: doctor.profiles?.full_name || "",
      email: "",
      password: "",
      specialtyId: doctor.specialty_id,
      consultingRoom: doctor.consulting_room || "",
      licenseNumber: doctor.license_number,
      city: doctor.city || "",
      phone: doctor.profiles?.phone || "",
    });
    setShowForm(true);
    setActionError(null);
    setActionSuccess(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    const form = new FormData();
    form.append("fullName", formData.fullName);
    form.append("email", formData.email);
    form.append("password", formData.password);
    form.append("specialtyId", formData.specialtyId);
    form.append("consultingRoom", formData.consultingRoom);
    form.append("licenseNumber", formData.licenseNumber);
    form.append("city", formData.city);
    form.append("phone", formData.phone);

    let result;
    if (editingDoctor) {
      form.append("id", editingDoctor.id);
      result = await updateDoctor(form);
    } else {
      result = await createDoctor(form);
    }

    if (result.error) {
      setActionError(result.error);
    } else {
      setActionSuccess(editingDoctor ? "Doctor actualizado exitosamente." : "Doctor creado exitosamente.");
      resetForm();
      fetchDoctors();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de eliminar este doctor? Se eliminarán también su perfil de usuario.")) return;
    setActionError(null);
    setActionSuccess(null);
    const result = await deleteDoctor(id);
    if (result.error) {
      setActionError(result.error);
    } else {
      setActionSuccess("Doctor eliminado exitosamente.");
      fetchDoctors();
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gestión de Doctores</h2>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          {showForm ? "Cancelar" : "Nuevo Doctor"}
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
          <h3 className="text-xl font-semibold mb-4">{editingDoctor ? "Editar Doctor" : "Nuevo Doctor"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={!!editingDoctor}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={!editingDoctor}
                disabled={!!editingDoctor}
                placeholder={editingDoctor ? "Dejar vacío para mantener" : ""}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad *</label>
              <select
                value={formData.specialtyId}
                onChange={(e) => setFormData({ ...formData, specialtyId: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Seleccionar especialidad</option>
                {specialties.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de Cédula *</label>
              <input
                type="text"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Consultorio</label>
              <input
                type="text"
                value={formData.consultingRoom}
                onChange={(e) => setFormData({ ...formData, consultingRoom: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
            {editingDoctor ? "Actualizar" : "Crear"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-600">Cargando doctores...</p>
      ) : error ? (
        <p className="text-red-600">Error: {error}</p>
      ) : doctors.length === 0 ? (
        <p className="text-gray-600">No hay doctores registrados.</p>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Especialidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cédula</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consultorio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ciudad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {doctors.map((doctor) => (
                <tr key={doctor.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{doctor.profiles?.full_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{doctor.specialties?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{doctor.license_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{doctor.consulting_room || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{doctor.city || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{doctor.profiles?.phone || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap space-x-2">
                    <button onClick={() => handleEdit(doctor)} className="text-blue-600 hover:text-blue-800">Editar</button>
                    <button onClick={() => handleDelete(doctor.id)} className="text-red-600 hover:text-red-800">Eliminar</button>
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
