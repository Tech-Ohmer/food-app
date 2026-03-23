import Link from 'next/link'

export default async function UnauthorizedPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; username?: string }>
}) {
  const { email, username } = await searchParams

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-500 text-sm mb-4">
          Your account does not have super admin access to OhmerEats.
        </p>
        {(email || username) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-5 text-left">
            <p className="text-xs font-semibold text-yellow-700 mb-1">Debug — add this to ADMIN_EMAILS or ADMIN_GITHUB_USERNAMES in Vercel:</p>
            {email && <p className="text-xs font-mono text-yellow-900">Email: <strong>{email}</strong></p>}
            {username && <p className="text-xs font-mono text-yellow-900">GitHub username: <strong>{username}</strong></p>}
          </div>
        )}
        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="bg-orange-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            Go to OhmerEats
          </Link>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full border border-gray-200 text-gray-600 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Sign out and try a different account
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
