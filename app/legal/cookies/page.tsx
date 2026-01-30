import Link from "next/link";

export default function CookiePolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Cookie Policy (Draft)
        </h1>
        <p className="text-sm text-slate-500">
          This is a placeholder cookie policy for development. It is not
          legal advice. Before launching PriceLance publicly, replace this
          page with a real policy written or reviewed by a legal
          professional.
        </p>
      </header>

      <section className="space-y-2 text-sm leading-relaxed text-slate-700">
        <h2 className="text-lg font-semibold">1. What are cookies?</h2>
        <p>
          Cookies are small text files stored on your device by your
          browser. They help websites remember information about your visit,
          such as your preferences or settings.
        </p>
      </section>

      <section className="space-y-2 text-sm leading-relaxed text-slate-700">
        <h2 className="text-lg font-semibold">2. How PriceLance uses cookies</h2>
        <p>
          During development, PriceLance only uses essential cookies needed
          to operate the site (for example, remembering that you accepted
          this cookie banner).
        </p>
        <p>
          In the future, we may add optional analytics cookies to understand
          how the service is used and to improve it. Those will only be
          activated after you give explicit consent.
        </p>
      </section>

      <section className="space-y-2 text-sm leading-relaxed text-slate-700">
        <h2 className="text-lg font-semibold">3. Managing your choices</h2>
        <p>
          You can manage your cookie choice at any time by using the{" "}
          <span className="font-medium">&quot;Cookies&quot;</span> button in
          the top-right corner of the site. This will reopen the cookie
          preferences window where you can review or update your choice.
        </p>
      </section>

      <section className="space-y-2 text-sm leading-relaxed text-slate-700">
        <h2 className="text-lg font-semibold">4. Contact</h2>
        <p>
          For questions about cookies or privacy on PriceLance, please
          contact us using the details provided on the{" "}
          <Link href="/help" className="underline">
            Help &amp; FAQ
          </Link>{" "}
          page.
        </p>
      </section>
    </main>
  );
}
