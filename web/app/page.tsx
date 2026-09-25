 import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#fffaf5] text-slate-900">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-2xl font-bold text-[#4b2aad]">
          DayOut
        </Link>

        <Link
          href="/plan"
          className="rounded-xl border border-[#4b2aad] px-4 py-2 text-sm font-semibold text-[#4b2aad] transition hover:bg-purple-100"
        >
          Plan my day
        </Link>
      </nav>

      <section className="mx-auto flex max-w-6xl flex-col justify-center px-6 pb-16 pt-12 md:min-h-[75vh]">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">
          Tourism Solutions • Build for Use
        </p>

        <h1 className="max-w-4xl text-5xl font-bold tracking-tight text-[#4b2aad] md:text-7xl">
          What are we doing today?
        </h1>

        <p className="mt-6 max-w-2xl text-xl leading-8 text-slate-600">
          DayOut creates complete, realistic day plans based on your location,
          budget, group size, available time and vibe.
        </p>

        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-500">
          Stop searching across TikTok, Google Maps, Instagram and group chats.
          Tell us what your day looks like and get options you can actually use.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/plan"
            className="rounded-xl bg-[#4b2aad] px-6 py-3 font-semibold text-white transition hover:bg-[#3d228d]"
          >
            Plan my day
          </Link>

          <Link
            href="/results?location=Johannesburg&budget=800&groupSize=4&time=360&vibes=chill,foodie"
            className="rounded-xl border border-[#4b2aad] px-6 py-3 font-semibold text-[#4b2aad] transition hover:bg-purple-100"
          >
            Try a sample plan
          </Link>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 md:grid-cols-5">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <p className="text-2xl">📍</p>
            <p className="mt-2 font-semibold">Location</p>
            <p className="mt-1 text-sm text-slate-500">Where you are starting</p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <p className="text-2xl">💸</p>
            <p className="mt-2 font-semibold">Budget</p>
            <p className="mt-1 text-sm text-slate-500">What you can spend</p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <p className="text-2xl">👥</p>
            <p className="mt-2 font-semibold">People</p>
            <p className="mt-1 text-sm text-slate-500">Who is coming along</p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <p className="text-2xl">⏱</p>
            <p className="mt-2 font-semibold">Time</p>
            <p className="mt-1 text-sm text-slate-500">How long you have</p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <p className="text-2xl">✨</p>
            <p className="mt-2 font-semibold">Vibe</p>
            <p className="mt-1 text-sm text-slate-500">Chill, foodie, artsy and more</p>
          </div>
        </div>
      </section>
    </main>
  );
}
