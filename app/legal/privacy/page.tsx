export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Politica de confidențialitate (Draft)
        </h1>
        <p className="text-sm text-slate-500">
          Aceasta este o politică de confidențialitate provizorie pentru
          dezvoltare. Înainte de lansare, înlocuiește conținutul cu un document
          complet revizuit de un specialist juridic.
        </p>
      </header>

      <section className="space-y-2 text-sm leading-relaxed text-slate-700">
        <h2 className="text-lg font-semibold">1. Date colectate</h2>
        <p>
          În faza actuală de dezvoltare, PriceLance colectează doar date
          tehnice minime necesare pentru funcționarea site-ului și cookie-uri
          esențiale (de ex. pentru a reține acceptul cookie-urilor).
        </p>
      </section>

      <section className="space-y-2 text-sm leading-relaxed text-slate-700">
        <h2 className="text-lg font-semibold">2. Scopul folosirii datelor</h2>
        <p>
          Datele sunt folosite pentru a afișa site-ul corect, pentru a menține
          securitatea și pentru a îmbunătăți experiența utilizatorului.
          În viitor este posibil să adăugăm analitice, care vor fi folosite
          doar cu consimțământul tău.
        </p>
      </section>
    </main>
  );
}
