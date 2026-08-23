"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ImagePlus, Megaphone, Send, X } from "lucide-react";
import { InlineLoader } from "@/components/dashboard/InlineLoader";

type Announcement = {
  id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  publishDate: string;
  createdAt?: string;
};

function formatLongDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Shared announcements panel with posting + viewing.
 * Used by roles allowed to manage announcements (admin, doctor, nurse, ...).
 * Posts to /api/admin/announcements which scopes to the user's own barangay.
 */
export function AnnouncementsManager({
  subtitle = "Post and view announcements for your barangay.",
}: {
  subtitle?: string;
}) {
  const today = new Date().toISOString().split("T")[0];

  const [selectedDate, setSelectedDate] = useState(today);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: "",
    content: "",
    imageUrl: "",
    publishDate: today,
  });

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/admin/announcements?date=${selectedDate}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to load announcements.");
        return;
      }

      setAnnouncements(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const handleImageUpload = (file: File | null) => {
    if (!file) return;
    setImageFile(file);
    setForm((prev) => ({ ...prev, imageUrl: URL.createObjectURL(file) }));
  };

  const clearImage = () => {
    setImageFile(null);
    setForm((prev) => ({ ...prev, imageUrl: "" }));
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setPosting(true);
    setMessage("");
    setError("");

    try {
      if (!form.title.trim() || !form.content.trim()) {
        setError("Title and content are required.");
        return;
      }

      let finalImageUrl = "";

      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append("file", imageFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadData,
        });
        const uploadJson = await uploadRes.json();

        if (!uploadRes.ok) {
          setError(uploadJson.error || "Failed to upload image.");
          return;
        }
        finalImageUrl = uploadJson.imageUrl;
      }

      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, imageUrl: finalImageUrl }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to post announcement.");
        return;
      }

      setMessage("Announcement posted successfully.");
      setForm({ title: "", content: "", imageUrl: "", publishDate: today });
      setImageFile(null);
      setSelectedDate(json.publishDate ? json.publishDate.split("T")[0] : form.publishDate);
      await fetchAnnouncements();
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the server.");
    } finally {
      setPosting(false);
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
            <h2 className="text-lg font-black text-slate-900">
              Health Center Announcements
            </h2>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>

        {/* Create form */}
        <form
          onSubmit={handlePost}
          className="rounded-[24px] border border-sky-200 bg-[#EFF6FF] p-5"
        >
          <h3 className="text-xl font-extrabold text-slate-900">New Announcement</h3>

          <div className="mt-4 grid gap-4">
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
                Title
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Announcement title"
                className="min-h-[48px] w-full rounded-2xl border border-sky-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
                Content
              </label>
              <textarea
                value={form.content}
                onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                rows={4}
                placeholder="Write the announcement details..."
                className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-sky-500"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
                  Publish Date
                </label>
                <input
                  type="date"
                  value={form.publishDate}
                  onChange={(e) => setForm((p) => ({ ...p, publishDate: e.target.value }))}
                  className="min-h-[48px] w-full rounded-2xl border border-sky-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
                  Image (optional)
                </label>
                <label className="flex min-h-[48px] cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-sky-300 bg-white px-4 text-sm font-semibold text-sky-600 hover:bg-sky-50">
                  <ImagePlus className="h-4 w-4" />
                  {imageFile ? "Change image" : "Upload image"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {form.imageUrl && (
              <div className="relative w-fit">
                <img
                  src={form.imageUrl}
                  alt="Preview"
                  className="max-h-48 rounded-2xl border border-sky-200 object-contain"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-600 shadow ring-1 ring-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {error && (
              <p className="text-sm font-semibold text-red-600">{error}</p>
            )}
            {message && (
              <p className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                {message}
              </p>
            )}

            <div>
              <button
                type="submit"
                disabled={posting}
                className="inline-flex min-h-[50px] items-center gap-2 rounded-2xl bg-[#0EA5E9] px-5 py-3 text-sm font-bold text-white transition hover:bg-sky-600 disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {posting ? "Posting..." : "Post Announcement"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Viewer */}
      <div className="rounded-[24px] border border-sky-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 rounded-[24px] border border-sky-200 bg-[#EFF6FF] p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900">
              Announcements for {formatLongDate(selectedDate)}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Use the calendar to view announcements for another date.
            </p>
          </div>

          <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-sky-200">
            <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
              Calendar Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="min-h-[46px] rounded-xl border border-sky-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {loading ? (
          <InlineLoader label="Loading announcements..." />
        ) : announcements.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-sky-200 bg-gradient-to-br from-sky-50 to-white p-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-sky-600 shadow-sm ring-1 ring-sky-200">
              <Megaphone className="h-9 w-9" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">No announcement</h3>
            <p className="mt-2 text-sm text-slate-500">
              There is no announcement for this selected date.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {announcements.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-[26px] border border-sky-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                {item.imageUrl ? (
                  <div className="bg-slate-100">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="max-h-[360px] w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-44 items-center justify-center bg-gradient-to-br from-sky-50 to-white text-sky-600">
                    <Megaphone className="h-14 w-14" />
                  </div>
                )}

                <div className="p-5">
                  <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-sky-600">
                    {formatLongDate(item.publishDate)}
                  </span>
                  <h3 className="mt-3 text-2xl font-black text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
                    {item.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
