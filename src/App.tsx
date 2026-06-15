import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PackageList from "@/pages/PackageList";
import PackageDetail from "@/pages/PackageDetail";
import BatchManagement from "@/pages/BatchManagement";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PackageList />} />
        <Route path="/package/:id" element={<PackageDetail />} />
        <Route path="/batch" element={<BatchManagement />} />
      </Routes>
    </Router>
  );
}
