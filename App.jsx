import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// ---------------- Firebase 초기화 ----------------
const firebaseConfig = {
  apiKey: "AIzaSyBzMM4swUjS08WjOqSF7RmfaHOsfVc8gSg",
  authDomain: "gguri-e94ae.firebaseapp.com",
  projectId: "gguri-e94ae",
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider();

// ---------------- App ----------------
export default function App() {
  const [user, setUser] = useState(null);
  const [coupleId, setCoupleId] = useState("");
  const [inputCoupleId, setInputCoupleId] = useState("");
  const [tab, setTab] = useState("home");

  useEffect(() => onAuthStateChanged(auth, u => u && setUser(u)), []);

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  const createCouple = async () => {
    const id = Math.random().toString(36).slice(2, 8);
    setCoupleId(id);
    navigator.clipboard.writeText(id);
    await setDoc(doc(db, "couples", id), {});
    alert("초대 코드: " + id);
  };
  const joinCouple = () => setCoupleId(inputCoupleId);

  if (!user) return <AuthPage login={login} />;
  if (!coupleId) return <JoinCouplePage createCouple={createCouple} joinCouple={joinCouple} inputCoupleId={inputCoupleId} setInputCoupleId={setInputCoupleId} />;

  return (
    <div style={{minHeight:"100vh", background:"#fff5f7", padding:"20px", fontFamily:"'Arial', sans-serif"}}>
      <TabBar tab={tab} setTab={setTab} logout={logout} />
      {tab==="home" && <HomeTab coupleId={coupleId} />}
      {tab==="tasks" && <TasksTab coupleId={coupleId} />}
      {tab==="guests" && <GuestsTab coupleId={coupleId} />}
      {tab==="budget" && <BudgetTab coupleId={coupleId} />}
    </div>
  );
}

// ---------------- Auth ----------------
function AuthPage({ login }) {
  return (
    <div style={{height:"100vh", display:"flex", justifyContent:"center", alignItems:"center", background:"linear-gradient(135deg,#fce3ec,#ffe8d6)"}}>
      <div style={{textAlign:"center"}}>
        <h1 style={{fontSize:"40px", marginBottom:"20px"}}>💍 Wedding</h1>
        <button onClick={login} style={{padding:"15px 40px", fontSize:"18px", borderRadius:"20px", border:"none", background:"#ff6f91", color:"#fff", cursor:"pointer"}}>Google 로그인</button>
      </div>
    </div>
  );
}

// ---------------- Join Couple ----------------
function JoinCouplePage({ createCouple, joinCouple, inputCoupleId, setInputCoupleId }) {
  return (
    <div style={{height:"100vh", display:"flex", justifyContent:"center", alignItems:"center", background:"#fff0f5"}}>
      <div style={{textAlign:"center", background:"#fff", padding:"30px", borderRadius:"20px", boxShadow:"0 5px 20px rgba(0,0,0,0.1)"}}>
        <button onClick={createCouple} style={{padding:"10px 20px", borderRadius:"12px", background:"#ff8fa3", color:"#fff", border:"none", marginBottom:"10px"}}>커플 생성</button>
        <div style={{marginTop:"10px"}}>
          <input placeholder="초대 코드 입력" value={inputCoupleId} onChange={e=>setInputCoupleId(e.target.value)} style={{padding:"8px", borderRadius:"10px", border:"1px solid #ddd", marginRight:"5px"}}/>
          <button onClick={joinCouple} style={{padding:"8px 15px", borderRadius:"12px", background:"#ffb3c1", border:"none"}}>입장</button>
        </div>
      </div>
    </div>
  );
}

// ---------------- TabBar ----------------
function TabBar({ tab, setTab, logout }) {
  return (
    <div style={{display:"flex", gap:"10px", marginBottom:"20px"}}>
      {["home","tasks","guests","budget"].map(t => (
        <button key={t} onClick={()=>setTab(t)} style={{flex:1, padding:"12px", borderRadius:"20px", border:"none", background: tab===t?"#ff8fa3":"white", color: tab===t?"white":"black", fontWeight:"bold"}}>
          {t==="home"?"홈":t==="tasks"?"할일":t==="guests"?"하객":"예산"}
        </button>
      ))}
      <button onClick={logout} style={{marginLeft:"10px", padding:"8px 12px", borderRadius:"12px", background:"#ffb3c1", border:"none"}}>로그아웃</button>
    </div>
  );
}

// ---------------- HomeTab ----------------
function HomeTab({ coupleId }) {
  const [images, setImages] = useState([]);
  const [currentImage, setCurrentImage] = useState(0);
  const [weddingDate, setWeddingDate] = useState("");
  const [events, setEvents] = useState([]);
  const [eventText, setEventText] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [monthOffset, setMonthOffset] = useState(0);

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, "couples", coupleId));
      if (snap.exists()) {
        const d = snap.data();
        setImages(d.images || []);
        setEvents(d.events || []);
        setWeddingDate(d.weddingDate || "");
      }
    };
    load();
  }, [coupleId]);

  const saveField = async (field, value) => { await updateDoc(doc(db, "couples", coupleId), { [field]: value }); };
  useEffect(() => { if(images.length) saveField("images", images); }, [images]);
  useEffect(() => { if(events.length) saveField("events", events); }, [events]);
  useEffect(() => { if(weddingDate) saveField("weddingDate", weddingDate); }, [weddingDate]);

  useEffect(() => {
    if(images.length < 2) return;
    const interval = setInterval(() => setCurrentImage((prev) => (prev + 1) % images.length), 3000);
    return () => clearInterval(interval);
  }, [images]);

  const baseDate = new Date();
  baseDate.setMonth(baseDate.getMonth() + monthOffset);
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dday = weddingDate ? Math.ceil((new Date(weddingDate) - new Date()) / (1000*60*60*24)) : null;

  const uploadImage = async (file) => {
  console.log("업로드 시도", coupleId, file);
  try {
    if (!coupleId) throw new Error("coupleId가 없습니다!"); // coupleId 확인
    const storageRef = ref(storage, `images/${coupleId}/${file.name}-${Date.now()}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    setImages(prev => [...prev, url]);
  } catch(err) { 
    console.error("업로드 오류:", err); 
    alert("사진 업로드 실패: " + err.message); // 실패 사유 표시
  }
};
  

  return (
    <div>
      {/* 사진 업로드 */}
      <div style={{marginBottom:"20px"}}>
        <label style={{display:"inline-block", padding:"10px 20px", borderRadius:"12px", background:"#ff8fa3", color:"#fff", cursor:"pointer"}}>
          사진 추가
          <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{ if(e.target.files[0]) uploadImage(e.target.files[0]); }} />
        </label>
        <div style={{display:"flex", gap:"5px", marginTop:"10px", flexWrap:"wrap"}}>
          {images.map((img, idx)=>(
            <img key={idx} src={img} onClick={()=>setCurrentImage(idx)} style={{width:"80px", height:"80px", objectFit:"cover", borderRadius:"8px", border: idx===currentImage?"2px solid #ff8fa3":"1px solid #ccc", cursor:"pointer"}}/>
          ))}
        </div>
      </div>

      {/* 사진 슬라이드 */}
      {images.length>0 && (
        <div style={{width:"100%", maxHeight:"50vh", borderRadius:"20px", overflow:"hidden", marginBottom:"20px", display:"flex", justifyContent:"center", alignItems:"center", background:"#fff"}}>
          <img src={images[currentImage]} style={{maxWidth:"100%", maxHeight:"100%", objectFit:"contain"}} />
        </div>
      )}

      {/* D-day */}
      <div style={{background:"white", padding:"20px", borderRadius:"20px", textAlign:"center", marginBottom:"20px"}}>
        <h2>D-{dday ?? "?"}</h2>
        <input type="date" value={weddingDate} onChange={e=>setWeddingDate(e.target.value)} style={{padding:"10px", borderRadius:"12px", border:"1px solid #ddd", marginTop:"10px"}}/>
      </div>

      {/* 달력 */}
      <div style={{background:"white", padding:"20px", borderRadius:"20px", marginBottom:"20px"}}>
        <div style={{display:"flex", justifyContent:"space-between", marginBottom:"10px"}}>
          <button onClick={()=>setMonthOffset(monthOffset-1)} style={{background:"#ffccd5", border:"none", borderRadius:"12px", padding:"5px 10px", cursor:"pointer"}}>◀ 이전달</button>
          <h3>{year}년 {month+1}월</h3>
          <button onClick={()=>setMonthOffset(monthOffset+1)} style={{background:"#ffccd5", border:"none", borderRadius:"12px", padding:"5px 10px", cursor:"pointer"}}>다음달 ▶</button>
        </div>
        <div style={{display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"5px"}}>
          {[...Array(daysInMonth)].map((_,i)=>{
            const date = `${year}-${String(month+1).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`;
            const hasEvent = events.find(e=>e.date===date);
            return <div key={i} onClick={()=>setSelectedDate(date)} style={{padding:"12px", borderRadius:"10px", background:hasEvent?"#ffccd5":"#f9f9f9", textAlign:"center", cursor:"pointer"}}>{i+1}</div>
          })}
        </div>
        {selectedDate && (
          <div style={{marginTop:"10px"}}>
            <h4>{selectedDate}</h4>
            {events.filter(e=>e.date===selectedDate).map((e,i)=><div key={i}>{e.text}</div>)}
            <input placeholder="일정" value={eventText} onChange={e=>setEventText(e.target.value)} style={{padding:"5px", borderRadius:"10px", border:"1px solid #ddd", marginRight:"5px"}}/>
            <button onClick={()=>{
              if(!eventText) return;
              setEvents(prev => [...prev,{text:eventText,date:selectedDate}]);
              setEventText("");
            }} style={{padding:"5px 12px", borderRadius:"10px", background:"#ff8fa3", color:"#fff", border:"none", cursor:"pointer"}}>추가</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------- TasksTab ----------------
function TasksTab({ coupleId }) {
  const [tasks, setTasks] = useState([]);
  const [taskText, setTaskText] = useState("");
  const [taskCategory, setTaskCategory] = useState("");

  useEffect(() => { const load = async () => { const snap = await getDoc(doc(db,"couples",coupleId)); if(snap.exists()) setTasks(snap.data().tasks || []); }; load(); }, [coupleId]);
  useEffect(() => { updateDoc(doc(db,"couples",coupleId), {tasks}); }, [tasks]);

  return (
    <div style={{background:"white", padding:"15px", borderRadius:"20px"}}>
      <input placeholder="카테고리" value={taskCategory} onChange={e=>setTaskCategory(e.target.value)} style={{padding:"8px", borderRadius:"10px", border:"1px solid #ddd", marginRight:"5px"}}/>
      <input placeholder="할 일 입력" value={taskText} onChange={e=>setTaskText(e.target.value)} style={{padding:"8px", borderRadius:"10px", border:"1px solid #ddd", width:"60%", marginRight:"5px"}}/>
      <button onClick={()=>{
        if(!taskText || !taskCategory) return;
        setTasks(prev => [...prev,{text:taskText,category:taskCategory,done:false}]);
        setTaskText(""); setTaskCategory("");
      }} style={{padding:"8px 15px", borderRadius:"12px", background:"#ff8fa3", color:"#fff", border:"none", cursor:"pointer"}}>➕ 추가</button>

      <div style={{marginTop:"10px"}}>
        {Object.entries(tasks.reduce((acc,t)=>{acc[t.category]=acc[t.category]||[]; acc[t.category].push(t); return acc;},{})).map(([cat,list])=>(
          <div key={cat} style={{marginBottom:"10px"}}>
            <b>{cat}</b>
            {list.map((t,i)=>(
              <div key={i} style={{display:"flex", justifyContent:"space-between", padding:"5px 0"}}>
                <span style={{textDecoration:t.done?"line-through":"none"}}>{t.text}</span>
                <button onClick={()=>{ setTasks(prev => prev.map(item => item===t ? {...item, done:!item.done} : item)); }}>{t.done?"완료":"미완료"}</button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- GuestsTab ----------------
function GuestsTab({ coupleId }) {
  const [guests, setGuests] = useState([]);
  const [guestName, setGuestName] = useState("");
  const [guestParent, setGuestParent] = useState("신랑");
  const [guestCategory, setGuestCategory] = useState("");
  const [guestSearch, setGuestSearch] = useState("");

  useEffect(() => { const load = async () => { const snap = await getDoc(doc(db,"couples",coupleId)); if(snap.exists()) setGuests(snap.data().guests || []); }; load(); }, [coupleId]);
  useEffect(() => { updateDoc(doc(db,"couples",coupleId), {guests}); }, [guests]);

  const filtered = guests.filter(g=>g.name.includes(guestSearch) || g.category.includes(guestSearch));

  return (
    <div style={{background:"white", padding:"15px", borderRadius:"20px"}}>
      <div style={{display:"flex", gap:"5px", marginBottom:"10px"}}>
        <select value={guestParent} onChange={e=>setGuestParent(e.target.value)} style={{padding:"8px", borderRadius:"10px", border:"1px solid #ddd"}}>
          <option>신랑</option>
          <option>신부</option>
        </select>
        <input placeholder="카테고리" value={guestCategory} onChange={e=>setGuestCategory(e.target.value)} style={{padding:"8px", borderRadius:"10px", border:"1px solid #ddd"}}/>
        <input placeholder="이름" value={guestName} onChange={e=>setGuestName(e.target.value)} style={{padding:"8px", borderRadius:"10px", border:"1px solid #ddd", flex:1}}/>
        <button onClick={()=>{
          if(!guestName || !guestCategory) return;
          setGuests(prev => [...prev,{name:guestName,parent:guestParent,category:guestCategory}]);
          setGuestName(""); setGuestCategory(""); setGuestParent("신랑");
        }} style={{padding:"8px 15px", borderRadius:"12px", background:"#ff8fa3", color:"#fff", border:"none", cursor:"pointer"}}>➕ 추가</button>
      </div>
      <input placeholder="검색" value={guestSearch} onChange={e=>setGuestSearch(e.target.value)} style={{padding:"8px", borderRadius:"10px", border:"1px solid #ddd", width:"100%", marginBottom:"10px"}}/>
      <div>
        {filtered.map((g,i)=>(
          <div key={i} style={{display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid #eee"}}>
            <span>{g.parent} - {g.category} - {g.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- BudgetTab ----------------
function BudgetTab({ coupleId }) {
  const [budgetItems, setBudgetItems] = useState([]);
  const [budgetName, setBudgetName] = useState("");
  const [budgetCost, setBudgetCost] = useState("");  

  // Firestore에서 불러오기
  useEffect(() => {
    if (!coupleId) return;
    const load = async () => {
      const snap = await getDoc(doc(db, "couples", coupleId));
      if (snap.exists()) setBudgetItems(snap.data().budgetItems || []);
    };
    load();
  }, [coupleId]);

  // Firestore에 저장
  useEffect(() => {
    if (!coupleId) return;
    updateDoc(doc(db, "couples", coupleId), { budgetItems });
  }, [budgetItems, coupleId]);

  const handleAdd = () => {
    if (!budgetName || !budgetCost) return;
    setBudgetItems(prev => [...prev, { name: budgetName, cost: Number(budgetCost) }]);
    setBudgetName("");
    setBudgetCost("");
  };

  const totalBudget = budgetItems.reduce((acc, b) => acc + Number(b.cost || 0), 0);

  return (
    <div style={{ background: "white", padding: "15px", borderRadius: "20px" }}>
      {/* 입력창 */}
      <div style={{ display: "flex", gap: "5px", marginBottom: "10px" }}>
        <input
          placeholder="항목명"
          value={budgetName}
          onChange={e => setBudgetName(e.target.value)}
          style={{ padding:"8px", borderRadius:"10px", border:"1px solid #ddd" }}
        />
        <input
          placeholder="금액"
          type="number"
          value={budgetCost}
          onChange={e => setBudgetCost(e.target.value)}
          style={{ padding:"8px", borderRadius:"10px", border:"1px solid #ddd" }}
        />
        <button
          onClick={handleAdd}
          style={{ padding:"8px 15px", borderRadius:"12px", background:"#ff8fa3", color:"#fff", border:"none", cursor:"pointer" }}
        >
          ➕ 추가
        </button>
      </div>

      {/* 총액 */}
      <div style={{ marginBottom:"10px", fontWeight:"bold" }}>
        총 예산: {totalBudget.toLocaleString()}원
      </div>

      {/* 리스트 */}
      <div>
        {budgetItems.map((b, i) => (
          <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid #eee" }}>
            <span>{b.name}</span>
            <span>{Number(b.cost).toLocaleString()}원</span>
          </div>
        ))}
      </div>
    </div>
  );
}