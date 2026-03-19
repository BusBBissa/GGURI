import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc, setDoc, onSnapshot } from "firebase/firestore";

// ---------------- Firebase 초기화 ----------------
const firebaseConfig = {
  apiKey: "AIzaSyBzMM4swUjS08WjOqSF7RmfaHOsfVc8gSg",
  authDomain: "gguri-e94ae.firebaseapp.com",
  projectId: "gguri-e94ae",
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
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
    await setDoc(doc(db, "couples", id), {
      weddingDate: "",
      events: [],
      images: [],
      tasks: [],
      guests: [],
      budgetItems: []
    });
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

  // Firestore 실시간 구독
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "couples", coupleId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setWeddingDate(data.weddingDate || "");
        setEvents(data.events || []);
        setImages(data.images || []);
      }
    });
    return () => unsubscribe();
  }, [coupleId]);

  const saveField = async (field, value) => {
    try { await updateDoc(doc(db, "couples", coupleId), { [field]: value }); }
    catch(err){ console.error(err); alert(`${field} 저장 실패!`);}
  };

  useEffect(() => saveField("weddingDate", weddingDate), [weddingDate]);
  useEffect(() => saveField("events", events), [events]);
  useEffect(() => saveField("images", images), [images]);

  const uploadImage = (file) => {
    if(!file.type.startsWith("image/")) return alert("이미지 파일만 업로드 가능");
    const reader = new FileReader();
    reader.onload = e=>{
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, 800/img.width);
        canvas.width = img.width*scale;
        canvas.height = img.height*scale;
        canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
        setImages(prev=>[...prev, canvas.toDataURL("image/jpeg",0.8)]);
      }
    };
    reader.readAsDataURL(file);
  };

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = firstDay.getFullYear();
  const month = firstDay.getMonth();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const firstDayOfMonth = firstDay.getDay();
  const weekdays = ["일","월","화","수","목","금","토"];

  return (
    <div>
      <div style={{marginBottom:"20px"}}>
        <label style={{display:"inline-block", padding:"10px 20px", borderRadius:"12px", background:"#ff8fa3", color:"#fff", cursor:"pointer"}}>
          사진 추가
          <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>e.target.files[0] && uploadImage(e.target.files[0])}/>
        </label>
        <div style={{display:"flex", gap:"5px", marginTop:"10px", flexWrap:"wrap"}}>
          {images.map((img, idx)=>
            <div key={idx} style={{position:"relative"}}>
              <img src={img} onClick={()=>setCurrentImage(idx)} style={{width:"80px", height:"80px", objectFit:"cover", borderRadius:"8px", border: idx===currentImage?"2px solid #ff8fa3":"1px solid #ccc", cursor:"pointer"}}/>
              <button onClick={()=>setImages(prev=>prev.filter((_,i)=>i!==idx))} style={{position:"absolute", top:"-5px", right:"-5px", background:"red", color:"white", borderRadius:"50%", width:"20px", height:"20px", border:"none", cursor:"pointer"}}>×</button>
            </div>
          )}
        </div>
      </div>
      {images.length>0 && <div style={{width:"100%", maxHeight:"50vh", borderRadius:"20px", overflow:"hidden", marginBottom:"20px", display:"flex", justifyContent:"center", alignItems:"center", background:"#fff"}}><img src={images[currentImage]} style={{maxWidth:"100%", maxHeight:"100%", objectFit:"contain"}} /></div>}

      <div style={{background:"white", padding:"20px", borderRadius:"20px", textAlign:"center", marginBottom:"20px"}}>
        <h2>D-{weddingDate ? Math.floor((new Date(weddingDate)-new Date())/(1000*60*60*24)) : "?"}</h2>
        <input type="date" value={weddingDate} onChange={e=>setWeddingDate(e.target.value)} style={{padding:"10px", borderRadius:"12px", border:"1px solid #ddd", marginTop:"10px"}}/>
      </div>

      <div style={{background:"white", padding:"20px", borderRadius:"20px", marginBottom:"20px"}}>
        <div style={{display:"flex", justifyContent:"space-between", marginBottom:"10px"}}>
          <button onClick={()=>setMonthOffset(monthOffset-1)} style={{background:"#ffccd5", border:"none", borderRadius:"12px", padding:"5px 10px", cursor:"pointer"}}>◀ 이전달</button>
          <h3>{year}년 {month+1}월</h3>
          <button onClick={()=>setMonthOffset(monthOffset+1)} style={{background:"#ffccd5", border:"none", borderRadius:"12px", padding:"5px 10px", cursor:"pointer"}}>다음달 ▶</button>
        </div>
        <div style={{display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:"5px", textAlign:"center", fontWeight:"bold"}}>
          {weekdays.map((d,i)=><div key={i} style={{padding:"5px", color:i===0?"red":i===6?"blue":"black"}}>{d}</div>)}
        </div>
        <div style={{display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"5px"}}>
          {Array(firstDayOfMonth).fill(null).map((_,i)=><div key={"blank"+i}></div>)}
          {Array(daysInMonth).fill(null).map((_,i)=>{
            const date = `${year}-${String(month+1).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`;
            const hasEvent = events.find(e=>e.date===date);
            return (
              <div key={i} onClick={()=>setSelectedDate(date)} style={{padding:"12px", borderRadius:"10px", background: hasEvent?"#ffccd5":"#f9f9f9", textAlign:"center", cursor:"pointer"}}>{i+1}</div>
            )
          })}
        </div>
        {selectedDate && <div style={{marginTop:"10px"}}>
          <h4>{selectedDate}</h4>
          {events.filter(e=>e.date===selectedDate).map((e,i)=><div key={i}>{e.text}</div>)}
          <input placeholder="일정" value={eventText} onChange={e=>setEventText(e.target.value)} style={{padding:"5px", borderRadius:"10px", border:"1px solid #ddd", marginRight:"5px"}}/>
          <button onClick={()=>{
            if(!eventText) return;
            setEvents(prev=>[...prev,{text:eventText,date:selectedDate}]);
            setEventText("");
          }} style={{padding:"5px 12px", borderRadius:"10px", background:"#ff8fa3", color:"#fff", border:"none", cursor:"pointer"}}>추가</button>
        </div>}
      </div>
    </div>
  );
}

