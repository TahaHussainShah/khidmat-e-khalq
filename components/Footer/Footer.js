// components/Footer/Footer.js

export default function Footer() {
  return (
    <footer className="bg-brand-dark text-gray-400 text-sm py-8 mt-auto border-t border-brand-mid">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌿</span>
          <span className="font-display text-brand-lime font-semibold">Khidmat e Khalq</span>
        </div>
        <p className="text-center text-xs text-gray-500">
          Civic Issue Reporting Platform · Department of ADCS · Educational Project
        </p>
        <p className="text-xs text-gray-600">
          Built with Next.js &amp; Firebase
        </p>
      </div>
    </footer>
  )
}
