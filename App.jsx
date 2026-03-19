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

  // LocalStorage 키
  const imagesKey = `wedding_images_${coupleId}`;
  const eventsKey = `wedding_events_${coupleId}`;
  const dateKey = `wedding_date_${coupleId}`;

  // ---------------- 초기 데이터 불러오기 ----------------
  useEffect(() => {
    const savedImages = localStorage.getItem(imagesKey);
    if (savedImages) setImages(JSON.parse(savedImages));

    const savedEvents = localStorage.getItem(eventsKey);
    if (savedEvents) setEvents(JSON.parse(savedEvents));

    const savedDate = localStorage.getItem(dateKey);
    if (savedDate) setWeddingDate(savedDate);

    const load = async () => {
      const snap = await getDoc(doc(db, "couples", coupleId));
      if (snap.exists()) {
        const d = snap.data();
        setImages(d.images || JSON.parse(savedImages) || []);
        setEvents(d.events || JSON.parse(savedEvents) || []);
        setWeddingDate(d.weddingDate || savedDate || "");
      }
    };
    load();
  }, [coupleId]);

  // ---------------- 상태 변경 시 저장 ----------------
  useEffect(() => {
    localStorage.setItem(imagesKey, JSON.stringify(images));
    updateDoc(doc(db,"couples",coupleId), { images });
  }, [images, coupleId]);

  useEffect(() => {
    localStorage.setItem(eventsKey, JSON.stringify(events));
    updateDoc(doc(db,"couples",coupleId), { events });
  }, [events, coupleId]);

  useEffect(() => {
    localStorage.setItem(dateKey, weddingDate);
    updateDoc(doc(db,"couples",coupleId), { weddingDate });
  }, [weddingDate, coupleId]);

  // ---------------- 사진 슬라이드 ----------------
  useEffect(() => {
    if(images.length < 2) return;
    const interval = setInterval(() => setCurrentImage(prev => (prev + 1) % images.length), 3000);
    return () => clearInterval(interval);
  }, [images]);

  // ---------------- 이미지 업로드 ----------------
  const uploadImage = (file) => {
    const reader = new FileReader();
    reader.onload = () => setImages(prev => [...prev, reader.result]);
    reader.readAsDataURL(file);
  };

  // ---------------- 이미지 삭제 ----------------
  const deleteImage = (idx) => setImages(prev => prev.filter((_,i)=>i!==idx));

  // ---------------- 이벤트 추가 ----------------
  const addEvent = () => {
    if(!eventText || !selectedDate) return;
    setEvents(prev => [...prev, { text: eventText, date: selectedDate }]);
    setEventText("");
  };

  // ---------------- 달력 계산 ----------------
  const today = new Date();
  const displayDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = displayDate.getFullYear();
  const month = displayDate.getMonth();
  const daysInMonth = new Date(year, month+1, 0).getDate();

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
            <div key={idx} style={{position:"relative"}}>
              <img src={img} onClick={()=>setCurrentImage(idx)} style={{width:"80px", height:"80px", objectFit:"cover", borderRadius:"8px", border: idx===currentImage?"2px solid #ff8fa3":"1px solid #ccc", cursor:"pointer"}}/>
              <button onClick={()=>deleteImage(idx)} style={{position:"absolute", top:"-5px", right:"-5px", background:"#ffb3c1", border:"none", borderRadius:"50%", width:"20px", height:"20px", cursor:"pointer"}}>×</button>
            </div>
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
        <h2>D-{weddingDate ? Math.ceil((new Date(weddingDate)-today)/(1000*60*60*24)) : "?"}</h2>
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
            const dayEvents = events.filter(e=>e.date===date);
            return (
              <div key={i} onClick={()=>setSelectedDate(date)} style={{padding:"12px", borderRadius:"10px", background:dayEvents.length?"#ffccd5":"#f9f9f9", textAlign:"center", cursor:"pointer"}}>
                {i+1}
              </div>
            )
          })}
        </div>

        {selectedDate && (
          <div style={{marginTop:"10px"}}>
            <h4>{selectedDate}</h4>
            {events.filter(e=>e.date===selectedDate).map((e,i)=>(
              <div key={i} style={{display:"flex", justifyContent:"space-between", padding:"5px 0", background:"#fff", borderRadius:"8px", boxShadow:"0 1px 3px rgba(0,0,0,0.1)", marginBottom:"3px"}}>
                <span>{e.text}</span>
                <button onClick={()=>setEvents(prev => prev.filter(ev=>ev!==e))} style={{padding:"2px 6px", borderRadius:"6px", background:"#ffb3c1", border:"none", cursor:"pointer"}}>❌</button>
              </div>
            ))}
            <div style={{display:"flex", gap:"5px", marginTop:"5px"}}>
              <input placeholder="일정" value={eventText} onChange={e=>setEventText(e.target.value)} style={{padding:"5px", borderRadius:"10px", border:"1px solid #ddd", flex:1}}/>
              <button onClick={addEvent} style={{padding:"5px 12px", borderRadius:"10px", background:"#ff8fa3", color:"#fff", border:"none", cursor:"pointer"}}>추가</button>
            </div>
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

  // Firestore에서 불러오기
  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db,"couples",coupleId));
      if(snap.exists()) setTasks(snap.data().tasks || []);
    };
    load();
  }, [coupleId]);

  // Firestore에 저장
  useEffect(() => {
    updateDoc(doc(db,"couples",coupleId), {tasks});
  }, [tasks, coupleId]);

  // 완료 상태 토글
  const toggleDone = (task) => {
    setTasks(prev => prev.map(t => t===task ? {...t, done: !t.done} : t));
  };

  // 삭제
  const deleteTask = (task) => {
    setTasks(prev => prev.filter(t => t !== task));
  };

  // 카테고리별 그룹화
  const grouped = tasks.reduce((acc, t) => {
    acc[t.category] = acc[t.category] || [];
    acc[t.category].push(t);
    return acc;
  }, {});

  return (
    <div style={{background:"white", padding:"15px", borderRadius:"20px"}}>
      {/* 입력창 */}
      <div style={{display:"flex", gap:"5px", marginBottom:"15px", flexWrap:"wrap"}}>
        <input placeholder="카테고리" value={taskCategory} onChange={e=>setTaskCategory(e.target.value)} style={{padding:"8px", borderRadius:"10px", border:"1px solid #ddd"}}/>
        <input placeholder="할 일 입력" value={taskText} onChange={e=>setTaskText(e.target.value)} style={{padding:"8px", borderRadius:"10px", border:"1px solid #ddd", flex:1}}/>
        <button onClick={()=>{
          if(!taskText || !taskCategory) return;
          setTasks(prev => [...prev,{text:taskText,category:taskCategory,done:false}]);
          setTaskText(""); setTaskCategory("");
        }} style={{padding:"8px 15px", borderRadius:"12px", background:"#ff8fa3", color:"#fff", border:"none", cursor:"pointer"}}>➕ 추가</button>
      </div>

      {/* 카테고리별 그룹 표시 */}
      {Object.entries(grouped).map(([cat, list]) => (
        <div key={cat} style={{marginBottom:"15px"}}>
          <b style={{display:"block", marginBottom:"5px"}}>{cat}</b>
          <div style={{display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:"10px"}}>
            {list.map((t,i)=>(
              <div key={i} style={{
                padding:"10px",
                borderRadius:"12px",
                background:"#fff0f5",
                display:"flex",
                justifyContent:"space-between",
                alignItems:"center",
                cursor:"pointer",
                boxShadow:"0 2px 5px rgba(0,0,0,0.05)"
              }}>
                <span onClick={()=>toggleDone(t)} style={{
                  textDecoration: t.done ? "line-through" : "none",
                  color: t.done ? "#888" : "#000",
                  flex:1,
                  marginRight:"5px"
                }}>
                  {t.text}
                </span>
                <button onClick={()=>deleteTask(t)} style={{
                  background:"red",
                  border:"none",
                  color:"#fff",
                  borderRadius:"6px",
                  padding:"2px 6px",
                  cursor:"pointer",
                  fontSize:"12px"
                }}>×</button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
// ---------------- GuestsTab ----------------
function GuestsTab({ coupleId }) {
  const [guests, setGuests] = useState([]);
  const [guestName, setGuestName] = useState("");
  const [guestCategory, setGuestCategory] = useState("");

  // Firestore에서 불러오기
  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db,"couples",coupleId));
      if(snap.exists()) setGuests(snap.data().guests || []);
    };
    load();
  }, [coupleId]);

  // Firestore에 저장
  useEffect(() => {
    updateDoc(doc(db,"couples",coupleId), {guests});
  }, [guests, coupleId]);

  // 상태 토글: 참석예정 <-> 미정
  const toggleStatus = (guest) => {
    setGuests(prev => prev.map(g => g === guest ? {...g, status: g.status==="참석예정" ? "미정" : "참석예정"} : g));
  };

  // 삭제
  const deleteGuest = (guest) => {
    setGuests(prev => prev.filter(g => g !== guest));
  };

  // 신랑/신부, 카테고리별 그룹화
  const grouped = { 신랑: {}, 신부: {} };
  guests.forEach(g => {
    const side = g.parent || "신랑";
    grouped[side][g.category] = grouped[side][g.category] || [];
    grouped[side][g.category].push(g);
  });

  return (
    <div style={{background:"white", padding:"15px", borderRadius:"20px"}}>
      {/* 입력창 */}
      <div style={{display:"flex", gap:"5px", marginBottom:"15px", flexWrap:"wrap"}}>
        <input placeholder="이름" value={guestName} onChange={e=>setGuestName(e.target.value)} style={{padding:"8px", borderRadius:"10px", border:"1px solid #ddd", flex:1}}/>
        <input placeholder="카테고리" value={guestCategory} onChange={e=>setGuestCategory(e.target.value)} style={{padding:"8px", borderRadius:"10px", border:"1px solid #ddd"}}/>
        <button onClick={()=>{
          if(!guestName || !guestCategory) return;
          setGuests(prev => [...prev,{name:guestName, category:guestCategory, parent:"신랑", status:"참석예정"}]);
          setGuestName(""); setGuestCategory("");
        }} style={{padding:"8px 15px", borderRadius:"12px", background:"#ff8fa3", color:"#fff", border:"none", cursor:"pointer"}}>➕ 추가</button>
      </div>

      {/* 신랑 / 신부 영역 */}
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px"}}>
        {["신랑","신부"].map(side => (
          <div key={side}>
            <h3 style={{textAlign:"center", marginBottom:"10px"}}>{side}</h3>
            {Object.entries(grouped[side]).map(([cat, list]) => (
              <div key={cat} style={{marginBottom:"15px"}}>
                <b style={{display:"block", marginBottom:"5px"}}>{cat}</b>
                <div style={{display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"10px"}}>
                  {list.map((g,i)=>(
                    <div key={i} style={{
                      padding:"10px",
                      borderRadius:"12px",
                      background:"#fff0f5",
                      display:"flex",
                      justifyContent:"space-between",
                      alignItems:"center",
                      boxShadow:"0 2px 5px rgba(0,0,0,0.05)",
                      cursor:"pointer"
                    }}>
                      <span onClick={()=>toggleStatus(g)} style={{
                        flex:1,
                        marginRight:"5px",
                        color: g.status==="참석예정" ? "#000" : "#888",
                        textDecoration: g.status==="참석예정" ? "none" : "line-through"
                      }}>{g.name} ({g.status})</span>
                      <button onClick={()=>deleteGuest(g)} style={{
                        background:"red",
                        border:"none",
                        color:"#fff",
                        borderRadius:"6px",
                        padding:"2px 6px",
                        cursor:"pointer",
                        fontSize:"12px"
                      }}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
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

  // 삭제
  const deleteItem = (item) => {
    setBudgetItems(prev => prev.filter(b => b !== item));
  };

  // 총액
  const totalBudget = budgetItems.reduce((acc, b) => acc + Number(b.cost || 0), 0);

  return (
    <div style={{background:"white", padding:"15px", borderRadius:"20px"}}>
      {/* 입력창 */}
      <div style={{display:"flex", gap:"5px", marginBottom:"15px", flexWrap:"wrap"}}>
        <input placeholder="항목명" value={budgetName} onChange={e=>setBudgetName(e.target.value)} style={{padding:"8px", borderRadius:"10px", border:"1px solid #ddd", flex:1}}/>
        <input placeholder="금액" type="number" value={budgetCost} onChange={e=>setBudgetCost(e.target.value)} style={{padding:"8px", borderRadius:"10px", border:"1px solid #ddd"}}/>
        <button onClick={()=>{
          if(!budgetName || !budgetCost) return;
          setBudgetItems(prev => [...prev,{name:budgetName, cost:Number(budgetCost)}]);
          setBudgetName(""); setBudgetCost("");
        }} style={{padding:"8px 15px", borderRadius:"12px", background:"#ff8fa3", color:"#fff", border:"none", cursor:"pointer"}}>➕ 추가</button>
      </div>

      {/* 총액 */}
      <div style={{marginBottom:"15px", fontWeight:"bold"}}>
        총 예산: {totalBudget.toLocaleString()}원
      </div>

      {/* 2단 카드형 리스트 */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"10px"}}>
        {budgetItems.map((b,i)=>(
          <div key={i} style={{
            padding:"10px",
            borderRadius:"12px",
            background:"#fff0f5",
            display:"flex",
            justifyContent:"space-between",
            alignItems:"center",
            boxShadow:"0 2px 5px rgba(0,0,0,0.05)"
          }}>
            <span>{b.name} - {Number(b.cost).toLocaleString()}원</span>
            <button onClick={()=>deleteItem(b)} style={{
              background:"red",
              border:"none",
              color:"#fff",
              borderRadius:"6px",
              padding:"2px 6px",
              cursor:"pointer",
              fontSize:"12px"
            }}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}