import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [error, setError] = useState("");

  // -------------------------------------------------------------------------
  // Load departments
  // -------------------------------------------------------------------------
  const loadDepartments = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await api.listDepartments();
      setDepartments(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  // -------------------------------------------------------------------------
  // Open Add form
  // -------------------------------------------------------------------------
  const openAddForm = () => {
    setEditingDepartment(null);
    setName("");
    setDescription("");
    setError("");
    setShowForm(true);
  };

  // -------------------------------------------------------------------------
  // Open Edit form
  // -------------------------------------------------------------------------
  const openEditForm = (department) => {
    setEditingDepartment(department);
    setName(department.name);
    setDescription(department.description || "");
    setError("");
    setShowForm(true);
  };

  // -------------------------------------------------------------------------
  // Close form
  // -------------------------------------------------------------------------
  const closeForm = () => {
    setShowForm(false);
    setEditingDepartment(null);
    setName("");
    setDescription("");
    setError("");
  };

  // -------------------------------------------------------------------------
  // Save department
  // -------------------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Department name is required");
      return;
    }

    try {
      setError("");

      const payload = {
        name: trimmedName,
        description: description.trim() || null,
      };

      if (editingDepartment) {
        await api.updateDepartment(
          editingDepartment.department_id,
          payload
        );
      } else {
        await api.createDepartment(payload);
      }

      closeForm();
      await loadDepartments();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to save department");
    }
  };

  // -------------------------------------------------------------------------
  // Delete department
  // -------------------------------------------------------------------------
  const handleDelete = async (department) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${department.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.deleteDepartment(department.department_id);

      await loadDepartments();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to delete department");
    }
  };

  return (
    <div className="min-h-screen bg-canvas">
      <main className="p-8 max-w-6xl mx-auto">

        {/* ---------------------------------------------------------------- */}
        {/* Header                                                           */}
        {/* ---------------------------------------------------------------- */}

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">
              Departments
            </h1>

            <p className="text-muted mt-1">
              Manage departments used in recruitment.
            </p>
          </div>

          <button
            onClick={openAddForm}
            className="px-5 py-2.5 rounded-md bg-accent text-white text-sm font-medium hover:opacity-90 transition"
          >
            + Add Department
          </button>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Error                                                            */}
        {/* ---------------------------------------------------------------- */}

        {error && !showForm && (
          <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Loading                                                          */}
        {/* ---------------------------------------------------------------- */}

        {loading ? (
          <div className="text-sm text-muted">
            Loading departments...
          </div>
        ) : departments.length === 0 ? (

          <div className="bg-white border border-line rounded-lg p-10 text-center">
            <h2 className="font-medium text-ink">
              No departments yet
            </h2>

            <p className="text-sm text-muted mt-1">
              Add your first department to get started.
            </p>
          </div>

        ) : (

          /* -------------------------------------------------------------- */
          /* Department cards                                               */
          /* -------------------------------------------------------------- */

          <div className="space-y-4">
            {departments.map((department) => (
              <div
                key={department.department_id}
                className="bg-white border border-line rounded-lg p-6"
              >
                <div className="flex items-start justify-between gap-6">

                  <div className="min-w-0">

                    <h2 className="text-lg font-semibold text-ink">
                      {department.name}
                    </h2>

                    <p className="text-sm text-muted mt-2">
                      {department.description || "No description provided."}
                    </p>

                  </div>

                  <div className="flex gap-2 shrink-0">

                    <button
                      onClick={() => openEditForm(department)}
                      className="px-4 py-2 border border-line rounded-md text-sm font-medium text-ink hover:bg-canvas transition"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(department)}
                      className="px-4 py-2 border border-red-200 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition"
                    >
                      Delete
                    </button>

                  </div>

                </div>
              </div>
            ))}
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Add / Edit Modal                                                */}
        {/* ---------------------------------------------------------------- */}

        {showForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">

              <div className="px-6 py-5 border-b border-line">

                <h2 className="text-xl font-semibold text-ink">
                  {editingDepartment
                    ? "Edit Department"
                    : "Add Department"}
                </h2>

                <p className="text-sm text-muted mt-1">
                  {editingDepartment
                    ? "Update the department details."
                    : "Add a new department to the recruitment system."}
                </p>

              </div>

              <form onSubmit={handleSubmit}>

                <div className="p-6 space-y-5">

                  {error && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  {/* Department name */}

                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">
                      Department Name
                    </label>

                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Engineering"
                      className="w-full border border-line rounded-md px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                      autoFocus
                    />
                  </div>

                  {/* Description */}

                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">
                      Description
                    </label>

                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe this department..."
                      rows={4}
                      className="w-full border border-line rounded-md px-3 py-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                    />
                  </div>

                </div>

                {/* Modal buttons */}

                <div className="px-6 py-4 border-t border-line flex justify-end gap-3">

                  <button
                    type="button"
                    onClick={closeForm}
                    className="px-4 py-2 border border-line rounded-md text-sm font-medium text-ink hover:bg-canvas"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-md bg-accent text-white text-sm font-medium hover:opacity-90"
                  >
                    {editingDepartment
                      ? "Save Changes"
                      : "Add Department"}
                  </button>

                </div>

              </form>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}