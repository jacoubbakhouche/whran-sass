import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiHome, FiShoppingBag, FiUsers } from 'react-icons/fi';
import './ProPortal.css';

export default function ProPortal() {
  const navigate = useNavigate();

  const options = [
    {
      id: 'institution',
      title: 'المؤسسات التعليمية',
      desc: 'إدارة المدرسة، تسجيل الطلاب، ونشر الإعلانات',
      icon: <FiHome />,
      color: 'var(--accent)',
      path: '/institution-login'
    },
    {
      id: 'vendor',
      title: 'المكاتب والبائعين',
      desc: 'إدارة المتجر، رفع الكتب، ومتابعة الطلبات',
      icon: <FiShoppingBag />,
      color: 'var(--accent-warm)',
      path: '/vendor-login'
    },
    {
      id: 'staff',
      title: 'الأساتذة والعمال',
      desc: 'الوصول إلى الفضاء المهني الخاص بالموظفين',
      icon: <FiUsers />,
      color: '#1A5276',
      path: '/institution-login' // Assuming same entry for now or a filtered one
    }
  ];

  return (
    <div className="pro-portal" dir="rtl">
      <button className="back-btn" onClick={() => navigate('/')}>
        <FiArrowLeft size={18} />
        <span>العودة للرئيسية</span>
      </button>

      <div className="pro-portal__container">
        <header className="pro-portal__header animate-up">
          <span className="pro-portal__badge">بوابة المهنيين</span>
          <h1>مرحباً بك في فضاء الأعمال</h1>
          <p>اختر نوع حسابك للوصول إلى لوحة التحكم الخاصة بك وإدارة نشاطك على منصة "تعلم DZ"</p>
        </header>

        <div className="pro-portal__grid">
          {options.map((opt, i) => (
            <div 
              key={opt.id} 
              className="pro-portal__card animate-up" 
              style={{ animationDelay: `${i * 0.1}s` }}
              onClick={() => navigate(opt.path)}
            >
              <div className="pro-portal__card-icon" style={{ backgroundColor: opt.color + '15', color: opt.color }}>
                {opt.icon}
              </div>
              <div className="pro-portal__card-body">
                <h3>{opt.title}</h3>
                <p>{opt.desc}</p>
                <span className="pro-portal__card-link" style={{ color: opt.color }}>
                  دخول الفضاء ←
                </span>
              </div>
            </div>
          ))}
        </div>

        <footer className="pro-portal__footer animate-up" style={{ animationDelay: '0.4s' }}>
          <p>هل تواجه مشكلة في تسجيل الدخول؟ <a href="#">اتصل بالدعم الفني</a></p>
        </footer>
      </div>
    </div>
  );
}
