import { useNavigate } from 'react-router-dom';
import { FiUser, FiHome, FiBriefcase } from 'react-icons/fi';
import './UserTypeScreen.css';

export default function UserTypeScreen() {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    // Assuming authSignOut is available from a context or imported
    // await authSignOut(); // This function is not defined in this component's scope
    navigate('/welcome');
  };

  const handleSelect = (type) => {
    // Save selection or navigate to specific login
    if (type === 'user') navigate('/login');
    else if (type === 'institution') navigate('/institution-login');
    else if (type === 'office') navigate('/vendor-login');
  };

  return (
    <div className="user-type-screen" dir="rtl">
      <div className="user-type-content animate-fade">
        <div className="user-type-header animate-up">
          <h1>من أنت؟</h1>
          <p>اختر نوع حسابك للمتابعة</p>
        </div>

        <div className="user-type-grid">
          <div className="user-type-card glass animate-up" onClick={() => handleSelect('user')}>
            <div className="card-icon-wrap user">
              <FiUser />
            </div>
            <h3>عميل عادي</h3>
            <p>للبحث عن المؤسسات والكتب والإعلانات</p>
          </div>

          <div className="user-type-card glass animate-up" style={{ animationDelay: '0.1s' }} onClick={() => handleSelect('institution')}>
            <div className="card-icon-wrap inst">
              <FiHome />
            </div>
            <h3>صاحب مؤسسة</h3>
            <p>لإدارة مؤسستك التعليمية وإعلاناتك</p>
          </div>

          <div className="user-type-card glass animate-up" style={{ animationDelay: '0.2s' }} onClick={() => handleSelect('office')}>
            <div className="card-icon-wrap office">
              <FiBriefcase />
            </div>
            <h3>صاحب مكتبة</h3>
            <p>لبيع الكتب والأدوات المدرسية</p>
          </div>
        </div>

        <div className="user-type-footer animate-up" style={{ animationDelay: '0.3s' }}>
          <button className="admin-link-btn" onClick={() => navigate('/admin-login')}>
            دخول المشرفين (تجريبي)
          </button>
        </div>
      </div>
      
      <div className="user-type-bg-glow" />
    </div>
  );
}
