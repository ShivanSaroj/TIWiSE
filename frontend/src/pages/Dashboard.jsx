import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Waves, Mountain, Search, SlidersHorizontal } from "lucide-react";;
import CompetitorPriceComparison from "./charts/CompetitorPriceComparison";
import Sidebar from "../components/Sidebar";
import Chart from "./charts/Charts";
import POITrends from "./charts/POITrends";
import WeatherChart from "./charts/WeatherChart";
import MapActivities from "./charts/MapActivities";

const indianCities = [
  "Mumbai",
  "Delhi",
  "Bengaluru",
  "Chennai",
  "Kolkata",
  "Hyderabad",
  "Pune",
  "Ahmedabad",
  "Jaipur",
  "Udaipur",
  "Goa",
  "Agra",
  "Varanasi",
  "Surat",
  "Indore",
  "Chandigarh",
  "Lucknow",
  "Bhopal",
  "Coimbatore",
  "Visakhapatnam",
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [summarySection, setSummarySection] = useState('Most Rated Hotels');

  const AnalyticsCategory = [
    { title: "Most Rated Hotels" },
    { title: "Most Liked Movies" },
  
  ];

  const [cityA, setCityA] = useState("Mumbai"); 
  const [cityB, setCityB] = useState("Delhi");

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50 relative overflow-x-hidden">

      {/* Sidebar */}
      <button
        className="lg:hidden fixed top-4 left-4 bg-white p-2 rounded-full shadow-md z-50"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <Menu size={24} />
      </button>

      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity ${
          isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        } lg:hidden`}
        onClick={() => setIsSidebarOpen(false)}
      ></div>
      <div
        className={`fixed top-0 left-0 h-full bg-white shadow-lg transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform z-50 lg:static lg:translate-x-0`}
      >
        <Sidebar />
      </div>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        

        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          
          {/* Left Column  */}
         

          {/* Right Column - Graph Section */}
          <div className="w-full lg:w-1/2" id="newsletter-capture-target">
            <section className="bg-white rounded-xl shadow p-6 h-full">
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 w-full mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none "
                value={summarySection}
                onChange={(e) => setSummarySection(e.target.value)}
              >
                {AnalyticsCategory.map((category, index) => (
                  <option key={index} value={category.title}>
                    {category.title}
                  </option>
                ))}
              </select>
              <div className="h-[calc(100%-100px)]">
                <Chart type={summarySection} />
              </div>
            </section>
          </div>
        </div>

<div id="#compPrice">
  <CompetitorPriceComparison />
  </div>
     

        <div className="p-8 bg-gradient-to-r from-teal-50 to-teal-100 min-h-screen">
      {/* Title & Tagline */}
      <h1 className="text-3xl font-bold text-teal-800 text-center mb-4">
        Compare Travel Trends 📊✈️
      </h1>
      <p className="text-lg text-teal-700 text-center mb-8 italic">
        "Discover the pulse of travel between two iconic destinations!"
      </p>

      {/* City Selection */}
      <div className="bg-white p-6 rounded-xl shadow-md max-w-3xl mx-auto border-t-4 border-teal-400">
        <h2 className="text-xl font-semibold text-teal-800 mb-4 text-center">
          Pick Two Cities for a Travel Face-Off! 🌍
        </h2>

        <div className="flex flex-col md:flex-row justify-center items-center gap-6">
          {/* City A */}
          <div className="flex flex-col items-center">
            <label className="font-semibold text-teal-700 mb-2">Select City A:</label>
            <select
              value={cityA}
              onChange={(e) => setCityA(e.target.value)}
              className="p-3 border border-teal-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-teal-50 text-teal-900"
            >
              {indianCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <span className="text-teal-600 text-xl">🔁</span>

          {/* City B */}
          <div className="flex flex-col items-center">
            <label className="font-semibold text-teal-700 mb-2">Select City B:</label>
            <select
              value={cityB}
              onChange={(e) => setCityB(e.target.value)}
              className="p-3 border border-teal-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-teal-50 text-teal-900"
            >
              {indianCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Travel Trends Component */}
      <div className="mt-8" id="trend">
        <POITrends cityA={cityA} cityB={cityB} />
      </div>
      <div >
        <WeatherChart/>
      </div>
      <div>
        <MapActivities/>
      </div>
    </div>

      </main>
    </div>
  );
};

export default Dashboard;
