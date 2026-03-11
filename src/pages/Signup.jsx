import React from 'react'
import SignupForm from '../components/auth/SignupForm'

function Signup() {
    return (
        <div className="min-h-screen bg-gray-200 flex items-center justify-center px-4 md:px-10 lg:px-20">

            <div className="flex flex-col md:flex-row w-full max-w-5xl">

                {/* Left Panel */}
                <div className="hidden md:flex md:w-1/2 bg-slate-900 rounded-tl-2xl rounded-bl-2xl flex-col justify-center items-center gap-4 p-8">
                    <h1 className="text-gray-300 font-extrabold text-4xl lg:text-6xl">
                        Mark'd
                    </h1>
                    <p className="text-gray-200 font-semibold text-lg lg:text-2xl text-center">
                        "Attendance, simplified"
                    </p>
                    <p className="text-slate-400 text-sm text-center mt-2 max-w-xs">
                        Secure, time-bound attendance marking for modern classrooms.
                    </p>
                </div>

                {/* Right Panel */}
                <div className="bg-white w-full md:w-1/2 rounded-2xl md:rounded-tr-2xl md:rounded-br-2xl flex flex-col p-6 md:p-8">

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-2">

                        <div className="flex flex-col text-sm">
                            <h2 className='text-xl font-bold text-slate-900'>Create your account</h2>
                            <p className='text-sm text-slate-400'>Enter your details to get started</p>
                        </div>

                        <div className="flex flex-col text-sm">
                            <span>Already logged in?</span>
                            <span className="text-blue-500 cursor-pointer">
                                Log in here
                            </span>
                        </div>

                    </div>

                    {/* Form */}
                    <SignupForm />

                </div>

            </div>
        </div>
    )
}

export default Signup