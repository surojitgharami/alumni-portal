function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="text-sm text-gray-600">Alumni Portal</span>
          </div>
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Alumni Portal. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
