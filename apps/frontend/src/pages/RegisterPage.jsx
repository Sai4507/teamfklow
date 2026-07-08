import React from 'react'

const RegisterPage = () => {
  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-6">Register</h1>
      <form className="space-y-4">
        <input type="email" placeholder="Email" className="w-full px-4 py-2 border rounded-lg" />
        <input type="text" placeholder="Username" className="w-full px-4 py-2 border rounded-lg" />
        <input type="password" placeholder="Password" className="w-full px-4 py-2 border rounded-lg" />
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg">Register</button>
      </form>
    </div>
  )
}

export default RegisterPage
