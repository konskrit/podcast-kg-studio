import { redirect } from "next/navigation";

import { auth, signOut } from "@/auth";

/** Session gate uses cookies — allow blocking render under Cache Components. */
export const instant = false;

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-2xl flex-col gap-8 px-6 py-16">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
          Podcast KG Studio
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
          Library
        </h1>
        <p className="mt-2 text-zinc-600">
          Signed in as {session.user.email}. Sources land here in the next
          slices.
        </p>
      </div>

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <button
          type="submit"
          className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
