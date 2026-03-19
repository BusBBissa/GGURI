import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBzMM4swUjS08WjOqSF7RmfaHOsfVc8gSg",
  authDomain: "gguri-e94ae.firebaseapp.com",
  projectId: "gguri-e94ae",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export default function App() {
  const [user, setUser] = useState(null);
  const [coupleId, setCoupleId] = useState("");
  const [inputCoupleId, setInputCoupleId] = useState("");

  const [tab, setTab] = useState("home");

  // 홈
  const [images, setImages] = useState([]);
  const [weddingDate, setWeddingDate] = useState("");
  const [dday, setDday] = useState(null);

  // 달력
  const [events, setEvents] = useState([]);
  const [eventText, setEventText] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [monthOffset, setMonthOffset] = useState(0);

  // 하객
  const [guestTab, setGuestTab] = useState("신랑");
  const [guests, setGuests] = useState([]);
  const [guestName, setGuestName] = useState("");
  const [guestCategory, setGuestCategory] = useState("고등학교");

  // 할일
  const [tasks, setTasks] = useState([]);
  const [taskText, setTaskText] = useState("");
  const [taskCategory, setTaskCategory] = useState("스드메");

  // 예산
  const [budgetItems, setBudgetItems] = useState([]);
  const [budgetName, setBudgetName] = useState("");
  const [budgetCost, setBudgetCost] = useState("");

  useEffect(() => {
    onAuthStateChanged(auth, (u) => u && setUser(u));
  }, []);

  useEffect(() => {
    if (!coupleId) return;
    const load = async () => {
      const snap = await getDoc(doc(db, "couples", coupleId));
      if (snap.exists()) {
        const d = snap.data();
        setImages(d.images || []);
        setWeddingDate(d.weddingDate || "");
        setTasks(d.tasks || []);
        setEvents(d.events || []);
        setGuests(d.guests || []);
        setBudgetItems(d.budgetItems || []);
      }
    };
    load();
  }, [coupleId]);

  useEffect(() => {
    if (!coupleId) return;
    setDoc(doc(db, "couples", coupleId), { images, weddingDate, tasks, events, guests, budgetItems });
  }, [images, weddingDate, tasks, events, guests, budgetItems, coupleId]);

  // D-day 계산
  useEffect(() => {
    if (!weddingDate) return;
    const diff = Math.ceil((new Date(weddingDate) - new Date()) / (1000*60*60*24));
    setDday(diff);
  }, [weddingDate]);

  const login = () => signInWithPopup(auth, provider);

  const createCouple = () => {
    const id = Math.random().toString(36).slice(2, 8);
    setCoupleId(id);
    navigator.clipboard.writeText(id);
    alert("초대 코드 복사됨: " + id);
  };

  const joinCouple = () => setCoupleId(inputCoupleId);

  // 달력 기본
  const baseDate = new Date();
  baseDate.setMonth(baseDate.getMonth() + monthOffset);
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const totalBudget = budgetItems.reduce((a,b)=>a+b.cost,0);

  if (!user) {
    return (
      <div style={{ height:"100vh", display:"flex", justifyContent:"center", alignItems:"center", background:"linear-gradient(135deg,#fce3ec,#ffe8d6)" }}>
        <div style={{ textAlign:"center" }}>
          <h1 style={{ fontSize:"40px" }}>💍 Wedding</h1>
          <button onClick={login}>Google 로그인</button>
        </div>
      </div>
    );
  }

  if (!coupleId) {
    return (
      <div style={{ height:"100vh", display:"flex", justifyContent:"center", alignItems:"center" }}>
        <div style={{ textAlign:"center" }}>
          <button onClick={createCouple}>커플 생성</button>
          <input onChange={(e)=>setInputCoupleId(e.target.value)} placeholder="코드 입력"/>
          <button onClick={joinCouple}>입장</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:"#fff0f5", padding:"15px" }}>
      {/* 탭 */}
      <div style={{ display:"flex", gap:"10px", marginBottom:"20px" }}>
        {["home","guests","tasks","budget"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{ flex:1, padding:"12px", borderRadius:"20px", border:"none", background:tab===t?"#ff8fa3":"#fff" }}>
            {t==="home"?"홈":t==="guests"?"하객":t==="tasks"?"할일":"예산"}
          </button>
        ))}
      </div>

      {tab === "home" && (
        <div>
          {images[0] && <img src={images[0]} style={{ width:"100%", borderRadius:"20px", marginBottom:"10px" }} />}
          <label style={{ display:"block", textAlign:"center", marginBottom:"20px" }}>
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
            <input type="date" value={weddingDate} onChange={(e)=>setWeddingDate(e.target.value)} />
          </div>

          <div style={{ background:"white", padding:"15px", borderRadius:"20px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"10px" }}>
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

            <input placeholder="일정" value={eventText} onChange={(e)=>setEventText(e.target.value)} />
            <input type="date" value={eventDate} onChange={(e)=>setEventDate(e.target.value)} />
            <button onClick={()=>setEvents([...events,{text:eventText,date:eventDate}])}>추가</button>
          </div>
        </div>
      )}

      {tab === "guests" && (
        <div>
          {/* 상위 탭: 신랑 / 신부 */}
          <div style={{ display:"flex", gap:"10px", marginBottom:"10px" }}>
            {["신랑","신부"].map(t=>(
              <button key={t} onClick={()=>setGuestTab(t)} style={{ flex:1, padding:"8px", borderRadius:"15px", border:"none", background:guestTab===t?"#ff8fa3":"#fff" }}>{t}</button>
            ))}
          </div>

          <input placeholder="카테고리" value={guestCategory} onChange={(e)=>setGuestCategory(e.target.value)} />
          <input placeholder="이름" value={guestName} onChange={(e)=>setGuestName(e.target.value)} />
          <button onClick={()=>{
            setGuests([...guests,{tab:guestTab,category:guestCategory,name:guestName}]);
            setGuestName("");
          }}>추가</button>

          <div style={{ marginTop:"10px" }}>
            {["신랑","신부"].map(t=>(
              <div key={t} style={{ marginBottom:"10px" }}>
                <h4>{t}</h4>
                {guests.filter(g=>g.tab===t).reduce((acc,g)=>{
                  acc[g.category] = acc[g.category] || [];
                  acc[g.category].push(g);
                  return acc;
                },{}).entries && Object.entries(guests.filter(g=>g.tab===t).reduce((acc,g)=>{
                  acc[g.category] = acc[g.category] || [];
                  acc[g.category].push(g);
                  return acc;
                },{})).map(([cat,list])=>(
                  <div key={cat} style={{ marginBottom:"5px" }}>
                    <b>{cat}</b>
                    {list.map((g,i)=>(
                      <div key={i}>{g.name}</div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "tasks" && (
        <div>
          <select value={taskCategory} onChange={(e)=>setTaskCategory(e.target.value)}>
            <option>스드메</option>
            <option>웨딩홀</option>
            <option>신혼여행</option>
            <option>예물</option>
            <option>혼수</option>
          </select>
          <input value={taskText} onChange={(e)=>setTaskText(e.target.value)} placeholder="할 일 입력" />
          <button onClick={()=>{
            setTasks([...tasks,{text:taskText,category:taskCategory,done:false}]);
            setTaskText("");
          }}>추가</button>

          <div>
            {Object.entries(
              tasks.reduce((acc,t)=>{
                acc[t.category] = acc[t.category] || [];
                acc[t.category].push(t);
                return acc;
              },{})
            ).map(([cat,list])=>(
              <div key={cat} style={{ marginTop:"10px", background:"#fff", padding:"10px", borderRadius:"15px" }}>
                <b>📂 {cat}</b>
                {list.map((t,i)=>(
                  <div key={i} style={{ display:"flex", justifyContent:"space-between" }}>
                    <span>{t.text}</span>
                    <button onClick={()=>{let x=[...tasks];x[i].done=!x[i].done;setTasks(x);}}>{t.done?"완료":"미완료"}</button>
                    <button onClick={()=>setTasks(tasks.filter((_,idx)=>idx!==i))}>삭제</button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "budget" && (
        <div>
          <div style={{ background:"#fff", padding:"15px", borderRadius:"15px" }}>
            <h3>💰 총 예산: {totalBudget}원</h3>
            <input placeholder="항목" value={budgetName} onChange={(e)=>setBudgetName(e.target.value)} />
            <input placeholder="금액" type="number" value={budgetCost} onChange={(e)=>setBudgetCost(e.target.value)} />
            <button onClick={()=>setBudgetItems([...budgetItems,{name:budgetName,cost:+budgetCost}])}>추가</button>

            <div style={{ marginTop:"10px" }}>
              {budgetItems.map((b,i)=>(
                <div key={i}>{b.name} - {b.cost}원</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 커플 코드 버튼 */}
      <button onClick={createCouple} style={{ position:"fixed", bottom:"20px", right:"20px", background:"#ff8fa3", color:"#fff", border:"none", padding:"16px", borderRadius:"50%" }}>
        +
      </button>

    </div>
  );
}