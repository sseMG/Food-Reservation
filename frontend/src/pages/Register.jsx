// src/pages/Register.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../components/Input";
import Button from "../components/Button";
import { api, ApiError } from "../lib/api";
import { refreshSessionForPublic } from "../lib/auth";
import { Menu, X, Eye, EyeOff } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      await refreshSessionForPublic({ navigate });
    })();
  }, [navigate]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    phone: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // For phone field, only allow digits and limit to 11 characters
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '');
      const limited = digitsOnly.slice(0, 11);
      setForm((f) => ({ ...f, [name]: limited }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
    
    if (errors[name]) setErrors((err) => ({ ...err, [name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Invalid email";

    if (!form.phone.trim()) errs.phone = "Contact number is required";
    else if (form.phone.length !== 11)
      errs.phone = "Contact number must be exactly 11 digits";

    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 8)
      errs.password = "Must be at least 8 characters";
    if (!form.confirm) errs.confirm = "Please confirm password";
    else if (form.confirm !== form.password)
      errs.confirm = "Passwords do not match";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setIsLoading(true);

    try {
      await api.post("/auth/register", {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        grade: "",
        section: "",
        phone: form.phone.trim(),
      });

      setIsLoading(false);
      // Show success message and redirect to pending approval page
      navigate("/registration-pending", { 
        replace: true,
        state: { email: form.email.trim() }
      });
      return;
    } catch (err) {
      setIsLoading(false);
      if (err instanceof ApiError) {
        const status = err.status;
        const serverMsg =
          (err?.response && err.response.data && err.response.data.error) ||
          (err?.data && err.data.error) ||
          err.message ||
          "";
        if (status === ApiError.Conflict) {
          // Handle 409 conflicts
          if (/email/i.test(serverMsg)) {
            setErrors({
              email: "Email already registered. Please use a different email or log in instead.",
            });
          } else {
            setErrors({
              email: "This information is already registered. Please use different details.",
            });
          }
          return;
        }
        if (status === 400) {
          if (/phone/i.test(serverMsg) || /contact/i.test(serverMsg)) {
            setErrors({ phone: serverMsg });
          } else {
            setErrors({ email: serverMsg || "Invalid registration data" });
          }
          return;
        }
        if (status === 403) {
          // Account pending approval
          navigate("/registration-pending", { 
            replace: true,
            state: { email: form.email.trim() }
          });
          return;
        }
        switch (status) {
          case ApiError.Maintenance:
            navigate("/status/maintenance", { replace: true });
            break;
          case ApiError.ServerError:
            navigate("/status/server_error", { replace: true });
            break;
          default:
            navigate("/status/something_went_wrong");
        }
        return;
      }

      setErrors({ email: "Registration failed. Please try again." });
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* HEADER - JCKL Themed */}
      <header className="w-full bg-white shadow-sm border-b-4 border-jckl-gold sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2 min-w-0 flex-shrink" aria-label="JCKL Food Reservation Home">
            <img 
              src="/jckl-192.png" 
              alt="JCKL Academy Logo" 
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex-shrink-0"
            />
            <div className="font-bold text-jckl-navy min-w-0">
              <span className="hidden xl:inline text-lg">Jesus Christ King of Kings and Lord of Lords Academy Inc.</span>
              <span className="hidden md:inline xl:hidden text-base truncate max-w-[400px]">Jesus Christ King of Kings and Lord of Lords Academy Inc.</span>
              <span className="md:hidden text-sm truncate">JCKL Academy</span>
            </div>
          </Link>

          <nav className="hidden lg:flex flex-shrink-0" aria-label="Primary navigation">
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
                  className="text-jckl-slate hover:text-jckl-navy font-medium transition-colors duration-200"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="text-jckl-navy font-medium border-b-2 border-jckl-gold pb-1"
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
        
        {/* Mobile menu dropdown */}
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
                className="block px-3 py-2 text-jckl-slate hover:bg-jckl-cream rounded-lg transition text-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                About Us
              </Link>
              <Link
                to="/register"
                className="block px-3 py-2 text-jckl-navy bg-jckl-cream rounded-lg text-sm font-medium"
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

      {/* MAIN CONTENT */}
      <div className="flex-grow flex items-center justify-center py-8 sm:py-12 px-4">
        <div className="w-full max-w-md">
          {/* Welcome Card */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <img 
                src="/jckl-192.png" 
                alt="JCKL Academy Logo" 
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shadow-lg"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-jckl-navy mb-2">
              Create Your Account
            </h1>
            <p className="text-sm sm:text-base text-jckl-slate">
              Join the food reservation system at JCKL Academy
            </p>
          </div>

          {/* Registration Form Card */}
          <div className="bg-white rounded-2xl shadow-xl border-t-4 border-jckl-gold p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <Input
                label="Full Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Juan Dela Cruz"
                error={errors.name}
              />
              <Input
                label="Contact Number"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+63 912 345 6789"
                error={errors.phone}
              />
              <Input
                label="Email Address"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="student@jckl.edu.ph"
                error={errors.email}
              />

              {/* Password field with toggle */}
              <div className="relative">
                <Input
                  label="Password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="At least 8 characters"
                  error={errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-10 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex="-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Confirm Password field with toggle */}
              <div className="relative">
                <Input
                  label="Confirm Password"
                  name="confirm"
                  type={showConfirm ? "text" : "password"}
                  value={form.confirm}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  error={errors.confirm}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-10 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex="-1"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={isLoading}
                className="bg-jckl-navy hover:bg-jckl-light-navy"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-jckl-slate">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-jckl-navy hover:text-jckl-light-navy font-semibold"
                >
                  Sign In
                </Link>
              </p>
            </div>

            <div className="mt-4 bg-jckl-cream border border-jckl-gold rounded-lg p-3 sm:p-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <svg
                  className="w-5 h-5 text-jckl-navy flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="text-xs sm:text-sm text-jckl-navy">
                  <p className="font-semibold mb-1">Student Accounts Only</p>
                  <p className="text-jckl-slate">
                    This registration is for JCKL Academy students. Use your
                    school email and contact number.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="py-6 sm:py-8 bg-jckl-navy text-center">
        <div className="text-jckl-cream text-xs sm:text-sm">
          © 2025 JCKL Food Reservation System. All rights reserved.
        </div>
      </footer>
    </div>
  );
}