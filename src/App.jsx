import { BrowserRouter, Routes, Route } from 'react-router-dom'
import WellnessMarketplace from './pages/WellnessMarketplace'
import ServiceDetails from './pages/ServiceDetails'
import BookingPage from './pages/BookingPage'
import EmbeddedBooking from './pages/EmbeddedBooking'
import LMNForm from './pages/LMNForm'
import PaymentSuccessPage from './pages/PaymentSuccessPage'
import ArketaTestPage from './pages/ArketaTestPage'
import MindbodyTestPage from './pages/MindbodyTestPage'
import AmeliaTestPage from './pages/AmeliaTestPage'

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
        <Route path="/arketa-test" element={<ArketaTestPage />} />
        <Route path="/mindbody-test" element={<MindbodyTestPage />} />
        <Route path="/amelia-test" element={<AmeliaTestPage />} />
      </Routes>
    </BrowserRouter>
  )
}
