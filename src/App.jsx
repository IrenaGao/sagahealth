import { BrowserRouter, Routes, Route } from 'react-router-dom'
import WellnessMarketplace from './pages/WellnessMarketplace/WellnessMarketplace.controller'
import ServiceDetails from './pages/ServiceDetails/ServiceDetails.controller'
import BookingPage from './pages/BookingPage'
import EmbeddedBooking from './pages/EmbeddedBooking/EmbeddedBooking.controller'
import LMNForm from './pages/LMNForm/LMNForm.controller'
import PaymentSuccessPage from './pages/PaymentSuccessPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WellnessMarketplace />} />
        <Route path="/service/:businessName" element={<ServiceDetails />} />
        <Route path="/book/:businessName" element={<BookingPage />} />
        <Route path="/book/:businessName/schedule" element={<EmbeddedBooking />} />
        <Route path="/book/:businessName/lmn-form" element={<LMNForm />} />
        <Route path="/payment-success" element={<PaymentSuccessPage />} />

      </Routes>
    </BrowserRouter>
  )
}
