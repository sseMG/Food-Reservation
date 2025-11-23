const path = require("path");
const fs = require("fs-extra");
const mongoose = require("mongoose");
const RepositoryFactory = require("../repositories/repository.factory");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

const REPORTS_DIR = path.join(__dirname, "..", "reports");
fs.ensureDirSync(REPORTS_DIR);

/**
 * Compute monthly report data for given month/year.
 * month: 1-12, year: 4-digit
 */
async function computeMonthlyReport(month, year) {
  // Normalize month/year
  const m = Number(month) || (new Date().getMonth() + 1);
  const y = Number(year) || new Date().getFullYear();
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);

  const reservationRepo = RepositoryFactory.getReservationRepository();
  const menuRepo = RepositoryFactory.getMenuRepository();

  // Get all reservations and filter by date range
  const allReservations = await reservationRepo.findAll({});
  const filtered = allReservations.filter((r) => {
    const created = new Date(r.createdAt);
    return created >= start && created < end && !["Pending", "Rejected"].includes(r.status);
  });

  const totalEarnings = filtered.reduce((s, r) => s + (Number(r.total) || 0), 0);
  const totalOrders = filtered.length;

  const prodMap = {};
  const catMap = {};
  const menuList = await menuRepo.findAll({ includeDeleted: 'true' });
  
  for (const r of filtered) {
    for (const it of r.items || []) {
      const id = it.id || it.itemId || String(Math.random());
      const menuItem = menuList.find((m) => String(m.id) === String(id));
      const name = it.name || (menuItem && menuItem.name) || id;
      const qty = Number(it.qty || it.quantity || 0);
      const price = Number(it.price || it.unitPrice || (menuItem && menuItem.price) || 0);
      const cat = it.category || (menuItem && menuItem.category) || "Uncategorized";

      prodMap[id] = prodMap[id] || { itemId: id, name, category: cat, qty: 0, revenue: 0 };
      prodMap[id].qty += qty;
      prodMap[id].revenue += qty * price;

      catMap[cat] = catMap[cat] || { category: cat, qty: 0, revenue: 0 };
      catMap[cat].qty += qty;
      catMap[cat].revenue += qty * price;
    }
  }

  const topProducts = Object.values(prodMap).sort((a, b) => b.qty - a.qty).slice(0, 20);
  const topCategories = Object.values(catMap).sort((a, b) => b.revenue - a.revenue).slice(0, 20);

  return {
    month: m,
    year: y,
    totalEarnings,
    totalOrders,
    topProducts,
    topCategories,
  };
}

/**
 * GET /reports/monthly?month=MM&year=YYYY
 */
exports.monthly = async (req, res) => {
  try {
    const { month, year } = req.query || {};
    const data = await computeMonthlyReport(month, year);
    res.json(data);
  } catch (err) {
    console.error("[REPORTS] monthly error:", err);
    res.status(500).json({ error: "Failed to compute report" });
  }
};

/**
 * GET /reports/export?month=MM&year=YYYY&format=xlsx|pdf
 * Responds with a file attachment (binary).
 */
exports.exportMonthly = async (req, res) => {
  try {
    const month = Number(req.query.month || 0);
    const year = Number(req.query.year || 0);
    const format = (req.query.format || "xlsx").toLowerCase();

    // helper: is in requested month
    const inMonth = (iso) => {
      if (!iso) return false;
      const d = new Date(iso);
      if (isNaN(d)) return false;
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    };

    // load reservations
    const reservationRepo = RepositoryFactory.getReservationRepository();
    const allReservations = await reservationRepo.findAll({});
    const reservations = allReservations.filter((r) => inMonth(r.createdAt || r.date || r.submittedAt));

    // load menu map to compute names/prices if needed
    const menuRepo = RepositoryFactory.getMenuRepository();
    const allMenu = await menuRepo.findAll({ includeDeleted: 'true' });
    const menuMap = {};
    for (const m of allMenu || []) {
      menuMap[String(m.id)] = m;
    }

    // build rows
    const rows = (reservations || []).map((r) => {
      const items = Array.isArray(r.items)
        ? r.items
            .map((it) => {
              const mid = String(it.id ?? it._id ?? "");
              const m = menuMap[mid] || {};
              const name = it.name || m.name || `#${mid}`;
              const qty = Number(it.qty || it.quantity || 0);
              const price = Number(it.price ?? m.price ?? 0);
              return `${name} x${qty} (${(price * qty).toFixed(2)})`;
            })
            .join("; ")
        : (r.items && JSON.stringify(r.items)) || "";
      const total = Number(r.total ?? r.amount ?? r.totalAmount ?? 0) || 0;
      return {
        id: r.id ?? r._id ?? r.reservationId ?? "",
        user: r.userId ?? r.user ?? r.userEmail ?? "",
        status: r.status ?? r.state ?? "",
        createdAt: r.createdAt ?? r.date ?? r.submittedAt ?? "",
        items,
        total,
      };
    });

    if (format === "xlsx") {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Reservations");
      ws.columns = [
        { header: "Reservation ID", key: "id", width: 20 },
        { header: "User", key: "user", width: 25 },
        { header: "Status", key: "status", width: 15 },
        { header: "Created At", key: "createdAt", width: 20 },
        { header: "Items", key: "items", width: 80 },
        { header: "Total", key: "total", width: 12 },
      ];
      rows.forEach((r) => ws.addRow(r));
      const buffer = await wb.xlsx.writeBuffer();
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="report_${String(month).padStart(2, "0")}_${year}.xlsx"`);
      return res.send(Buffer.from(buffer));
    }

    if (format === "pdf") {
      const doc = new PDFDocument({ margin: 30, size: "A4" });
      const filename = `report_${String(month).padStart(2, "0")}_${year}.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      // stream PDF to response
      doc.pipe(res);
      doc.fontSize(16).text(`Monthly Report — ${String(month).padStart(2, "0")}/${year}`, { align: "center" });
      doc.moveDown();
      doc.fontSize(10);
      for (const r of rows) {
        doc.font("Helvetica-Bold").text(`Reservation: ${r.id} — ${r.status}`, { continued: false });
        doc.font("Helvetica").text(`User: ${r.user}  Created: ${r.createdAt}  Total: ${r.total.toFixed(2)}`);
        doc.text(`Items: ${r.items}`);
        doc.moveDown(0.5);
      }
      doc.end();
      return;
    }

    // fallback: return JSON url or CSV
    // produce CSV
    const csvHeader = ["Reservation ID,User,Status,Created At,Items,Total"].join(",");
    const csvRows = rows.map((r) => {
      const esc = (s) => `"${String(s || "").replace(/"/g, '""')}"`;
      return [esc(r.id), esc(r.user), esc(r.status), esc(r.createdAt), esc(r.items), esc(r.total)].join(",");
    });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="report_${String(month).padStart(2, "0")}_${year}.csv"`);
    return res.send([csvHeader].concat(csvRows).join("\n"));
  } catch (err) {
    console.error("[REPORTS] export error:", err);
    return res.status(500).json({ error: "Export failed", details: String(err.message || err) });
  }
};