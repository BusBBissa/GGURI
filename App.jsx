import React, { useState, useEffect } from "react"; import { initializeApp } from "firebase/app"; import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth"; import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = { apiKey: "AIzaSyBzMM4swUjS08WjOqSF7RmfaHOsfVc8gSg", authDomain: "gguri-e94ae.firebaseapp.com", projectId: "gguri-e94ae", };

const app = initializeApp(firebaseConfig); const auth = getAuth(app); const db = getFirestore(app); const provider = new GoogleAuthProvider();

export default function App() { const [user, setUser] = useState(null); const [coupleId, setCoupleId] = useState(""); const [inputCoupleId, setInputCoupleId] = useState("");

const [tab, setTab] = useState("home"); const [images, setImages] = useState([]);

const [tasks, setTasks] = useState([]); const [taskText, setTaskText] = useState(""); const [category, setCategory] = useState("스드메");

const [events, setEvents] = useState([]); const [eventText, setEventText] = useState(""); const [eventDate, setEventDate] = useState(""); const [selectedDate, setSelectedDate] = useState("");

const [budgetItems, setBudgetItems] = useState([]); const [budgetName, setBudgetName] = useState(""); const [budgetCost, setBudgetCost] = useState("");

const [guests, setGuests] = useState([]); const [guestName, setGuestName] = useState("");

const [weddingDate, setWeddingDate] = useState(""); const [monthOffset, setMonthOffset] = useState(0);

useEffect(() => { onAuthStateChanged(auth, (u) => u && setUser(u)); }, []);

useEffect(() => { if (!coupleId) return; const load = async () => { const snap = await getDoc(doc(db, "couples", coupleId)); if (snap.exists()) { const d = snap.data(); setImages(d.images || []); setTasks(d.tasks || []); setEvents(d.events || []); setBudgetItems(d.budgetItems || []); setGuests(d.guests || []); setWeddingDate(d.weddingDate || ""); } }; load(); }, [coupleId]);

useEffect(() => { if (!coupleId) return; setDoc(doc(db, "couples", coupleId), { images, tasks, events, budgetItems, guests, weddingDate }); }, [images, tasks, events, budgetItems, guests, weddingDate, coupleId]);

const login = () => signInWithPopup(auth, provider); const logout = () => signOut(auth);

const createCouple = () => { const id = Math.random().toString(36).slice(2, 8); setCoupleId(id); navigator.clipboard.writeText(id); alert("초대 코드: " + id); };

const joinCouple = () => setCoupleId(inputCoupleId);

const baseDate = new Date(); baseDate.setMonth(baseDate.getMonth() + monthOffset); const year = baseDate.getFullYear(); const month = baseDate.getMonth(); const daysInMonth = new Date(year, month + 1, 0).getDate();

const dday = weddingDate ? Math.ceil((new Date(weddingDate) - new Date())/(10006060*24)) : null; const totalBudget = budgetItems.reduce((a,b)=>a + b.cost,0);

if (!user) { return ( <div style={{ height:"100vh", display:"flex", justifyContent:"center", alignItems:"center", background:"linear-gradient(135deg,#fce3ec,#ffe8d6)" }}> <div style={{ textAlign:"center" }}> <h1 style={{ fontSize:"40px" }}>💍 Wedding</h1> <button onClick={login}>Google 로그인</button> </div> </div> ); }

if (!coupleId) { return ( <div style={{ height:"100vh", display:"flex", justifyContent:"center", alignItems:"center" }}> <div> <button onClick={createCouple}>커플 생성</button> <input onChange={(e)=>setInputCoupleId(e.target.value)} /> <button onClick={joinCouple}>입장</button> </div> </div> ); }

return ( <div style={{ minHeight:"100vh", background:"linear-gradient(#fff,#fce3ec)", padding:"20px" }}>

{/* 탭 */}
  <div style={{ display:"flex", gap:"10px", marginBottom:"20px" }}>
    {["home","tasks"].map(t=>(
      <button key={t} onClick={()=>setTab(t)} style={{ flex:1, padding:"12px", borderRadius:"20px", border:"none", background:tab===t?"#ff8fa3":"white" }}>
        {t === "home" ? "홈" : "할일"}
      </button>
    ))}
  </div>

  {tab === "home" && (
    <div>
      {images[0] && <img src={images[0]} style={{ width:"100%", borderRadius:"20px" }} />}
      <label style={{ display:"block", textAlign:"center", margin:"10px" }}>
        사진 변경
        <input type="file" style={{ display:"none" }} onChange={(e)=>{
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = ()=> setImages([reader.result]);
          reader.readAsDataURL(file);
        }} />
      </label>

      <div style={{ background:"white", padding:"20px", borderRadius:"20px", textAlign:"center", marginBottom:"20px" }}>
        <h2>D-{dday ?? "?"}</h2>
        <input type="date" onChange={(e)=>setWeddingDate(e.target.value)} />
      </div>

      <div style={{ background:"white", padding:"20px", borderRadius:"20px" }}>
        <div style={{ display:"flex", justifyContent:"space-between" }}>
          <button onClick={()=>setMonthOffset(monthOffset-1)}>◀</button>
          <h3>{year}년 {month+1}월</h3>
          <button onClick={()=>setMonthOffset(monthOffset+1)}>▶</button>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"5px" }}>
          {[...Array(daysInMonth)].map((_,i)=>{
            const date = `${year}-${String(month+1).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`;
            const hasEvent = events.find(e=>e.date===date);
            return (
              <div key={i} onClick={()=>setSelectedDate(date)} style={{ padding:"12px", borderRadius:"10px", background:hasEvent?"#ffccd5":"#f9f9f9" }}>
                {i+1}
              </div>
            );
          })}
        </div>

        {selectedDate && (
          <div style={{ marginTop:"10px" }}>
            <h4>{selectedDate}</h4>
            {events.filter(e=>e.date===selectedDate).map((e,i)=>(
              <div key={i}>{e.text}</div>
            ))}
          </div>
        )}

        <input placeholder="일정" onChange={(e)=>setEventText(e.target.value)} />
        <input type="date" onChange={(e)=>setEventDate(e.target.value)} />
        <button onClick={()=>setEvents([...events,{text:eventText,date:eventDate}])}>추가</button>
      </div>
    </div>
  )}

  {tab === "tasks" && (
    <div>
      <div style={{ background:"white", padding:"10px", borderRadius:"10px", marginBottom:"10px" }}>
        💰 총 예산: {totalBudget}
        <div>
          <input placeholder="항목" onChange={(e)=>setBudgetName(e.target.value)} />
          <input placeholder="금액" type="number" onChange={(e)=>setBudgetCost(e.target.value)} />
          <button onClick={()=>setBudgetItems([...budgetItems,{name:budgetName,cost:+budgetCost}])}>추가</button>
        </div>
      </div>

      <div style={{ background:"white", padding:"10px", borderRadius:"10px", marginBottom:"10px" }}>
        👥 하객 ({guests.length})
        <input placeholder="이름" onChange={(e)=>setGuestName(e.target.value)} />
        <button onClick={()=>setGuests([...guests,guestName])}>추가</button>
        {guests.map((g,i)=>(<div key={i}>{g}</div>))}
      </div>

      <select onChange={(e)=>setCategory(e.target.value)}>
        <option>스드메</option>
        <option>웨딩홀</option>
        <option>신혼여행</option>
        <option>예물</option>
        <option>혼수</option>
      </select>

      <input value={taskText} onChange={(e)=>setTaskText(e.target.value)} placeholder="할 일 입력" />
      <button onClick={()=>{
        setTasks([...tasks,{text:taskText,done:false,category}]);
        setTaskText("");
      }}>추가</button>

      {tasks.map((t,i)=>(
        <div key={i} style={{ marginTop:"10px", background:"white", padding:"10px", borderRadius:"10px" }}>
          <b>[{t.category}]</b> {t.text}
          <div>
            <button onClick={()=>{
              let x=[...tasks];x[i].done=!x[i].done;setTasks(x);
            }}>{t.done?"완료":"미완료"}</button>
            <button onClick={()=>setTasks(tasks.filter((_,idx)=>idx!==i))}>삭제</button>
          </div>
        </div>
      ))}
    </div>
  )}

  <button onClick={createCouple} style={{ position:"fixed", bottom:"20px", right:"20px", background:"#ff8fa3", color:"white", border:"none", padding:"16px", borderRadius:"50%" }}>
    +
  </button>

</div>

); }