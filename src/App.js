import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  onSnapshot,
  updateDoc,
  setDoc,
  getDoc,
  addDoc,
  deleteDoc,
  collection,
  arrayUnion
} from 'firebase/firestore';
import { LogOut, Lock, Save, Palette, Scroll, Layout, Trash2, Plus, Maximize, Mail, Key, KeyRound, Check, Users, UserPlus, Database, FileJson, Layers, Percent, History, FileText, ToggleLeft, ToggleRight, Sliders, Eye, EyeOff, Stamp, Factory, Ban, Info, Sparkles, AlertTriangle } from 'lucide-react';

// --- Firebase Setup ---
const firebaseConfig = {
  apiKey: "AIzaSyDlKM00R5pD3kfFs_vv2KTsnDEvTqmWnSU",
  authDomain: "mynew-6e4cc.firebaseapp.com",
  projectId: "mynew-6e4cc",
  storageBucket: "mynew-6e4cc.firebasestorage.app",
  messagingSenderId: "789467376297",
  appId: "1:789467376297:web:8f6356a625756d179c17b8",
  measurementId: "G-81PB2CLSS9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const appId = 'printing-app-v1';
const LOGO_URL = "https://cdn.salla.sa/cdn-cgi/image/fit=scale-down,width=400,height=400,onerror=redirect,format=auto/XWZKA/YaMTPHLOL2Te8CL4gQbZmq17ktijebIHHKZRx6jp.png";

// --- Constants ---
const USERS_DB_PATH = ['artifacts', appId, 'public', 'data', 'settings', 'users_db'];
const HISTORY_COLLECTION_PATH = ['artifacts', appId, 'public', 'data', 'pricing_history'];
const GENERAL_SETTINGS_PATH = ['artifacts', appId, 'public', 'data', 'settings', 'general'];
const RESET_REQUESTS_PATH = ['artifacts', appId, 'public', 'data', 'password_reset_requests'];

// --- Helper Components ---

const DiscountManager = ({ discounts, onChange, unitLabel }) => {
  const [minQty, setMinQty] = useState('');
  const [percent, setPercent] = useState('');

  const handleAdd = () => {
    if (!minQty || !percent) return;
    const newRule = { min: parseFloat(minQty), percent: parseFloat(percent) };
    const newDiscounts = [...(discounts || []), newRule].sort((a, b) => a.min - b.min);
    onChange(newDiscounts);
    setMinQty('');
    setPercent('');
  };

  const handleRemove = (index) => {
    const newDiscounts = discounts.filter((_, i) => i !== index);
    onChange(newDiscounts);
  };

  return (
    <div className="bg-[#337159]/5 p-3 md:p-4 rounded-xl border border-[#337159]/20 mt-4">
      <div className="flex items-center gap-2 mb-3 text-[#337159]">
        <Percent className="w-5 h-5" />
        <h4 className="font-bold text-sm">شرائح الخصم (الكميات)</h4>
      </div>

      <div className="space-y-2 mb-3">
        {(!discounts || discounts.length === 0) && <p className="text-xs text-slate-400 text-center">لا توجد خصومات مفعلة</p>}
        {discounts?.map((rule, idx) => (
          <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-[#b99ecb]/30 text-sm">
            <span>من <span className="font-bold text-[#337159]">{rule.min}</span> {unitLabel} فأكثر</span>
            <div className="flex items-center gap-3">
              <span className="font-bold text-[#fa5732] bg-[#fa5732]/10 px-2 py-0.5 rounded text-xs md:text-sm">خصم {rule.percent}%</span>
              <button onClick={() => handleRemove(idx)} className="text-slate-400 hover:text-[#fa5732]"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 items-end border-t border-[#337159]/10 pt-3">
        <div className="flex-1">
          <label className="text-[10px] text-slate-500 block mb-1">الحد الأدنى ({unitLabel})</label>
          <input type="number" value={minQty} onChange={(e) => setMinQty(e.target.value)} className="w-full p-2 text-sm border border-[#b99ecb] rounded outline-none focus:ring-1 focus:ring-[#337159]" placeholder="مثال: 100" />
        </div>
        <div className="w-20">
          <label className="text-[10px] text-slate-500 block mb-1">نسبة الخصم %</label>
          <input type="number" value={percent} onChange={(e) => setPercent(e.target.value)} className="w-full p-2 text-sm border border-[#b99ecb] rounded outline-none focus:ring-1 focus:ring-[#337159]" placeholder="مثال: 10" />
        </div>
        <button onClick={handleAdd} className="bg-[#337159] hover:bg-[#2a5c48] text-white p-2 rounded"><Plus className="w-5 h-5" /></button>
      </div>
    </div>
  );
};

const PriceTiersManager = ({ tiers, onChange, unitLabel }) => {
  const [minQty, setMinQty] = useState('');
  const [price, setPrice] = useState('');

  const handleAdd = () => {
    if (minQty === '' || price === '') return;
    const newRule = { min: parseFloat(minQty), price: parseFloat(price) };
    const newTiers = [...(tiers || []), newRule].sort((a, b) => a.min - b.min);
    onChange(newTiers);
    setMinQty('');
    setPrice('');
  };

  const handleRemove = (index) => {
    const newTiers = tiers.filter((_, i) => i !== index);
    onChange(newTiers);
  };

  return (
    <div className="bg-[#337159]/5 p-3 md:p-4 rounded-xl border border-[#337159]/20 mt-4">
      <div className="flex items-center gap-2 mb-3 text-[#337159]">
        <Layers className="w-5 h-5" />
        <h4 className="font-bold text-sm">أسعار مخصصة بناءً على الاستهلاك</h4>
      </div>

      <div className="space-y-2 mb-3">
        {(!tiers || tiers.length === 0) && <p className="text-xs text-slate-400 text-center">السعر الأساسي فقط هو المفعل أو لا توجد شرائح</p>}
        {tiers?.map((rule, idx) => (
          <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-[#b99ecb]/30 text-sm">
            <span>من <span className="font-bold text-[#337159]">{rule.min}</span> {unitLabel} فأكثر</span>
            <div className="flex items-center gap-3">
              <span className="font-bold text-[#337159] bg-[#337159]/10 px-2 py-0.5 rounded text-xs md:text-sm">{rule.price} ريال للمتر</span>
              <button onClick={() => handleRemove(idx)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 items-end border-t border-[#337159]/10 pt-3">
        <div className="flex-1">
          <label className="text-[10px] text-slate-500 block mb-1">الحد الأدنى ({unitLabel})</label>
          <input type="number" value={minQty} step="0.1" onChange={(e) => setMinQty(e.target.value)} className="w-full p-2 text-sm border border-[#b99ecb] rounded outline-none focus:ring-1 focus:ring-[#337159]" placeholder="مثال: 4" />
        </div>
        <div className="w-24">
          <label className="text-[10px] text-slate-500 block mb-1">سعر المتر (ريال)</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full p-2 text-sm border border-[#b99ecb] rounded outline-none focus:ring-1 focus:ring-[#337159]" placeholder="مثال: 120" />
        </div>
        <button onClick={handleAdd} className="bg-[#337159] hover:bg-[#2a5c48] text-white p-2 rounded"><Plus className="w-5 h-5" /></button>
      </div>
    </div>
  );
};

const ResultBox = ({ label, value, highlighted = false }) => (
  <div className={`p-3 rounded-lg border ${highlighted ? 'bg-[#fa5732]/10 border-[#fa5732]/30' : 'bg-slate-50 border-slate-100'}`}>
    <div className="text-[10px] md:text-xs text-slate-500 mb-1">{label}</div>
    <div className={`font-bold text-lg md:text-xl ${highlighted ? 'text-[#fa5732]' : 'text-[#337159]'}`}>
      {typeof value === 'object' && value !== null ? JSON.stringify(value) : value}
    </div>
  </div>
);

const AuthScreen = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'forgot'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // حالة نسيت كلمة المرور
  const [resetEmail, setResetEmail] = useState('');
  const [resetNewPass, setResetNewPass] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState(null); // { type, text }

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMsg(null);

    try {
      if (resetEmail.trim().toLowerCase() === 'admin@print.com') {
        setResetMsg({ type: 'error', text: 'حساب المدير العام لا يمكن إعادة تعيينه من هنا.' });
        setResetLoading(false);
        return;
      }

      const usersSnap = await getDoc(doc(db, ...USERS_DB_PATH));
      const currentUsers = usersSnap.exists() ? (usersSnap.data().list || []) : [];
      const foundUser = currentUsers.find(u => u.email.toLowerCase() === resetEmail.trim().toLowerCase());

      if (!foundUser) {
        setResetMsg({ type: 'error', text: 'هذا البريد الإلكتروني غير مسجل في النظام.' });
        setResetLoading(false);
        return;
      }

      await addDoc(collection(db, ...RESET_REQUESTS_PATH), {
        email: foundUser.email,
        name: foundUser.name || '',
        requestedPassword: resetNewPass,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      setResetMsg({ type: 'success', text: 'تم إرسال طلبك للمسؤول. ستتمكن من الدخول بكلمة المرور الجديدة فور موافقته.' });
      setResetEmail('');
      setResetNewPass('');
    } catch (err) {
      console.error(err);
      setResetMsg({ type: 'error', text: 'حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى.' });
    }
    setResetLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (email === 'admin@print.com') {
      onLoginSuccess({
        email: 'admin@print.com',
        name: 'المدير العام',
        role: 'admin',
        uid: 'admin-master-id'
      });
      return;
    }

    try {
      const usersDocRef = doc(db, ...USERS_DB_PATH);
      const usersSnap = await getDoc(usersDocRef);
      let currentUsers = [];

      if (usersSnap.exists()) {
        currentUsers = usersSnap.data().list || [];
      }

      const foundUser = currentUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

      if (foundUser) {
        // يُسمح للموظفين والمسؤولين بالدخول، كلٌّ حسب صلاحيته
        onLoginSuccess(foundUser);
      } else {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      }
    } catch (err) {
      console.error(err);
      setError('حدث خطأ في الاتصال بقاعدة البيانات');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl max-w-md w-full relative border-t-4 border-[#337159]">
        <div className="text-center mb-8 mt-4">
          <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 flex items-center justify-center p-1">
            <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-[#337159]">{mode === 'login' ? 'تسجيل الدخول' : 'استعادة كلمة المرور'}</h1>
          <p className="text-slate-500 text-sm mt-1">{mode === 'login' ? 'يرجى تسجيل الدخول للوصول إلى الحاسبات' : 'أدخل بريدك وكلمة المرور الجديدة لإرسال طلب للمسؤول'}</p>
        </div>

        {mode === 'login' ? (
          <>
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm text-center border border-red-100">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#337159] mb-1">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute top-3 right-3 w-5 h-5 text-[#b99ecb]" />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pr-10 pl-3 py-2.5 border border-[#b99ecb] rounded-xl focus:ring-2 focus:ring-[#fa5732] outline-none" placeholder="name@company.com" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#337159] mb-1">كلمة المرور</label>
                <div className="relative">
                  <Key className="absolute top-3 right-3 w-5 h-5 text-[#b99ecb]" />
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pr-10 pl-3 py-2.5 border border-[#b99ecb] rounded-xl focus:ring-2 focus:ring-[#fa5732] outline-none" placeholder="******" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-[#fa5732] hover:bg-[#d94a29] text-white py-3 rounded-xl font-bold shadow-lg shadow-orange-100 transition-all mt-6 disabled:opacity-70 disabled:cursor-not-allowed">
                {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
              </button>
            </form>

            <button
              type="button"
              onClick={() => { setMode('forgot'); setError(''); setResetMsg(null); }}
              className="w-full text-center text-sm text-[#337159] hover:text-[#fa5732] font-medium mt-5 flex items-center justify-center gap-1.5 transition-colors"
            >
              <KeyRound className="w-4 h-4" /> نسيت كلمة المرور؟
            </button>
          </>
        ) : (
          <>
            {resetMsg && (
              <div className={`p-3 rounded-lg mb-6 text-sm text-center border ${resetMsg.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                {resetMsg.text}
              </div>
            )}

            <form onSubmit={handleResetRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#337159] mb-1">البريد الإلكتروني المسجّل</label>
                <div className="relative">
                  <Mail className="absolute top-3 right-3 w-5 h-5 text-[#b99ecb]" />
                  <input type="email" required value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="w-full pr-10 pl-3 py-2.5 border border-[#b99ecb] rounded-xl focus:ring-2 focus:ring-[#fa5732] outline-none" placeholder="name@company.com" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#337159] mb-1">كلمة المرور الجديدة المطلوبة</label>
                <div className="relative">
                  <Key className="absolute top-3 right-3 w-5 h-5 text-[#b99ecb]" />
                  <input type="text" required minLength={4} value={resetNewPass} onChange={(e) => setResetNewPass(e.target.value)} className="w-full pr-10 pl-3 py-2.5 border border-[#b99ecb] rounded-xl focus:ring-2 focus:ring-[#fa5732] outline-none" placeholder="كلمة المرور الجديدة" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">سيتم تفعيلها بعد موافقة المسؤول على الطلب.</p>
              </div>
              <button type="submit" disabled={resetLoading} className="w-full bg-[#337159] hover:bg-[#2a5c48] text-white py-3 rounded-xl font-bold shadow-lg transition-all mt-6 disabled:opacity-70 disabled:cursor-not-allowed">
                {resetLoading ? 'جاري الإرسال...' : 'إرسال طلب إعادة التعيين'}
              </button>
            </form>

            <button
              type="button"
              onClick={() => { setMode('login'); setResetMsg(null); }}
              className="w-full text-center text-sm text-slate-500 hover:text-[#337159] font-medium mt-5 transition-colors"
            >
              العودة لتسجيل الدخول
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const UserManagement = ({ currentUser }) => {
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('employee');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [usersList, setUsersList] = useState([]);
  const [resetRequests, setResetRequests] = useState([]);
  const [processingReset, setProcessingReset] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);

  useEffect(() => {
    const usersDocRef = doc(db, ...USERS_DB_PATH);
    const unsubscribe = onSnapshot(usersDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setUsersList(docSnap.data().list || []);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const reqRef = collection(db, ...RESET_REQUESTS_PATH);
    const unsubscribe = onSnapshot(reqRef, (snapshot) => {
      const data = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(r => r.status === 'pending')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setResetRequests(data);
    });
    return () => unsubscribe();
  }, []);

  // اعتماد طلب: تعيين كلمة المرور الجديدة للمستخدم ثم حذف الطلب
  const handleApproveReset = async (req) => {
    setProcessingReset(req.id);
    try {
      const newList = usersList.map(u =>
        u.email.toLowerCase() === req.email.toLowerCase()
          ? { ...u, password: req.requestedPassword }
          : u
      );
      await setDoc(doc(db, ...USERS_DB_PATH), { list: newList }, { merge: true });
      await deleteDoc(doc(db, ...RESET_REQUESTS_PATH, req.id));
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء اعتماد الطلب: ' + err.message);
    }
    setProcessingReset(null);
  };

  // رفض / حذف طلب دون تغيير كلمة المرور
  const handleRejectReset = async (req) => {
    setProcessingReset(req.id);
    try {
      await deleteDoc(doc(db, ...RESET_REQUESTS_PATH, req.id));
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حذف الطلب: ' + err.message);
    }
    setProcessingReset(null);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      if (usersList.some(u => u.email.toLowerCase() === newUserEmail.toLowerCase())) {
        setMsg('هذا البريد الإلكتروني مسجل بالفعل');
        setLoading(false);
        return;
      }
      const newUser = {
        uid: 'user-' + Date.now(),
        email: newUserEmail,
        password: newUserPass,
        name: newUserName,
        role: newUserRole,
        createdAt: new Date().toISOString()
      };
      const usersDocRef = doc(db, ...USERS_DB_PATH);
      try {
        await updateDoc(usersDocRef, { list: arrayUnion(newUser) });
      } catch {
        await setDoc(usersDocRef, { list: [newUser] });
      }
      setMsg('تم إنشاء المستخدم بنجاح!');
      setNewUserEmail(''); setNewUserPass(''); setNewUserName('');
    } catch (err) {
      console.error(err);
      setMsg('حدث خطأ أثناء الحفظ');
    }
    setLoading(false);
  };

  // حذف مستخدم من القائمة
  const handleDeleteUser = async (user) => {
    if (currentUser && user.email.toLowerCase() === currentUser.email.toLowerCase()) {
      alert('لا يمكنك حذف حسابك الحالي.');
      return;
    }
    if (!window.confirm(`هل أنت متأكد من حذف المستخدم "${user.name}" (${user.email})؟ لا يمكن التراجع عن هذا الإجراء.`)) {
      return;
    }
    setDeletingUser(user.email);
    try {
      const newList = usersList.filter(u => u.email.toLowerCase() !== user.email.toLowerCase());
      await setDoc(doc(db, ...USERS_DB_PATH), { list: newList }, { merge: true });
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حذف المستخدم: ' + err.message);
    }
    setDeletingUser(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-[#337159]/5 p-6 rounded-xl border border-[#337159]/20">
        <h4 className="font-bold text-[#337159] mb-4 flex items-center gap-2"><UserPlus className="w-5 h-5" /> إضافة مستخدم جديد</h4>
        {msg && <div className={`p-3 rounded-lg mb-4 text-sm font-bold text-center ${msg.includes('بنجاح') ? 'bg-green-100 text-green-800' : 'bg-red-200 text-red-800'}`}>{msg}</div>}
        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-xs font-bold text-slate-600 mb-1">الاسم</label><input type="text" required value={newUserName} onChange={e => setNewUserName(e.target.value)} className="w-full p-2 rounded border border-[#b99ecb] focus:ring-2 focus:ring-[#337159] outline-none" /></div>
          <div><label className="block text-xs font-bold text-slate-600 mb-1">البريد الإلكتروني</label><input type="email" required value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} className="w-full p-2 rounded border border-[#b99ecb] focus:ring-2 focus:ring-[#337159] outline-none" /></div>
          <div><label className="block text-xs font-bold text-slate-600 mb-1">كلمة المرور</label><input type="text" required value={newUserPass} onChange={e => setNewUserPass(e.target.value)} className="w-full p-2 rounded border border-[#b99ecb] focus:ring-2 focus:ring-[#337159] outline-none" placeholder="كلمة المرور" /></div>
          <div><label className="block text-xs font-bold text-slate-600 mb-1">الدور (الصلاحية)</label><select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} className="w-full p-2 rounded border border-[#b99ecb] focus:ring-2 focus:ring-[#337159] outline-none bg-white"><option value="employee">موظف (حاسبة فقط)</option><option value="admin">مسؤول (تحكم كامل)</option></select></div>
          <div className="md:col-span-2 mt-2"><button type="submit" disabled={loading} className="w-full bg-[#337159] hover:bg-[#2a5c48] text-white py-2 rounded-lg font-bold shadow transition-colors disabled:opacity-50">{loading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}</button></div>
        </form>
      </div>
      {/* طلبات إعادة تعيين كلمة المرور */}
      <div className="bg-amber-50 p-4 md:p-6 rounded-xl border border-amber-200">
        <h4 className="font-bold text-amber-800 mb-4 flex items-center gap-2">
          <KeyRound className="w-5 h-5" /> طلبات إعادة تعيين كلمة المرور
          {resetRequests.length > 0 && (
            <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{resetRequests.length}</span>
          )}
        </h4>
        {resetRequests.length === 0 ? (
          <p className="text-sm text-amber-700/70 text-center py-2">لا توجد طلبات معلّقة حالياً.</p>
        ) : (
          <div className="space-y-3">
            {resetRequests.map((req) => (
              <div key={req.id} className="bg-white p-3 rounded-lg border border-amber-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex-1 text-sm">
                  <div className="font-bold text-slate-700">{req.name || 'مستخدم'}</div>
                  <div className="font-mono text-xs text-slate-500">{req.email}</div>
                  <div className="text-xs mt-1">كلمة المرور الجديدة المطلوبة: <span className="font-mono font-bold text-[#fa5732] bg-[#fa5732]/10 px-2 py-0.5 rounded">{req.requestedPassword}</span></div>
                  <div className="text-[10px] text-slate-400 mt-1">{new Date(req.createdAt).toLocaleString('ar-EG')}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApproveReset(req)}
                    disabled={processingReset === req.id}
                    className="bg-[#337159] hover:bg-[#2a5c48] text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                  >
                    <Check className="w-4 h-4" /> {processingReset === req.id ? 'جارٍ...' : 'اعتماد'}
                  </button>
                  <button
                    onClick={() => handleRejectReset(req)}
                    disabled={processingReset === req.id}
                    className="text-red-500 hover:bg-red-50 border border-red-100 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> رفض
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-[#b99ecb]" /> قائمة المستخدمين المسجلين</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-bold">
              <tr><th className="p-3 border-b">الاسم</th><th className="p-3 border-b">البريد الإلكتروني</th><th className="p-3 border-b">كلمة المرور</th><th className="p-3 border-b">الدور</th><th className="p-3 border-b">تاريخ التسجيل</th><th className="p-3 border-b text-center">إجراءات</th></tr>
            </thead>
            <tbody>
              {usersList.length === 0 ? (<tr><td colSpan="6" className="p-4 text-center text-slate-400">لا يوجد مستخدمين مسجلين في القائمة بعد.</td></tr>) : (
                usersList.map((user, idx) => {
                  const isSelf = currentUser && user.email.toLowerCase() === currentUser.email.toLowerCase();
                  return (
                  <tr key={idx} className="border-b hover:bg-slate-50">
                    <td className="p-3">{user.name}</td><td className="p-3 font-mono text-xs">{user.email}</td><td className="p-3 font-mono text-xs text-slate-400">{user.password}</td>
                    <td className="p-3"><span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'admin' ? 'bg-[#b99ecb]/20 text-[#b99ecb]' : 'bg-[#337159]/10 text-[#337159]'}`}>{user.role === 'admin' ? 'مسؤول' : 'موظف'}</span></td>
                    <td className="p-3 text-slate-400 text-xs">{new Date(user.createdAt).toLocaleDateString('ar-EG')}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDeleteUser(user)}
                        disabled={isSelf || deletingUser === user.email}
                        title={isSelf ? 'لا يمكنك حذف حسابك الحالي' : 'حذف المستخدم'}
                        className="text-red-500 hover:bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <Trash2 className="w-4 h-4" /> {deletingUser === user.email ? 'جارٍ...' : 'حذف'}
                      </button>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const HistoryLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const logsRef = collection(db, ...HISTORY_COLLECTION_PATH);
    const unsubscribe = onSnapshot(logsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setLogs(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="text-center p-8 text-slate-500">جاري تحميل السجل...</div>;

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 animate-in fade-in duration-300">
      <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
        <History className="w-5 h-5 text-[#fa5732]" />
        سجل تسعيرات الموظفين
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-600 font-bold">
            <tr>
              <th className="p-3 border-b">التاريخ</th>
              <th className="p-3 border-b">الموظف</th>
              <th className="p-3 border-b">النوع</th>
              <th className="p-3 border-b">التفاصيل</th>
              <th className="p-3 border-b">السعر النهائي</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan="5" className="p-4 text-center text-slate-400">لا توجد سجلات حتى الآن.</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-slate-50">
                  <td className="p-3 text-xs font-mono text-slate-500">{new Date(log.createdAt).toLocaleString('ar-EG')}</td>
                  <td className="p-3 font-bold text-[#337159]">{log.employeeName}</td>
                  <td className="p-3"><span className={`px-2 py-1 rounded text-xs font-bold bg-[#b99ecb]/10 text-[#337159]`}>{log.type === 'roll' ? 'رول' : log.type === 'digital' ? 'ديجيتال' : log.type === 'uvdtf' ? 'UV DTF' : log.type === 'offset' ? 'أوفست' : 'بصمة'}</span></td>
                  <td className="p-3 text-xs text-slate-600 max-w-[200px] truncate" title={log.details}>{log.details}</td>
                  <td className="p-3 font-bold text-[#fa5732]">{Math.round(log.finalPrice)} ريال</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AdminPanel = ({ prices, onUpdatePrice, onLogout, currentUser, generalSettings, onUpdateGeneralSettings }) => {
  const [localPrices, setLocalPrices] = useState(prices);
  const [localGeneral, setLocalGeneral] = useState(generalSettings || { allowPriceOverride: false });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('roll');

  const [newPaperName, setNewPaperName] = useState('');
  const [newPaperPrice, setNewPaperPrice] = useState('');

  // Offset specific states for new items
  const [newOffsetPaperName, setNewOffsetPaperName] = useState('');
  const [newOffsetPaperPrice, setNewOffsetPaperPrice] = useState('');

  const [newAddonName, setNewAddonName] = useState('');
  const [newAddonPrice, setNewAddonPrice] = useState('');

  useEffect(() => {
    const updatedPrices = { ...prices };
    if (!updatedPrices.digitalAddons) updatedPrices.digitalAddons = [];
    if (!updatedPrices.rollDiscounts) updatedPrices.rollDiscounts = [];
    if (!updatedPrices.digitalDiscounts) updatedPrices.digitalDiscounts = [];
    if (!updatedPrices.uvDtfDiscounts) updatedPrices.uvDtfDiscounts = [];
    if (!updatedPrices.uvDtfTiers) updatedPrices.uvDtfTiers = [
      { min: 0, price: 150 },
      { min: 4, price: 120 },
      { min: 11, price: 95 }
    ];
    if (!updatedPrices.offsetPaperTypes) updatedPrices.offsetPaperTypes = [];
    if (!updatedPrices.offsetDiscounts) updatedPrices.offsetDiscounts = [];

    // Default Offset Values
    if (!updatedPrices.offsetFixedWidth) updatedPrices.offsetFixedWidth = 5;
    if (!updatedPrices.offsetFixedHeight) updatedPrices.offsetFixedHeight = 9;
    if (!updatedPrices.offsetPlatePrice) updatedPrices.offsetPlatePrice = 50;
    if (!updatedPrices.offsetPrintPrice1000) updatedPrices.offsetPrintPrice1000 = 80;
    if (!updatedPrices.offsetMinQty) updatedPrices.offsetMinQty = 1000;

    // Default Foil Values
    if (!updatedPrices.foilMoldPricePerCm2) updatedPrices.foilMoldPricePerCm2 = 1.15;
    if (!updatedPrices.foilMinMoldPrice) updatedPrices.foilMinMoldPrice = 150;
    if (!updatedPrices.foilStampingUnitPrice) updatedPrices.foilStampingUnitPrice = 0.40;

    // Show Digital Paper Field Toggle Default
    if (updatedPrices.showDigitalPaperField === undefined) updatedPrices.showDigitalPaperField = true;

    // Updated Digital Sheet Sizes Default (Long Sheet)
    if (!updatedPrices.digitalSheetSizes || updatedPrices.digitalSheetSizes.length === 0) {
      updatedPrices.digitalSheetSizes = [
        { name: 'ربع ورق (33×48)', width: 33, height: 48 },
        { name: 'شيت طويل (33×100)', width: 33, height: 100 }
      ];
    } else {
      const hasFullSheet = updatedPrices.digitalSheetSizes.some(s => s.width === 70 && s.height === 100);
      if (hasFullSheet) {
        updatedPrices.digitalSheetSizes = updatedPrices.digitalSheetSizes.filter(s => !(s.width === 70 && s.height === 100));
        updatedPrices.digitalSheetSizes.push({ name: 'شيت طويل (33×100)', width: 33, height: 100 });
      }
    }

    setLocalPrices(updatedPrices);
  }, [prices]);

  useEffect(() => {
    if (generalSettings) setLocalGeneral(generalSettings);
  }, [generalSettings]);

  const handleChange = (key, value) => { setLocalPrices(prev => ({ ...prev, [key]: value })); };

  const handleSave = async () => {
    setSaving(true);
    await onUpdatePrice(localPrices);
    if (JSON.stringify(localGeneral) !== JSON.stringify(generalSettings)) {
      await onUpdateGeneralSettings(localGeneral);
    }
    setSaving(false);
  };

  const toggleGeneralSetting = (key) => {
    setLocalGeneral(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const safeHandleAddPaper = () => {
    if (!newPaperName || !newPaperPrice) return;
    const currentPapers = localPrices.digitalPaperTypes || [];
    setLocalPrices(prev => ({ ...prev, digitalPaperTypes: [...currentPapers, { name: newPaperName, price: parseFloat(newPaperPrice), active: true }] }));
    setNewPaperName(''); setNewPaperPrice('');
  };
  const handleRemovePaper = (i) => setLocalPrices(prev => ({ ...prev, digitalPaperTypes: prev.digitalPaperTypes.filter((_, idx) => idx !== i) }));

  const handlePaperChange = (i, f, v) => {
    const up = [...localPrices.digitalPaperTypes];
    if (f === 'price') {
      up[i][f] = parseFloat(v);
    } else if (f === 'active') {
      up[i][f] = v;
    } else {
      up[i][f] = v;
    }
    setLocalPrices(prev => ({ ...prev, digitalPaperTypes: up }));
  };

  // --- Offset Paper Management ---
  const safeHandleAddOffsetPaper = () => {
    if (!newOffsetPaperName || !newOffsetPaperPrice) return;
    const currentPapers = localPrices.offsetPaperTypes || [];
    setLocalPrices(prev => ({ ...prev, offsetPaperTypes: [...currentPapers, { name: newOffsetPaperName, price: parseFloat(newOffsetPaperPrice), active: true }] }));
    setNewOffsetPaperName(''); setNewOffsetPaperPrice('');
  };
  const handleRemoveOffsetPaper = (i) => setLocalPrices(prev => ({ ...prev, offsetPaperTypes: prev.offsetPaperTypes.filter((_, idx) => idx !== i) }));
  const handleOffsetPaperChange = (i, f, v) => {
    const up = [...localPrices.offsetPaperTypes];
    up[i][f] = f === 'price' ? parseFloat(v) : (f === 'active' ? v : v);
    setLocalPrices(prev => ({ ...prev, offsetPaperTypes: up }));
  };

  const handleSheetSizeChange = (i, f, v) => {
    const us = [...localPrices.digitalSheetSizes]; us[i][f] = f === 'name' ? v : parseFloat(v);
    setLocalPrices(prev => ({ ...prev, digitalSheetSizes: us }));
  };
  const safeHandleAddAddon = () => {
    if (!newAddonName || !newAddonPrice) return;
    const currentAddons = localPrices.digitalAddons || [];
    setLocalPrices(prev => ({ ...prev, digitalAddons: [...currentAddons, { name: newAddonName, price: parseFloat(newAddonPrice) }] }));
    setNewAddonName(''); setNewAddonPrice('');
  };
  const handleRemoveAddon = (i) => setLocalPrices(prev => ({ ...prev, digitalAddons: prev.digitalAddons.filter((_, idx) => idx !== i) }));
  const handleAddonChange = (i, f, v) => {
    const ua = [...localPrices.digitalAddons]; ua[i][f] = f === 'price' ? parseFloat(v) : v;
    setLocalPrices(prev => ({ ...prev, digitalAddons: ua }));
  };
  const handleDiscountChange = (tab, newDiscounts) => setLocalPrices(prev => ({ ...prev, [tab]: newDiscounts }));

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div className="w-full md:w-auto">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Logo" className="w-10 h-10 md:w-12 md:h-12 object-contain" />
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-[#337159]">لوحة تحكم المسؤول</h2>
              <p className="text-xs text-slate-500 mt-1">مرحباً بك، {currentUser.name}</p>
            </div>
          </div>
        </div>
        <button onClick={onLogout} className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium border border-red-100 flex items-center gap-2 w-full md:w-auto justify-center">
          <LogOut className="w-4 h-4" /> خروج
        </button>
      </div>

      <div className="flex gap-2 mb-6 border-b border-slate-200 pb-1 overflow-x-auto">
        <button onClick={() => setActiveTab('roll')} className={`px-4 py-3 rounded-t-xl font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'roll' ? 'bg-[#337159] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}><Scroll className="w-5 h-5" /> رول</button>
        <button onClick={() => setActiveTab('digital')} className={`px-4 py-3 rounded-t-xl font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'digital' ? 'bg-[#337159] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}><Layout className="w-5 h-5" /> ديجيتال</button>
        <button onClick={() => setActiveTab('offset')} className={`px-4 py-3 rounded-t-xl font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'offset' ? 'bg-[#337159] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}><Factory className="w-5 h-5" /> أوفست</button>
        <button onClick={() => setActiveTab('uvdtf')} className={`px-4 py-3 rounded-t-xl font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'uvdtf' ? 'bg-[#337159] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}><Palette className="w-5 h-5" /> UV DTF</button>
        <button onClick={() => setActiveTab('users')} className={`px-4 py-3 rounded-t-xl font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'users' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}><Users className="w-5 h-5" /> المستخدمين</button>
        <button onClick={() => setActiveTab('history')} className={`px-4 py-3 rounded-t-xl font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'history' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}><History className="w-5 h-5" /> السجل</button>
        <button onClick={() => setActiveTab('general')} className={`px-4 py-3 rounded-t-xl font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'general' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}><Sliders className="w-5 h-5" /> عام</button>
      </div>

      <div className="bg-white p-4 md:p-8 rounded-b-xl rounded-tr-xl shadow-sm border border-slate-200 min-h-[400px]">
        {activeTab === 'roll' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6 text-[#337159] border-b border-[#337159]/20 pb-4"><Scroll className="w-6 h-6" /><h3 className="font-bold text-xl">إعدادات خامات الرول</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="block text-sm font-medium text-slate-600 mb-2">سعر المتر المربع الأساسي (ريال)</label><input type="number" value={localPrices.rollUnitPrice || ''} onChange={(e) => handleChange('rollUnitPrice', e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#337159] outline-none text-lg" /></div>
              <div><label className="block text-sm font-medium text-slate-600 mb-2">عرض الرول الافتراضي (سم)</label><input type="number" value={localPrices.defaultRollWidth || ''} onChange={(e) => handleChange('defaultRollWidth', e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#337159] outline-none text-lg" /></div>
            </div>
            <DiscountManager discounts={localPrices.rollDiscounts} onChange={(newDiscounts) => handleDiscountChange('rollDiscounts', newDiscounts)} unitLabel="متر مربع (المساحة)" />
          </div>
        )}

        {activeTab === 'digital' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-4 text-[#337159] border-b border-[#337159]/20 pb-4"><Layout className="w-6 h-6" /><h3 className="font-bold text-xl">إعدادات خامات الديجيتال</h3></div>

            {/* Toggle Show/Hide Paper Field */}
            <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between mb-6">
              <div>
                <h4 className="font-bold text-slate-800 mb-1 text-sm md:text-base">إظهار قائمة "نوع الورق" في الحاسبة</h4>
                <p className="text-xs md:text-sm text-slate-500">عند التعطيل، سيتم إخفاء قائمة اختيار الورق وسيتم اعتماد السعر الافتراضي أو أول ورق في القائمة.</p>
              </div>
              <button
                onClick={() => handleChange('showDigitalPaperField', !localPrices.showDigitalPaperField)}
                className={`p-2 rounded-full transition-colors ${localPrices.showDigitalPaperField !== false ? 'bg-[#337159]/10 text-[#337159]' : 'bg-slate-100 text-slate-400'}`}
              >
                {localPrices.showDigitalPaperField !== false ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-8">
                {/* 1. Foil Settings in Digital */}
                <div className="bg-[#b99ecb]/5 p-6 rounded-xl border border-[#b99ecb]/30">
                  <div className="flex items-center gap-2 mb-4 text-[#337159]"><Stamp className="w-5 h-5" /><h4 className="font-bold text-lg">إعدادات البصمة (Foil)</h4></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className="block text-xs font-bold text-slate-600 mb-1">سعر 1 سم² للقالب</label><input type="number" value={localPrices.foilMoldPricePerCm2 || ''} onChange={(e) => handleChange('foilMoldPricePerCm2', e.target.value)} className="w-full p-2 border border-[#b99ecb] rounded focus:ring-1 focus:ring-[#337159] outline-none text-sm" /></div>
                    <div><label className="block text-xs font-bold text-slate-600 mb-1">الحد الأدنى للقالب</label><input type="number" value={localPrices.foilMinMoldPrice || ''} onChange={(e) => handleChange('foilMinMoldPrice', e.target.value)} className="w-full p-2 border border-[#b99ecb] rounded focus:ring-1 focus:ring-[#337159] outline-none text-sm" /></div>
                    <div><label className="block text-xs font-bold text-slate-600 mb-1">سعر التبصيم (للحبة)</label><input type="number" value={localPrices.foilStampingUnitPrice || ''} onChange={(e) => handleChange('foilStampingUnitPrice', e.target.value)} className="w-full p-2 border border-[#b99ecb] rounded focus:ring-1 focus:ring-[#337159] outline-none text-sm" /></div>
                  </div>
                </div>

                {/* 2. Sheet Sizes */}
                <div className="bg-[#337159]/5 p-6 rounded-xl border border-[#337159]/10">
                  <div className="flex items-center gap-2 mb-4 text-[#337159]"><Maximize className="w-5 h-5" /><h4 className="font-bold text-lg">مقاسات الورق (سم)</h4></div>
                  <div className="space-y-4">
                    {localPrices.digitalSheetSizes?.map((size, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-lg border border-[#b99ecb]/30 shadow-sm">
                        <div className="mb-3"><label className="text-xs text-slate-400 block mb-1">اسم المقاس</label><input type="text" value={size.name} onChange={(e) => handleSheetSizeChange(idx, 'name', e.target.value)} className="w-full p-2 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-[#337159] outline-none font-bold text-slate-700" /></div>
                        <div className="grid grid-cols-2 gap-4">
                          <div><label className="text-xs text-slate-400 block mb-1">العرض</label><input type="number" value={size.width} onChange={(e) => handleSheetSizeChange(idx, 'width', e.target.value)} className="w-full p-2 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-[#337159] outline-none text-center" /></div>
                          <div><label className="text-xs text-slate-400 block mb-1">الطول</label><input type="number" value={size.height} onChange={(e) => handleSheetSizeChange(idx, 'height', e.target.value)} className="w-full p-2 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-[#337159] outline-none text-center" /></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-amber-50 p-6 rounded-xl border border-amber-100">
                  <div className="flex items-center gap-2 mb-4 text-amber-800"><Layers className="w-5 h-5" /><h4 className="font-bold text-lg">إدارة الإضافات</h4></div>
                  <div className="space-y-2 mb-4 max-h-[200px] overflow-y-auto">
                    {localPrices.digitalAddons?.map((addon, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded border border-amber-200 shadow-sm">
                        <input type="text" value={addon.name} onChange={(e) => handleAddonChange(idx, 'name', e.target.value)} className="flex-1 text-sm border-none bg-transparent outline-none font-bold text-slate-700" />
                        <span className="text-xs text-slate-400">سعر/شيت:</span>
                        <input type="number" value={addon.price} onChange={(e) => handleAddonChange(idx, 'price', e.target.value)} className="w-16 text-sm bg-amber-50 rounded px-1 text-center font-bold text-amber-800 outline-none" />
                        <button onClick={() => handleRemoveAddon(idx)} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 items-end border-t border-amber-200 pt-3">
                    <div className="flex-1"><label className="text-[10px] text-slate-500 block mb-1">اسم الإضافة</label><input type="text" value={newAddonName} onChange={(e) => setNewAddonName(e.target.value)} className="w-full p-2 text-sm border border-amber-200 rounded outline-none focus:ring-1 focus:ring-amber-500" /></div>
                    <div className="w-20"><label className="text-[10px] text-slate-500 block mb-1">السعر</label><input type="number" value={newAddonPrice} onChange={(e) => setNewAddonPrice(e.target.value)} className="w-full p-2 text-sm border border-amber-200 rounded outline-none focus:ring-1 focus:ring-amber-500" /></div>
                    <button onClick={safeHandleAddAddon} className="bg-amber-500 hover:bg-amber-600 text-white p-2 rounded"><Plus className="w-5 h-5" /></button>
                  </div>
                </div>
              </div>
              <div className="flex flex-col h-full">
                <div className="flex-1 bg-[#337159]/5 rounded-xl p-4 mb-4 overflow-y-auto min-h-[300px] border border-[#337159]/10">
                  {localPrices.digitalPaperTypes?.map((paper, idx) => (
                    <div key={idx} className={`flex items-center gap-3 bg-white p-3 mb-2 rounded-lg border border-slate-100 shadow-sm hover:shadow-md transition-shadow ${paper.active === false ? 'opacity-50' : ''}`}>
                      <button
                        onClick={() => handlePaperChange(idx, 'active', paper.active === false ? true : false)}
                        className={`p-1 rounded-full ${paper.active !== false ? 'text-[#337159] hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`}
                        title={paper.active !== false ? 'تعطيل' : 'تفعيل'}
                      >
                        {paper.active !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <div className="flex-1"><label className="text-[10px] text-slate-400 block mb-1">اسم الورق</label><input type="text" value={paper.name} onChange={(e) => handlePaperChange(idx, 'name', e.target.value)} className="w-full text-sm font-bold text-slate-700 border-b border-transparent focus:border-[#337159] outline-none bg-transparent hover:bg-slate-50 p-1" /></div>
                      <div className="w-20"><label className="text-[10px] text-slate-400 block mb-1">السعر (ريال)</label><input type="number" value={paper.price} onChange={(e) => handlePaperChange(idx, 'price', e.target.value)} className="w-full text-sm font-bold text-[#337159] bg-[#337159]/10 border border-[#337159]/20 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-[#337159]" /></div>
                      <button onClick={() => handleRemovePaper(idx)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 mb-4">
                  <h5 className="text-sm font-bold text-slate-600 mb-3">إضافة نوع جديد</h5>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1"><label className="block text-xs text-slate-500 mb-1">اسم الخامة</label><input type="text" value={newPaperName} onChange={(e) => setNewPaperName(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#337159] outline-none" placeholder="مثال: كوشيه 300" /></div>
                    <div className="w-24"><label className="block text-xs text-slate-500 mb-1">السعر</label><input type="number" value={newPaperPrice} onChange={(e) => setNewPaperPrice(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#337159] outline-none" placeholder="0" /></div>
                    <button onClick={safeHandleAddPaper} className="bg-[#337159] hover:bg-[#2a5c48] text-white p-2.5 rounded-lg transition-colors flex items-center justify-center shadow-md"><Plus className="w-5 h-5" /></button>
                  </div>
                </div>
                <DiscountManager discounts={localPrices.digitalDiscounts} onChange={(newDiscounts) => handleDiscountChange('digitalDiscounts', newDiscounts)} unitLabel="شيت (عدد الورق)" />
              </div>
            </div>
          </div>
        )}

        {/* --- Offset Tab Settings --- */}
        {activeTab === 'offset' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-4 text-[#337159] border-b border-[#337159]/20 pb-4"><Factory className="w-6 h-6" /><h3 className="font-bold text-xl">إعدادات الأوفست (Offset)</h3></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-[#337159]/5 p-4 rounded-xl border border-[#337159]/20 shadow-sm">
                <label className="block text-sm font-bold text-[#337159] mb-2">ثابت العرض (A)</label>
                <input type="number" value={localPrices.offsetFixedWidth ?? 5} onChange={(e) => handleChange('offsetFixedWidth', e.target.value)} className="w-full p-3 border border-[#337159]/30 rounded-lg focus:ring-2 focus:ring-[#337159] outline-none text-lg text-center font-bold" />
                <p className="text-xs text-slate-400 mt-1">يُستخدم في المعادلة: CEILING(العرض / ثابت العرض)</p>
              </div>
              <div className="bg-[#337159]/5 p-4 rounded-xl border border-[#337159]/20 shadow-sm">
                <label className="block text-sm font-bold text-[#337159] mb-2">ثابت الطول (B)</label>
                <input type="number" value={localPrices.offsetFixedHeight ?? 9} onChange={(e) => handleChange('offsetFixedHeight', e.target.value)} className="w-full p-3 border border-[#337159]/30 rounded-lg focus:ring-2 focus:ring-[#337159] outline-none text-lg text-center font-bold" />
                <p className="text-xs text-slate-400 mt-1">يُستخدم في المعادلة: CEILING(الطول / ثابت الطول)</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm text-blue-800 mb-6">
              <h5 className="font-bold mb-1">📐 معادلة الحساب:</h5>
              <p className="font-mono text-xs">السعر لكل 1000 = CEILING(عرض÷A) × CEILING(طول÷B) × سعر الورق/1000</p>
              <p className="font-mono text-xs mt-1">سعر الحبة = السعر لكل 1000 ÷ 1000</p>
              <p className="font-mono text-xs mt-1">السعر شامل الضريبة = السعر لكل 1000 × 1.15</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Paper Management for Offset */}
              <div className="flex flex-col h-full">
                <div className="bg-[#337159]/10 p-4 rounded-t-xl border border-[#337159]/20">
                  <h4 className="font-bold text-[#337159]">قائمة أنواع ورق الأوفست</h4>
                  <p className="text-xs text-[#337159]/80">الأسعار هنا لكل 1000 ورق (70×100)</p>
                </div>
                <div className="flex-1 bg-white border border-t-0 border-slate-200 p-4 mb-4 overflow-y-auto min-h-[300px]">
                  {localPrices.offsetPaperTypes?.map((paper, idx) => (
                    <div key={idx} className={`flex items-center gap-3 bg-slate-50 p-3 mb-2 rounded-lg border border-slate-100 shadow-sm ${paper.active === false ? 'opacity-50' : ''}`}>
                      <button
                        onClick={() => handleOffsetPaperChange(idx, 'active', paper.active === false ? true : false)}
                        className={`p-1 rounded-full ${paper.active !== false ? 'text-green-500 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`}
                      >
                        {paper.active !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-400 block mb-1">اسم الورق</label>
                        <input type="text" value={paper.name} onChange={(e) => handleOffsetPaperChange(idx, 'name', e.target.value)} className="w-full text-sm font-bold text-slate-700 bg-transparent border-none outline-none" />
                      </div>
                      <div className="w-24">
                        <label className="text-[10px] text-slate-400 block mb-1">سعر الألف (ريال)</label>
                        <input type="number" value={paper.price} onChange={(e) => handleOffsetPaperChange(idx, 'price', e.target.value)} className="w-full text-sm font-bold text-[#337159] bg-white border border-[#b99ecb] rounded px-2 py-1 outline-none text-center" />
                      </div>
                      <button onClick={() => handleRemoveOffsetPaper(idx)} className="text-red-400 hover:text-red-600 p-2"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}

                  {/* Add New Offset Paper */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <h5 className="text-xs font-bold text-slate-500 mb-2">إضافة ورق جديد</h5>
                    <div className="flex gap-2 items-end">
                      <input type="text" value={newOffsetPaperName} onChange={(e) => setNewOffsetPaperName(e.target.value)} className="flex-1 p-2 border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-[#337159]" placeholder="اسم الورق (مثال: كوشيه 300)" />
                      <input type="number" value={newOffsetPaperPrice} onChange={(e) => setNewOffsetPaperPrice(e.target.value)} className="w-24 p-2 border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-[#337159]" placeholder="السعر/1000" />
                      <button onClick={safeHandleAddOffsetPaper} className="bg-[#337159] hover:bg-[#2a5c48] text-white p-2 rounded"><Plus className="w-5 h-5" /></button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Offset Discounts */}
              <div>
                <DiscountManager discounts={localPrices.offsetDiscounts} onChange={(newDiscounts) => handleDiscountChange('offsetDiscounts', newDiscounts)} unitLabel="ورق (طباعة)" />
                <div className="mt-6 bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-sm text-yellow-800">
                  <h5 className="font-bold mb-2">ملاحظة عن الأوفست:</h5>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>يتم احتساب عدد الورق بقسمة الكمية المطلوبة على عدد التكرار في الورق (70×100).</li>
                    <li>تكلفة الورق = (عدد الورق / 1000) × سعر الورق المحدد.</li>
                    <li>تكلفة الطباعة = (عدد الورق / 1000) × سعر الطباعة، بحد أدنى للتشغيل.</li>
                    <li>عدد الزنكات = 4 (وجه واحد) أو 8 (وجهين).</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'uvdtf' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6 text-[#337159] border-b border-[#337159]/20 pb-4"><Palette className="w-6 h-6" /><h3 className="font-bold text-xl">إعدادات حاسبة UV DTF</h3></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-[#337159]/5 p-4 rounded-xl border border-[#337159]/20 shadow-sm">
                <label className="block text-sm font-bold text-[#337159] mb-2">سعر المتر الطولي الأساسي (ريال)</label>
                <input type="number" value={localPrices.uvDtfPrice || ''} onChange={(e) => handleChange('uvDtfPrice', e.target.value)} className="w-full p-3 border border-[#337159]/30 rounded-lg focus:ring-2 focus:ring-[#337159] outline-none text-lg text-center font-bold" />
              </div>
              <div className="bg-[#337159]/5 p-4 rounded-xl border border-[#337159]/20 shadow-sm">
                <label className="block text-sm font-bold text-[#337159] mb-2">عرض المسطح الفعلي (سم)</label>
                <input type="number" value={localPrices.uvDtfRollWidth ?? 55} onChange={(e) => handleChange('uvDtfRollWidth', e.target.value)} className="w-full p-3 border border-[#337159]/30 rounded-lg focus:ring-2 focus:ring-[#337159] outline-none text-lg text-center font-bold" />
                <p className="text-xs text-slate-400 mt-1">يُستخدم في المعادلة بدلاً من العرض الثابت (55 سم)</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm text-blue-800 mb-6">
              <h5 className="font-bold mb-1">📐 معادلة الحساب المُستخدمة:</h5>
              <p className="font-mono text-xs" dir="ltr">ROUND(CEILING(Qty / INT(RollWidth / (Height + 0.5)), 1) * (Width + 0.5) / 100, 2)</p>
              <p className="text-xs mt-1">يُضاف 0.5 سم كهامش أمان للملصق، ويتم تجربة تدوير التصميم تلقائياً واختيار الوضع الذي يستهلك أمتاراً أقل وتطبيقها.</p>
            </div>

            <PriceTiersManager tiers={localPrices.uvDtfTiers} onChange={(newTiers) => handleDiscountChange('uvDtfTiers', newTiers)} unitLabel="متر طولي (استهلاك)" />
          </div>
        )}

        {activeTab === 'users' && <UserManagement currentUser={currentUser} />}
        {activeTab === 'history' && <HistoryLog />}

        {/* General Settings Tab */}
        {activeTab === 'general' && (
          <div className="animate-in fade-in duration-300 p-4">
            <div className="flex items-center gap-3 mb-6 text-slate-800 border-b border-slate-200 pb-4"><Sliders className="w-6 h-6" /><h3 className="font-bold text-xl">إعدادات عامة</h3></div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-4">
              <h4 className="font-bold text-[#337159] mb-4 text-lg border-b pb-2">إعدادات الأسعار والربح</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">نسبة الضريبة (VAT) %</label>
                  <input
                    type="number"
                    value={localGeneral.taxRate ?? 15}
                    onChange={(e) => setLocalGeneral({ ...localGeneral, taxRate: parseFloat(e.target.value) })}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#337159] outline-none text-lg text-center font-bold text-[#337159]"
                  />
                  <p className="text-xs text-slate-400 mt-1">النسبة المئوية لضريبة القيمة المضافة (الافتراضي 15%)</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">نسبة هامش الربح %</label>
                  <input
                    type="number"
                    value={localGeneral.profitMargin ?? 15}
                    onChange={(e) => setLocalGeneral({ ...localGeneral, profitMargin: parseFloat(e.target.value) })}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#337159] outline-none text-lg text-center font-bold text-[#337159]"
                  />
                  <p className="text-xs text-slate-400 mt-1">النسبة المضافة فوق التكلفة كربح (الافتراضي 15%)</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between mb-4">
              <div>
                <h4 className="font-bold text-slate-800 mb-1">تفعيل إدخال الأسعار يدوياً للموظف</h4>
                <p className="text-sm text-slate-500">عند التفعيل، سيظهر حقل إضافي للموظف يسمح له بتعديل سعر الخامة (المتر/الورق) يدوياً.</p>
              </div>
              <button
                onClick={() => toggleGeneralSetting('allowPriceOverride')}
                className={`p-2 rounded-full transition-colors ${localGeneral.allowPriceOverride ? 'bg-[#337159]/10 text-[#337159]' : 'bg-slate-100 text-slate-400'}`}
              >
                {localGeneral.allowPriceOverride ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
              </button>
            </div>

            {/* Visibility Controls */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="font-bold text-slate-800 border-b pb-2">التحكم في ظهور الحاسبات</h4>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-700 font-medium"><Scroll className="w-4 h-4" /> حاسبة الرول (Roll-to-Roll)</span>
                <button onClick={() => toggleGeneralSetting('showRoll')} className={`p-1 rounded-full transition-colors ${localGeneral.showRoll !== false ? 'text-[#337159]' : 'text-slate-300'}`}>
                  {localGeneral.showRoll !== false ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-700 font-medium"><Layout className="w-4 h-4" /> حاسبة الديجيتال (Digital)</span>
                <button onClick={() => toggleGeneralSetting('showDigital')} className={`p-1 rounded-full transition-colors ${localGeneral.showDigital !== false ? 'text-[#337159]' : 'text-slate-300'}`}>
                  {localGeneral.showDigital !== false ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-700 font-medium"><Factory className="w-4 h-4" /> حاسبة الأوفست (Offset)</span>
                <button onClick={() => toggleGeneralSetting('showOffset')} className={`p-1 rounded-full transition-colors ${localGeneral.showOffset !== false ? 'text-[#337159]' : 'text-slate-300'}`}>
                  {localGeneral.showOffset !== false ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-700 font-medium"><Palette className="w-4 h-4" /> حاسبة UV DTF</span>
                <button onClick={() => toggleGeneralSetting('showUvDtf')} className={`p-1 rounded-full transition-colors ${localGeneral.showUvDtf !== false ? 'text-[#337159]' : 'text-slate-300'}`}>
                  {localGeneral.showUvDtf !== false ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-700 font-medium"><Layers className="w-4 h-4" /> حاسبة بوكسات الأوفست</span>
                <button onClick={() => toggleGeneralSetting('showOffsetBox')} className={`p-1 rounded-full transition-colors ${localGeneral.showOffsetBox !== false ? 'text-[#337159]' : 'text-slate-300'}`}>
                  {localGeneral.showOffsetBox !== false ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                </button>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'database' && (
          <div className="animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6 text-slate-800 border-b border-slate-200 pb-4"><Database className="w-6 h-6" /><h3 className="font-bold text-xl">عرض قاعدة البيانات الخام</h3></div>
            <div className="bg-slate-900 text-green-400 p-6 rounded-xl font-mono text-sm overflow-auto max-h-[500px] shadow-inner" dir="ltr">
              <div className="flex items-center gap-2 mb-4 text-slate-400 border-b border-slate-700 pb-2"><FileJson className="w-4 h-4" /><span>/artifacts/{appId || 'app'}/public/data/settings/pricing</span></div>
              <pre>{JSON.stringify(localPrices, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>

      {activeTab !== 'users' && activeTab !== 'history' && activeTab !== 'database' && (
        <div className="mt-8 flex justify-end">
          <button onClick={handleSave} disabled={saving} className="bg-[#fa5732] hover:bg-[#d94a29] text-white py-3 px-8 rounded-xl font-bold shadow-lg flex items-center gap-2 disabled:opacity-50 transition-transform hover:scale-105 active:scale-95">
            <Save className="w-5 h-5" /> {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </button>
        </div>
      )}
    </div>
  );
};

// 5. الحاسبة (الموظف)
// ===== حاسبة بوكسات الأوفست (Offset Boxes) — منقولة من ProSticker =====
const OB_MACHINES = {
  'ربع': { label: 'ربع 35×50', sheetW: 35, sheetH: 50, maxFlatW: 47, maxFlatH: 33, model: 'tiered', setup: 1050, tier1: 0.30, tier2: 0.65, tier3: 0.61 },
  'نص': { label: 'نص 50×70', sheetW: 50, sheetH: 70, maxFlatW: 69, maxFlatH: 49, model: 'tiered', setup: 1467, tier1: 1.07, tier2: 1.25, tier3: 1.09 },
  'كامل': {
    label: 'كامل 70×100', sheetW: 70, sheetH: 100, maxFlatW: 99, maxFlatH: 69, model: 'detailed',
    // الطباعة 4 لون: جدول مرجعي مباشر من المورد (مبني على عدد الحبات — كل وجه طباعة يُسعَّر مستقلاً)
    printTable: { 500: 900, 1000: 900, 3000: 1500, 5000: 2000, 10000: 3000, 20000: 4800 },
    diePerThousand1: 250, diePerThousandExtra: 150,
    plate: 800,
    // شيتات ثابتة للمعايرة والضبط (هالك تجهيز) — أياً كانت الكمية
    setupSheets: 200,
    // لا هالك نسبي هنا — الـ200 شيت تغطي التجهيز
    wastage: 1.00,
    celloPerSheet: 0.60
  }
};
const OB_CELLO_PER_UNIT_SMALL = 0.20;
const OB_BASE_PAPER_PRICE = 1.35;
const OB_WASTAGE = 1.05;
const OB_QUANTITIES = [500, 1000, 2000, 3000, 5000, 10000, 20000];
const OB_FACES_MULTIPLIER = { 1: 1.0, 2: 1.5 };
// معامل أوجه الطباعة لماكينة الكامل 70×100 فقط:
// وجهين بنفس التصميم = نفس الزنكات + شوط ثاني (1.5)
// وجهين بتصميم مختلف = وجه طباعة مستقل بالكامل (2.0)
const OB_FULL_FACE2_SAME = 1.5;
const OB_FULL_FACE2_DIFF = 2.0;
const OB_DIGITAL_QUANTITIES = [50, 100, 250];
const OB_DIGITAL_PRICES = { 50: 6.90, 100: 5.75, 250: 4.60 };
const OB_DIGITAL_PRINT_2FACE_ADD = 1.15;
const OB_DIGITAL_CELLO_PER_FACE = 0.60;
const OB_DIGITAL_AREA_W = 47;
const OB_DIGITAL_AREA_H = 33;
const OB_DIGITAL_B_PRICES = { 50: 11.50, 100: 9.20, 250: 8.00 };
const OB_DIGITAL_B_PRINT_2FACE_ADD = 1.00;
const OB_DIGITAL_B_AREA_W = 99;
const OB_DIGITAL_B_AREA_H = 32;

function obNesting(flatL, flatW, sheetW, sheetH, safety = 1.0) {
  const usableW = sheetW - safety;
  const usableH = sheetH - safety;
  const a = Math.floor(usableW / flatL) * Math.floor(usableH / flatW);
  const b = Math.floor(usableW / flatW) * Math.floor(usableH / flatL);
  return Math.max(a, b);
}
function obPickMachine(flatL, flatW) {
  for (const key of ['ربع', 'نص', 'كامل']) {
    const m = OB_MACHINES[key];
    const fits = (flatL <= m.maxFlatW && flatW <= m.maxFlatH) || (flatL <= m.maxFlatH && flatW <= m.maxFlatW);
    if (fits) return key;
  }
  return null;
}
function obInterpolatePrint(qty, table) {
  if (qty in table) return table[qty];
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
  if (qty <= keys[0]) return table[keys[0]];
  if (qty >= keys[keys.length - 1]) {
    const last = keys[keys.length - 1], prev = keys[keys.length - 2];
    const slope = (table[last] - table[prev]) / (last - prev);
    return table[last] + slope * (qty - last);
  }
  for (let i = 0; i < keys.length - 1; i++) {
    if (keys[i] <= qty && qty <= keys[i + 1]) {
      const ratio = (qty - keys[i]) / (keys[i + 1] - keys[i]);
      return table[keys[i]] + ratio * (table[keys[i + 1]] - table[keys[i]]);
    }
  }
  return 0;
}
function obCalcCost(machineKey, qty, faces, celloFaces, paperPrice, copiesPerSheet, face2Diff) {
  const m = OB_MACHINES[machineKey];
  const faceMult = OB_FACES_MULTIPLIER[faces];
  let sheetsNeeded = 0;
  if (copiesPerSheet > 0) sheetsNeeded = Math.ceil((qty / copiesPerSheet) * (m.wastage != null ? m.wastage : OB_WASTAGE));
  if (m.model === 'tiered') {
    let tieredPrice;
    if (qty <= 1000) tieredPrice = m.tier1 * qty;
    else if (qty <= 5000) tieredPrice = m.tier1 * 1000 + m.tier2 * (qty - 1000);
    else tieredPrice = m.tier1 * 1000 + m.tier2 * 4000 + m.tier3 * (qty - 5000);
    const baseCost = m.setup + tieredPrice * faceMult;
    const celloCost = OB_CELLO_PER_UNIT_SMALL * celloFaces * qty;
    const paperAdjustment = sheetsNeeded * (paperPrice - OB_BASE_PAPER_PRICE);
    return { model: 'tiered', setup: m.setup, tiered: tieredPrice * faceMult, cello: celloCost, paperAdjustment, sheets: sheetsNeeded, total: baseCost + celloCost + paperAdjustment };
  }
  // === النموذج التفصيلي (الكامل 70×100) ===
  // كل وجه طباعة يُسعَّر مستقلاً من الجدول:
  // وجه واحد = ×1 | وجهين نفس التصميم = ×1.5 | وجهين تصميم مختلف = ×2 (وجه طباعة جديد)
  const printUnit = obInterpolatePrint(qty, m.printTable);
  const printMult = faces === 2 ? (face2Diff ? OB_FULL_FACE2_DIFF : OB_FULL_FACE2_SAME) : 1.0;
  const printCost = printUnit * printMult;
  const totalK = Math.ceil(qty / 1000);
  const dieCost = m.diePerThousand1 + (totalK - 1) * m.diePerThousandExtra;
  const plateCost = m.plate;
  // السلوفان: 0.60 × عدد الشيتات الصالحة (بدون هالك، لأنه يُطبّق على المنتج النهائي)
  const sheetsRaw = copiesPerSheet > 0 ? Math.ceil(qty / copiesPerSheet) : 0;
  const celloCost = m.celloPerSheet * sheetsRaw * celloFaces;
  // الورق: شيتات الإنتاج (بدون هالك نسبي) + 200 شيت ثابتة للمعايرة والضبط
  const setupSheets = m.setupSheets || 0;
  const totalSheets = sheetsNeeded + setupSheets;
  const paperCost = totalSheets * paperPrice;
  return {
    model: 'detailed', print: printCost, printUnit, printMult, die: dieCost, plate: plateCost,
    cello: celloCost, paper: paperCost, prodSheets: sheetsNeeded, setupSheets, sheets: totalSheets,
    total: printCost + dieCost + plateCost + celloCost + paperCost
  };
}
function obFmt(n, decimals = 0) {
  return (n || 0).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function obCalcDigitalFinal(qty, faces, celloFaces, digitalCopies, band) {
  if (digitalCopies < 1) return null;
  if (band === 'B') {
    if (!(qty in OB_DIGITAL_B_PRICES)) return null;
    let perSheet = OB_DIGITAL_B_PRICES[qty];
    if (faces === 2) perSheet += OB_DIGITAL_B_PRINT_2FACE_ADD;
    return perSheet / digitalCopies;
  }
  if (!(qty in OB_DIGITAL_PRICES)) return null;
  let perSheet = OB_DIGITAL_PRICES[qty];
  if (faces === 2) perSheet += OB_DIGITAL_PRINT_2FACE_ADD;
  if (celloFaces === 0) perSheet -= OB_DIGITAL_CELLO_PER_FACE;
  else if (celloFaces === 2) perSheet += OB_DIGITAL_CELLO_PER_FACE;
  return perSheet / digitalCopies;
}

const OB_MACHINE_BADGE = {
  'ربع': 'bg-blue-100 text-blue-800',
  'نص': 'bg-orange-100 text-orange-800',
  'كامل': 'bg-purple-100 text-purple-800'
};

const OffsetBoxesCalculator = () => {
  const [productName, setProductName] = useState('');
  const [flatL, setFlatL] = useState('38');
  const [flatW, setFlatW] = useState('67');
  const [paper, setPaper] = useState('انفربرش');
  const [faces, setFaces] = useState(1);
  const [face2Design, setFace2Design] = useState('same');
  const [cello, setCello] = useState(1);
  const [paperPrice, setPaperPrice] = useState('1.35');
  const [margin, setMargin] = useState('40');
  const [vat, setVat] = useState('15');

  const data = useMemo(() => {
    const L = parseFloat(flatL) || 0;
    const W = parseFloat(flatW) || 0;
    const pp = parseFloat(paperPrice) || OB_BASE_PAPER_PRICE;
    const marginR = (parseFloat(margin) || 0) / 100;
    const vatRate = (parseFloat(vat) || 0) / 100;
    const face2Diff = face2Design === 'diff';

    if (!L || !W || L < 1 || W < 1) return { state: 'empty' };

    const machineKey = obPickMachine(L, W);
    if (!machineKey) return { state: 'oversize', L, W };

    const m = OB_MACHINES[machineKey];
    const copies = obNesting(L, W, m.sheetW, m.sheetH);

    const digitalCopiesA = obNesting(L, W, OB_DIGITAL_AREA_W, OB_DIGITAL_AREA_H, 0);
    const digitalCopiesB = obNesting(L, W, OB_DIGITAL_B_AREA_W, OB_DIGITAL_B_AREA_H, 0);
    let band = null, digitalCopies = 0;
    if (digitalCopiesA >= 1) { band = 'A'; digitalCopies = digitalCopiesA; }
    else if (digitalCopiesB >= 1) { band = 'B'; digitalCopies = digitalCopiesB; }
    const digitalEligible = band !== null;

    const colDefs = [];
    if (digitalEligible) OB_DIGITAL_QUANTITIES.forEach(q => colDefs.push({ q, type: 'digital' }));
    OB_QUANTITIES.forEach(q => colDefs.push({ q, type: 'offset' }));

    const cols = colDefs.map(c => {
      if (c.type === 'digital') {
        const finalPU = obCalcDigitalFinal(c.q, faces, cello, digitalCopies, band);
        const preVatPU = finalPU / (1 + vatRate);
        const preTotal = preVatPU * c.q;
        return { ...c, perUnitPre: preVatPU, preTotal, vatAmt: preTotal * vatRate, finalTotal: finalPU * c.q, digital: true };
      }
      const cost = obCalcCost(machineKey, c.q, faces, cello, pp, copies, face2Diff);
      const priceWithMargin = cost.total * (1 + marginR);
      return { ...c, perUnitPre: priceWithMargin / c.q, preTotal: priceWithMargin, vatAmt: priceWithMargin * vatRate, finalTotal: priceWithMargin * (1 + vatRate), digital: false };
    });

    const refQty = 5000;
    const refCost = obCalcCost(machineKey, refQty, faces, cello, pp, copies, face2Diff);
    const refMarginAmt = refCost.total * marginR;
    const refWithMargin = refCost.total + refMarginAmt;

    return { state: 'ok', L, W, machineKey, m, copies, band, digitalCopies, digitalEligible, cols, vatRate, marginR, refQty, refCost, refMarginAmt, refWithMargin, faces, face2Diff, cello, paperPrice: pp };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flatL, flatW, paperPrice, margin, vat, faces, face2Design, cello]);

  const inputCls = "w-full p-2.5 border border-[#b99ecb] rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-[#337159] focus:border-[#337159]";
  const labelCls = "block text-sm font-medium text-slate-700 mb-1.5";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" dir="rtl">
      {/* لوحة الإدخال */}
      <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 p-4"><h3 className="font-bold text-slate-700 flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#337159]"></span> بيانات البوكس</h3></div>
        <div className="p-5 space-y-4">
          <div>
            <label className={labelCls}>اسم المنتج (اختياري)</label>
            <input type="text" value={productName} onChange={e => setProductName(e.target.value)} className={inputCls} placeholder="مثال: صندوق كيك 20×20×9" />
          </div>

          <div className="bg-[#337159]/5 border-r-4 border-[#337159] rounded-lg p-3 text-xs text-[#337159] leading-relaxed">
            <strong className="block mb-1">📐 خذ المقاس من ملف الـ Dieline</strong>
            الفرد = القياس الكامل للورق بعد فرده قبل الطي، ويشمل كل اللسانات والكلابسات.
          </div>

          <div>
            <label className={labelCls}>أبعاد الفرد (سم)</label>
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
              <input type="number" step="0.1" min="1" value={flatL} onChange={e => setFlatL(e.target.value)} className={`${inputCls} text-center font-bold`} placeholder="الطول" />
              <span className="text-slate-400 font-light">×</span>
              <input type="number" step="0.1" min="1" value={flatW} onChange={e => setFlatW(e.target.value)} className={`${inputCls} text-center font-bold`} placeholder="العرض" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">طول الفرد × عرض الفرد بعد التسطيح الكامل</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>نوع الورق</label>
              <select value={paper} onChange={e => setPaper(e.target.value)} className={inputCls}>
                <option value="انفربرش">انفربرش (أبيض)</option>
                <option value="كرافت">كرافت (بني)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>أوجه الطباعة</label>
              <select value={faces} onChange={e => setFaces(parseInt(e.target.value))} className={inputCls}>
                <option value={1}>وجه واحد (خارجي فقط)</option>
                <option value={2}>وجهين (داخلي وخارجي)</option>
              </select>
            </div>
          </div>

          {faces === 2 && (
            <div>
              <label className={labelCls}>تصميم الوجه الثاني</label>
              <select value={face2Design} onChange={e => setFace2Design(e.target.value)} className={inputCls}>
                <option value="same">نفس تصميم الوجه الأول</option>
                <option value="diff">تصميم مختلف</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1.5">في ماكينة الكامل 70×100: التصميم المختلف يُحتسب وجه طباعة مستقل بسعر الجدول كاملاً</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>السلوفان</label>
              <select value={cello} onChange={e => setCello(parseInt(e.target.value))} className={inputCls}>
                <option value={0}>بدون سلوفان</option>
                <option value={1}>سلوفان وجه واحد</option>
                <option value={2}>سلوفان وجهين</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>سعر شيت الورق (ر.س)</label>
              <input type="number" min="0.1" max="20" step="0.05" value={paperPrice} onChange={e => setPaperPrice(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>هامش الربح (%)</label>
              <input type="number" min="0" max="200" step="5" value={margin} onChange={e => setMargin(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>ضريبة القيمة المضافة (%)</label>
              <input type="number" min="0" max="100" step="1" value={vat} onChange={e => setVat(e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* صندوق معلومات الماكينة */}
          {data.state === 'ok' && (
            <div className="bg-[#337159]/5 border-r-4 border-[#337159] rounded-lg p-3 text-xs space-y-1.5">
              <div className="flex justify-between"><span className="text-slate-500">الفرد:</span><span className="font-bold text-[#337159]">{data.L.toFixed(1)} × {data.W.toFixed(1)} سم</span></div>
              <div className="flex justify-between items-center"><span className="text-slate-500">الماكينة:</span><span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${OB_MACHINE_BADGE[data.machineKey]}`}>{data.m.label}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">شيت الماكينة:</span><span className="font-bold text-[#337159]">{data.m.sheetW} × {data.m.sheetH} سم</span></div>
              <div className="flex justify-between"><span className="text-slate-500">حد الفرد:</span><span className="font-bold text-[#337159]">{data.m.maxFlatW} × {data.m.maxFlatH} سم</span></div>
              <div className="flex justify-between"><span className="text-slate-500">نسخ في الشيت:</span><span className="font-bold text-[#337159]">{data.copies > 0 ? `${data.copies} نسخة` : '— (لا يدخل)'}</span></div>
            </div>
          )}

          {data.state === 'oversize' && (
            <div className="bg-red-50 border-r-4 border-red-500 text-red-700 rounded-lg p-3 text-xs font-medium">
              ✕ مقاس الفرد أكبر من شيت 70×100 سم — يحتاج خامة خاصة وعرض سعر مخصّص من المورد.
            </div>
          )}
        </div>
      </div>

      {/* لوحة النتائج */}
      <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center gap-3 flex-wrap">
          <div>
            <h3 className="font-bold text-slate-700 flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#fa5732]"></span> جدول الأسعار حسب الكمية</h3>
            {productName && <p className="text-xs text-slate-500 mt-1">🏷 {productName}</p>}
          </div>
          <button onClick={() => window.print()} className="text-slate-500 hover:text-[#337159] px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 hover:border-[#337159] transition-colors">طباعة / حفظ PDF</button>
        </div>
        <div className="p-5 overflow-x-auto">
          {data.state === 'empty' && (
            <div className="text-center py-16 text-slate-400">
              <div className="text-5xl mb-3 opacity-30">📐</div>
              <div className="text-sm">أدخل أبعاد الفرد لعرض التسعير</div>
            </div>
          )}
          {data.state === 'oversize' && (
            <div className="text-center py-16 text-slate-400">
              <div className="text-5xl mb-3 opacity-30">⚠</div>
              <div className="text-sm">المقاس أكبر من حد الماكينات القياسية.<br />راجع المورد لعرض سعر مخصّص لخامة كبيرة.</div>
            </div>
          )}
          {data.state === 'ok' && (
            <>
              <table className="w-full text-sm border-collapse whitespace-nowrap">
                <thead>
                  <tr>
                    <th className="p-2.5 text-right text-[11px] font-bold text-slate-500 uppercase bg-slate-50 border-b border-slate-200">البيان</th>
                    {data.cols.map((c, i) => (
                      <th key={i} className={`p-2.5 text-center text-[11px] font-bold border-b border-slate-200 ${c.digital ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-500'}`}>
                        {obFmt(c.q)} حبة
                        {c.digital && <span className="block text-[9px] mt-0.5 opacity-80">ديجيتال</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2.5 text-right font-medium bg-slate-50 border-b border-slate-100">سعر الحبة (ر.س)</td>
                    {data.cols.map((c, i) => (
                      <td key={i} className={`p-2.5 text-center font-bold text-[#fa5732] border-b border-slate-100 ${c.digital ? 'bg-blue-50/40' : ''}`}>{obFmt(c.perUnitPre, 2)}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2.5 text-right font-medium bg-slate-50 border-b border-slate-100">الإجمالي قبل الضريبة (ر.س)</td>
                    {data.cols.map((c, i) => (
                      <td key={i} className={`p-2.5 text-center font-semibold text-[#337159] border-b border-slate-100 ${c.digital ? 'bg-blue-50/40' : ''}`}>{obFmt(c.preTotal)}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2.5 text-right font-medium bg-slate-50 border-b border-slate-100">ضريبة القيمة المضافة ({(data.vatRate * 100).toFixed(0)}%)</td>
                    {data.cols.map((c, i) => (
                      <td key={i} className={`p-2.5 text-center text-slate-600 border-b border-slate-100 ${c.digital ? 'bg-blue-50/40' : ''}`}>{obFmt(c.vatAmt)}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2.5 text-right font-bold bg-amber-50 border-b border-slate-100">الإجمالي شامل الضريبة (ر.س)</td>
                    {data.cols.map((c, i) => (
                      <td key={i} className="p-2.5 text-center font-bold text-[#337159] bg-amber-50 border-b border-slate-100">{obFmt(c.finalTotal)}</td>
                    ))}
                  </tr>
                </tbody>
              </table>

              {data.digitalEligible && (
                <div className="mt-4 bg-amber-50 border-r-4 border-amber-500 text-amber-800 rounded-lg p-3 text-xs leading-relaxed">
                  {data.band === 'A' ? (
                    <><strong>الكميات الصغيرة (ديجيتال — فرد ≤ 47×33):</strong> الأسعار شاملة الضريبة، أساسها وجه طباعة + وجه سلوفان لحبة تملأ شيت 47×33. هذا المقاس يدخل منه <strong>{data.digitalCopies}</strong> حبة في الشيت، ويُقسَّم سعر الشيت عليها. الطباعة وجهين تضيف 1.15 ر.س للشيت، وكل وجه سلوفان 0.60 ر.س.</>
                  ) : (
                    <><strong>الكميات الصغيرة (ديجيتال — قطع طويلة، طول حتى 99 والعرض حتى 32 سم):</strong> الأسعار شاملة كل شيء حتى الضريبة، للوجه الواحد، والسلوفان مشمول ولا يغيّر السعر. هذا المقاس يدخل منه <strong>{data.digitalCopies}</strong> حبة في الشيت، ويُقسَّم سعر الشيت عليها. الطباعة وجهين تضيف 1 ر.س للشيت.</>
                  )}
                </div>
              )}

              {data.machineKey === 'كامل' && (
                <div className="mt-4 bg-amber-50 border-r-4 border-amber-500 text-amber-800 rounded-lg p-3 text-xs leading-relaxed">
                  <strong>ماكينة الكامل 70×100:</strong> كل وجه طباعة يُسعَّر مستقلاً من جدول المورد (500 و1000 = 900 · 3000 = 1500 · 5000 = 2000 · 10 آلاف = 3000 · 20 ألف = 4800)، فالوجه الثاني بتصميم مختلف يُحتسب وجه طباعة جديد كامل. القالب ثابت <strong>800</strong> ر.س، ويُضاف <strong>200 شيت</strong> ثابتة للمعايرة والضبط أياً كانت الكمية، وبدون هالك نسبي إضافي على الورق (الـ200 شيت تغطي التجهيز).
                </div>
              )}

              {/* تفصيل التكلفة لكمية مرجعية */}
              <div className="mt-6 bg-slate-50 rounded-xl p-4">
                <h4 className="font-bold text-[#337159] text-sm mb-3">تفصيل التكلفة لكمية مرجعية ({obFmt(data.refQty)} حبة)</h4>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2 text-right text-[10px] font-bold text-slate-500 bg-white border-b border-slate-200">البند</th>
                      <th className="p-2 text-center text-[10px] font-bold text-slate-500 bg-white border-b border-slate-200">القيمة (ر.س)</th>
                      <th className="p-2 text-center text-[10px] font-bold text-slate-500 bg-white border-b border-slate-200">نسبة من الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.refCost.model === 'tiered' ? (
                      <>
                        <tr><td className="p-2 text-right bg-white border-b border-slate-100">رسم التثبيت (قالب + إعداد الماكينة)</td><td className="p-2 text-center bg-white border-b border-slate-100">{obFmt(data.refCost.setup)}</td><td className="p-2 text-center bg-white border-b border-slate-100">{obFmt(data.refCost.setup / data.refWithMargin * 100, 1)}%</td></tr>
                        <tr><td className="p-2 text-right bg-white border-b border-slate-100">الطباعة والتكسير (سُلّمي حسب الكمية)</td><td className="p-2 text-center bg-white border-b border-slate-100">{obFmt(data.refCost.tiered)}</td><td className="p-2 text-center bg-white border-b border-slate-100">{obFmt(data.refCost.tiered / data.refWithMargin * 100, 1)}%</td></tr>
                        <tr><td className="p-2 text-right bg-white border-b border-slate-100">السلوفان ({data.cello} وجه × {OB_CELLO_PER_UNIT_SMALL.toFixed(2)} × {obFmt(data.refQty)})</td><td className="p-2 text-center bg-white border-b border-slate-100">{obFmt(data.refCost.cello)}</td><td className="p-2 text-center bg-white border-b border-slate-100">{obFmt(data.refCost.cello / data.refWithMargin * 100, 1)}%</td></tr>
                        {Math.abs(data.refCost.paperAdjustment) > 0.5 && (
                          <tr><td className="p-2 text-right bg-white border-b border-slate-100">تعديل سعر الورق ({data.refCost.sheets.toLocaleString()} شيت × {(data.paperPrice - OB_BASE_PAPER_PRICE).toFixed(2)} ر.س فرق)</td><td className="p-2 text-center bg-white border-b border-slate-100">{data.refCost.paperAdjustment > 0 ? '+' : ''}{obFmt(data.refCost.paperAdjustment)}</td><td className="p-2 text-center bg-white border-b border-slate-100">{obFmt(data.refCost.paperAdjustment / data.refWithMargin * 100, 1)}%</td></tr>
                        )}
                      </>
                    ) : (
                      <>
                        <tr><td className="p-2 text-right bg-white border-b border-slate-100">الطباعة 4 لون ({obFmt(data.refCost.printUnit)} × {data.refCost.printMult} — {data.faces === 2 ? (data.face2Diff ? 'وجهين بتصميم مختلف' : 'وجهين بنفس التصميم') : 'وجه واحد'})</td><td className="p-2 text-center bg-white border-b border-slate-100">{obFmt(data.refCost.print)}</td><td className="p-2 text-center bg-white border-b border-slate-100">{obFmt(data.refCost.print / data.refWithMargin * 100, 1)}%</td></tr>
                        <tr><td className="p-2 text-right bg-white border-b border-slate-100">التكسير ({data.m.diePerThousand1} لأول 1000 + {Math.ceil(data.refQty / 1000) - 1} × {data.m.diePerThousandExtra})</td><td className="p-2 text-center bg-white border-b border-slate-100">{obFmt(data.refCost.die)}</td><td className="p-2 text-center bg-white border-b border-slate-100">{obFmt(data.refCost.die / data.refWithMargin * 100, 1)}%</td></tr>
                        <tr><td className="p-2 text-right bg-white border-b border-slate-100">القالب (ثابت — {obFmt(data.m.plate)} ر.س)</td><td className="p-2 text-center bg-white border-b border-slate-100">{obFmt(data.refCost.plate)}</td><td className="p-2 text-center bg-white border-b border-slate-100">{obFmt(data.refCost.plate / data.refWithMargin * 100, 1)}%</td></tr>
                        {data.cello > 0 && (
                          <tr><td className="p-2 text-right bg-white border-b border-slate-100">السلوفان ({data.cello} وجه × {data.m.celloPerSheet.toFixed(2)} ر.س × عدد الشيتات)</td><td className="p-2 text-center bg-white border-b border-slate-100">{obFmt(data.refCost.cello)}</td><td className="p-2 text-center bg-white border-b border-slate-100">{obFmt(data.refCost.cello / data.refWithMargin * 100, 1)}%</td></tr>
                        )}
                        <tr><td className="p-2 text-right bg-white border-b border-slate-100">الورق — إنتاج ({data.refCost.prodSheets.toLocaleString()} شيت × {data.paperPrice.toFixed(2)} ر.س)</td><td className="p-2 text-center bg-white border-b border-slate-100">{obFmt(data.refCost.prodSheets * data.paperPrice)}</td><td className="p-2 text-center bg-white border-b border-slate-100">{obFmt(data.refCost.prodSheets * data.paperPrice / data.refWithMargin * 100, 1)}%</td></tr>
                        <tr><td className="p-2 text-right bg-white border-b border-slate-100">الورق — معايرة وضبط ({data.refCost.setupSheets} شيت ثابتة × {data.paperPrice.toFixed(2)} ر.س)</td><td className="p-2 text-center bg-white border-b border-slate-100">{obFmt(data.refCost.setupSheets * data.paperPrice)}</td><td className="p-2 text-center bg-white border-b border-slate-100">{obFmt(data.refCost.setupSheets * data.paperPrice / data.refWithMargin * 100, 1)}%</td></tr>
                      </>
                    )}
                    <tr><td className="p-2 text-right bg-white border-b border-slate-100">هامش الربح ({(data.marginR * 100).toFixed(0)}%)</td><td className="p-2 text-center bg-white border-b border-slate-100">{obFmt(data.refMarginAmt)}</td><td className="p-2 text-center bg-white border-b border-slate-100">{obFmt(data.refMarginAmt / data.refWithMargin * 100, 1)}%</td></tr>
                    <tr><td className="p-2 text-right font-bold text-[#337159] bg-[#337159]/10">السعر النهائي (قبل الضريبة)</td><td className="p-2 text-center font-bold text-[#337159] bg-[#337159]/10">{obFmt(data.refWithMargin)}</td><td className="p-2 text-center font-bold text-[#337159] bg-[#337159]/10">100.0%</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center gap-4 flex-wrap text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#fa5732]"></span> سعر الحبة</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#337159]"></span> السعر الإجمالي</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const CalculatorApp = ({ prices, onAdminLogin, onLogout, currentUser, isAdmin, generalSettings }) => {
  const [activeTab, setActiveTab] = useState('');
  const [inputs, setInputs] = useState({ width: 0, height: 0, quantity: 0, rollWidth: prices.defaultRollWidth || 100, offsetFaces: '1' });
  const [foilInputs, setFoilInputs] = useState({ width: 0, height: 0 });

  const [customUnitPrice, setCustomUnitPrice] = useState('');

  const [selectedPaperIndex, setSelectedPaperIndex] = useState(0);
  const [selectedOffsetPaperIndex, setSelectedOffsetPaperIndex] = useState(0);

  const [selectedSheetSizeIndex, setSelectedSheetSizeIndex] = useState(0);
  const [selectedAddonsIndices, setSelectedAddonsIndices] = useState([]);
  const [isFoilEnabled, setIsFoilEnabled] = useState(false);
  const [isSpotUvEnabled, setIsSpotUvEnabled] = useState(false);
  const [savingLog, setSavingLog] = useState(false);
  const [cuttingType, setCuttingType] = useState('normal'); // 'normal' = قص عادي | 'diecut' = قص داي كت
  const [isFoldingEnabled, setIsFoldingEnabled] = useState(false); // الثنية
  const [isPunchingEnabled, setIsPunchingEnabled] = useState(false); // التخريم

  // Set initial active tab based on visibility settings
  useEffect(() => {
    if (!activeTab) {
      if (generalSettings?.showRoll !== false) setActiveTab('roll');
      else if (generalSettings?.showDigital !== false) setActiveTab('digital');
      else if (generalSettings?.showOffset !== false) setActiveTab('offset');
      else if (generalSettings?.showUvDtf !== false) setActiveTab('uvdtf');
      else if (generalSettings?.showOffsetBox !== false) setActiveTab('offsetbox');
    }
  }, [generalSettings, activeTab]);

  // Filter active papers
  const activePapers = useMemo(() => {
    return prices.digitalPaperTypes?.filter(p => p.active !== false) || [];
  }, [prices.digitalPaperTypes]);

  const activeOffsetPapers = useMemo(() => {
    return prices.offsetPaperTypes?.filter(p => p.active !== false) || [];
  }, [prices.offsetPaperTypes]);

  // Adjust selected index if list changes
  useEffect(() => {
    if (activeTab === 'digital') {
      if (selectedPaperIndex >= activePapers.length && activePapers.length > 0) {
        setSelectedPaperIndex(0);
      }
    }
  }, [activePapers.length, activeTab, selectedPaperIndex]);

  useEffect(() => { setInputs(prev => ({ ...prev, rollWidth: prices.defaultRollWidth || 100 })); }, [prices.defaultRollWidth]);
  const handleInput = (e) => { const { name, value } = e.target; setInputs(prev => ({ ...prev, [name]: parseFloat(value) || 0 })); };
  const handleFoilInput = (e) => { const { name, value } = e.target; setFoilInputs(prev => ({ ...prev, [name]: parseFloat(value) || 0 })); };
  // eslint-disable-next-line no-unused-vars
  const handleFaceChange = (e) => { setInputs(prev => ({ ...prev, offsetFaces: e.target.value })); };


  useEffect(() => {
    setCustomUnitPrice('');
    setIsFoilEnabled(false);
    setIsSpotUvEnabled(false);
    setFoilInputs({ width: 0, height: 0 });
    setIsFoldingEnabled(false);
    setIsPunchingEnabled(false);
  }, [activeTab]);

  const toggleAddon = (index) => {
    setSelectedAddonsIndices(prev => {
      if (prev.includes(index)) return prev.filter(i => i !== index);
      return [...prev, index];
    });
  };

  const getDiscountPercent = (value, discounts) => {
    if (!discounts || discounts.length === 0) return 0;
    const applicable = [...discounts].reverse().find(rule => value >= rule.min);
    return applicable ? applicable.percent : 0;
  };

  const getTieredUnitPrice = (value, tiers, defaultPrice) => {
    if (!tiers || tiers.length === 0) return defaultPrice;
    const applicable = [...tiers].reverse().find(rule => value >= rule.min);
    return applicable ? applicable.price : defaultPrice;
  };

  const results = useMemo(() => {
    let unitPrice = 0;
    // eslint-disable-next-line no-unused-vars
    const isCustomPriceActive = generalSettings?.allowPriceOverride && customUnitPrice !== '' && !isNaN(parseFloat(customUnitPrice));

    // Check if manual price override is enabled and enforce input
    // Offset always uses paper price from list, never requires manual input
    if (generalSettings?.allowPriceOverride && activeTab !== 'offset') {
      if (!customUnitPrice || isNaN(parseFloat(customUnitPrice))) {
        return { missingPrice: true }; // Changed from returning empty object
      }
    }

    // Configurable Tax & Margin
    const taxRate = (generalSettings?.taxRate ?? 15) / 100;
    const marginRate = 1 + ((generalSettings?.profitMargin ?? 15) / 100);

    const manualPrice = parseFloat(customUnitPrice);
    // Roll & digital always expose the meter/paper price field; a filled value overrides the system price
    const hasManualValue = customUnitPrice !== '' && !isNaN(manualPrice);
    const isManualMode = generalSettings?.allowPriceOverride || (['roll', 'digital'].includes(activeTab) && hasManualValue);

    if (activeTab === 'roll') {
      const stickerW = inputs.width; const stickerH = inputs.height; const qty = inputs.quantity; const rollW = inputs.rollWidth;

      unitPrice = isManualMode ? manualPrice : (prices.rollUnitPrice || 0);

      const stickersPerRow = Math.floor(rollW / (stickerW + 0.2)); const rowsNeeded = stickersPerRow > 0 ? Math.ceil(qty / stickersPerRow) : 0; const baseLengthMeters = (rowsNeeded * (stickerH + 0.2)) / 100; const marginCount = Math.floor(baseLengthMeters / 0.5); const finalLength = baseLengthMeters + (marginCount * 0.02); const area = finalLength * (rollW / 100);

      const rawPrice = area * unitPrice;
      const pricePreTax = rawPrice * marginRate;
      const tax = pricePreTax * taxRate;
      let finalPrice = pricePreTax + tax;

      const discountPercent = getDiscountPercent(area, prices.rollDiscounts);
      const discountAmount = finalPrice * (discountPercent / 100);
      const priceAfterDiscount = finalPrice - discountAmount;
      return { stickersPerRow, rowsNeeded, baseLengthMeters, marginCount, finalLength, area, pricePreTax, tax, finalPrice, discountPercent, discountAmount, priceAfterDiscount, details: `رول: ${stickerW}x${stickerH}cm (كمية: ${qty})` };
    }
    else if (activeTab === 'digital') {
      const stickerW = inputs.width; const stickerH = inputs.height; const qty = inputs.quantity;
      const sizeObj = prices.digitalSheetSizes?.[selectedSheetSizeIndex] || { width: 33, height: 48 };
      const sheetW = sizeObj.width; const sheetH = sizeObj.height;

      let systemSheetPrice = 0;
      let paperName = 'ورق';

      if (activePapers.length > 0 && activePapers[selectedPaperIndex]) {
        systemSheetPrice = activePapers[selectedPaperIndex].price;
        paperName = activePapers[selectedPaperIndex].name;
      } else {
        systemSheetPrice = prices.digitalSheetPrice || 0;
      }

      unitPrice = isManualMode ? manualPrice : systemSheetPrice;

      let addonsCostPerSheet = 0;
      if (prices.digitalAddons) {
        selectedAddonsIndices.forEach(idx => {
          if (prices.digitalAddons[idx]) {
            addonsCostPerSheet += (prices.digitalAddons[idx].price || 0);
          }
        });
      }

      // -- UPDATED LOGIC: Calculate best fit (rotate if necessary) --
      const margin = 0.2;
      // Option 1: No rotation (Width on Width, Height on Height)
      const count1 = Math.floor(sheetW / (stickerW + margin)) * Math.floor(sheetH / (stickerH + margin));
      // Option 2: Rotated 90 degrees (Width on Height, Height on Width)
      const count2 = Math.floor(sheetW / (stickerH + margin)) * Math.floor(sheetH / (stickerW + margin));

      const perSheet = Math.max(count1, count2);
      const isRotatedBest = count2 > count1;

      const sheetsNeeded = perSheet > 0 ? Math.ceil(qty / perSheet) : 0;

      // --- Waste Logic (الهالك) ---
      let wasteSheets = 0;
      if (sheetsNeeded > 0) {
        if (sheetsNeeded <= 100) {
          wasteSheets = 5;
        } else if (sheetsNeeded <= 250) {
          wasteSheets = 10;
        } else if (sheetsNeeded <= 500) {
          wasteSheets = 20;
        } else {
          wasteSheets = 30; // 501 to 1000+
        }
      }

      const totalSheetsWithWaste = sheetsNeeded + wasteSheets;

      // Check if design is larger than sheet
      let error = null;
      if (stickerW > 0 && stickerH > 0 && perSheet === 0) {
        error = `عفواً، مقاس التصميم (${stickerW}×${stickerH}) أكبر من مقاس الورق المختار (${sheetW}×${sheetH}) مع الهوامش. يرجى اختيار ورق أكبر أو تقليل المقاس.`;
      }

      // Calculate Price based on Total Sheets (Net + Waste)
      const basePrice = totalSheetsWithWaste * unitPrice;
      const totalAddonsPrice = totalSheetsWithWaste * addonsCostPerSheet;

      // Foil Calculations
      let foilCost = 0;
      let moldPrice = 0;
      let stampingCost = 0;

      if (isFoilEnabled) {
        const fW = foilInputs.width > 0 ? foilInputs.width : stickerW;
        const fH = foilInputs.height > 0 ? foilInputs.height : stickerH;
        const foilArea = fW * fH;

        // 1. حساب سعر القالب (Mold)
        moldPrice = foilArea * (prices.foilMoldPricePerCm2 || 1.15);
        if (moldPrice < (prices.foilMinMoldPrice || 150)) {
          moldPrice = prices.foilMinMoldPrice || 150;
        }

        // 2. حساب سعر التبصيم (Stamping)
        // القاعدة: الحد الأدنى 200 ريال، أو السعر المحسوب أيهما أعلى
        let rawStampingCost = qty * (prices.foilStampingUnitPrice || 0.40);

        if (rawStampingCost < 200) {
          stampingCost = 200; // تثبيت السعر على 200 إذا كان أقل
        } else {
          stampingCost = rawStampingCost; // اعتماد السعر الأعلى
        }

        foilCost = moldPrice + stampingCost;
      }

      // Spot UV Calculation
      let spotUvCost = 0;
      if (isSpotUvEnabled && sheetsNeeded > 0) {
        if (sheetsNeeded <= 30) {
          spotUvCost = 450;
        } else if (sheetsNeeded <= 50) {
          spotUvCost = 800;
        } else {
          spotUvCost = 1000;
        }
      }

      const pricePreTax = basePrice + totalAddonsPrice + foilCost + spotUvCost;
      const tax = pricePreTax * taxRate;
      const finalPrice = pricePreTax + tax;

      const discountPercent = getDiscountPercent(sheetsNeeded, prices.digitalDiscounts);
      const discountAmount = finalPrice * (discountPercent / 100);
      const priceAfterDiscount = finalPrice - discountAmount;

      // --- Calculate Savings Logic ---
      let savingsMessage = null;
      if (count1 !== count2 && perSheet > 0) {
        const worstCount = Math.min(count1, count2);
        if (worstCount > 0) {
          const worstSheetsNeeded = Math.ceil(qty / worstCount);

          // Calc worst case waste
          let worstWaste = 0;
          if (worstSheetsNeeded <= 100) worstWaste = 5;
          else if (worstSheetsNeeded <= 250) worstWaste = 10;
          else if (worstSheetsNeeded <= 500) worstWaste = 20;
          else worstWaste = 30;

          const worstTotalSheets = worstSheetsNeeded + worstWaste;
          const worstBasePrice = worstTotalSheets * unitPrice;
          const worstAddons = worstTotalSheets * addonsCostPerSheet;

          const worstPricePreTax = worstBasePrice + worstAddons + foilCost + spotUvCost;
          const worstTax = worstPricePreTax * taxRate;
          const worstFinalPrice = worstPricePreTax + worstTax;

          const worstDiscountPercent = getDiscountPercent(worstSheetsNeeded, prices.digitalDiscounts);
          const worstDiscountAmount = worstFinalPrice * (worstDiscountPercent / 100);
          const worstPriceAfterDiscount = worstFinalPrice - worstDiscountAmount;

          const diff = worstPriceAfterDiscount - priceAfterDiscount;

          if (diff > 0) {
            const method = isRotatedBest ? "التدوير (تدوير التصميم)" : "الوضع القياسي";
            savingsMessage = `تم اختيار ${method} تلقائياً لأنه وفر ${Math.round(diff)} ريال مقارنة بالوضع الآخر.`;
          }
        }
      }

      let details = `ديجيتال: ${paperName} (${qty} قطعة)`;
      if (isFoilEnabled) details += ` + بصمة`;
      if (isSpotUvEnabled) details += ` + سبوت يو في`;

      return {
        perSheet, sheetsNeeded, wasteSheets, totalSheetsWithWaste, // Added new values
        pricePreTax, tax, finalPrice, sheetPriceUsed: unitPrice, addonsCostPerSheet, totalAddonsPrice,
        dims: `${sheetW}×${sheetH}`, discountPercent, discountAmount, priceAfterDiscount, details,
        foilCost, moldPrice, stampingCost, savingsMessage, spotUvCost, error
      };
    }
    else if (activeTab === 'offset') {
      const itemW = inputs.width;
      const itemH = inputs.height;
      const qty = inputs.quantity;

      // ثابت العرض (A) وثابت الطول (B) من إعدادات الإدارة
      const fixedW = prices.offsetFixedWidth || 5;
      const fixedH = prices.offsetFixedHeight || 9;

      // اسم الورق المختار (للعرض في التسعيرة فقط - لا يدخل في المعادلة)
      let paperName = 'ورق أوفست';
      if (activeOffsetPapers.length > 0 && activeOffsetPapers[selectedOffsetPaperIndex]) {
        paperName = activeOffsetPapers[selectedOffsetPaperIndex].name;
      }

      // متغير التسعير (C في المعادلة): قص عادي = 120، داي كت = 240
      const pricingVariable = cuttingType === 'diecut' ? 240 : 120;

      // تكلفة الثنية والتخريم (50 ريال لكل 1000) - تكاليف إضافية
      const foldingCostPer1000 = isFoldingEnabled ? 50 : 0;
      const punchingCostPer1000 = isPunchingEnabled ? 50 : 0;

      // المعادلة: السعر لكل 1000 = CEILING(العرض/A,1) * CEILING(الطول/B,1) * C
      const ceilW = Math.ceil(itemW / fixedW);
      const ceilH = Math.ceil(itemH / fixedH);
      const multiplier = ceilW * ceilH;
      const pricePer1000 = multiplier * pricingVariable;

      // السعر الإجمالي لكل 1000 شامل الإضافات (المعادلة تتضمن القص داخل C)
      const totalPricePer1000 = pricePer1000 + foldingCostPer1000 + punchingCostPer1000;

      // سعر الحبة (قبل الضريبة)
      const pricePerUnit = totalPricePer1000 / 1000;

      // السعر الإجمالي للكمية
      const rawTotal = pricePerUnit * qty;

      // السعر شامل الضريبة
      const taxRate = (generalSettings?.taxRate ?? 15) / 100;
      const priceWithTax = rawTotal * (1 + taxRate);

      const finalPrice = priceWithTax;

      const discountPercent = getDiscountPercent(qty, prices.offsetDiscounts);
      const discountAmount = finalPrice * (discountPercent / 100);
      const priceAfterDiscount = finalPrice - discountAmount;

      const cuttingLabel = cuttingType === 'diecut' ? 'قص داي كت' : 'قص عادي';
      let details = `أوفست: ${paperName} - ${qty} قطعة - ${cuttingLabel}`;
      if (isFoldingEnabled) details += ` + ثنية`;
      if (isPunchingEnabled) details += ` + تخريم`;

      return {
        pricePer1000, pricingVariable, foldingCostPer1000, punchingCostPer1000, totalPricePer1000,
        pricePerUnit, rawTotal, priceWithTax,
        finalPrice, discountPercent, discountAmount, priceAfterDiscount,
        details, paperName, ceilW, ceilH, multiplier,
        cuttingLabel
      };
    }
    else if (activeTab === 'uvdtf') {
      const h = inputs.height || 0; const w = inputs.width || 0; const qty = inputs.quantity || 0;
      const rollW = prices.uvDtfRollWidth ?? 55;
      
      let error = null;
      let metersConsumed = 0;
      let itemsPerRow = 0;
      let totalRows = 0;
      let isRotated = false;

      if (h > 0 && w > 0 && qty > 0) {
        const itemsNormal = Math.floor(rollW / (h + 0.5));
        const itemsRotated = Math.floor(rollW / (w + 0.5));

        if (itemsNormal === 0 && itemsRotated === 0) {
          error = "الاستيكر أعرض من المسطح";
        } else {
          const rowsNormal = itemsNormal > 0 ? Math.ceil(qty / itemsNormal) : 0;
          const lengthNormal = itemsNormal > 0 ? (rowsNormal * (w + 0.5)) / 100 : Infinity;

          const rowsRotated = itemsRotated > 0 ? Math.ceil(qty / itemsRotated) : 0;
          const lengthRotated = itemsRotated > 0 ? (rowsRotated * (h + 0.5)) / 100 : Infinity;

          if (lengthNormal <= lengthRotated) {
            itemsPerRow = itemsNormal;
            totalRows = rowsNormal;
            metersConsumed = Math.round(lengthNormal * 100) / 100;
          } else {
            itemsPerRow = itemsRotated;
            totalRows = rowsRotated;
            metersConsumed = Math.round(lengthRotated * 100) / 100;
            isRotated = true;
          }
        }
      }

      // If manual mode is on, use manualPrice. Else determine price from tiers based on meters consumed.
      const evaluatedUnitPrice = getTieredUnitPrice(metersConsumed, prices.uvDtfTiers, prices.uvDtfPrice || 0);
      unitPrice = isManualMode ? manualPrice : evaluatedUnitPrice;

      const pricePreTax = metersConsumed * unitPrice;
      const tax = pricePreTax * taxRate;
      const finalPrice = pricePreTax + tax;
      
      const discountPercent = 0; // Tiers replaced discounts for UV DTF
      const discountAmount = 0;
      const priceAfterDiscount = finalPrice;
      
      let details = `UV DTF: ${w}x${h}cm (كمية: ${qty})`;
      if (isRotated) details += ' - تم التدوير';

      return { itemsPerRow, totalRows, metersConsumed, pricePreTax, tax, finalPrice, discountPercent, discountAmount, priceAfterDiscount, details, error, evaluatedUnitPrice };
    }
    return {};
  }, [inputs, foilInputs, prices, activeTab, selectedPaperIndex, selectedSheetSizeIndex, selectedAddonsIndices, customUnitPrice, generalSettings, activePapers, isFoilEnabled, isSpotUvEnabled, activeOffsetPapers, selectedOffsetPaperIndex, cuttingType, isFoldingEnabled, isPunchingEnabled]);

  const handleSaveQuote = async () => {
    setSavingLog(true);
    try {
      const logData = {
        type: activeTab,
        details: results.details,
        finalPrice: results.priceAfterDiscount || results.finalPrice || 0,
        discountPercent: results.discountPercent || 0,
        employeeName: currentUser.name,
        employeeId: currentUser.uid,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, ...HISTORY_COLLECTION_PATH), logData);
      alert('تم حفظ التسعيرة بنجاح في السجل');
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء الحفظ');
    }
    setSavingLog(false);
  };

  // eslint-disable-next-line no-unused-vars
  const getSystemPriceDisplay = () => {
    if (activeTab === 'roll') return prices.rollUnitPrice;
    if (activeTab === 'uvdtf') return prices.uvDtfPrice;
    if (activeTab === 'digital') {
      if (activePapers.length > 0 && activePapers[selectedPaperIndex]) {
        return activePapers[selectedPaperIndex].price;
      }
      return prices.digitalSheetPrice || 'السعر الافتراضي';
    }
    if (activeTab === 'offset') {
      if (activeOffsetPapers.length > 0 && activeOffsetPapers[selectedOffsetPaperIndex]) {
        return activeOffsetPapers[selectedOffsetPaperIndex].price;
      }
      return 'سعر الورق لكل 1000';
    }
    return 0;
  };

  if (!activeTab && (generalSettings?.showRoll !== false || generalSettings?.showDigital !== false || generalSettings?.showOffset !== false || generalSettings?.showUvDtf !== false)) {
    return <div className="p-10 text-center text-slate-500">جاري تحميل الحاسبة...</div>;
  }

  if (!activeTab) return (<div className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-50"><Ban className="w-16 h-16 text-slate-300 mb-4" /><h2 className="text-xl font-bold text-slate-600">عذراً، جميع الحاسبات معطلة حالياً</h2><p className="text-sm text-slate-400 mt-2">يرجى التواصل مع المسؤول لتفعيل الخدمات.</p><div className="flex items-center gap-3 mt-8">{isAdmin && (<button onClick={onAdminLogin} className="text-slate-500 hover:text-[#fa5732] px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border border-slate-200 hover:border-[#fa5732] transition-colors"><Lock className="w-4 h-4" /> لوحة المسؤول</button>)}<button onClick={onLogout} className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border border-red-100 transition-colors"><LogOut className="w-4 h-4" /> خروج</button></div></div>);

  return (
    <div className="max-w-full mx-auto p-4 md:p-8" dir="rtl">
      <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border-t-4 border-[#337159]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-50 rounded-lg p-1 border border-slate-100"><img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" /></div>
          <div>
            <h2 className="text-xl font-bold text-[#337159]">حاسبة التسعير</h2>
            <p className="text-sm text-slate-500">مرحباً بك، {currentUser?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button onClick={onAdminLogin} className="text-slate-500 hover:text-[#fa5732] px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border border-slate-200 hover:border-[#fa5732] transition-colors"><Lock className="w-4 h-4" /> لوحة المسؤول</button>
          )}
          <button onClick={onLogout} className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border border-red-100 transition-colors"><LogOut className="w-4 h-4" /> خروج</button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-1 gap-3 lg:gap-4 content-start">
          {generalSettings?.showRoll !== false && (
            <button onClick={() => setActiveTab('roll')} className={`w-full text-right p-4 rounded-xl font-medium transition-all flex items-center gap-3 ${activeTab === 'roll' ? 'bg-[#337159] text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-50'}`}><Scroll className="w-5 h-5 shrink-0" /> <span className="truncate">رول تو رول</span></button>
          )}
          {generalSettings?.showDigital !== false && (
            <button onClick={() => setActiveTab('digital')} className={`w-full text-right p-4 rounded-xl font-medium transition-all flex items-center gap-3 ${activeTab === 'digital' ? 'bg-[#337159] text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-50'}`}><Layout className="w-5 h-5 shrink-0" /> <span className="truncate">ديجيتال</span></button>
          )}
          {generalSettings?.showOffset !== false && (
            <button onClick={() => setActiveTab('offset')} className={`w-full text-right p-4 rounded-xl font-medium transition-all flex items-center gap-3 ${activeTab === 'offset' ? 'bg-[#337159] text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-50'}`}><Factory className="w-5 h-5 shrink-0" /> <span className="truncate">أوفست</span></button>
          )}
          {generalSettings?.showUvDtf !== false && (
            <button onClick={() => setActiveTab('uvdtf')} className={`w-full text-right p-4 rounded-xl font-medium transition-all flex items-center gap-3 ${activeTab === 'uvdtf' ? 'bg-[#337159] text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-50'}`}><Palette className="w-5 h-5 shrink-0" /> <span className="truncate">UV DTF</span></button>
          )}
          {generalSettings?.showOffsetBox !== false && (
            <button onClick={() => setActiveTab('offsetbox')} className={`w-full text-right p-4 rounded-xl font-medium transition-all flex items-center gap-3 ${activeTab === 'offsetbox' ? 'bg-[#337159] text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-50'}`}><Layers className="w-5 h-5 shrink-0" /> <span className="truncate">بوكسات الأوفست</span></button>
          )}
        </div>
        <div className="lg:col-span-9 space-y-6">
          {activeTab === 'offsetbox' ? (
            <OffsetBoxesCalculator />
          ) : (
          <>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center"><h3 className="font-bold text-slate-700 flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#337159]"></span> المدخلات (بيانات العميل)</h3></div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* --- Custom Unit Price Override Input --- */}
              {((generalSettings?.allowPriceOverride && activeTab !== 'offset') || activeTab === 'roll' || activeTab === 'digital') && (
                <div className="md:col-span-3 mb-4 bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <label className="block text-sm font-bold text-orange-800 mb-2">
                    {activeTab === 'roll' ? 'سعر المتر المربع' :
                      activeTab === 'digital' ? 'سعر الورق' :
                        activeTab === 'offset' ? 'سعر الألف ورق' :
                          'سعر المتر الطولي'}
                    {generalSettings?.allowPriceOverride
                      ? <> (إجباري) <span className="text-red-500">*</span></>
                      : <span className="text-xs font-normal text-orange-600"> (اختياري — اتركه فارغاً لاستخدام سعر النظام)</span>}
                  </label>
                  <input
                    type="number"
                    value={customUnitPrice}
                    onChange={(e) => setCustomUnitPrice(e.target.value)}
                    className="w-full p-3 bg-white border-2 border-orange-300 rounded-lg text-center font-bold text-xl text-orange-900 outline-none focus:ring-2 focus:ring-[#fa5732] placeholder-orange-200"
                    placeholder={generalSettings?.allowPriceOverride ? 'أدخل السعر هنا' : `سعر النظام: ${activeTab === 'roll' ? (prices.rollUnitPrice || 0) : (activePapers[selectedPaperIndex]?.price ?? prices.digitalSheetPrice ?? 0)}`}
                    required={!!generalSettings?.allowPriceOverride}
                  />
                </div>
              )}

              {activeTab === 'digital' && (
                <>
                  {(prices.showDigitalPaperField !== false) && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-slate-600 mb-2">نوع الورق / الخامة</label>
                      <select value={selectedPaperIndex} onChange={(e) => setSelectedPaperIndex(Number(e.target.value))} className="w-full p-3 bg-[#337159]/5 border border-[#b99ecb] rounded-xl focus:ring-2 focus:ring-[#337159] outline-none font-bold text-lg text-slate-700">
                        {activePapers.length > 0 ? (
                          activePapers.map((type, idx) => (
                            <option key={idx} value={idx}>{type.name} - ({type.price} ريال)</option>
                          ))
                        ) : (
                          <option value={0}>الافتراضي ({prices.digitalSheetPrice || 0} ريال)</option>
                        )}
                      </select>
                    </div>
                  )}

                  <div className="md:col-span-1">
                    <label className="block text-sm font-bold text-slate-600 mb-2">مقاس الورق</label>
                    <select value={selectedSheetSizeIndex} onChange={(e) => setSelectedSheetSizeIndex(Number(e.target.value))} className="w-full p-3 bg-[#337159]/5 border border-[#b99ecb] rounded-xl focus:ring-2 focus:ring-[#337159] outline-none font-bold text-lg text-slate-700">
                      {prices.digitalSheetSizes && prices.digitalSheetSizes.length > 0 ? (prices.digitalSheetSizes.map((size, idx) => (<option key={idx} value={idx}>{size.name}</option>))) : (<option value={0}>33×48</option>)}
                    </select>
                  </div>

                  <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
                    <div className={`p-4 rounded-xl border transition-all ${isFoilEnabled ? 'bg-[#b99ecb]/10 border-[#b99ecb]' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-slate-700 font-bold">
                          <Stamp className="w-5 h-5" />
                          <span>بصمة (Foil)</span>
                        </div>
                        <button onClick={() => setIsFoilEnabled(!isFoilEnabled)} className={`${isFoilEnabled ? 'text-[#fa5732]' : 'text-slate-300'}`}>
                          {isFoilEnabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                        </button>
                      </div>
                      {isFoilEnabled && (
                        <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                          <div>
                            <label className="text-[10px] text-slate-500">عرض البصمة (سم)</label>
                            <input type="number" name="width" value={foilInputs.width || ''} onChange={handleFoilInput} className="w-full p-2 text-sm border rounded text-center outline-none focus:border-[#fa5732]" placeholder="0" />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500">ارتفاع البصمة (سم)</label>
                            <input type="number" name="height" value={foilInputs.height || ''} onChange={handleFoilInput} className="w-full p-2 text-sm border rounded text-center outline-none focus:border-[#fa5732]" placeholder="0" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${isSpotUvEnabled ? 'bg-[#b99ecb]/10 border-[#b99ecb]' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center gap-2 text-slate-700 font-bold">
                        <Sparkles className="w-5 h-5" />
                        <span>سبوت يو في (Spot UV)</span>
                      </div>
                      <button onClick={() => setIsSpotUvEnabled(!isSpotUvEnabled)} className={`${isSpotUvEnabled ? 'text-[#fa5732]' : 'text-slate-300'}`}>
                        {isSpotUvEnabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                      </button>
                    </div>
                  </div>

                  {prices.digitalAddons && prices.digitalAddons.length > 0 && (
                    <div className="md:col-span-3 mt-2 bg-amber-50 p-4 rounded-xl border border-amber-100">
                      <label className="block text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
                        <Layers className="w-4 h-4" /> الإضافات (سلوفان، داي كت، إلخ)
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {prices.digitalAddons.map((addon, idx) => (
                          <label key={idx} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${selectedAddonsIndices.includes(idx) ? 'bg-amber-200 border-amber-400 shadow-sm' : 'bg-white border-amber-100 hover:bg-amber-100'}`}>
                            <input type="checkbox" checked={selectedAddonsIndices.includes(idx)} onChange={() => toggleAddon(idx)} className="w-4 h-4 accent-amber-600" />
                            <div className="flex flex-col"><span className="text-sm font-bold text-slate-700">{addon.name}</span><span className="text-[10px] text-slate-500">{addon.price} ريال/شيت</span></div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'offset' && (
                <>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-600 mb-2">نوع الورق (سعر الألف)</label>
                    <select value={selectedOffsetPaperIndex} onChange={(e) => setSelectedOffsetPaperIndex(Number(e.target.value))} className="w-full p-3 bg-[#337159]/5 border border-[#b99ecb] rounded-xl focus:ring-2 focus:ring-[#337159] outline-none font-bold text-lg text-slate-700">
                      {activeOffsetPapers.length > 0 ? (
                        activeOffsetPapers.map((type, idx) => (
                          <option key={idx} value={idx}>{type.name}</option>
                        ))
                      ) : (
                        <option value={0}>ورق افتراضي</option>
                      )}
                    </select>
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-sm font-bold text-slate-600 mb-2">نوع القص</label>
                    <select value={cuttingType} onChange={(e) => setCuttingType(e.target.value)} className="w-full p-3 bg-[#337159]/5 border border-[#b99ecb] rounded-xl focus:ring-2 focus:ring-[#337159] outline-none font-bold text-lg text-slate-700">
                      <option value="normal">قص عادي (120 ريال/1000)</option>
                      <option value="diecut">قص داي كت (240 ريال/1000)</option>
                    </select>
                  </div>
                  {/* إضافات الأوفست */}
                  <div className="md:col-span-3 grid grid-cols-2 gap-3 mt-1">
                    <div
                      onClick={() => setIsFoldingEnabled(!isFoldingEnabled)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all select-none ${isFoldingEnabled ? 'bg-[#337159]/10 border-[#337159]' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
                    >
                      <div className="flex items-center gap-2 font-bold text-slate-700">
                        <span className="text-xl">📄</span>
                        <div>
                          <div className="text-sm">الثنية</div>
                          <div className="text-[10px] text-slate-400 font-normal">+50 ريال / 1000</div>
                        </div>
                      </div>
                      {isFoldingEnabled ? <ToggleRight className="w-7 h-7 text-[#337159]" /> : <ToggleLeft className="w-7 h-7 text-slate-300" />}
                    </div>
                    <div
                      onClick={() => setIsPunchingEnabled(!isPunchingEnabled)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all select-none ${isPunchingEnabled ? 'bg-[#337159]/10 border-[#337159]' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
                    >
                      <div className="flex items-center gap-2 font-bold text-slate-700">
                        <span className="text-xl">⚙️</span>
                        <div>
                          <div className="text-sm">التخريم</div>
                          <div className="text-[10px] text-slate-400 font-normal">+50 ريال / 1000</div>
                        </div>
                      </div>
                      {isPunchingEnabled ? <ToggleRight className="w-7 h-7 text-[#337159]" /> : <ToggleLeft className="w-7 h-7 text-slate-300" />}
                    </div>
                  </div>
                </>
              )}

              <div><label className="block text-sm font-bold text-slate-600 mb-2">العرض (سم)</label><input type="number" name="width" value={inputs.width || ''} onChange={handleInput} className="w-full p-3 bg-[#337159]/5 border border-[#b99ecb] rounded-xl focus:ring-2 focus:ring-[#337159] outline-none text-center font-bold text-lg" placeholder="0" /></div>
              <div><label className="block text-sm font-bold text-slate-600 mb-2">الارتفاع (سم)</label><input type="number" name="height" value={inputs.height || ''} onChange={handleInput} className="w-full p-3 bg-[#337159]/5 border border-[#b99ecb] rounded-xl focus:ring-2 focus:ring-[#337159] outline-none text-center font-bold text-lg" placeholder="0" /></div>
              <div><label className="block text-sm font-bold text-slate-600 mb-2">العدد المطلوب</label><input type="number" name="quantity" value={inputs.quantity || ''} onChange={handleInput} className="w-full p-3 bg-[#337159]/5 border border-[#b99ecb] rounded-xl focus:ring-2 focus:ring-[#337159] outline-none text-center font-bold text-lg" placeholder="0" /></div>
              {activeTab === 'roll' && (<div><label className="block text-sm font-bold text-slate-600 mb-2">عرض الرول (سم)</label><input type="number" name="rollWidth" value={inputs.rollWidth || ''} onChange={handleInput} className="w-full p-3 bg-[#337159]/5 border border-[#b99ecb] rounded-xl focus:ring-2 focus:ring-[#337159] outline-none text-center font-bold text-lg" /></div>)}

              {/* Error Message Moved Here */}
              {results.error && (
                <div className="md:col-span-3 bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-xs font-bold flex items-center gap-2 mt-2 animate-in fade-in slide-in-from-top-2">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  {results.error}
                </div>
              )}
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 p-4"><h3 className="font-bold text-slate-700 flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#fa5732]"></span> المخرجات (التكلفة)</h3></div>
            <div className="p-6">

              {/* Alert for Missing Price */}
              {results.missingPrice ? (
                <div className="flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
                  <div className="bg-orange-100 p-4 rounded-full mb-3">
                    <AlertTriangle className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-700 mb-1">يرجى إدخال السعر أولاً</h3>
                  <p className="text-slate-500 text-sm">نظام التسعير اليدوي مفعل. لا يمكن حساب التكلفة بدون إدخال سعر الوحدة.</p>
                </div>
              ) : (
                <>
                  {activeTab === 'roll' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <ResultBox label="العدد في الصف" value={results.stickersPerRow} /><ResultBox label="عدد الصفوف" value={results.rowsNeeded} /><ResultBox label="الطول الأساسي (م)" value={results.baseLengthMeters?.toFixed(2)} /><ResultBox label="عدد الهوامش" value={results.marginCount} /><ResultBox label="الطول النهائي (م)" value={results.finalLength?.toFixed(2)} highlighted /><ResultBox label="المساحة (م²)" value={results.area?.toFixed(2)} />
                      <div className="col-span-2 md:col-span-4 mt-4 bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-2">
                        <div className="flex justify-between items-center text-slate-500 text-sm"><span>السعر قبل الضريبة:</span><span>{results.pricePreTax?.toFixed(2)} ريال</span></div>
                        <div className="flex justify-between items-center text-slate-500 text-sm"><span>الضريبة ({generalSettings?.taxRate ?? 15}%):</span><span>+{results.tax?.toFixed(2)} ريال</span></div>
                        {results.discountPercent > 0 && (<div className="flex justify-between items-center text-[#337159] text-sm"><span>خصم الكمية ({results.discountPercent}%):</span><span>-{Math.round(results.discountAmount)} ريال</span></div>)}
                        <div className="border-t border-slate-200 pt-2 flex justify-between items-center"><span className="font-bold text-[#337159] text-lg">السعر النهائي (شامل الضريبة):</span><span className="font-black text-3xl text-[#fa5732]">{Math.round(results.priceAfterDiscount || 0)} <span className="text-sm font-medium">ريال</span></span></div>
                      </div>
                    </div>
                  )}
                  {activeTab === 'digital' && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <ResultBox label="العدد في الورق" value={results.perSheet} />
                      <ResultBox label="عدد الورق (صافي)" value={results.sheetsNeeded} />
                      <ResultBox label="هالك تشغيل (+)" value={results.wasteSheets} highlighted />
                      <ResultBox label="إجمالي الورق المحتسب" value={results.totalSheetsWithWaste} />
                      <ResultBox label="أبعاد الورق" value={results.dims} />
                      <ResultBox label="سعر الورق (للورقة)" value={results.sheetPriceUsed} />
                      {results.addonsCostPerSheet > 0 && <ResultBox label="سعر الإضافات (للورق)" value={results.addonsCostPerSheet} />}

                      {isFoilEnabled && (
                        <div className="col-span-2 md:col-span-3 bg-[#b99ecb]/10 p-3 rounded-lg border border-[#b99ecb] grid grid-cols-2 gap-2 mt-2">
                          <div className="col-span-2 font-bold text-[#337159] text-xs mb-1">تفاصيل البصمة ({foilInputs.width || inputs.width}x{foilInputs.height || inputs.height}):</div>
                          <div className="text-xs flex justify-between"><span>سعر القالب:</span> <span className="font-bold">{results.moldPrice?.toFixed(1)} ريال</span></div>
                          <div className="text-xs flex justify-between"><span>تكلفة التبصيم:</span> <span className="font-bold">{results.stampingCost?.toFixed(1)} ريال</span></div>
                          <div className="text-xs flex justify-between border-t border-[#b99ecb] pt-1 col-span-2 text-[#337159]"><span>إجمالي البصمة:</span> <span className="font-bold">{results.foilCost?.toFixed(1)} ريال</span></div>
                        </div>
                      )}

                      {isSpotUvEnabled && (
                        <div className="col-span-2 md:col-span-3 bg-[#b99ecb]/10 p-3 rounded-lg border border-[#b99ecb] flex justify-between items-center mt-2">
                          <div className="text-xs font-bold text-[#337159]">تكلفة سبوت يو في ({results.sheetsNeeded} شيت):</div>
                          <div className="font-bold text-[#fa5732]">{results.spotUvCost} ريال</div>
                        </div>
                      )}

                      {results.savingsMessage && !results.error && (
                        <div className="col-span-2 md:col-span-3 bg-[#337159]/10 border border-[#337159] text-[#337159] p-3 rounded-lg text-xs font-bold flex items-center gap-2 mt-2">
                          <Info className="w-4 h-4 flex-shrink-0" />
                          {results.savingsMessage}
                        </div>
                      )}

                      <ResultBox label="السعر قبل الضريبة" value={results.pricePreTax?.toFixed(2)} /><ResultBox label={`قيمة الضريبة (${generalSettings?.taxRate ?? 15}%)`} value={results.tax?.toFixed(2)} />
                      <div className="col-span-2 md:col-span-3 mt-4 bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-2">
                        <div className="flex justify-between items-center text-slate-500"><span>السعر الأساسي:</span><span>{Math.round(results.finalPrice || 0)} ريال</span></div>
                        {results.discountPercent > 0 && (<div className="flex justify-between items-center text-[#337159]"><span>خصم الكمية ({results.discountPercent}%):</span><span>-{Math.round(results.discountAmount)} ريال</span></div>)}
                        <div className="border-t border-slate-200 pt-2 flex justify-between items-center"><span className="font-bold text-[#337159] text-lg">السعر النهائي (بعد الخصم):</span><span className="font-black text-3xl text-[#fa5732]">{Math.round(results.priceAfterDiscount || 0)} <span className="text-sm font-medium">ريال</span></span></div>
                      </div>
                    </div>
                  )}
                  {activeTab === 'offset' && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <ResultBox label="CEILING(عرض)" value={results.ceilW} />
                      <ResultBox label="CEILING(طول)" value={results.ceilH} />
                      <ResultBox label={`متغير التسعير (C) - ${results.cuttingLabel}`} value={results.pricingVariable} />

                      <div className="col-span-2 md:col-span-3 bg-[#337159]/5 p-4 rounded-xl border border-[#337159]/20 mt-2 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="bg-white p-3 rounded-lg border border-[#337159]/10 text-center">
                            <div className="text-xs text-slate-500 mb-1">السعر لكل 1000 (المعادلة)</div>
                            <div className="text-2xl font-black text-[#337159]">{results.pricePer1000?.toFixed(2)}</div>
                            <div className="text-[10px] text-slate-400">CEILING × CEILING × C</div>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-[#b99ecb]/30 text-center">
                            <div className="text-xs text-slate-500 mb-1">المضاعف (CEILING × CEILING)</div>
                            <div className="text-2xl font-black text-[#b99ecb]">{results.multiplier}</div>
                            <div className="text-[10px] text-slate-400">{results.ceilW} × {results.ceilH}</div>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-amber-200 text-center">
                            <div className="text-xs text-slate-500 mb-1">سعر الحبة (قبل الضريبة)</div>
                            <div className="text-2xl font-black text-amber-600">{results.pricePerUnit?.toFixed(3)}</div>
                            <div className="text-[10px] text-slate-400">ريال</div>
                          </div>
                        </div>
                        {(isFoldingEnabled || isPunchingEnabled) && (
                          <div className="bg-[#337159]/5 border border-[#337159]/20 rounded-lg p-3 grid grid-cols-2 gap-2">
                            <div className="col-span-2 text-xs font-bold text-[#337159] mb-1">الإضافات (لكل 1000):</div>
                            {isFoldingEnabled && (
                              <div className="flex justify-between items-center text-xs bg-white rounded p-2 border border-[#337159]/10">
                                <span className="flex items-center gap-1"><span>📄</span> الثنية</span>
                                <span className="font-bold text-[#337159]">{results.foldingCostPer1000} ريال</span>
                              </div>
                            )}
                            {isPunchingEnabled && (
                              <div className="flex justify-between items-center text-xs bg-white rounded p-2 border border-[#337159]/10">
                                <span className="flex items-center gap-1"><span>⚙️</span> التخريم</span>
                                <span className="font-bold text-[#337159]">{results.punchingCostPer1000} ريال</span>
                              </div>
                            )}
                            <div className="col-span-2 flex justify-between items-center text-xs font-bold border-t border-[#337159]/20 pt-2 text-[#337159]">
                              <span>إجمالي الإضافات (لكل 1000)</span>
                              <span>{(results.foldingCostPer1000 + results.punchingCostPer1000)} ريال</span>
                            </div>
                          </div>
                        )}
                        <div className="bg-white p-3 rounded-lg border border-[#337159]/30 text-center">
                          <div className="text-xs text-slate-500 mb-1">الإجمالي لكل 1000 (شامل كل الإضافات)</div>
                          <div className="text-2xl font-black text-[#fa5732]">{results.totalPricePer1000?.toFixed(2)}</div>
                          <div className="text-[10px] text-slate-400">ريال</div>
                        </div>
                      </div>

                      <div className="col-span-2 md:col-span-3 mt-2 bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-2">
                        <div className="flex justify-between items-center text-slate-500 text-sm">
                          <span>السعر للكمية ({inputs.quantity} حبة):</span>
                          <span>{results.rawTotal?.toFixed(2)} ريال</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-500 text-sm">
                          <span>الضريبة ({generalSettings?.taxRate ?? 15}%):</span>
                          <span>+{((results.priceWithTax || 0) - (results.rawTotal || 0)).toFixed(2)} ريال</span>
                        </div>
                        {results.discountPercent > 0 && (
                          <div className="flex justify-between items-center text-[#337159] text-sm">
                            <span>خصم الكمية ({results.discountPercent}%):</span>
                            <span>-{Math.round(results.discountAmount)} ريال</span>
                          </div>
                        )}
                        <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                          <span className="font-bold text-[#337159] text-lg">السعر شامل الضريبة:</span>
                          <span className="font-black text-3xl text-[#fa5732]">{Math.round(results.priceAfterDiscount || 0)} <span className="text-sm font-medium">ريال</span></span>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeTab === 'uvdtf' && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <ResultBox label="عدد في الصف" value={results.itemsPerRow} />
                      <ResultBox label="عدد الصفوف" value={results.totalRows} />
                      <ResultBox label="الأمتار المستهلكة" value={results.metersConsumed?.toFixed(3)} highlighted />
                      <ResultBox label="سعر المتر المطبق" value={results.evaluatedUnitPrice} />
                      
                      <div className="col-span-2 md:col-span-3 mt-4 bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-2">
                        <div className="flex justify-between items-center text-slate-500 text-sm"><span>السعر قبل الضريبة:</span><span>{results.pricePreTax?.toFixed(2)} ريال</span></div>
                        <div className="flex justify-between items-center text-slate-500 text-sm"><span>الضريبة ({generalSettings?.taxRate ?? 15}%):</span><span>+{results.tax?.toFixed(2)} ريال</span></div>
                        <div className="border-t border-slate-200 pt-2 flex justify-between items-center"><span className="font-bold text-[#337159] text-lg">السعر النهائي (شامل الضريبة):</span><span className="font-black text-3xl text-[#fa5732]">{Math.round(results.finalPrice || 0)} <span className="text-sm font-medium">ريال</span></span></div>
                      </div>
                    </div>
                  )}

                  {/* Save Button */}
                  <div className="mt-6 flex justify-end col-span-full">
                    <button
                      onClick={handleSaveQuote}
                      disabled={savingLog || !results.finalPrice}
                      className="bg-[#fa5732] hover:bg-[#d94a29] text-white py-3 px-8 rounded-xl font-bold shadow-lg flex items-center gap-2 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                    >
                      <FileText className="w-5 h-5" />
                      {savingLog ? 'جاري الحفظ...' : 'حفظ التسعيرة'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="text-center text-xs text-slate-400 mt-8">{activeTab === 'digital' ? `السعر المطبق للورق: ${results.sheetPriceUsed} ريال | المقاس: ${results.dims}` : activeTab === 'offset' ? `السعر لكل 1000: ${results.pricePer1000?.toFixed(2)} ريال | سعر الحبة: ${results.pricePerUnit?.toFixed(3)} ريال` : `الأسعار الأساسية: رول: ${prices.rollUnitPrice} | UV: ${prices.uvDtfPrice}`}</div>
          </>
          )}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return <AppContent />;
}

function AppContent() {
  const [view, setView] = useState('calculator'); // 'calculator', 'admin'
  const [loggedInUser, setLoggedInUser] = useState(() => {
    try {
      const saved = localStorage.getItem('pricing_logged_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  // Added visibility settings to initial state
  const [generalSettings, setGeneralSettings] = useState({
    allowPriceOverride: false,
    showRoll: true,
    showDigital: true,
    showOffset: true,
    showUvDtf: true,
    showOffsetBox: true
  });

  const [prices, setPrices] = useState({
    rollUnitPrice: 80, defaultRollWidth: 120, digitalSheetPrice: 5, digitalPaperTypes: [], digitalAddons: [], rollDiscounts: [], digitalDiscounts: [], uvDtfDiscounts: [],
    digitalSheetSizes: [{ name: 'ربع ورق (33×48)', width: 33, height: 48 }, { name: 'شيت طويل (33×100)', width: 33, height: 100 }],
    sheetWidth: 33, sheetHeight: 48, uvDtfPrice: 150,
    foilMoldPricePerCm2: 1.15, foilMinMoldPrice: 150, foilStampingUnitPrice: 0.40,
    // Offset Defaults
    offsetFixedWidth: 5, offsetFixedHeight: 9,
    offsetPlatePrice: 50, offsetPrintPrice1000: 80, offsetMinQty: 1000, offsetPaperTypes: [], offsetDiscounts: [],
    // New Toggle default
    showDigitalPaperField: true
  });

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (e) {
        console.error("Auth Error:", e);
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  useEffect(() => {
    // Add Cairo Font
    const link = document.createElement('link');
    link.href = "https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;700;800;900&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.innerHTML = `* {font - family: 'Cairo', sans-serif; }`;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    if (loading) return;
    const priceDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'pricing');
    const generalRef = doc(db, ...GENERAL_SETTINGS_PATH);

    const unsubPrice = onSnapshot(priceDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setPrices(prev => ({ ...prev, ...docSnap.data() }));
      } else {
        setDoc(priceDocRef, prices).catch(console.error);
      }
    });

    const unsubGeneral = onSnapshot(generalRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Merge with defaults to ensure all keys exist for new features
        setGeneralSettings(prev => ({ ...prev, ...data }));
      } else {
        setDoc(generalRef, {
          allowPriceOverride: false,
          showRoll: true,
          showDigital: true,
          showOffset: true,
          showUvDtf: true,
          showOffsetBox: true
        });
      }
    });

    return () => {
      unsubPrice();
      unsubGeneral();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const handleUpdatePrice = async (newPrices) => {
    try {
      const priceDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'pricing');
      await setDoc(priceDocRef, newPrices, { merge: true });
      alert('تم تحديث الأسعار بنجاح');
    } catch (error) {
      console.error("Error updating:", error);
      alert('حدث خطأ أثناء الحفظ: ' + error.message);
    }
  };

  const handleUpdateGeneralSettings = async (newSettings) => {
    try {
      const generalRef = doc(db, ...GENERAL_SETTINGS_PATH);
      await setDoc(generalRef, newSettings, { merge: true });
    } catch (error) {
      console.error("Error updating general settings:", error);
      alert('خطأ في حفظ الإعدادات: ' + error.message);
    }
  };

  const handleLoginSuccess = (user) => {
    setLoggedInUser(user);
    try {
      localStorage.setItem('pricing_logged_user', JSON.stringify(user));
    } catch {}
    setView('calculator');
  };

  // تسجيل الخروج الكامل (يُعيد المستخدم لشاشة الدخول)
  const handleLogout = () => {
    setLoggedInUser(null);
    try {
      localStorage.removeItem('pricing_logged_user');
    } catch {}
    setView('calculator');
  };

  // الدخول للوحة المسؤول (للمسؤولين فقط، دون إعادة تسجيل دخول)
  const goToAdmin = () => {
    if (loggedInUser?.role === 'admin') setView('admin');
  };

  if (loading) return (<div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500 gap-4"><div className="w-10 h-10 border-4 border-[#337159] border-t-transparent rounded-full animate-spin"></div><p>جاري التحميل...</p></div>);

  // بوابة إلزامية: لا يمكن الوصول للحاسبات إلا بعد تسجيل الدخول
  if (!loggedInUser) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  if (view === 'admin' && loggedInUser.role === 'admin') {
    return <AdminPanel
      prices={prices}
      onUpdatePrice={handleUpdatePrice}
      onLogout={() => setView('calculator')}
      currentUser={loggedInUser}
      generalSettings={generalSettings}
      onUpdateGeneralSettings={handleUpdateGeneralSettings}
    />;
  }

  // عرض الحاسبة (للأعضاء المسجلين فقط)
  return (
    <div className="min-h-screen bg-slate-100 font-sans" dir="rtl">
      <CalculatorApp
        prices={prices}
        onAdminLogin={goToAdmin}
        onLogout={handleLogout}
        currentUser={loggedInUser}
        isAdmin={loggedInUser.role === 'admin'}
        generalSettings={generalSettings}
      />
    </div>
  );
}
