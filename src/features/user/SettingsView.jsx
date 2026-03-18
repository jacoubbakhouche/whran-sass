import './SettingsView.css';

export default function SettingsView() {
  return (
    <div className="settings-page page" dir="rtl">
      <header className="settings-header">
        <h2>الإعدادات</h2>
        <p>تحكم بخياراتك العامة والإشعارات.</p>
      </header>
      <div className="settings-grid">
        {['تعديل الملف الشخصي', 'تغيير كلمة المرور', 'إدارة الإشعارات', 'مزامنة الجهات'].map((label) => (
          <button type="button" key={label} className="settings-card">
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
