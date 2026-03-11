import { useState } from 'react'
import { supabase } from './lib/supabaseClient'
import Signup from './pages/Signup'

function App() {
  const [count, setCount] = useState(0)

  console.log(supabase)

  return (
    <>
    <Signup />
    </>
  )
}

export default App
