import React, { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
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

  // 사진 + 슬라이드
  const [images, setImages] = useState([]);
  const slideRef = useRef(null);
  const [slideIndex, setSlideIndex] = useState(0);

  // D-day
  const [weddingDate, setWeddingDate] = useState("");

  // 달력
  const [events, setEvents] = useState([]);
  const [eventText, setEventText] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState("");

  // 할일
  const [tasks, setTasks] = useState([]);
  const [taskText, setTaskText] = useState("");
  const [category, setCategory] = useState("스드메");

  // 예산
  const [budgetItems, setBudgetItems] = useState([]);
  const [budgetName, setBudgetName] = useState("");
  const [budgetCost, setBudgetCost] = useState("");

  // 하객
  const [guests, setGuests] = useState([]);
  const [guestName, setGuestName] = useState("");

  useEffect(() => {
    onAuthStateChanged(auth, (u) => u && setUser(u));
  }, []);

  // 데이터 불러오기
  useEffect(() => {
    if (!coupleId) return;
    const load = async () => {
      const snap = await getDoc(doc(db, "couples", coupleId));
      if (snap.exists()) {
        const d = snap.data();
        setImages(d.images || []);
        setTasks(d.tasks || []);
        setEvents(d.events || []);
        setBudgetItems(d.budgetItems || []);
        setGuests(d.guests || []);
        setWeddingDate(d.weddingDate || "");
      }
    };
    load();
  }, [coupleId]);

  // 데이터 저장
  useEffect(() => {
    if (!coupleId) return;
    setDoc(doc(db, "couples", coupleId), { images, tasks, events, budgetItems, guests, weddingDate });
  }, [images, tasks, events, budgetItems, guests, weddingDate, coupleId]);

  // 사진 슬라이드 자동
  useEffect(() => {
    if (!images.length) return;
    const interval = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images]);

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  const createCouple = () => {
    const id = Math.random().toString(36).slice(2, 8);
    setCoupleId(id);
    navigator.clipboard.writeText(id);
    alert("초대 코드: " + id);
  };

  const joinCouple = () => setCoupleId(inputCoupleId);

  const baseDate = new Date();
  baseDate.setMonth(baseDate.getMonth() + monthOffset);
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dday = weddingDate ? Math.ceil((new Date(weddingDate) - new Date())/(1000*60*60*24)) : null;
  const totalBudget = budgetItems.reduce((a,b)=>a + b.cost,0);

  // 로그인 전 화면
  if (!user) {
    return (
      <div style={{ height:"100vh", display:"flex", justifyContent:"center", alignItems:"center", background:"linear-gradient(135deg,#fce3ec,#ffe8d6)" }}>
        <div style={{ textAlign:"center" }}>
          <h1 style={{ fontSize:"50px" }}>💍 Wedding App</h1>
          <button onClick={login} style={{ padding:"12px 25px", fontSize:"18px", borderRadius:"10px", background:"#ff8fa3", border:"none", color:"white" }}>Google 로그인</button>
        </div>
      </div>
    );
  }

  // 커플 코드 생성/입장
  if (!coupleId) {
    return (
      <div style={{ height:"100vh", display:"flex", justifyContent:"center", alignItems:"center", flexDirection:"column" }}>
        <button onClick={createCouple} style={{ padding:"12px 25px", marginBottom:"10px", borderRadius:"10px", background:"#ff8fa3", color:"#fff", border:"none" }}>커플 생성</button>
        <div>
          <input placeholder="초대 코드 입력" onChange={(e)=>setInputCoupleId(e.target.value)} style={{ padding:"8px 12px", marginRight:"10px", borderRadius:"6px", border:"1px solid #ccc" }}/>
          <button onClick={joinCouple} style={{ padding:"8px 15px", borderRadius:"6px", background:"#f497c1", color:"#fff", border:"none" }}>입장</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:"#fff3f6", padding:"20px", fontFamily:"sans-serif" }}>
      {/* 탭 */}
      <div style={{ display:"flex", gap:"10px", marginBottom:"20px" }}>
        {["home","tasks"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{
            flex:1, padding:"12px", borderRadius:"20px", border:"none",
            background:tab===t?"#ff8fa3":"#fff", color: tab===t?"#fff":"#000", fontWeight:"bold"
          }}>
            {t==="home"?"홈":"할일"}
          </button>
        ))}
        <button onClick={logout} style={{ padding:"12px", borderRadius:"20px", background:"#ccc", color:"#fff", border:"none" }}>로그아웃</button>
      </div>

      {tab==="home" && (
        <div>
          {/* 사진 슬라이드 */}
          <div style={{ position:"relative", borderRadius:"20px", overflow:"hidden", marginBottom:"20px" }}>
            {images[slideIndex] && <img src={images[slideIndex]} style={{ width:"100%", height:"250px", objectFit:"cover" }}/>}
            <div style={{ display:"flex", gap:"5px", overflowX:"auto", position:"absolute", bottom:"10px", left:"50%", transform:"translateX(-50%)" }}>
              {images.map((img,i)=>(
                <img key={i} src={img} style={{
                  width:"50px", height:"50px", objectFit:"cover", borderRadius:"10px",
                  border:i===slideIndex?"2px solid #ff8fa3":"2px solid #fff", cursor:"pointer"
                }} onClick={()=>setSlideIndex(i)}/>
              ))}
            </div>
            <label style={{ position:"absolute", top:"10px", right:"10px", background:"#ff8fa3", padding:"6px 10px", borderRadius:"10px", color:"#fff", cursor:"pointer" }}>
              사진 추가
              <input type="file" style={{ display:"none" }} onChange={(e)=>{
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = ()=> setImages([...images,reader.result]);
                reader.readAsDataURL(file);
              }}/>
            </label>
          </div>

          {/* D-day */}
          <div style={{ background:"#fff", padding:"20px", borderRadius:"20px", textAlign:"center", marginBottom:"20px" }}>
            <h2>D-{dday ?? "?"}</h2>
            <input type="date" onChange={(e)=>setWeddingDate(e.target.value)} style={{ padding:"8px 12px", borderRadius:"10px", border:"1px solid #ccc", fontSize:"16px" }}/>
          </div>

          {/* 달력 */}
          <div style={{ background:"#fff", padding:"15px", borderRadius:"20px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
              <button onClick={()=>setMonthOffset(monthOffset-1)} style={{ border:"none", background:"#ff8fa3", color:"#fff", padding:"6px 12px", borderRadius:"10px" }}>◀</button>
              <h3>{year}년 {month+1}월</h3>
              <button onClick={()=>setMonthOffset(monthOffset+1)} style={{ border:"none", background:"#ff8fa3", color:"#fff", padding:"6px 12px", borderRadius:"10px" }}>▶</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"5px" }}>
              {[...Array(daysInMonth)].map((_,i)=>{
                const date = `${year}-${String(month+1).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`;
                const hasEvent = events.find(e=>e.date===date);
                return (
                  <div key={i} onClick={()=>setSelectedDate(date)} style={{
                    padding:"12px", borderRadius:"10px",
                    background: hasEvent?"#ffccd5":"#f9f9f9",
                    textAlign:"center",
                    cursor:"pointer"
                  }}>
                    {i+1}
                  </div>
                );
              })}
            </div>
            {selectedDate && (
              <div style={{ marginTop:"10px" }}>
                <h4>{selectedDate}</h4>
                {events.filter(e=>e.date===selectedDate).map((e,i)=>(<div key={i}>{e.text}</div>))}
                <input placeholder="일정" onChange={(e)=>setEventText(e.target.value)} style={{ padding:"6px 10px", borderRadius:"8px", border:"1px solid #ccc", marginTop:"5px" }}/>
                <input type="date" onChange={(e)=>setEventDate(e.target.value)} style={{ padding:"6px 10px", borderRadius:"8px", border:"1px solid #ccc", marginTop:"5px", marginLeft:"5px" }}/>
                <button onClick={()=>setEvents([...events,{text:eventText,date:eventDate}])} style={{ padding:"6px 12px", marginLeft:"5px", borderRadius:"8px", border:"none", background:"#ff8fa3", color:"#fff" }}>추가</button>
              </div>
            )}
          </div>
        </div>
      )}

      {tab==="tasks" && (
        <div>
          {/* 예산 */}
          <div style={{ background:"#fff", padding:"15px", borderRadius:"20px", marginBottom:"15px" }}>
            <h3>💰 예산</h3>
            <h2>{totalBudget}원</h2>
            <input placeholder="항목" onChange={(e)=>setBudgetName(e.target.value)} style={{ padding:"6px 10px", borderRadius:"8px", border:"1px solid #ccc", marginRight:"5px" }}/>
            <input placeholder="금액" type="number" onChange={(e)=>setBudgetCost(e.target.value)} style={{ padding:"6px 10px", borderRadius:"8px", border:"1px solid #ccc", marginRight:"5px" }}/>
            <button onClick={()=>setBudgetItems([...budgetItems,{name:budgetName,cost:+budgetCost}])} style={{ padding:"6px 12px", borderRadius:"8px", border:"none", background:"#ff8fa3", color:"#fff" }}>추가</button>
            <div style={{ maxHeight:"150px", overflowY:"auto", marginTop:"10px" }}>
              {budgetItems.map((b,i)=>(<div key={i}>{b.name} - {b.cost}원</div>))}
            </div>
          </div>

          {/* 하객 */}
          <div style={{ background:"#fff", padding:"15px", borderRadius:"20px", marginBottom:"15px" }}>
            <h3>👥 하객 ({guests.length})</h3>
            <input placeholder="이름" onChange={(e)=>setGuestName(e.target.value)} style={{ padding:"6px 10px", borderRadius:"8px", border:"1px solid #ccc", marginRight:"5px" }}/>
            <button onClick={()=>setGuests([...guests,guestName])} style={{ padding:"6px 12px", borderRadius:"8px", border:"none", background:"#ff8fa3", color:"#fff" }}>추가</button>
            <div style={{ maxHeight:"150px", overflowY:"auto", marginTop:"10px" }}>
              {guests.map((g,i)=>(<div key={i}>{g}</div>))}
            </div>
          </div>

          {/* 할일 */}
          <div style={{ background:"#fff", padding:"15px", borderRadius:"20px", marginBottom:"15px" }}>
            <h3>✅ 할일</h3>
            <select onChange={(e)=>setCategory(e.target.value)} style={{ padding:"6px 10px", borderRadius:"8px", border:"1px solid #ccc", marginRight:"5px" }}>
              <option>스드메</option>
              <option>웨딩홀</option>
              <option>신혼여행</option>
              <option>예물</option>
              <option>혼수</option>
            </select>
            <input value={taskText} onChange={(e)=>setTaskText(e.target.value)} placeholder="할 일 입력" style={{ padding:"6px 10px", borderRadius:"8px", border:"1px solid #ccc", marginRight:"5px" }}/>
            <button onClick={()=>{
              setTasks([...tasks,{text:taskText,done:false,category}]); setTaskText("");
            }} style={{ padding:"6px 12px", borderRadius:"8px", border:"none", background:"#ff8fa3", color:"#fff" }}>추가</button>
            <div style={{ maxHeight:"200px", overflowY:"auto", marginTop:"10px" }}>
              {Object.entries(tasks.reduce((acc,t)=>{
                acc[t.category] = acc[t.category] || [];
                acc[t.category].push(t); return acc;
              },{})).map(([cat,list])=>(
                <div key={cat} style={{ marginTop:"8px", padding:"8px", background:"#fce3ec", borderRadius:"10px" }}>
                  <b>📂 {cat}</b>
                  {list.map((t,i)=>(
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", marginTop:"5px" }}>
                      <span>{t.text}</span>
                      <button onClick={()=>{
                        let x=[...tasks]; x[tasks.indexOf(t)].done=!x[tasks.indexOf(t)].done; setTasks(x);
                      }} style={{ border:"none", background:"#fff", borderRadius:"5px", padding:"2px 6px", cursor:"pointer" }}>{t.done?"완료":"미완료"}</button>
                      <button onClick={()=>setTasks(tasks.filter(ts=>ts!==t))} style={{ border:"none", background:"#fff", borderRadius:"5px", padding:"2px 6px", cursor:"pointer" }}>삭제</button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}