// ---------------- TasksTab ----------------
function TasksTab({ coupleId }) {
  const [tasks, setTasks] = useState([]);
  const [taskText, setTaskText] = useState("");
  const [taskCategory, setTaskCategory] = useState("");

  useEffect(()=>{
    const unsubscribe = onSnapshot(doc(db,"couples",coupleId),(snap)=>{
      if(snap.exists()){
        setTasks(snap.data().tasks || []);
      }
    });
    return () => unsubscribe();
  },[coupleId]);

  useEffect(()=>{ updateDoc(doc(db,"couples",coupleId), {tasks}); },[tasks,coupleId]);

  const addTask = () => { if(!taskText||!taskCategory) return; setTasks(prev=>[...prev,{text:taskText,category:taskCategory,done:false}]); setTaskText(""); setTaskCategory(""); };
  const toggleDone = t => setTasks(prev=>prev.map(item=>item===t?{...item,done:!item.done}:item));
  const deleteTask = t => setTasks(prev=>prev.filter(item=>item!==t));

  const grouped = tasks.reduce((acc,t)=>{ acc[t.category] = acc[t.category]||[]; acc[t.category].push(t); return acc; },{});

  return <div style={{background:"white", padding:"15px", borderRadius:"20px"}}>
    <div style={{display:"flex", gap:"5px", marginBottom:"10px"}}>
      <input placeholder="카테고리" value={taskCategory} onChange={e=>setTaskCategory(e.target.value)} style={{padding:"8px",borderRadius:"10px",border:"1px solid #ddd"}}/>
      <input placeholder="할 일 입력" value={taskText} onChange={e=>setTaskText(e.target.value)} style={{padding:"8px",borderRadius:"10px",border:"1px solid #ddd", flex:1}}/>
      <button onClick={addTask} style={{padding:"8px 15px",borderRadius:"12px",background:"#ff8fa3",color:"#fff",border:"none",cursor:"pointer"}}>➕ 추가</button>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr", gap:"10px"}}>
      {Object.entries(grouped).map(([cat,list])=><div key={cat}><b>{cat}</b>{list.map((t,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px",margin:"5px 0",borderRadius:"12px",background:"#f9f9f9",boxShadow:"0 1px 3px rgba(0,0,0,0.1)"}}><span style={{textDecoration:t.done?"line-through":"none"}}>{t.text}</span><div style={{display:"flex",gap:"5px"}}><button onClick={()=>toggleDone(t)} style={{padding:"2px 6px",borderRadius:"6px",background:t.done?"#b3ffb3":"#ffd1dc",border:"none",cursor:"pointer"}}>{t.done?"완료":"미완료"}</button><button onClick={()=>deleteTask(t)} style={{padding:"2px 6px",borderRadius:"6px",background:"#ffb3c1",border:"none",cursor:"pointer"}}>❌</button></div></div>)}</div>)}
    </div>
  </div>;
}

// ---------------- GuestsTab ----------------
function GuestsTab({ coupleId }) {
  const [guests,setGuests]=useState([]);
  const [guestText,setGuestText]=useState(""); 
  const [guestCategory,setGuestCategory]=useState("");
  const [guestParent,setGuestParent]=useState("신랑");
  const [guestSearch,setGuestSearch]=useState("");

  // Firestore 실시간 구독
  useEffect(()=>{
    const unsubscribe = onSnapshot(doc(db,"couples",coupleId),(snap)=>{
      if(snap.exists()){ 
        setGuests(snap.data().guests || []); 
      }
    });
    return () => unsubscribe();
  },[coupleId]);

  // 변경사항 저장
  useEffect(()=>{ 
    updateDoc(doc(db,"couples",coupleId), {guests}); 
  },[guests,coupleId]);

  const addGuest = () => { 
    if(!guestText||!guestCategory) return; 
    setGuests(prev=>[...prev,{name:guestText,parent:guestParent,category:guestCategory,status:"미정"}]); 
    setGuestText(""); setGuestCategory(""); setGuestParent("신랑"); 
  };

  const toggleStatus = g => {
    const nextStatus = g.status==="미정"?"확정":g.status==="확정"?"불참":"미정";
    setGuests(prev=>prev.map(item=>item===g?{...item,status:nextStatus}:item));
  };

  const deleteGuest = g => setGuests(prev=>prev.filter(item=>item!==g));

  const filteredGuests = guests.filter(g=>g.name.includes(guestSearch) || g.category.includes(guestSearch));

  return (
    <div style={{background:"white", padding:"15px", borderRadius:"20px"}}>
      <div style={{display:"flex", gap:"5px", marginBottom:"10px"}}>
        <input placeholder="이름" value={guestText} onChange={e=>setGuestText(e.target.value)} style={{padding:"8px",borderRadius:"10px",border:"1px solid #ddd"}}/>
        <input placeholder="카테고리" value={guestCategory} onChange={e=>setGuestCategory(e.target.value)} style={{padding:"8px",borderRadius:"10px",border:"1px solid #ddd"}}/>
        <select value={guestParent} onChange={e=>setGuestParent(e.target.value)} style={{padding:"8px",borderRadius:"10px",border:"1px solid #ddd"}}>
          <option>신랑</option>
          <option>신부</option>
        </select>
        <button onClick={addGuest} style={{padding:"8px 15px",borderRadius:"12px",background:"#ff8fa3",color:"#fff",border:"none",cursor:"pointer"}}>➕ 추가</button>
      </div>
      <div style={{marginBottom:"10px"}}>
        <input placeholder="검색" value={guestSearch} onChange={e=>setGuestSearch(e.target.value)} style={{padding:"8px",borderRadius:"10px",border:"1px solid #ddd", width:"100%"}}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr", gap:"10px"}}>
        {filteredGuests.map((g,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px",borderRadius:"12px",background:"#f9f9f9",boxShadow:"0 1px 3px rgba(0,0,0,0.1)"}}>
            <div>
              <b>{g.name}</b> ({g.parent}) [{g.category}] - <span style={{color:g.status==="확정"?"green":g.status==="불참"?"red":"black"}}>{g.status}</span>
            </div>
            <div style={{display:"flex",gap:"5px"}}>
              <button onClick={()=>toggleStatus(g)} style={{padding:"2px 6px",borderRadius:"6px",background:"#ffd1dc",border:"none",cursor:"pointer"}}>상태</button>
              <button onClick={()=>deleteGuest(g)} style={{padding:"2px 6px",borderRadius:"6px",background:"#ff8fa3",border:"none",cursor:"pointer",color:"white"}}>❌</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- BudgetTab ----------------
function BudgetTab({ coupleId }) {
  const [budgetItems,setBudgetItems]=useState([]);
  const [itemText,setItemText]=useState("");
  const [itemCost,setItemCost]=useState("");

  useEffect(()=>{
    const unsubscribe = onSnapshot(doc(db,"couples",coupleId),(snap)=>{
      if(snap.exists()){ 
        setBudgetItems(snap.data().budgetItems || []); 
      }
    });
    return () => unsubscribe();
  },[coupleId]);

  useEffect(()=>{ updateDoc(doc(db,"couples",coupleId), {budgetItems}); },[budgetItems,coupleId]);

  const addItem = () => { 
    if(!itemText||!itemCost) return; 
    setBudgetItems(prev=>[...prev,{name:itemText,cost:Number(itemCost)}]); 
    setItemText(""); setItemCost(""); 
  };
  const deleteItem = i => setBudgetItems(prev=>prev.filter((_,idx)=>idx!==i));

  const total = budgetItems.reduce((sum,it)=>sum+it.cost,0);

  return (
    <div style={{background:"white", padding:"15px", borderRadius:"20px"}}>
      <div style={{display:"flex", gap:"5px", marginBottom:"10px"}}>
        <input placeholder="항목" value={itemText} onChange={e=>setItemText(e.target.value)} style={{padding:"8px",borderRadius:"10px",border:"1px solid #ddd"}}/>
        <input placeholder="금액" value={itemCost} onChange={e=>setItemCost(e.target.value)} style={{padding:"8px",borderRadius:"10px",border:"1px solid #ddd"}}/>
        <button onClick={addItem} style={{padding:"8px 15px",borderRadius:"12px",background:"#ff8fa3",color:"#fff",border:"none",cursor:"pointer"}}>➕ 추가</button>
      </div>
      <div style={{display:"flex", flexDirection:"column", gap:"5px"}}>
        {budgetItems.map((b,i)=><div key={i} style={{display:"flex", justifyContent:"space-between", padding:"8px", borderRadius:"10px", background:"#f9f9f9"}}>{b.name} - {b.cost.toLocaleString()}원 <button onClick={()=>deleteItem(i)} style={{border:"none", background:"#ff8fa3", color:"#fff", borderRadius:"6px", cursor:"pointer"}}>❌</button></div>)}
      </div>
      <div style={{marginTop:"10px", fontWeight:"bold"}}>총 합계: {total.toLocaleString()}원</div>
    </div>
  );
}