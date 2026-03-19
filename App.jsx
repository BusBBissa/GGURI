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

  const storageKey = `wedding_images_${coupleId}`;

  // ---------------- 초기 데이터 불러오기 ----------------
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) setImages(JSON.parse(saved));

    const load = async () => {
      const snap = await getDoc(doc(db, "couples", coupleId));
      if (snap.exists()) {
        const d = snap.data();
        setEvents(d.events || []);
        setWeddingDate(d.weddingDate || "");
      }
    };
    load();
  }, [coupleId]);

  // ---------------- LocalStorage에 저장 ----------------
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(images));
  }, [images]);

  const saveField = async (field, value) => { 
    await updateDoc(doc(db, "couples", coupleId), { [field]: value }); 
  };

  useEffect(() => { if(events.length) saveField("events", events); }, [events]);
  useEffect(() => { if(weddingDate) saveField("weddingDate", weddingDate); }, [weddingDate]);

  // ---------------- 사진 슬라이드 자동 ----------------
  useEffect(() => {
    if(images.length < 2) return;
    const interval = setInterval(() => setCurrentImage((prev) => (prev + 1) % images.length), 3000);
    return () => clearInterval(interval);
  }, [images]);

  // ---------------- 사진 업로드 (모바일 & 용량 대응) ----------------
  const uploadImage = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result;
      img.onload = () => {
        // 최대 너비 800px 유지, 비율 맞춤
        const scale = Math.min(1, 800 / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const resizedDataUrl = canvas.toDataURL("image/jpeg", 0.8); // 용량 줄이기
        setImages(prev => [...prev, resizedDataUrl]);
      };
    };
    reader.readAsDataURL(file);
  };

  // ---------------- 달력 계산 ----------------
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = firstDay.getFullYear();
  const month = firstDay.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = firstDay.getDay(); // 달력 첫 날 요일
  const weekdays = ["일","월","화","수","목","금","토"];

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
        <h2>D-{weddingDate ? Math.floor((new Date(weddingDate)-new Date())/(1000*60*60*24)) : "?"}</h2>
        <input type="date" value={weddingDate} onChange={e=>setWeddingDate(e.target.value)} style={{padding:"10px", borderRadius:"12px", border:"1px solid #ddd", marginTop:"10px"}}/>
      </div>

      {/* 달력 */}
      <div style={{background:"white", padding:"20px", borderRadius:"20px", marginBottom:"20px"}}>
        {/* 이전/다음 달 버튼 */}
        <div style={{display:"flex", justifyContent:"space-between", marginBottom:"10px"}}>
          <button onClick={()=>setMonthOffset(monthOffset-1)} style={{background:"#ffccd5", border:"none", borderRadius:"12px", padding:"5px 10px", cursor:"pointer"}}>◀ 이전달</button>
          <h3>{year}년 {month+1}월</h3>
          <button onClick={()=>setMonthOffset(monthOffset+1)} style={{background:"#ffccd5", border:"none", borderRadius:"12px", padding:"5px 10px", cursor:"pointer"}}>다음달 ▶</button>
        </div>

        {/* 요일 */}
        <div style={{display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:"5px", textAlign:"center", fontWeight:"bold"}}>
          {weekdays.map((d,i)=>(
            <div key={i} style={{padding:"5px", color: i===0?"red":i===6?"blue":"black"}}>{d}</div>
          ))}
        </div>

        {/* 날짜 */}
        <div style={{display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"5px"}}>
          {Array(firstDayOfMonth).fill(null).map((_,i)=>(
            <div key={"blank"+i}></div>
          ))}
          {Array(daysInMonth).fill(null).map((_,i)=>{
            const date = `${year}-${String(month+1).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`;
            const hasEvent = events.find(e=>e.date===date);
            return (
              <div key={i} onClick={()=>setSelectedDate(date)} 
                style={{
                  padding:"12px",
                  borderRadius:"10px",
                  background: hasEvent ? "#ffccd5" : "#f9f9f9",
                  textAlign:"center",
                  cursor:"pointer"
                }}
              >
                {i+1}
              </div>
            )
          })}
        </div>

        {/* 선택 날짜 이벤트 */}
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

  // Firestore + LocalStorage에서 불러오기
  useEffect(() => {
    const saved = localStorage.getItem(`tasks_${coupleId}`);
    if (saved) setTasks(JSON.parse(saved));

    const load = async () => {
      const snap = await getDoc(doc(db, "couples", coupleId));
      if (snap.exists()) setTasks(snap.data().tasks || []);
    };
    load();
  }, [coupleId]);

  // 저장
  useEffect(() => {
    localStorage.setItem(`tasks_${coupleId}`, JSON.stringify(tasks));
    updateDoc(doc(db, "couples", coupleId), { tasks });
  }, [tasks, coupleId]);

  const addTask = () => {
    if (!taskText || !taskCategory) return;
    setTasks(prev => [...prev, { text: taskText, category: taskCategory, done: false }]);
    setTaskText(""); setTaskCategory("");
  };

  const toggleDone = (t) => setTasks(prev => prev.map(item => item===t ? {...item, done: !item.done} : item));
  const deleteTask = (t) => setTasks(prev => prev.filter(item => item!==t));

  // 카테고리별 그룹화
  const grouped = tasks.reduce((acc, t) => { acc[t.category] = acc[t.category] || []; acc[t.category].push(t); return acc; }, {});

  return (
    <div style={{background:"white", padding:"15px", borderRadius:"20px"}}>
      <div style={{display:"flex", gap:"5px", marginBottom:"10px"}}>
        <input placeholder="카테고리" value={taskCategory} onChange={e=>setTaskCategory(e.target.value)} style={{padding:"8px",borderRadius:"10px",border:"1px solid #ddd"}}/>
        <input placeholder="할 일 입력" value={taskText} onChange={e=>setTaskText(e.target.value)} style={{padding:"8px",borderRadius:"10px",border:"1px solid #ddd", flex:1}}/>
        <button onClick={addTask} style={{padding:"8px 15px",borderRadius:"12px",background:"#ff8fa3",color:"#fff",border:"none",cursor:"pointer"}}>➕ 추가</button>
      </div>

      {/* 2단 레이아웃 */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr", gap:"10px"}}>
        {Object.entries(grouped).map(([cat,list])=>(
          <div key={cat}>
            <b>{cat}</b>
            {list.map((t,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px",margin:"5px 0",borderRadius:"12px",background:"#f9f9f9",boxShadow:"0 1px 3px rgba(0,0,0,0.1)"}}>
                <span style={{textDecoration:t.done?"line-through":"none"}}>{t.text}</span>
                <div style={{display:"flex",gap:"5px"}}>
                  <button onClick={()=>toggleDone(t)} style={{padding:"2px 6px",borderRadius:"6px",background:t.done?"#b3ffb3":"#ffd1dc",border:"none",cursor:"pointer"}}>
                    {t.done?"완료":"미완료"}
                  </button>
                  <button onClick={()=>deleteTask(t)} style={{padding:"2px 6px",borderRadius:"6px",background:"#ffb3c1",border:"none",cursor:"pointer"}}>❌</button>
                </div>
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
  const [guestText, setGuestText] = useState("");
  const [guestCategory, setGuestCategory] = useState("");
  const [guestParent, setGuestParent] = useState("신랑"); // 입력시 선택
  const [guestSearch, setGuestSearch] = useState("");

  // 불러오기
  useEffect(() => {
    const saved = localStorage.getItem(`guests_${coupleId}`);
    if (saved) setGuests(JSON.parse(saved));

    const load = async () => {
      const snap = await getDoc(doc(db,"couples",coupleId));
      if (snap.exists()) setGuests(snap.data().guests || []);
    };
    load();
  }, [coupleId]);

  // 저장
  useEffect(() => {
    localStorage.setItem(`guests_${coupleId}`, JSON.stringify(guests));
    updateDoc(doc(db,"couples",coupleId), {guests});
  }, [guests, coupleId]);

  // 추가
  const addGuest = () => {
    if (!guestText || !guestCategory) return;
    setGuests(prev => [...prev,{name:guestText,parent:guestParent,category:guestCategory,status:"미정"}]);
    setGuestText(""); setGuestCategory(""); setGuestParent("신랑");
  };

  // 상태 토글
  const toggleStatus = (g) => {
    const next = g.status==="미정"?"참석예정":g.status==="참석예정"?"불참":"미정";
    setGuests(prev => prev.map(item => item===g ? {...item,status:next} : item));
  };

  // 삭제
  const deleteGuest = (g) => setGuests(prev => prev.filter(item => item!==g));

  // 신랑/신부별 그룹화 -> 카테고리별 그룹화
  const grouped = { "신랑": {}, "신부": {} };
  guests.forEach(g => {
    if (!grouped[g.parent][g.category]) grouped[g.parent][g.category] = [];
    grouped[g.parent][g.category].push(g);
  });

  return (
    <div style={{background:"white", padding:"15px", borderRadius:"20px"}}>
      {/* 입력 */}
      <div style={{display:"flex", gap:"5px", marginBottom:"10px"}}>
        <select value={guestParent} onChange={e=>setGuestParent(e.target.value)} style={{padding:"8px", borderRadius:"10px", border:"1px solid #ddd"}}>
          <option>신랑</option>
          <option>신부</option>
        </select>
        <input placeholder="카테고리" value={guestCategory} onChange={e=>setGuestCategory(e.target.value)} style={{padding:"8px", borderRadius:"10px", border:"1px solid #ddd"}}/>
        <input placeholder="이름" value={guestText} onChange={e=>setGuestText(e.target.value)} style={{padding:"8px", borderRadius:"10px", border:"1px solid #ddd", flex:1}}/>
        <button onClick={addGuest} style={{padding:"8px 15px", borderRadius:"12px", background:"#ff8fa3", color:"#fff", border:"none", cursor:"pointer"}}>➕ 추가</button>
      </div>

      {/* 검색 */}
      <input placeholder="검색" value={guestSearch} onChange={e=>setGuestSearch(e.target.value)} style={{padding:"8px", borderRadius:"10px", border:"1px solid #ddd", width:"100%", marginBottom:"10px"}}/>

      {/* 2단 레이아웃: 좌측 신랑, 우측 신부 */}
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px"}}>
        {["신랑","신부"].map(parent => (
          <div key={parent}>
            <h3>{parent}</h3>
            {Object.entries(grouped[parent]).map(([cat,list])=>(
              <div key={cat} style={{marginBottom:"10px"}}>
                <b>{cat}</b>
                {list.filter(g=>g.name.includes(guestSearch) || g.category.includes(guestSearch)).map((g,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px",margin:"5px 0",borderRadius:"12px",background:"#f9f9f9",boxShadow:"0 1px 3px rgba(0,0,0,0.1)"}}>
                    <span>{g.name}</span>
                    <div style={{display:"flex", gap:"5px"}}>
                      <button onClick={()=>toggleStatus(g)} style={{padding:"2px 6px",borderRadius:"6px",background:g.status==="참석예정"?"#b3ffb3":g.status==="불참"?"#ffd1dc":"#fff",border:"1px solid #ddd",cursor:"pointer"}}>
                        {g.status}
                      </button>
                      <button onClick={()=>deleteGuest(g)} style={{padding:"2px 6px",borderRadius:"6px",background:"#ffb3c1",border:"none",cursor:"pointer"}}>❌</button>
                    </div>
                  </div>
                ))}
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

  // LocalStorage 키
  const storageKey = `budget_${coupleId}`;

  // 불러오기
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) setBudgetItems(JSON.parse(saved));

    const load = async () => {
      const snap = await getDoc(doc(db,"couples",coupleId));
      if (snap.exists()) setBudgetItems(snap.data().budgetItems || []);
    };
    load();
  }, [coupleId]);

  // 저장
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(budgetItems));
    updateDoc(doc(db,"couples",coupleId), {budgetItems});
  }, [budgetItems, coupleId]);

  // 항목 추가
  const addItem = () => {
    if (!budgetName || !budgetCost) return;
    setBudgetItems(prev => [...prev,{name:budgetName,cost:Number(budgetCost)}]);
    setBudgetName(""); setBudgetCost("");
  };

  // 항목 삭제
  const deleteItem = (item) => setBudgetItems(prev => prev.filter(i=>i!==item));

  // 2단 배치
  const half = Math.ceil(budgetItems.length/2);
  const left = budgetItems.slice(0, half);
  const right = budgetItems.slice(half);

  const totalBudget = budgetItems.reduce((acc,b)=>acc+Number(b.cost||0),0);

  return (
    <div style={{background:"white", padding:"15px", borderRadius:"20px"}}>
      {/* 입력창 */}
      <div style={{display:"flex", gap:"5px", marginBottom:"10px"}}>
        <input
          placeholder="항목명"
          value={budgetName}
          onChange={e=>setBudgetName(e.target.value)}
          style={{padding:"8px", borderRadius:"10px", border:"1px solid #ddd", flex:1}}
        />
        <input
          placeholder="금액"
          type="number"
          value={budgetCost}
          onChange={e=>setBudgetCost(e.target.value)}
          style={{padding:"8px", borderRadius:"10px", border:"1px solid #ddd", width:"100px"}}
        />
        <button
          onClick={addItem}
          style={{padding:"8px 15px", borderRadius:"12px", background:"#ff8fa3", color:"#fff", border:"none", cursor:"pointer"}}
        >
          ➕ 추가
        </button>
      </div>

      {/* 총액 */}
      <div style={{marginBottom:"10px", fontWeight:"bold"}}>
        총 예산: {totalBudget.toLocaleString()}원
      </div>

      {/* 2단 리스트 */}
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px"}}>
        {[left,right].map((col,idx)=>(
          <div key={idx}>
            {col.map((b,i)=>(
              <div key={i} style={{
                display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"8px", margin:"5px 0", borderRadius:"12px", background:"#f9f9f9",
                boxShadow:"0 1px 3px rgba(0,0,0,0.1)"
              }}>
                {/* 왼쪽: 항목명 */}
                <span style={{flex:1}}>{b.name}</span>

                {/* 오른쪽: 금액 + 삭제 */}
                <div style={{display:"flex", gap:"5px", alignItems:"center"}}>
                  <span>{Number(b.cost).toLocaleString()}원</span>
                  <button onClick={()=>deleteItem(b)} style={{
                    padding:"2px 6px", borderRadius:"6px", background:"#ffb3c1",
                    border:"none", cursor:"pointer"
                  }}>❌</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}