"use client";

import { createBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import { createPatient, updatePatient, deletePatient } from "./actions";
import { Database } from "../../../../database.types";

type Patient = Database["public"]["Tables"]["patients"]["Row"];

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState({ fullName: "", email: "", phone: "" });
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchPatients();
  }, []);

  async function fetchPatients() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from("patients").select("*").order("created_at", { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setPatients(data || []);
    }
    setLoading(false);
  }

  function resetForm() {
    setFormData({ fullName: "", email: "", phone: "" });
    setEditingPatient(null);
    setShowForm(false);
    setActionError(null);
    setActionSuccess(null);
  }

  function handleEdit(patient: Patient) {
    setEditingPatient(patient);
    setFormData({ fullName: patient.full_name, email: patient.email, phone: patient.phone || "" });
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
    form.append("phone", formData.phone);

    let result;
    if (editingPatient) {
      form.append("id", editingPatient.id);
      result = await updatePatient(form);
    } else {
      result = await createPatient(form);
    }

    if (result.error) {
      setActionError(result.error);
    } else {
      setActionSuccess(editingPatient ? "Paciente actualizado exitosamente." : "Paciente creado exitosamente.");
      resetForm();
      fetchPatients();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de eliminar este paciente?")) return;
    setActionError(null);
    setActionSuccess(null);
    const result = await deletePatient(id);
    if (result.error) {
      setActionError(result.error);
    } else {
      setActionSuccess("Paciente eliminado exitosamente.");
      fetchPatients();
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gestión de Pacientes</h2>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          {showForm ? "Cancelar" : "Nuevo Paciente"}
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
          <h3 className="text-xl font-semibold mb-4">{editingPatient ? "Editar Paciente" : "Nuevo Paciente"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
            {editingPatient ? "Actualizar" : "Crear"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-600">Cargando pacientes...</p>
      ) : error ? (
        <p className="text-red-600">Error: {error}</p>
      ) : patients.length === 0 ? (
        <p className="text-gray-600">No hay pacientes registrados.</p>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {patients.map((patient) => (
                <tr key={patient.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{patient.full_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{patient.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{patient.phone || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(patient.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap space-x-2">
                    <button onClick={() => handleEdit(patient)} className="text-blue-600 hover:text-blue-800">Editar</button>
                    <button onClick={() => handleDelete(patient.id)} className="text-red-600 hover:text-red-800">Eliminar</button>
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
