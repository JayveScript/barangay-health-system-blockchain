"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Archive,
  CheckCircle2,
  Clock,
  Megaphone,
  Pencil,
  RotateCcw,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { InlineLoader } from "@/components/dashboard/InlineLoader";

type Announcement = {
  id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  publishDate: string;
  status?: string;
  authorName?: string | null;
  authorRole?: string | null;
};

type Filter = "ALL" | "PENDING" | "PUBLISHED" | "ARCHIVED";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "PENDING", label: "Pending" },
  { id: "PUBLISHED", label: "Published" },
  { id: "ARCHIVED", label: "Archived" },
];

function longDate(v: string) {
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? v
    : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700",
    PUBLISHED: "bg-emerald-100 text-emerald-700",
    ARCHIVED: "bg-slate-200 text-slate-500",
  };
  const s = status ?? "PUBLISHED";
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${map[s] ?? map.PUBLISHED}`}>
      {s}
    </span>
  );
}

export function AnnouncementsAdmin() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [filter, setFilter] = useState<Filter>("PENDING");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Announcement | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const q = filter === "ALL" ? "" : `&status=${filter}`;
      const res = await fetch(`/api/admin/announcements?manage=1${q}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to load announcements.");
        return;
      }
      setItems(Array.isArray(json) ? json : []);
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (id: string, body: Record<string, unknown>) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) await load();
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
      if (res.ok) await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5 pb-4">
      <div className="rounded-[24px] border border-sky-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
            <Megaphone className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-black text-slate-900">Manage Announcements</h2>
            <p className="text-sm text-slate-500">
              Review staff submissions, then publish, edit, archive, or delete.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                filter === f.id ? "bg-[#0EA5E9] text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>
      )}

      {loading ? (
        <InlineLoader label="Loading announcements..." />
      ) : items.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-sky-200 bg-gradient-to-br from-sky-50 to-white p-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-sky-600 shadow-sm ring-1 ring-sky-200">
            <Megaphone className="h-9 w-9" />
          </div>
          <h3 className="text-xl font-black text-slate-900">Nothing here</h3>
          <p className="mt-2 text-sm text-slate-500">No {filter === "ALL" ? "" : filter.toLowerCase()} announcements.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div key={a.id} className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={a.status} />
                <span className="text-xs font-bold text-slate-400">{longDate(a.publishDate)}</span>
                {a.status === "PENDING" && <Clock className="h-3.5 w-3.5 text-amber-500" />}
              </div>
              <h3 className="mt-2 text-lg font-black text-slate-900">{a.title}</h3>
              <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm text-slate-600">{a.content}</p>
              {(a.authorName || a.authorRole) && (
                <p className="mt-2 text-xs font-semibold text-slate-400">
                  Submitted by {a.authorName || "Staff"}
                  {a.authorRole ? ` · ${a.authorRole}` : ""}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                {a.status !== "PUBLISHED" && (
                  <button
                    type="button"
                    disabled={busyId === a.id}
                    onClick={() => patch(a.id, { status: "PUBLISHED" })}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    <Send className="h-3.5 w-3.5" /> {a.status === "ARCHIVED" ? "Restore & Publish" : "Approve & Publish"}
                  </button>
                )}
                <button
                  type="button"
                  disabled={busyId === a.id}
                  onClick={() => setEditing(a)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-black text-sky-700 hover:bg-sky-50 disabled:opacity-60"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                {a.status === "PUBLISHED" && (
                  <button
                    type="button"
                    disabled={busyId === a.id}
                    onClick={() => patch(a.id, { status: "ARCHIVED" })}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                  >
                    <Archive className="h-3.5 w-3.5" /> Archive
                  </button>
                )}
                {a.status === "ARCHIVED" && (
                  <button
                    type="button"
                    disabled={busyId === a.id}
                    onClick={() => patch(a.id, { status: "PENDING" })}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Move to Pending
                  </button>
                )}
                <button
                  type="button"
                  disabled={busyId === a.id}
                  onClick={() => remove(a.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-black text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <EditModal
          announcement={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function EditModal({
  announcement,
  onClose,
  onSaved,
}: {
  announcement: Announcement;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(announcement.title);
  const [content, setContent] = useState(announcement.content);
  const [publishDate, setPublishDate] = useState(announcement.publishDate.split("T")[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/announcements/${announcement.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, publishDate }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error || "Failed to save.");
        return;
      }
      onSaved();
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:p-4">
      <div className="flex h-full w-full max-w-lg flex-col overflow-hidden border border-sky-200 bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-[28px]">
        <div className="flex items-center justify-between border-b border-sky-200 bg-sky-50/60 p-4 sm:p-5">
          <h3 className="text-lg font-black text-slate-900">Edit Announcement</h3>
          <button onClick={onClose} className="rounded-xl bg-white p-2 text-slate-500 ring-1 ring-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="min-h-[46px] w-full rounded-2xl border border-sky-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Publish Date</label>
            <input
              type="date"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              className="min-h-[46px] w-full rounded-2xl border border-sky-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none focus:border-sky-500"
            />
          </div>
          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-sky-200 bg-white p-4">
          <button onClick={onClose} className="min-h-[44px] rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-[#0EA5E9] px-5 text-sm font-bold text-white hover:bg-sky-600 disabled:opacity-60"
          >
            <CheckCircle2 className="h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
