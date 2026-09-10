import { useEffect, useState } from "react";
import { api } from "../lib/api";

const JobRequirements = () => {
  const [requirements, setRequirements] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState(null);

  const [departmentId, setDepartmentId] = useState("");
  const [position, setPosition] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [preferredSkills, setPreferredSkills] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [requirementsData, departmentsData] = await Promise.all([
        api.listJobRequirements(),
        api.listDepartments(),
      ]);

      setRequirements(requirementsData);
      setDepartments(departmentsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDepartmentId("");
    setPosition("");
    setRequiredSkills("");
    setPreferredSkills("");
    setEditingRequirement(null);
    setError("");
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (requirement) => {
    setEditingRequirement(requirement);

    setDepartmentId(requirement.department_id || "");
    setPosition(requirement.position || "");

    setRequiredSkills(
      Array.isArray(requirement.required_skills)
        ? requirement.required_skills.join(", ")
        : ""
    );

    setPreferredSkills(
      Array.isArray(requirement.preferred_skills)
        ? requirement.preferred_skills.join(", ")
        : ""
    );

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!departmentId || !position.trim()) {
      setError("Department and position are required.");
      return;
    }

    const payload = {
      department_id: departmentId,
      position: position.trim(),
      required_skills: requiredSkills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),

      preferred_skills: preferredSkills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
    };

    try {
      setSaving(true);
      setError("");

      if (editingRequirement) {
        await api.updateJobRequirement(
          editingRequirement.requirement_id,
          payload
        );
      } else {
        await api.createJobRequirement(payload);
      }

      await loadData();
      closeModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this job requirement?"
    );

    if (!confirmed) return;

    try {
      await api.deleteJobRequirement(id);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="text-slate-600">
          Loading job requirements...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Positions / Job Requirements
          </h1>

          <p className="text-slate-500 mt-2">
            Define the skills and requirements for each position.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-medium"
        >
          + Add Job Requirement
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Requirements */}
      {requirements.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <h2 className="text-lg font-semibold text-slate-800">
            No job requirements yet
          </h2>

          <p className="text-slate-500 mt-2">
            Add a position to start defining recruitment requirements.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requirements.map((requirement) => (
            <div
              key={requirement.requirement_id}
              className="bg-white border border-slate-200 rounded-xl p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    {requirement.position}
                  </h2>

                  <p className="text-blue-600 font-medium mt-1">
                    {requirement.department}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => openEditModal(requirement)}
                    className="border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      handleDelete(requirement.requirement_id)
                    }
                    className="border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Required Skills */}
              <div className="mt-5">
                <h3 className="font-semibold text-slate-700 mb-2">
                  Required Skills
                </h3>

                <div className="flex flex-wrap gap-2">
                  {requirement.required_skills?.length > 0 ? (
                    requirement.required_skills.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400">
                      No required skills
                    </span>
                  )}
                </div>
              </div>

              {/* Preferred Skills */}
              <div className="mt-5">
                <h3 className="font-semibold text-slate-700 mb-2">
                  Preferred Skills
                </h3>

                <div className="flex flex-wrap gap-2">
                  {requirement.preferred_skills?.length > 0 ? (
                    requirement.preferred_skills.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400">
                      No preferred skills
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b">
              <h2 className="text-xl font-bold text-slate-800">
                {editingRequirement
                  ? "Edit Job Requirement"
                  : "Add Job Requirement"}
              </h2>

              <p className="text-slate-500 mt-1">
                Define the requirements for this position.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-5">
                {/* Department */}
                <div>
                  <label className="block font-medium text-slate-700 mb-2">
                    Department
                  </label>

                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">
                      Select a department
                    </option>

                    {departments.map((department) => (
                      <option
                        key={department.department_id}
                        value={department.department_id}
                      >
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Position */}
                <div>
                  <label className="block font-medium text-slate-700 mb-2">
                    Position
                  </label>

                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="e.g. Python Developer"
                    className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Required Skills */}
                <div>
                  <label className="block font-medium text-slate-700 mb-2">
                    Required Skills
                  </label>

                  <input
                    type="text"
                    value={requiredSkills}
                    onChange={(e) => setRequiredSkills(e.target.value)}
                    placeholder="Python, FastAPI, SQL, Git"
                    className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <p className="text-xs text-slate-400 mt-1">
                    Separate skills with commas.
                  </p>
                </div>

                {/* Preferred Skills */}
                <div>
                  <label className="block font-medium text-slate-700 mb-2">
                    Preferred Skills
                  </label>

                  <input
                    type="text"
                    value={preferredSkills}
                    onChange={(e) => setPreferredSkills(e.target.value)}
                    placeholder="Docker, AWS, React"
                    className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <p className="text-xs text-slate-400 mt-1">
                    Separate skills with commas.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="border border-slate-300 px-5 py-2.5 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingRequirement
                    ? "Update Requirement"
                    : "Add Requirement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobRequirements;