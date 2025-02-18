import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import PaymentComponent from './components/PaymentComponent'



function App() {
  const [count, setCount] = useState(0)

  

  return (
    <>
     <PaymentComponent/>
    </>
  )
}

export default App
