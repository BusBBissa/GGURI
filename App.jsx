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
  const [currentImage, setCurrentImage] = useState(0);
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

  // 데이터 로드
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

  // 사진 슬라이드 자동
  useEffect(() => {
    if(images.length<2) return;
    const interval = setInterval(()=>{
      setCurrentImage((prev)=>(prev+1)%images.length);
    }, 3000);
    return ()=>clearInterval(interval);
  }, [images]);

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
          <button onClick={login} style={{ padding:"12px 20px", borderRadius:"20px", background:"#ff8fa3", color:"#fff", border:"none"}}>Google 로그인</button>
        </div>
      </div>
    );
  }

  if (!coupleId) {
    return (
      <div style={{ height:"100vh", display:"flex", justifyContent:"center", alignItems:"center" }}>
        <div style={{ textAlign:"center" }}>
          <button onClick={createCouple} style={{ margin:"5px", padding:"10px 15px"}}>커플 생성</button>
          <input onChange={(e)=>setInputCoupleId(e.target.value)} placeholder="코드 입력"/>
          <button onClick={joinCouple} style={{ margin:"5px", padding:"10px 15px"}}>입장</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:"#fff0f5", padding:"15px", fontFamily:"sans-serif" }}>
      {/* 탭 */}
      <div style={{ display:"flex", gap:"10px", marginBottom:"20px" }}>
        {["home","guests","tasks","budget"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{ flex:1, padding:"12px", borderRadius:"20px", border:"none", background:tab===t?"#ff8fa3":"#fff" }}>
            {t==="home"?"홈":t==="guests"?"하객":t==="tasks"?"할일":"예산"}
          </button>
        ))}
      </div>

      {/* 홈 */}
      {tab==="home" && (
        <div>
          {/* 사진 슬라이드 */}
          {images.length>0 && (
            <div style={{ position:"relative", marginBottom:"10px", borderRadius:"20px", overflow:"hidden" }}>
              <img src={images[currentImage]} style={{ width:"100%", height:"300px", objectFit:"cover" }} />
              <div style={{ display:"flex", gap:"5px", position:"absolute", bottom:"10px", left:"50%", transform:"translateX(-50%)" }}>
                {images.map((img,i)=>(
                  <img key={i} src={img} onClick={()=>setCurrentImage(i)}
                    style={{ width:"40px", height:"40px", objectFit:"cover", borderRadius:"10px", border: currentImage===i?"2px solid #ff8fa3":"1px solid #fff", cursor:"pointer" }}/>
                ))}
              </div>
            </div>
          )}
          <label style={{ display:"block", textAlign:"center", marginBottom:"20px", cursor:"pointer" }}>
            사진 업로드
            <input type="file" style={{ display:"none" }} onChange={(e)=>{
              const file = e.target.files[0];
              const reader = new FileReader();
              reader.onload = ()=> setImages([...images, reader.result]);
              reader.readAsDataURL(file);
            }} />
          </label>

          {/* D-day 카드 */}
          <div style={{ background:"#fff", borderRadius:"25px", padding:"20px", textAlign:"center", marginBottom:"20px", boxShadow:"0 5px 20px rgba(0,0,0,0.1)" }}>
            <h2 style={{ fontSize:"24px", marginBottom:"10px" }}>💖 Wedding D-Day</h2>
            <input type="date" value={weddingDate} onChange={(e)=>setWeddingDate(e.target.value)} style={{ padding:"10px", borderRadius:"15px", border:"1px solid #ddd", marginBottom:"10px" }} />
            <div style={{ fontSize:"28px", fontWeight:"bold", color:"#ff8fa3" }}>{dday!=null?`D-${dday}`:"?"}</div>
          </div>

          {/* 달력 */}
          <div style={{ background:"#fff", padding:"15px", borderRadius:"20px", boxShadow:"0 5px 15px rgba(0,0,0,0.05)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"10px" }}>
              <button onClick={()=>setMonthOffset(monthOffset-1)} style={{ padding:"6px 12px", borderRadius:"12px", background:"#ffb6c1", border:"none", color:"#fff" }}>◀ 이전</button>
              <h3>{year}년 {month+1}월</h3>
              <button onClick={()=>setMonthOffset(monthOffset+1)} style={{ padding:"6px 12px", borderRadius:"12px", background:"#ffb6c1", border:"none", color:"#fff" }}>다음 ▶</button>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"5px" }}>
              {[...Array(daysInMonth)].map((_,i)=>{
                const date = `${year}-${String(month+1).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`;
                const hasEvent = events.find(e=>e.date===date);
                return (
                  <div key={i} onClick={()=>setSelectedDate(date)} style={{ padding:"12px", borderRadius:"10px", background:hasEvent?"#ffccd5":"#f9f9f9", textAlign:"center", cursor:"pointer" }}>
                    {i+1}
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop:"10px", display:"flex", gap:"5px" }}>
              <input placeholder="일정 추가" value={eventText} onChange={(e)=>setEventText(e.target.value)} style={{ flex:1, padding:"8px", borderRadius:"12px", border:"1px solid #ddd" }} />
              <input type="date" value={eventDate} onChange={(e)=>setEventDate(e.target.value)} style={{ padding:"8px", borderRadius:"12px", border:"1px solid #ddd" }} />
              <button onClick={()=>setEvents([...events,{text:eventText,date:eventDate}])} style={{ padding:"8px 12px", borderRadius:"12px", border:"none", background:"#ff8fa3", color:"#fff" }}>추가</button>
            </div>

            {selectedDate && (
              <div style={{ marginTop:"10px", textAlign:"center", color:"#ff8fa3", fontWeight:"bold" }}>
                {selectedDate} 일정:
                {events.filter(e=>e.date===selectedDate).map((e,i)=>(
                  <div key={i}>{e.text}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 하객 */}
      {tab==="guests" && (
        <div>
          <div style={{ display:"flex", gap:"10px", marginBottom:"10px" }}>
            {["신랑","신부"].map(t=>(
              <button key={t} onClick={()=>setGuestTab(t)} style={{ flex:1, padding:"8px", borderRadius:"15px", border:"none", background:guestTab===t?"#ff8fa3":"#fff" }}>{t}</button>
            ))}
          </div>

          <div style={{ display:"flex", gap:"5px", marginBottom:"10px" }}>
            <input placeholder="카테고리" value={guestCategory} onChange={(e)=>setGuestCategory(e.target.value)} style={{ flex:1, padding:"8px", borderRadius:"12px", border:"1px solid #ddd" }} />
            <input placeholder="이름" value={guestName} onChange={(e)=>setGuestName(e.target.value)} style={{ flex:1, padding:"8px", borderRadius:"12px", border:"1px solid #ddd" }} />
            <button onClick={()=>{setGuests([...guests,{tab:guestTab,category:guestCategory,name:guestName}]); setGuestName("");}} style={{ padding:"8px 12px", borderRadius:"12px", border:"none", background:"#ff8fa3", color:"#fff" }}>추가</button>
          </div>

          <div>
            {["신랑","신부"].map(t=>(
              <div key={t} style={{ marginBottom:"10px" }}>
                <h4>{t}</h4>
                {Object.entries(guests.filter(g=>g.tab===t).reduce((acc,g)=>{acc[g.category] = acc[g.category]||[]; acc[g.category].push(g); return acc;},{})).map(([cat,list])=>(
                  <div key={cat} style={{ marginBottom:"5px" }}>
                    <b>{cat}</b>
                    {list.map((g,i)=>(<div key={i}>{g.name}</div>))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 할일 */}
      {tab==="tasks" && (
        <div>
          <div style={{ display:"flex", gap:"5px", marginBottom:"10px" }}>
            <select value={taskCategory} onChange={(e)=>setTaskCategory(e.target.value)} style={{ padding:"8px", borderRadius:"12px", border:"1px solid #ddd" }}>
              <option>스드메</option>
              <option>웨딩홀</option>
              <option>신혼여행</option>
              <option>예물</option>
              <option>혼수</option>
            </select>
            <input value={taskText} onChange={(e)=>setTaskText(e.target.value)} placeholder="할 일 입력" style={{ flex:1, padding:"8px", borderRadius:"12px", border:"1px solid #ddd" }} />
            <button onClick={()=>{setTasks([...tasks,{text:taskText,category:taskCategory,done:false}]); setTaskText("");}} style={{ padding:"8px 12px", borderRadius:"12px", border:"none", background:"#ff8fa3", color:"#fff" }}>추가</button>
          </div>

          {Object.entries(tasks.reduce((acc,t)=>{acc[t.category]=acc[t.category]||[]; acc[t.category].push(t); return acc;},{})).map(([cat,list])=>(
            <div key={cat} style={{ background:"#fff", padding:"10px", borderRadius:"15px", marginBottom:"10px" }}>
              <b>📂 {cat}</b>
              {list.map((t,i)=>(
                <div key={i} style={{ display:"flex", justifyContent:"space-between", marginTop:"5px" }}>
                  <span style={{ textDecoration:t.done?"line-through":"" }}>{t.text}</span>
                  <div>
                    <button onClick={()=>{let x=[...tasks];x[i].done=!x[i].done; setTasks(x);}} style={{ marginRight:"5px"}}>{t.done?"완료":"미완료"}</button>
                    <button onClick={()=>setTasks(tasks.filter((_,idx)=>idx!==i))}>삭제</button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* 예산 */}
      {tab==="budget" && (
        <div>
          <div style={{ background:"#fff", padding:"15px", borderRadius:"15px" }}>
            <h3>💰 총 예산: {totalBudget}원</h3>
            <div style={{ display:"flex", gap:"5px", marginBottom:"10px" }}>
              <input placeholder="항목" value={budgetName} onChange={(e)=>setBudgetName(e.target.value)} style={{ flex:1, padding:"8px", borderRadius:"12px", border:"1px solid #ddd" }} />
              <input placeholder="금액" type="number" value={budgetCost} onChange={(e)=>setBudgetCost(e.target.value)} style={{ flex:1, padding:"8px", borderRadius:"12px", border:"1px solid #ddd" }} />
              <button onClick={()=>setBudgetItems([...budgetItems,{name:budgetName,cost:+budgetCost}])} style={{ padding:"8px 12px", borderRadius:"12px", border:"none", background:"#ff8fa3", color:"#fff" }}>추가</button>
            </div>
            {budgetItems.map((b,i)=>(
              <div key={i}>{b.name} - {b.cost}원</div>
            ))}
          </div>
        </div>
      )}

      <button onClick={createCouple} style={{ position:"fixed", bottom:"20px", right:"20px", background:"#ff8fa3", color:"#fff",