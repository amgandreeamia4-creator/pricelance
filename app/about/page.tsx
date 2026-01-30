export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Despre PriceLance
        </h1>
        <p className="text-sm text-slate-500">
          Aceasta este o pagină de prezentare de bază pentru dezvoltare.
          Înainte de lansarea publică poți actualiza conținutul cu o descriere
          reală a serviciului.
        </p>
      </header>

      <section className="space-y-2 text-sm leading-relaxed text-slate-700">
        <p>
          PriceLance este un serviciu de informare care ajută utilizatorii
          să compare prețuri pentru produse din mai mulți comercianți online.
        </p>
        <p>
          Această pagină este un placeholder și poate fi extinsă cu informații
          despre echipă, misiune, istoric etc.
        </p>
      </section>
    </main>
  );
}
