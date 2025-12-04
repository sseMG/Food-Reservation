  import React, { useState } from "react";
  import { Link, useNavigate } from "react-router-dom";
  import { 
    Utensils, 
    Wallet, 
    Clock, 
    CheckCircle, 
    ShoppingBag, 
    TrendingUp,
    Users,
    Mail,
    MapPin,
    Phone,
    Menu,
    X
  } from "lucide-react";

  function SiteHeader() {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    return (
      <header className="w-full bg-white shadow-sm border-b-4 border-jckl-gold sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2 min-w-0 flex-shrink">
            <img 
              src="/jckl-192.png" 
              alt="JCKL Logo" 
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex-shrink-0"
            />
            <div className="font-bold text-jckl-navy min-w-0">
              <span className="hidden xl:inline text-lg">Jesus Christ King of Kings and Lord of Lords Academy Inc.</span>
              <span className="hidden md:inline xl:hidden text-base truncate max-w-[400px]">Jesus Christ King of Kings and Lord of Lords Academy Inc.</span>
              <span className="md:hidden text-sm truncate">JCKL Academy</span>
            </div>
          </Link>
          <nav className="hidden lg:flex flex-shrink-0">
            <ul className="flex items-center gap-2 sm:gap-4 lg:gap-8">
              <li>
                <Link
                  to="/"
                  className="text-jckl-slate hover:text-jckl-navy font-medium transition-colors duration-200"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-jckl-navy font-medium border-b-2 border-jckl-gold pb-1"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="text-jckl-slate hover:text-jckl-navy font-medium transition-colors duration-200"
                >
                  Register
                </Link>
              </li>
              <li>
                <button
                  onClick={() => navigate("/login")}
                  className="px-4 py-2 bg-jckl-navy text-white rounded-lg hover:bg-jckl-light-navy font-medium transition-colors duration-200"
                >
                  Log In
                </button>
              </li>
            </ul>
          </nav>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to="/login" className="hidden sm:inline-block lg:hidden">
              <button className="px-3 py-2 bg-jckl-navy text-white rounded-lg hover:bg-jckl-light-navy font-medium transition-colors duration-200 text-sm">
                Log In
              </button>
            </Link>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-jckl-cream text-jckl-navy"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        {/* Mobile view menu dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-jckl-gold bg-white">
            <nav className="px-4 py-3 space-y-2">
              <Link
                to="/"
                className="block px-3 py-2 text-jckl-slate hover:bg-jckl-cream rounded-lg transition text-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/about"
                className="block px-3 py-2 text-jckl-navy bg-jckl-cream rounded-lg text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                About Us
              </Link>
              <Link
                to="/register"
                className="block px-3 py-2 text-jckl-slate hover:bg-jckl-cream rounded-lg transition text-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                Register
              </Link>
              <Link
                to="/login"
                className="block px-3 py-2 bg-jckl-navy text-white hover:bg-jckl-light-navy rounded-lg transition text-sm font-medium sm:hidden"
                onClick={() => setMobileMenuOpen(false)}
              >
                Log In
              </Link>
            </nav>
          </div>
        )}
      </header>
    );
  }

  function SiteFooter() {
    return (
      <footer className="py-6 sm:py-12 bg-jckl-navy mt-6 sm:mt-12">
        <div className="container mx-auto px-3 sm:px-6 text-center">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <img 
              src="/jckl-192.png" 
              alt="JCKL Logo" 
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex-shrink-0"
            />
            <div className="font-bold text-sm sm:text-xl text-white text-left sm:text-center">
              Food Reservation & Allowance System
            </div>
          </div>
          <p className="text-jckl-cream mb-4 sm:mb-6 max-w-2xl mx-auto text-xs sm:text-base">
            Empowering students with modern technology for a better dining experience.
          </p>
          <div className="text-jckl-gold text-xs sm:text-sm">
            © 2025 JCKL Food Reservation System. All rights reserved.
          </div>
        </div>
      </footer>
    );
  }

  export default function About() {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <SiteHeader />

        <main className="flex-grow">
          {/* Hero Section */}
          <section className="bg-gradient-to-r from-jckl-navy to-jckl-purple text-white py-12 sm:py-20">
            <div className="max-w-6xl mx-auto px-3 sm:px-6 text-center">
              <h1 className="text-3xl sm:text-5xl font-extrabold mb-4 sm:mb-6">About Our System</h1>
              <p className="text-base sm:text-xl text-jckl-cream max-w-3xl mx-auto">
                Transforming the dining experience at JCKL Academy through
                innovation, efficiency, and student-first design.
              </p>
            </div>
          </section>

          {/* About the School */}
          <section className="py-8 sm:py-16 max-w-6xl mx-auto px-3 sm:px-6">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-10 border-t-4 border-jckl-gold">
              <div className="text-center mb-6 sm:mb-12">
                <h2 className="text-2xl sm:text-3xl font-bold text-jckl-navy mb-3 sm:mb-4">
                  About JCKL Academy
                </h2>
                <p className="text-sm sm:text-lg text-jckl-slate max-w-3xl mx-auto leading-relaxed">
                  Jesus Christ King of Kings and Lord of Lords Academy Inc. is a
                  Christian educational institution committed to providing
                  quality education grounded in biblical principles and academic
                  excellence. Our school nurtures students spiritually,
                  academically, and socially to become future leaders who honor
                  God and serve their communities.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
                <div className="bg-jckl-cream p-4 sm:p-6 rounded-lg sm:rounded-xl border-l-4 border-jckl-gold">
                  <h3 className="text-lg sm:text-xl font-bold text-jckl-navy mb-2 sm:mb-3">
                    Our Vision
                  </h3>
                  <p className="text-sm sm:text-base text-jckl-slate leading-relaxed">
                    To be a leading Christ-centered institution that develops
                    well-rounded individuals equipped with knowledge, character,
                    and faith to make a positive impact in society.
                  </p>
                </div>

                <div className="bg-jckl-cream p-4 sm:p-6 rounded-lg sm:rounded-xl border-l-4 border-jckl-purple">
                  <h3 className="text-lg sm:text-xl font-bold text-jckl-navy mb-2 sm:mb-3">
                    Our Mission
                  </h3>
                  <p className="text-sm sm:text-base text-jckl-slate leading-relaxed">
                    To provide holistic Christian education that cultivates
                    academic excellence, moral integrity, and spiritual growth,
                    empowering students to become responsible citizens and
                    faithful servants of God.
                  </p>
                </div>
              </div>

              <div className="mt-4 sm:mt-8 bg-gradient-to-r from-jckl-navy to-jckl-light-navy p-4 sm:p-6 rounded-lg sm:rounded-xl border border-jckl-gold">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3">
                  Core Values
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 text-sm sm:text-base text-jckl-cream">
                  <div>
                    <span className="font-semibold text-jckl-gold">Faith:</span>{" "}
                    Grounded in biblical teachings
                  </div>
                  <div>
                    <span className="font-semibold text-jckl-gold">Excellence:</span>{" "}
                    Pursuing the highest standards
                  </div>
                  <div>
                    <span className="font-semibold text-jckl-gold">Integrity:</span>{" "}
                    Living with honesty and honor
                  </div>
                  <div>
                    <span className="font-semibold text-jckl-gold">Service:</span>{" "}
                    Contributing to community welfare
                  </div>
                  <div>
                    <span className="font-semibold text-jckl-gold">Compassion:</span>{" "}
                    Caring for others with love
                  </div>
                  <div>
                    <span className="font-semibold text-jckl-gold">Discipline:</span>{" "}
                    Committed to personal growth
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* About the System */}
          <section className="py-8 sm:py-16 bg-jckl-cream">
            <div className="max-w-6xl mx-auto px-3 sm:px-6">
              <div className="text-center mb-6 sm:mb-12">
                <h2 className="text-2xl sm:text-3xl font-bold text-jckl-navy mb-3 sm:mb-4">
                  About This System
                </h2>
                <p className="text-sm sm:text-lg text-jckl-slate max-w-3xl mx-auto">
                  The Food Reservation & Allowance System was developed to
                  modernize the cafeteria experience and support our school's
                  commitment to efficiency, student welfare, and responsible
                  financial management.
                </p>
              </div>
            </div>
          </section>

          {/* Why We Built This */}
          <section className="py-8 sm:py-16 bg-white">
            <div className="max-w-6xl mx-auto px-3 sm:px-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-jckl-navy text-center mb-6 sm:mb-12">
                Why We Built This System
              </h2>
              <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
                <div className="bg-gradient-to-br from-jckl-cream to-white p-4 sm:p-8 rounded-lg sm:rounded-xl border border-jckl-gold">
                  <h3 className="text-lg sm:text-xl font-bold text-jckl-navy mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-jckl-navy" />
                    For Students
                  </h3>
                  <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-jckl-slate">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-jckl-navy mt-0.5 flex-shrink-0" />
                      <span>No more waiting in long cafeteria lines</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-jckl-navy mt-0.5 flex-shrink-0" />
                      <span>Cashless, secure digital wallet system</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-jckl-navy mt-0.5 flex-shrink-0" />
                      <span>Pre-order meals and skip the rush</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-jckl-navy mt-0.5 flex-shrink-0" />
                      <span>Track spending and manage allowance easily</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-jckl-cream to-white p-4 sm:p-8 rounded-lg sm:rounded-xl border border-jckl-purple">
                  <h3 className="text-lg sm:text-xl font-bold text-jckl-navy mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-jckl-purple" />
                    For The School
                  </h3>
                  <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-jckl-slate">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-jckl-navy mt-0.5 flex-shrink-0" />
                      <span>Better inventory management and forecasting</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-jckl-navy mt-0.5 flex-shrink-0" />
                      <span>Reduced food waste through accurate ordering</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-jckl-navy mt-0.5 flex-shrink-0" />
                      <span>Real-time sales reports and analytics</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-jckl-navy mt-0.5 flex-shrink-0" />
                      <span>Streamlined cafeteria operations</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="py-8 sm:py-16 max-w-6xl mx-auto px-3 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-jckl-navy text-center mb-6 sm:mb-12">
              How It Works
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-md border-t-4 border-jckl-navy text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-jckl-cream rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Wallet className="w-6 h-6 sm:w-7 sm:h-7 text-jckl-navy" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-jckl-gold mb-2">Step 1</div>
                <h3 className="text-sm sm:text-base font-bold text-jckl-navy mb-2">Top Up Wallet</h3>
                <p className="text-xs sm:text-sm text-jckl-slate">
                  Load your digital wallet with cash through the admin office
                </p>
              </div>

              <div className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-md border-t-4 border-jckl-purple text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-jckl-cream rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Utensils className="w-6 h-6 sm:w-7 sm:h-7 text-jckl-purple" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-jckl-gold mb-2">Step 2</div>
                <h3 className="text-sm sm:text-base font-bold text-jckl-navy mb-2">Browse Menu</h3>
                <p className="text-xs sm:text-sm text-jckl-slate">
                  View daily menu items with prices and availability
                </p>
              </div>

              <div className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-md border-t-4 border-jckl-navy text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-jckl-cream rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7 text-jckl-navy" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-jckl-gold mb-2">Step 3</div>
                <h3 className="text-sm sm:text-base font-bold text-jckl-navy mb-2">Place Order</h3>
                <p className="text-xs sm:text-sm text-jckl-slate">
                  Reserve your meal and pay using your wallet balance
                </p>
              </div>

              <div className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-md border-t-4 border-jckl-purple text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-jckl-cream rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Clock className="w-6 h-6 sm:w-7 sm:h-7 text-jckl-purple" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-jckl-gold mb-2">Step 4</div>
                <h3 className="text-sm sm:text-base font-bold text-jckl-navy mb-2">Pick Up</h3>
                <p className="text-xs sm:text-sm text-jckl-slate">
                  Collect your order at the designated pickup time
                </p>
              </div>
            </div>
          </section>

          {/* Key Features */}
          <section className="py-8 sm:py-16 bg-jckl-cream">
            <div className="max-w-6xl mx-auto px-3 sm:px-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-jckl-navy text-center mb-6 sm:mb-12">
                Key Features
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-md border-t-4 border-jckl-gold">
                  <Wallet className="w-8 h-8 sm:w-10 sm:h-10 text-jckl-navy mb-3 sm:mb-4" />
                  <h3 className="font-bold text-base sm:text-lg text-jckl-navy mb-2">
                    Digital Wallet System
                  </h3>
                  <p className="text-jckl-slate text-xs sm:text-sm">
                    Secure cashless payments with real-time balance tracking and
                    transaction history
                  </p>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-md border-t-4 border-jckl-purple">
                  <Utensils className="w-8 h-8 sm:w-10 sm:h-10 text-jckl-purple mb-3 sm:mb-4" />
                  <h3 className="font-bold text-base sm:text-lg text-jckl-navy mb-2">
                    Daily Menu Updates
                  </h3>
                  <p className="text-jckl-slate text-xs sm:text-sm">
                    Browse fresh menu items updated daily with accurate pricing and
                    availability
                  </p>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-md border-t-4 border-jckl-navy">
                  <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-jckl-navy mb-3 sm:mb-4" />
                  <h3 className="font-bold text-base sm:text-lg text-jckl-navy mb-2">
                    Real-Time Inventory
                  </h3>
                  <p className="text-jckl-slate text-xs sm:text-sm">
                    Live stock tracking ensures you know what's available before
                    ordering
                  </p>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-md border-t-4 border-jckl-gold">
                  <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-jckl-navy mb-3 sm:mb-4" />
                  <h3 className="font-bold text-base sm:text-lg text-jckl-navy mb-2">
                    Order Tracking
                  </h3>
                  <p className="text-jckl-slate text-xs sm:text-sm">
                    Monitor your reservation status from placement to pickup
                  </p>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-md border-t-4 border-jckl-purple">
                  <ShoppingBag className="w-8 h-8 sm:w-10 sm:h-10 text-jckl-purple mb-3 sm:mb-4" />
                  <h3 className="font-bold text-base sm:text-lg text-jckl-navy mb-2">
                    Transaction History
                  </h3>
                  <p className="text-jckl-slate text-xs sm:text-sm">
                    Complete record of all purchases and wallet top-ups for easy
                    tracking
                  </p>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-md border-t-4 border-jckl-navy">
                  <Users className="w-8 h-8 sm:w-10 sm:h-10 text-jckl-navy mb-3 sm:mb-4" />
                  <h3 className="font-bold text-base sm:text-lg text-jckl-navy mb-2">
                    Admin Dashboard
                  </h3>
                  <p className="text-jckl-slate text-xs sm:text-sm">
                    Comprehensive management tools for staff to handle orders,
                    inventory, and reports
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section className="py-8 sm:py-16 bg-white">
            <div className="max-w-6xl mx-auto px-3 sm:px-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-jckl-navy text-center mb-6 sm:mb-12">
                Contact & Support
              </h2>
              <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
                <div className="bg-jckl-cream p-4 sm:p-8 rounded-lg sm:rounded-xl border-l-4 border-jckl-gold">
                  <h3 className="text-lg sm:text-xl font-bold text-jckl-navy mb-4 sm:mb-6">
                    Cafeteria Hours
                  </h3>
                  <div className="space-y-2 sm:space-y-3 text-xs sm:text-base text-jckl-slate">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-jckl-navy flex-shrink-0" />
                      <span>
                        <strong>Breakfast:</strong> 7:00 AM - 8:30 AM
                      </span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-jckl-navy flex-shrink-0" />
                      <span>
                        <strong>Lunch:</strong> 11:30 AM - 1:30 PM
                      </span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-jckl-navy flex-shrink-0" />
                      <span>
                        <strong>Snacks:</strong> 3:00 PM - 4:00 PM
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-jckl-cream p-4 sm:p-8 rounded-lg sm:rounded-xl border-l-4 border-jckl-purple">
                  <h3 className="text-lg sm:text-xl font-bold text-jckl-navy mb-4 sm:mb-6">
                    Get In Touch
                  </h3>
                  <div className="space-y-3 sm:space-y-4 text-xs sm:text-base text-jckl-slate">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-jckl-navy mt-0.5 flex-shrink-0" />
                      <span>
                        Jesus Christ King of Kings and Lord of Lords Academy Inc.
                        <br />
                        School Cafeteria, Ground Floor
                      </span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-jckl-navy flex-shrink-0" />
                      <span className="break-all">cafeteria@jckl.edu.ph</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-jckl-navy flex-shrink-0" />
                      <span>Local Extension: 1234</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 sm:mt-8 bg-gradient-to-r from-jckl-navy to-jckl-light-navy p-4 sm:p-6 rounded-lg sm:rounded-xl border border-jckl-gold text-center">
                <p className="text-xs sm:text-base text-jckl-cream">
                  <strong className="text-jckl-gold">Need Help?</strong> Contact the school administration
                  office or speak with cafeteria staff for assistance with the
                  system, wallet top-ups, or any technical issues.
                </p>
              </div>
            </div>
          </section>

          {/* Call to Action */}
          <section className="py-8 sm:py-16 bg-gradient-to-r from-jckl-navy to-jckl-purple">
            <div className="max-w-4xl mx-auto px-3 sm:px-6 text-center text-white">
              <h2 className="text-xl sm:text-3xl font-bold mb-3 sm:mb-4">Ready to Get Started?</h2>
              <p className="text-sm sm:text-xl text-jckl-cream mb-6 sm:mb-8">
                Join hundreds of students already enjoying a better cafeteria
                experience
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Link
                  to="/register"
                  className="px-6 sm:px-8 py-2.5 sm:py-3 bg-jckl-gold text-jckl-navy rounded-lg font-bold hover:bg-jckl-muted-gold transition-colors duration-200 text-sm sm:text-base"
                >
                  Create Account
                </Link>
                <Link
                  to="/login"
                  className="px-6 sm:px-8 py-2.5 sm:py-3 bg-transparent text-white rounded-lg font-bold hover:bg-jckl-light-navy transition-colors duration-200 border-2 border-jckl-gold text-sm sm:text-base"
                >
                  Log In
                </Link>
              </div>
            </div>
          </section>
        </main>

        <SiteFooter />
      </div>
    );
  }
