import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/adminavbar";
import {
  Edit,
  Trash2,
  PlusCircle,
  RefreshCw,
  Lock,
  AlertTriangle,
  X,
  Check,
} from "lucide-react";
import AdminBottomNav from "../../components/mobile/AdminBottomNav";
import { api } from "../../lib/api";
import { refreshSessionForProtected } from "../../lib/auth";

const DEFAULT_CATEGORIES = ["Meals", "Snacks", "Beverages"];
const STORAGE_KEY = "admin_categories_v1";

const FOOD_ICONS = [
  "🍚",
  "🍱",
  "🍔",
  "🍟",
  "🍕",
  "🌭",
  "🥪",
  "🌮",
  "🍣",
  "🍜",
  "🍩",
  "🍪",
  "🧁",
  "🍰",
  "🍦",
  "🥤",
  "🧃",
  "☕️",
  "🍺",
  "🍽️",
];

export default function AdminCategories() {
  const navigate = useNavigate();
  useEffect(() => {
    (async () => {
      await refreshSessionForProtected({ navigate, requiredRole: "admin" });
    })();
  }, [navigate]);

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [iconsMap, setIconsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("📦");

  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Load items and categories
  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getMenu(false);
      setItems(Array.isArray(data) ? data : []);
      // Extract unique categories from items
      const uniqueCats = new Set((Array.isArray(data) ? data : []).map((i) => i.category).filter(Boolean));

      // Read stored categories/icons from localStorage
      const stored = (() => {
        try {
          return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        } catch (e) {
          return {};
        }
      })();

      const storedList = Array.isArray(stored.list) ? stored.list : [];
      const storedIcons = stored.icons || {};

      // Merge: defaults -> stored custom -> categories from items
      const merged = new Set([...DEFAULT_CATEGORIES, ...storedList, ...Array.from(uniqueCats)]);
      setCategories(Array.from(merged));
      setIconsMap({ ...storedIcons });
    } catch (e) {
      console.error(e);
      alert("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  const saveStorage = (cats, icons) => {
    try {
      const custom = (cats || categories).filter((c) => !DEFAULT_CATEGORIES.includes(c));
      const payload = { list: custom, icons: icons || iconsMap };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error("Could not save categories to storage", e);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Count items in each category
  const getItemCount = (catName) => {
    return items.filter((i) => i.category === catName).length;
  };

  // Check if category is default (cannot delete, can only edit icon)
  const isDefaultCategory = (catName) => {
    return DEFAULT_CATEGORIES.includes(catName);
  };

  // Check if custom category can be deleted (no items in it)
  const canDeleteCategory = (catName) => {
    return !isDefaultCategory(catName) && getItemCount(catName) === 0;
  };

  // Start editing a category
  const startEdit = (catName, icon) => {
    setEditingId(catName);
    setEditName(catName);
    setEditIcon(icon || iconsMap[catName] || "📦");
  };

  // Save category edit
  const saveEdit = async (oldName) => {
    if (!editName.trim()) {
      alert("Category name cannot be empty.");
      return;
    }

    // If name changed and it's a custom category, validate it
    if (!isDefaultCategory(oldName) && editName !== oldName) {
      if (categories.includes(editName)) {
        alert("Category already exists.");
        return;
      }
    }

    setBusyId(oldName);
    try {
      // Update all items with the old category name to the new name
      if (editName !== oldName) {
        // If renaming a default category, don't allow rename
        if (isDefaultCategory(oldName)) {
          alert("Default categories cannot be renamed.");
          return;
        }

        const itemsToUpdate = items.filter((i) => i.category === oldName);
        for (const item of itemsToUpdate) {
          // update backend
          try {
            await api.put(`/admin/menu/${item.id}`, { category: editName });
          } catch (e) {
            // ignore individual failures but log
            console.warn("Failed to update item category", item.id, e);
          }
        }

        // Update category list and items in state
        const newCategories = categories.map((c) => (c === oldName ? editName : c));
        setCategories(newCategories);
        setItems((prev) => prev.map((i) => (i.category === oldName ? { ...i, category: editName } : i)));

        // move icon mapping key
        const newIcons = { ...iconsMap };
        if (newIcons[oldName]) {
          newIcons[editName] = newIcons[oldName];
          delete newIcons[oldName];
        }
        newIcons[editName] = editIcon || newIcons[editName] || "📦";
        setIconsMap(newIcons);
        saveStorage(newCategories, newIcons);
      } else {
        // only icon changed
        const newIcons = { ...iconsMap, [oldName]: editIcon || iconsMap[oldName] || "📦" };
        setIconsMap(newIcons);
        saveStorage(categories, newIcons);
      }

      setEditingId(null);
      setEditName("");
      setEditIcon("");
    } catch (e) {
      console.error(e);
      alert("Failed to update category.");
    } finally {
      setBusyId(null);
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditIcon("");
  };

  // Delete custom category
  const deleteCategory = async (catName) => {
    if (!canDeleteCategory(catName)) {
      alert("Cannot delete category with items.");
      return;
    }

    setBusyId(catName);
    setDeleteConfirm(null);
    try {
      const newCategories = categories.filter((c) => c !== catName);
      setCategories(newCategories);
      const newIcons = { ...iconsMap };
      delete newIcons[catName];
      setIconsMap(newIcons);
      saveStorage(newCategories, newIcons);
      alert("Category deleted successfully.");
    } catch (e) {
      console.error(e);
      alert("Failed to delete category.");
    } finally {
      setBusyId(null);
    }
  };

  // Add new category
  const addCategory = async () => {
    if (!newCatName.trim()) {
      alert("Category name cannot be empty.");
      return;
    }

    if (categories.includes(newCatName)) {
      alert("Category already exists.");
      return;
    }

    setBusyId("new");
    try {
      const next = [...categories, newCatName];
      setCategories(next);
      const newIcons = { ...iconsMap, [newCatName]: newCatIcon || "📦" };
      setIconsMap(newIcons);
      saveStorage(next, newIcons);
      setNewCatName("");
      setNewCatIcon("📦");
      setShowAddForm(false);
      alert("Category added successfully.");
    } catch (e) {
      console.error(e);
      alert("Failed to add category.");
    } finally {
      setBusyId(null);
    }
  };

  // Group categories into default and custom
  const defaultCats = useMemo(
    () => categories.filter((c) => isDefaultCategory(c)),
    [categories]
  );

  const customCats = useMemo(
    () => categories.filter((c) => !isDefaultCategory(c)),
    [categories]
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Navbar />

      <main className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8 space-y-6">
        {/* Header */}
        <section className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Category Management
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Manage product categories and their icons
              </p>
            </div>

            <button
              onClick={load}
              disabled={loading}
              className="hidden md:inline-flex items-center gap-2 border px-3 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="text-xs text-gray-500">Total Categories</div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                {categories.length}
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="text-xs text-gray-500">Default Categories</div>
              <div className="text-xl sm:text-2xl font-bold text-blue-600 mt-1">
                {defaultCats.length}
              </div>
            </div>
          </div>
        </section>

        {/* Default Categories Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">
              Default Categories
            </h2>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
              Read-only
            </span>
          </div>

          <div className="space-y-2">
            {loading ? (
              <div className="bg-white rounded-lg border border-gray-100 p-6 text-center text-sm text-gray-500">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                Loading categories…
              </div>
            ) : defaultCats.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-100 p-6 text-center text-sm text-gray-500">
                No default categories found.
              </div>
              ) : (
              defaultCats.map((cat) => {
                const itemCount = getItemCount(cat);
                const isEditing = editingId === cat;

                return (
                  <div
                    key={cat}
                    className="bg-white rounded-lg border border-gray-100 p-4 flex items-center justify-between hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {isEditing ? (
                        <div className="w-40 grid grid-cols-6 gap-1">
                          {FOOD_ICONS.map((ic) => (
                            <button
                              key={ic}
                              type="button"
                              onClick={() => setEditIcon(ic)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${editIcon === ic ? 'ring-2 ring-blue-400' : 'bg-white'}`}
                            >
                              {ic}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg">
                          {iconsMap[cat] || "📦"}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            disabled
                            className="w-full px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium bg-gray-50 cursor-not-allowed"
                          />
                        ) : (
                          <h3 className="font-medium text-gray-900 truncate">
                            {cat}
                          </h3>
                        )}
                        <div className="text-xs text-gray-500 mt-0.5">
                          {itemCount} item{itemCount !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-3">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => saveEdit(cat)}
                            disabled={busyId === cat}
                            className="p-2 rounded-lg text-green-600 hover:bg-green-50 disabled:opacity-60 transition-colors"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            disabled={busyId === cat}
                            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-60 transition-colors"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(cat, iconsMap[cat])}
                            disabled={busyId === cat}
                            className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 disabled:opacity-60 transition-colors"
                            title="Edit icon only"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <div className="w-8 h-8 flex items-center justify-center text-gray-400 cursor-not-allowed">
                            <Lock className="w-4 h-4" />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Custom Categories Section */}
        {customCats.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Custom Categories
            </h2>

            <div className="space-y-2">
              {customCats.map((cat) => {
                const itemCount = getItemCount(cat);
                const isEditing = editingId === cat;
                const canDelete = canDeleteCategory(cat);

                return (
                  <div
                    key={cat}
                    className="bg-white rounded-lg border border-gray-100 p-4 flex items-center justify-between hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {isEditing ? (
                        <div className="w-40 grid grid-cols-6 gap-1">
                          {FOOD_ICONS.map((ic) => (
                            <button
                              key={ic}
                              type="button"
                              onClick={() => setEditIcon(ic)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${editIcon === ic ? 'ring-2 ring-blue-400' : 'bg-white'}`}
                            >
                              {ic}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg">
                          {iconsMap[cat] || "📦"}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <h3 className="font-medium text-gray-900 truncate">
                            {cat}
                          </h3>
                        )}
                        <div className="text-xs text-gray-500 mt-0.5">
                          {itemCount} item{itemCount !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-3">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => saveEdit(cat)}
                            disabled={busyId === cat}
                            className="p-2 rounded-lg text-green-600 hover:bg-green-50 disabled:opacity-60 transition-colors"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            disabled={busyId === cat}
                            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-60 transition-colors"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(cat, iconsMap[cat])}
                            disabled={busyId === cat}
                            className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 disabled:opacity-60 transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(cat)}
                            disabled={busyId === cat || !canDelete}
                            className={`p-2 rounded-lg transition-colors ${
                              canDelete
                                ? "text-red-600 hover:bg-red-50 disabled:opacity-60"
                                : "text-gray-400 cursor-not-allowed"
                            }`}
                            title={
                              canDelete
                                ? "Delete"
                                : "Cannot delete - items exist in this category"
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Add New Category Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Add Category</h2>

          {showAddForm ? (
            <div className="bg-white rounded-lg border border-gray-100 p-4 space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icon
                  </label>
                  <input
                    type="text"
                    value={newCatIcon}
                    onChange={(e) => setNewCatIcon(e.target.value)}
                    maxLength="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center text-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="📦"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use an emoji or character
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="e.g., Desserts"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={addCategory}
                  disabled={busyId === "new" || !newCatName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
                >
                  {busyId === "new" ? "Adding..." : "Add Category"}
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewCatName("");
                    setNewCatIcon("📦");
                  }}
                  disabled={busyId === "new"}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-60 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Add New Category
            </button>
          )}
        </section>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete Category?
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{deleteConfirm}</p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  This action cannot be undone. The category will be permanently
                  deleted.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={busyId === deleteConfirm}
                className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteCategory(deleteConfirm)}
                disabled={busyId === deleteConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60"
              >
                {busyId === deleteConfirm ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminBottomNav badgeCounts={{ orders: 0, topups: 0, lowStock: 0 }} />
    </div>
  );
}