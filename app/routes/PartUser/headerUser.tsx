import React, { useState } from "react";

const HeaderUser = () => {
  const [menuOpens, setMenuOpens] = useState(false); // State for controlling menu visibility

  return (
    <header className="bg-indigo-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <h1 className="text-xl md:text-2xl font-bold tracking-wide">
          CPC_PM2.5
        </h1>

        {/* Hamburger Menu for mobile */}
        <button
          className="md:hidden block focus:outline-none"
          onClick={() => setMenuOpens(!menuOpens)} // Toggle menu visibility
        >
          <svg
            className={`w-6 h-6 transform transition-transform duration-300 ${
              menuOpens ? "rotate-90" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            ></path>
          </svg>
        </button>

        {/* Navigation Menu */}
        <nav className={`md:flex md:items-center ${menuOpens ? "block" : "hidden"} transition-all duration-300 ease-in-out`}>
          <ul className="flex flex-col md:flex-row md:items-center space-y-6 md:space-y-0 md:space-x-8 text-sm md:text-base p-6 md:p-0">
            <li>
              <a
                href="/cpc/user/dashboard"
                className="hover:underline transition-colors duration-200"
              >
                หน้าแรก
              </a>
            </li>
            <li>
              <a
                href="/cpc/user/pm_ranking"
                className="hover:underline transition-colors duration-200"
              >
                ภาพรวม
              </a>
            </li>
            <li>
              <a
                href="/contact"
                className="hover:underline transition-colors duration-200"
              >
                การแจ้งเตือน
              </a>
            </li>
            <li>
              <a
                href="/other"
                className="hover:underline transition-colors duration-200"
              >
                รายการอื่นๆ
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default HeaderUser;