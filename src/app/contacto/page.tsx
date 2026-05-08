import Link from "next/link";

export default function ContactoPage() {
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
        <h2 className="text-3xl font-bold text-center mb-8">Contáctanos</h2>

        <div className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow-md">
          <p className="mb-4">Si tienes alguna pregunta o necesitas más información, no dudes en contactarnos a través de los siguientes medios:</p>

          <div className="mb-4">
            <h3 className="text-xl font-bold mb-2">Información de Contacto</h3>
            <p><strong>Dirección:</strong> Calle Falsa 123, Ciudad, País</p>
            <p><strong>Teléfono:</strong> +123 456 7890</p>
            <p><strong>Email:</strong> info@clinicaansoft.com</p>
          </div>

          <div className="mb-4">
            <h3 className="text-xl font-bold mb-2">Horario de Atención</h3>
            <p>Lunes a Viernes: 9:00 AM - 6:00 PM</p>
            <p>Sábados: 9:00 AM - 1:00 PM</p>
            <p>Domingos: Cerrado</p>
          </div>

          <h3 className="text-xl font-bold mb-4 mt-8">Envíanos un Mensaje</h3>
          <form className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">Nombre:</label>
              <input type="text" id="name" name="name" className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
            </div>
            <div>
              <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email:</label>
              <input type="email" id="email" name="email" className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
            </div>
            <div>
              <label htmlFor="message" className="block text-gray-700 text-sm font-bold mb-2">Mensaje:</label>
              <textarea id="message" name="message" rows={5} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
            </div>
            <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Enviar Mensaje</button>
          </form>
        </div>
      </main>

      <footer className="bg-gray-800 text-white p-4 text-center">
        <p>&copy; 2023 Clínica Ansoft. Todos los derechos reservados.</p>
        <p>Dirección: Calle Falsa 123, Ciudad, País</p>
        <p>Teléfono: +123 456 7890 | Email: info@clinicaansoft.com</p>
      </footer>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/521234567890"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-colors"
      >
        {/* Simple WhatsApp Icon (replace with a proper SVG/component if available) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="currentColor"
          stroke="none"
          className="w-6 h-6"
        >
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.598-3.852-1.598-5.943 0-6.566 5.338-11.895 11.942-11.895 3.224 0 6.227 1.247 8.458 3.468 2.23 2.221 3.48 5.216 3.48 8.444 0 6.566-5.339 11.894-11.943 11.894-1.996 0-3.991-.564-5.708-1.57L.057 24zm6.597-3.807c1.413.794 3.11-.05 4.382-.05 3.684 0 6.674-2.986 6.674-6.666 0-3.683-2.99-6.666-6.674-6.666-3.683 0-6.674 2.985-6.674 6.666 0 1.295.342 2.617.935 3.738l-.626 2.285 2.372-.619zm-1.127-1.472l-.37-.179s-.79-.387-.79-.938c0-.551.37-2.062.37-2.062s-.185-1.011-.185-1.428c0-.417.74-.627 1.11-.627 1.48 0 2.22 1.854 2.22 3.708 0 1.854-.74 3.708-2.22 3.708zM12 18.271c.05 0 .1 0 .15 0 .92-.04 1.8-.394 2.44-.99.64-.596.99-1.39.99-2.261 0-.964-.47-1.76-.94-2.28-1.854-2.059-3.708-2.059-3.708-2.059 0 .926.37 1.854.74 2.782.37.928.74 1.854 1.11 2.783zm-2.22-3.708s-.185-.551-.185-1.112c0-.551.37-.926.37-.926s.185-.37.37-.556.556-.37.556-.37.37-.185.74-.185.74.185.925.37.556.74.556.74.185.37.185.74.185.74.185.74.185.926-.001.926-.37-.185-.556-.185-1.112z" />
        </svg>
      </a>
    </div>
  );
}
