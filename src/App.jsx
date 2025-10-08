import { BrowserRouter, Routes, Route } from 'react-router-dom'
import WellnessMarketplace from './pages/WellnessMarketplace'
import ServiceDetails from './pages/ServiceDetails'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WellnessMarketplace />} />
        <Route path="/service/:id" element={<ServiceDetails />} />
      </Routes>
    </BrowserRouter>
  )
}
