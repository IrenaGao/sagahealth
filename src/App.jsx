import { BrowserRouter, Routes, Route } from 'react-router-dom'
import WellnessMarketplace from './pages/WellnessMarketplace'
import ServiceDetails from './pages/ServiceDetails'
import BookingPage from './pages/BookingPage'
import EmbeddedBooking from './pages/EmbeddedBooking'
import LMNForm from './pages/LMNForm'
import PaymentPage from './pages/PaymentPage'
import LMNSuccessPage from './pages/LMNSuccessPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WellnessMarketplace />} />
        <Route path="/service/:businessName" element={<ServiceDetails />} />
        <Route path="/book/:businessName" element={<BookingPage />} />
        <Route path="/book/:businessName/schedule" element={<EmbeddedBooking />} />
        <Route path="/book/:businessName/lmn-form" element={<LMNForm />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/payments" element={<PaymentPage />} />
        <Route path="/lmn-success" element={<LMNSuccessPage />} />
      </Routes>
    </BrowserRouter>
  )
}
