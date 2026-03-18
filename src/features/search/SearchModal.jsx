import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiSearch, FiArrowLeft, FiHash } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../i18n';
import { INSTITUTION_TYPES } from '../../lib/mockData';
import './SearchModal.css';

export default function SearchModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { getField } = useI18n();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ institutions: [], products: [], announcements: [] });
  const [loading, setLoading] = useState(false);

  const getTypeLabel = (type) => {
    const match = INSTITUTION_TYPES.find(t => t.value === type || t.name_ar === type || t.name_fr === type);
    return match ? getField(match, 'name') : type;
  };

  const handleSearch = useCallback(async (text) => {
    if (!text || text.length < 2) {
      setResults({ institutions: [], products: [], announcements: [] });
      return;
    }
    setLoading(true);

    const [insts, prods, anns] = await Promise.all([
      supabase.from('institutions').select('id, name_ar, type').ilike('name_ar', `%${text}%`).limit(4),
      supabase.from('products').select('id, name, price').ilike('name', `%${text}%`).limit(4),
      supabase.from('announcements').select('id, title, institution_id').ilike('title', `%${text}%`).limit(4),
    ]);

    setResults({
      institutions: insts.data || [],
      products: prods.data || [],
      announcements: anns.data || [],
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  if (!isOpen) return null;

  return (
    <div className="search-modal-overlay" dir="rtl">
      <div className="search-modal-content">
        <header className="search-modal-header">
          <div className="search-modal-input-wrap">
            <FiSearch className="search-icon" />
            <input
              autoFocus
              type="text"
              placeholder="ابحث عن مدرسة، كتاب، أو إعلان..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && <FiX className="clear-icon" onClick={() => setQuery('')} />}
          </div>
          <button className="close-btn" onClick={onClose}>إلغاء</button>
        </header>

        <div className="search-modal-body">
          {loading && <div className="search-loading">جاري البحث...</div>}

          {!loading && !query && (
            <div className="search-suggestions">
              <p className="suggest-title">اقتراحات شائعة</p>
              <div className="suggest-chips">
                {['ابتدائي', 'مركز لغات', 'روايات', 'بكالوريا'].map(s => (
                  <button key={s} className="chip" onClick={() => setQuery(s)}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {!loading && query && (
            <div className="search-results">
              {results.institutions.length > 0 && (
                <section>
                  <h4 className="results-title">🏫 المؤسسات</h4>
                  {results.institutions.map(item => (
                    <div key={item.id} className="result-item" onClick={() => { navigate(`/institution/${item.id}`); onClose(); }}>
                      <span className="name">{item.name_ar}</span>
                      <span className="type">{getTypeLabel(item.type)}</span>
                    </div>
                  ))}
                </section>
              )}

              {results.products.length > 0 && (
                <section>
                  <h4 className="results-title">📚 المكتبة والكتب</h4>
                  {results.products.map(item => (
                    <div key={item.id} className="result-item" onClick={() => { navigate(`/store/book/${item.id}`); onClose(); }}>
                      <span className="name">{item.name}</span>
                      <span className="price">{item.price} دج</span>
                    </div>
                  ))}
                </section>
              )}

              {results.announcements.length > 0 && (
                <section>
                  <h4 className="results-title">📣 الإعلانات</h4>
                  {results.announcements.map(item => (
                    <div key={item.id} className="result-item" onClick={() => { navigate(`/institution/${item.institution_id}`); onClose(); }}>
                      <span className="name">{item.title}</span>
                      <FiArrowLeft className="arrow" />
                    </div>
                  ))}
                </section>
              )}

              {results.institutions.length === 0 && results.products.length === 0 && results.announcements.length === 0 && (
                <div className="no-results">لا توجد نتائج تطابق بحثك</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
