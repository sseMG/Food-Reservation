import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";

const DEFAULT_CATEGORIES = ["Meals", "Snacks", "Beverages"];
// categories are provided by server via /categories

export default function EditItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [fields, setFields] = useState({ name: "", price: 0, category: "", stock: 0 });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [serverCategories, setServerCategories] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        // load menu items to gather categories and find this item
        let all = [];
        try {
          if (typeof api.getMenu === "function") {
            all = await api.getMenu(false);
          } else {
            const res = await api.get("/menu");
            all = Array.isArray(res) ? res : [];
          }
        } catch (e) {
          // ignore - keep all empty
          console.warn("Could not load menu list for categories", e);
        }

        // fetch server categories
        let storedList = [];
        try {
          const catData = await api.get('/categories');
          if (Array.isArray(catData)) storedList = catData.map(c => c.name);
        } catch (e) {
          storedList = [];
        }

        const fromMenu = Array.from(new Set((Array.isArray(all) ? all : []).map(i => {
          const c = i && i.category;
          return typeof c === 'string' ? c : (c && c.name) || null;
        }).filter(Boolean)));
        const merged = Array.from(new Set([...DEFAULT_CATEGORIES, ...storedList, ...fromMenu]));
        setCategories(merged);

        // find item by id
        const item = (Array.isArray(all) ? all : []).find(i => String(i.id) === String(id) || String(i._id) === String(id));
        if (item) {
          const itemCat = item && item.category;
          setFields(f => ({
            ...f,
            name: item.name ?? f.name,
            price: item.price ?? f.price,
            category: typeof itemCat === 'string' ? itemCat : (itemCat && itemCat.name) || f.category,
            stock: item.stock ?? f.stock,
            desc: item.description ?? item.desc ?? f.desc,
          }));
        } else {
          // if item not found in the menu list, try a single fetch
          try {
            const single = await api.get(`/menu/${id}`);
            if (single) {
              const singleCat = single && single.category;
              setFields(f => ({
                ...f,
                name: single.name ?? f.name,
                price: single.price ?? f.price,
                category: typeof singleCat === 'string' ? singleCat : (singleCat && singleCat.name) || f.category,
                stock: single.stock ?? f.stock,
                desc: single.description ?? single.desc ?? f.desc,
              }));
            }
          } catch (e) {
            // ignore
          }
        }
      } catch (err) {
        console.error("Failed to load item or categories", err);
      }
    };
    load();
  }, [id]);

  async function saveItem(fields, file) {
    try {
      const form = new FormData();
      if (fields.name !== undefined) form.append("name", fields.name);
      if (fields.price !== undefined) form.append("price", String(fields.price));
      if (fields.category !== undefined) form.append("category", fields.category);
      if (fields.stock !== undefined) form.append("stock", String(fields.stock));
      if (fields.desc !== undefined) form.append("desc", fields.desc);
      if (file) form.append("image", file); // backend expects "image"
      await api.putForm(`/menu/${id}`, form);
      // notify other pages to refresh their menu
      try { window.dispatchEvent(new Event("menu:updated")); } catch {}
      alert("Saved");
      navigate("/admin/shop");
    } catch (err) {
      console.error("Save failed", err);
      alert((err && err.message) || "Failed to save item");
    }
  }

  return (
    <div className="p-4 max-w-xl">
      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={fields.name}
          onChange={e => setFields(f => ({...f, name: e.target.value}))}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-sm font-medium mb-1">Price</label>
          <input
            type="number"
            className="w-full border rounded px-3 py-2"
            value={fields.price}
            onChange={e => setFields(f => ({...f, price: Number(e.target.value)}))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Stock</label>
          <input
            type="number"
            className="w-full border rounded px-3 py-2"
            value={fields.stock}
            onChange={e => setFields(f => ({...f, stock: Number(e.target.value)}))}
          />
        </div>
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Category</label>
        <select
          className="w-full border rounded px-3 py-2"
          value={fields.category}
          onChange={e => setFields(f => ({...f, category: e.target.value}))}
        >
          <option value="">(none)</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Image</label>
        <input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} />
      </div>

      <div className="flex gap-2">
        <button
          onClick={async () => {
            setSaving(true);
            await saveItem(fields, file);
            setSaving(false);
          }}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 border rounded"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}