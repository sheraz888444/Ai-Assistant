import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

function Homepage() {
  const { user } = useContext(AuthContext);

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Welcome to AI Assistant, {user?.username || 'User'}!</h1>
      <p className="text-center text-gray-600">Your personalized AI assistant is ready to help.</p>
      <div className="mt-8 text-center">
        <a href="/setup" className="py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Customize Assistant</a>
      </div>
    </div>
  );
}

export default Homepage;