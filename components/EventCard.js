import Link from "next/link";

export default function EventCard({ event }) {
  return (
    <div className="p-4 bg-white rounded-lg shadow hover:shadow-lg transition">
      <h2 className="text-xl font-semibold">{event.title}</h2>
      <p className="text-gray-500 capitalize">{event.type} event</p>
      <Link href={`/dashboard/user`} className="mt-2 inline-block text-orange-600 font-medium">
        View Event
      </Link>
    </div>
  );
}