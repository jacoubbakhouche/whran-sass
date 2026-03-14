import { useNavigate } from 'react-router-dom';
import './WelcomeScreen.css';

export default function WelcomeScreen() {
  const navigate = useNavigate();

  return (
    <div className="welcome-screen" dir="rtl">
      <div className="welcome-content animate-fade">
        <div className="welcome-logo-wrap animate-up">
          <div className="welcome-logo">🎓</div>
          <h1 className="welcome-title">Edu-expert</h1>
          <p className="welcome-subtitle">منصة التعليم الجزائرية الشاملة</p>
        </div>

        <div className="welcome-footer animate-up">
          <p className="welcome-tagline">اكتشف رحلتك التعليمية اليوم</p>
          <button 
            className="btn-primary welcome-start-btn" 
            onClick={() => {
              localStorage.setItem('edu_visited', 'true');
              navigate('/user-type');
            }}
          >
            ابدأ الآن
          </button>
        </div>
      </div>
      
      <div className="welcome-bg-glow" />
    </div>
  );
}
