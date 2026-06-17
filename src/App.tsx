import { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, ArrowLeft, HeartHandshake, MapPin } from 'lucide-react';
import './index.css';

// ============================================================================
// TODO: PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL HERE
// ============================================================================
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzE2DKmUve5j9AILxKbhowgj_c9llTCIwS5JUP1VpJS7iwSmThU1B8xppfLJNzjFFWXiQ/exec"; 

const SLOTS = [
  { id: 'act-1', title: 'Help with an Activity', time: '2:55 - 4:00 pm', spots: '30 Slots', icon: HeartHandshake },
  { id: 'act-2', title: 'Help with an Activity', time: '4:00 - 5:00 pm', spots: '30 Slots', icon: HeartHandshake },
  { id: 'clean', title: 'Cleanup Crew', time: '5:00 - 6:00 pm', spots: '12 Slots', icon: Clock, isCleanup: true },
];

function App() {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  
  const [slotCounts, setSlotCounts] = useState<Record<string, number>>({});
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);

  const fetchCounts = async () => {
    if (!WEB_APP_URL) {
      setIsLoadingSlots(false);
      return;
    }
    setIsLoadingSlots(true);
    try {
      const response = await fetch(WEB_APP_URL);
      const result = await response.json();
      if (result.status === 'success' && result.counts) {
        setSlotCounts(result.counts);
      }
    } catch (err) {
      console.error('Failed to fetch slot counts', err);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  const handleSlotSelect = (id: string) => {
    setSelectedSlot(id);
    setSubmitError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;
    setNameError('');
    setEmailError('');
    setPhoneError('');
    setSubmitError('');

    if (!selectedSlot) {
      setSubmitError('Please select a time slot first.');
      hasError = true;
    }
    
    if (!name.trim()) {
      setNameError('Please enter your name.');
      hasError = true;
    } else {
      const nameParts = name.trim().split(/\s+/);
      if (nameParts.length < 2) {
        setNameError('Please enter both your first and last name.');
        hasError = true;
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setEmailError('Please enter a valid email address (e.g., name@domain.com).');
      hasError = true;
    }

    const phoneRegex = /^\s*(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})(?: *x(\d+))?\s*$/;
    if (phone.trim() && !phoneRegex.test(phone.trim())) {
      setPhoneError('Please enter a valid 10-digit phone number.');
      hasError = true;
    }

    if (hasError) return;
    
    if (!WEB_APP_URL) {
      setSubmitError('System Error: Google Apps Script Web App URL is missing. Please contact the administrator.');
      return;
    }

    setIsSubmitting(true);

    const slotData = SLOTS.find(s => s.id === selectedSlot);
    const slotString = `${slotData?.title} ${slotData?.time}`;

    try {
      const response = await fetch(WEB_APP_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          slot: slotString
        }),
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        setIsSuccess(true);
      } else {
        setSubmitError(result.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error('Submission error:', err);
      // Fallback for CORS errors if they happen, sometimes Apps Script returns opaque responses
      // but usually the fetch throws. We'll show a generic error.
      setSubmitError('Failed to submit form. Please ensure the Web App URL is correct and deployed for "Anyone".');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedSlot(null);
    setName('');
    setEmail('');
    setPhone('');
    setIsSuccess(false);
    setSubmitError('');
    setNameError('');
    setEmailError('');
    setPhoneError('');
    fetchCounts(); // Fetch fresh data when returning to sign up
  };

  return (
    <div className="app-container">
      <div className="glass-card animate-fade-in">
        {!isSuccess ? (
          <>
            <div className="header">
              <h1 className="title" style={{ marginBottom: '0.25rem' }}>Kindness Carnival</h1>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '1rem', textAlign: 'center' }}>Volunteer Sign-up</h2>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '1.05rem', color: 'var(--text-secondary)' }}>More Info: </span>
                <a href="http://Carnival.LansingStake.org" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', borderBottom: '2px solid var(--primary)' }}>Carnival.LansingStake.org</a>
              </div>
              <div className="subtitle" style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                  <Calendar style={{ color: 'var(--primary)' }} size={24} />
                  <span style={{ fontSize: '1.15rem', fontWeight: 500 }}>Saturday, July 18th</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <MapPin style={{ color: 'var(--secondary)' }} size={24} />
                    <span style={{ fontSize: '1.15rem', fontWeight: 500 }}>Stake Center</span>
                  </div>
                  <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                    431 E Saginaw St,<br className="sm:hidden" /> East Lansing, MI 48823
                  </div>
                </div>
              </div>
              <p className="subtitle mt-4 delay-1 animate-fade-in text-left">
                We are in need of help with a variety of activities, including helping run some fun and simple carnival games. All supplies and instructions will be provided for the activities, and there will be both indoor and outdoor options. This is a great opportunity for youth to earn service hours. Thank you for your willingness to help make the Kindness Carnival a success!
              </p>
            </div>

            {submitError && (
              <div className="error-message animate-fade-in">
                {submitError}
              </div>
            )}

            <div className="slots-grid delay-2 animate-fade-in">
              {SLOTS.map((slot) => {
                const Icon = slot.icon;
                const maxSpots = slot.isCleanup ? 12 : 30;
                const taken = slotCounts[slot.id] || 0;
                const available = Math.max(0, maxSpots - taken);
                const spotsText = isLoadingSlots ? 'Loading...' : `${available} of ${maxSpots} slots available`;
                
                return (
                  <div 
                    key={slot.id}
                    className={`slot-card ${selectedSlot === slot.id ? 'selected' : ''} ${slot.isCleanup ? 'cleanup-slot' : ''}`}
                    onClick={() => handleSlotSelect(slot.id)}
                  >
                    <Icon className="slot-icon" size={28} />
                    <h3 className="slot-title">{slot.title}</h3>
                    <div className="slot-time">
                      <Clock size={16} />
                      {slot.time}
                    </div>
                    <div className="slot-spots">{spotsText}</div>
                  </div>
                );
              })}
            </div>

            {selectedSlot && (
              <form onSubmit={handleSubmit} className="form-container delay-3 animate-fade-in">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input"
                    placeholder="Jane Doe"
                    disabled={isSubmitting}
                  />
                  {nameError && <div className="field-error animate-fade-in">{nameError}</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <input
                    type="text"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    placeholder="jane@example.com"
                    disabled={isSubmitting}
                  />
                  {emailError && <div className="field-error animate-fade-in">{emailError}</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="phone" className="form-label">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="form-input"
                    placeholder="(555) 000-0000"
                    disabled={isSubmitting}
                  />
                  {phoneError && <div className="field-error animate-fade-in">{phoneError}</div>}
                </div>

                <button type="submit" className="btn" disabled={isSubmitting || !name}>
                  {isSubmitting ? (
                    <>
                      <div className="spinner"></div>
                      Submitting...
                    </>
                  ) : (
                    'Confirm Sign Up'
                  )}
                </button>
              </form>
            )}
          </>
        ) : (
          <div className="success-container animate-fade-in">
            <button type="button" onClick={resetForm} className="back-btn">
              <ArrowLeft size={16} /> Back to Sign Up
            </button>
            <div className="success-icon">
              <CheckCircle size={40} />
            </div>
            <h2 className="title" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Thank You!</h2>
            <p className="subtitle">
              Your sign up for the Kindness Carnival has been recorded. We appreciate your willingness to help!
            </p>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
          <a 
            href="https://docs.google.com/spreadsheets/d/1bryfwO2svh-h7pOdPYJaRNiNjje-dVypWTX1rXanBIg/edit?gid=733020565#gid=733020565" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textDecoration: 'underline' }}
          >
            Admin Data Link
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;
