import { Routes, Route } from 'react-router'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import Council from '@/pages/Council'
import Simulator from '@/pages/Simulator'
import Report from '@/pages/Report'
import Methodology from '@/pages/Methodology'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/council" element={<Council />} />
        <Route path="/simulator" element={<Simulator />} />
        <Route path="/report" element={<Report />} />
        <Route path="/methodology" element={<Methodology />} />
      </Routes>
    </Layout>
  )
}
