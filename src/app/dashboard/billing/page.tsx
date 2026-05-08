"use client";

import { createBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import { createBillingRecord, updateBillingStatus, deleteBillingRecord } from "./actions";
import { Database } from "../../../../database.types";

type Billing = Database["public"]["Tables"]["billing"]["Row"] & {
  doctors: { profiles: { full_name: string }[] };
};

export default function BillingPage() {
  const [billingRecords, setBillingRecords] = useState<Billing[]>([]);
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<string>("");
  const [formData, setFormData] = useState({
    doctorId: "",
    period: "",
    amount: "",
    paymentDate: "",
    status: "pending" as "pending" | "paid",
    notes: "",
  });
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchBillingRecords();
    fetchDoctors();
  }, []);

  async function fetchBillingRecords() {
    setLoading(true);
    setError(null);
    let query = supabase
      .from("billing")
      .select("*, doctors(profiles(full_name))")
      .order("created_at", { ascending: false });

    if (filterPeriod) {
      query = query.eq("period", filterPeriod);
    }

    const { data, error } = await query;
    if (error) {
      setError(error.message);
    } else {
      setBillingRecords(data || []);
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

  function resetForm() {
    setFormData({ doctorId: "", period: "", amount: "", paymentDate: "", status: "pending", notes: "" });
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
    form.append("period", formData.period);
    form.append("amount", formData.amount);
    form.append("paymentDate", formData.paymentDate);
    form.append("status", formData.status);
    form.append("notes", formData.notes);

    const result = await createBillingRecord(form);

    if (result.error) {
      setActionError(result.error);
    } else {
      setActionSuccess("Registro de pago creado exitosamente.");
      resetForm();
      fetchBillingRecords();
    }
  }

  async function handleMarkAsPaid(id: string) {
    setActionError(null);
    setActionSuccess(null);
    const result = await updateBillingStatus(id, "paid");
    if (result.error) {
      setActionError(result.error);
    } else {
      setActionSuccess("Pago marcado como pagado.");
      fetchBillingRecords();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de eliminar este registro?")) return;
    setActionError(null);
    setActionSuccess(null);
    const result = await deleteBillingRecord(id);
    if (result.error) {
      setActionError(result.error);
    } else {
      setActionSuccess("Registro eliminado exitosamente.");
      fetchBillingRecords();
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Estados de Cuenta</h2>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          {showForm ? "Cancelar" : "Nuevo Registro"}
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
          <h3 className="text-xl font-semibold mb-4">Nuevo Registro de Pago</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
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
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Período *</label>
              <input
                type="month"
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Pago</label>
              <input
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as "pending" | "paid" })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="pending">Pendiente</option>
                <option value="paid">Pagado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
            Crear Registro
          </button>
        </form>
      )}

      {/* Filter */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Período</label>
          <input
            type="month"
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-end">
          <button onClick={fetchBillingRecords} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Filtrar
          </button>
          {filterPeriod && (
            <button
              onClick={() => { setFilterPeriod(""); fetchBillingRecords(); }}
              className="ml-2 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-gray-600">Cargando registros...</p>
      ) : error ? (
        <p className="text-red-600">Error: {error}</p>
      ) : billingRecords.length === 0 ? (
        <p className="text-gray-600">No hay registros de pago.</p>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Período</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Pago</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {billingRecords.map((record) => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{record.doctors?.profiles?.[0]?.full_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{record.period}</td>
                  <td className="px-6 py-4 whitespace-nowrap">${record.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{record.payment_date || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${record.status === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                      {record.status === "paid" ? "Pagado" : "Pendiente"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{record.notes || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap space-x-2">
                    {record.status === "pending" && (
                      <button onClick={() => handleMarkAsPaid(record.id)} className="text-green-600 hover:text-green-800">
                        Marcar Pagado
                      </button>
                    )}
                    <button onClick={() => handleDelete(record.id)} className="text-red-600 hover:text-red-800">Eliminar</button>
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
