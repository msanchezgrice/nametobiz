export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          NametoBiz Test Page
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Deployment is working! 🎉
        </p>
        <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          <ul className="text-left space-y-2">
            <li>✅ Next.js App Deployed</li>
            <li>✅ Tailwind CSS Working</li>
            <li>✅ API Routes Available</li>
            <li>📍 Timestamp: {new Date().toISOString()}</li>
          </ul>
        </div>
        <div className="mt-8">
          <a 
            href="/"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Go to Main App →
          </a>
        </div>
      </div>
    </div>
  );
}
