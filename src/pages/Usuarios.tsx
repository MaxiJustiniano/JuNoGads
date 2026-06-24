import React, { useState, useEffect } from "react";
import { Plus, Users as UsersIcon, Edit2, Trash2 } from "lucide-react";
import api from "../lib/api";

interface User {
  id: string;
  username: string;
  nombre?: string;
  apellido?: string;
  dni?: string;
  rol?: { nombre: string };
}

export default function Usuarios() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form state
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [dni, setDni] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/usuarios");
      setUsers(data);
    } catch (err: any) {
      setError("Error al cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  const openNewModal = () => {
    setEditingUser(null);
    setNombre("");
    setApellido("");
    setDni("");
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setNombre(user.nombre || "");
    setApellido(user.apellido || "");
    setDni(user.dni || "");
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Estás seguro de eliminar este usuario?")) return;
    try {
      setLoading(true);
      await api.delete(`/usuarios/${id}`);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al eliminar usuario");
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      if (editingUser) {
        await api.put(`/usuarios/${editingUser.id}`, { nombre, apellido, dni });
      } else {
        await api.post("/usuarios", { nombre, apellido, dni });
      }
      setShowModal(false);
      setNombre("");
      setApellido("");
      setDni("");
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al guardar usuario");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center">
            <UsersIcon className="w-6 h-6 mr-2 text-indigo-600" />
            Usuarios del Sistema
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestión de accesos y cuentas de usuario
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
              <th className="p-4 font-medium">Usuario</th>
              <th className="p-4 font-medium">Nombre Completo</th>
              <th className="p-4 font-medium">DNI</th>
              <th className="p-4 font-medium">Rol</th>
              <th className="p-4 font-medium w-24">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {loading ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-slate-500">
                  Cargando...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-slate-500">
                  No hay usuarios registrados.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium text-slate-900">
                    {u.username}
                  </td>
                  <td className="p-4 text-slate-600">
                    {u.nombre && u.apellido ? `${u.nombre} ${u.apellido}` : "-"}
                  </td>
                  <td className="p-4 text-slate-600">{u.dni || "-"}</td>
                  <td className="p-4 text-slate-600">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                      {u.rol?.nombre || "N/A"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditModal(u)}
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">
                {editingUser ? "Editar Usuario" : "Alta de Usuario"}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {editingUser
                  ? "Modifique los datos del usuario."
                  : "El usuario se generará automáticamente."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ej: Lucas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Apellido
                </label>
                <input
                  type="text"
                  required
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ej: Gonzalez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  DNI
                </label>
                <input
                  type="text"
                  required
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ej: 35123456"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 mt-4 space-y-1">
                <p>
                  <strong>Usuario generado:</strong>{" "}
                  {nombre && apellido
                    ? `${nombre.charAt(0).toLowerCase()}${apellido.toLowerCase().replace(/\s/g, "")}`
                    : "-"}
                </p>
                <p>
                  <strong>Contraseña inicial:</strong> Será igual al DNI
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {submitting
                    ? "Guardando..."
                    : editingUser
                      ? "Actualizar Usuario"
                      : "Crear Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
