import { supabase } from "../../utils/supabaseClient";
import Link from "next/link";

export default async function EspecialidadesPage() {
  const { data: specialties, error } = await supabase.from("specialties").select("*");

  if (error) {
    console.error("Error fetching specialties:", error);
    return <p>Error al cargar especialidades.</p>;
  }

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
        <h2 className="text-3xl font-bold text-center mb-8">Especialidades Médicas</h2>
        {/* Buscador de especialidades (futura implementación) */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar especialidad..."
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {specialties.map((specialty) => (
            <div key={specialty.id} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-2">{specialty.name}</h3>
              <p className="text-gray-600">{specialty.description}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="bg-gray-800 text-white p-4 text-center">
        <p>&copy; 2023 Clínica Ansoft. Todos los derechos reservados.</p>
        <p>Dirección: Calle Falsa 123, Ciudad, País</p>
        <p>Teléfono: +123 456 7890 | Email: info@clinicaansoft.com</p>
      </footer>
    </div>
  );
}
