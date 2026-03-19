import React, { useState, useEffect } from "react";
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

  // 사진
  const [images, setImages] = useState([]);
  const [currentImage, setCurrentImage] = useState(0);

  // 할일
  const [tasks, setTasks] = useState([]);
  const [taskCategory, setTaskCategory] = useState("");
  const [taskText, setTaskText] = useState("");

  // 달력
  const [events, setEvents] = useState([]);
  const [eventText, setEventText] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [monthOffset, setMonthOffset] = useState(0);
  const [weddingDate, setWeddingDate] = useState("");

  useEffect(() => {
    onAuthStateChanged(auth, (u) => u && setUser(u));
  }, []);

  // 데이터 로딩
  useEffect(() => {
    if (!coupleId) return;
    const load = async () => {
      const snap = await getDoc(doc(db, "couples", coupleId));
      if (snap.exists()) {
        const d = snap.data();
        setImages(d.images || []);
        setTasks(d.tasks || []);
        setEvents(d.events || []);
        setWeddingDate(d.weddingDate || "");
      }
    };
    load();
  }, [coupleId]);

  // 데이터 저장
  useEffect(() => {
    if (!coupleId) return;
    setDoc(doc(db, "couples", coupleId), { images, tasks, events, weddingDate });
  }, [images, tasks, events, weddingDate, coupleId]);

  // 사진 슬라이드
  useEffect(() => {
    if (images.length < 2) return;
    const interval = setInterval(() => setCurrentImage((prev) => (prev + 1) % images.length), 3000);
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

  // 달력 관련 계산
  const baseDate = new Date();
  baseDate.setMonth(baseDate.getMonth() + monthOffset);
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dday = weddingDate ? Math.ceil((new Date(weddingDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;

  if (!user) return (
    <div style={{ height:"100vh", display:"flex", justifyContent:"center", alignItems:"center", background:"#f8f5f2" }}>
      <div style={{ background:"white", padding:"40px", borderRadius:"20px", textAlign:"center" }}>
        <h1>Wedding</h1>
        <button onClick={login}>Google 로그인</button>
      </div>
    </div>
  );

  if (!coupleId) return (
    <div style={{ height:"100vh", display:"flex", justifyContent:"center", alignItems:"center" }}>
      <div style={{textAlign:"center"}}>
        <button onClick={createCouple} style={{marginRight:"10px"}}>커플 생성</button>
        <input onChange={(e)=>setInputCoupleId(e.target.value)} placeholder="초대 코드 입력" style={{marginRight:"5px"}}/>
        <button onClick={joinCouple}>입장</button>
      </div>
    </div>
  );

  return (
    <div style={{ padding:"20px", background:"#f8f5f2", minHeight:"100vh" }}>
      
      {/* 사진 업로드 및 슬라이드 */}
      <div style={{ marginBottom:"20px", height:"50vh", borderRadius:"20px", overflow:"hidden", position:"relative", background:"#fff" }}>
        {images.length > 0 && (
          <img src={images[currentImage]} style={{ width:"100%", height:"100%", objectFit:"contain" }} />
        )}
        <input type="file" style={{position:"absolute", bottom:"10px", left:"10px"}} onChange={e=>{
          const file = e.target.files[0];
          if(!file) return;
          const reader = new FileReader();
          reader.onload = ()=> setImages([...images, reader.result]);
          reader.readAsDataURL(file);
        }}/>
        {images.length>0 && (
          <button onClick={()=>{ 
            let x=[...images]; 
            x.splice(currentImage,1); 
            setImages(x); 
            setCurrentImage(0);
          }} style={{position:"absolute", bottom:"10px", right:"10px"}}>삭제</button>
        )}
      </div>

      {/* 탭 */}
      <div style={{ display:"flex", justifyContent:"space-around", marginBottom:"20px" }}>
        <button onClick={()=>setTab("home")}>홈</button>
        <button onClick={()=>setTab("tasks")}>할일</button>
        <button onClick={()=>setTab("calendar")}>달력</button>
        <button onClick={logout}>로그아웃</button>
      </div>

      {/* 홈 */}
      {tab === "home" && (
        <div>
          <h2>우리의 웨딩</h2>
          <p>D-day: {dday ?? "?"}</p>
          <input type="date" value={weddingDate} onChange={(e)=>setWeddingDate(e.target.value)} />
          <p>커플코드: {coupleId}</p>
        </div>
      )}

      {/* 할일 */}
      {tab === "tasks" && (
        <div>
          <input placeholder="카테고리" value={taskCategory} onChange={e=>setTaskCategory(e.target.value)} style={{marginRight:"5px"}}/>
          <input placeholder="할 일" value={taskText} onChange={e=>setTaskText(e.target.value)} style={{marginRight:"5px"}}/>
          <button onClick={()=>{
            if(!taskCategory||!taskText) return;
            setTasks([...tasks,{category:taskCategory,text:taskText,done:false}]); 
            setTaskText(""); setTaskCategory("");
          }}>추가</button>

          {Object.entries(tasks.reduce((acc,t)=>{acc[t.category]=acc[t.category]||[];acc[t.category].push(t);return acc;},{})).map(([cat,list])=>(
            <div key={cat} style={{marginTop:"10px"}}>
              <b>{cat}</b>
              {list.map((t,i)=>(
                <div key={i} style={{display:"flex", alignItems:"center", marginTop:"5px"}}>
                  <span style={{textDecoration:t.done?"line-through":"none", marginRight:"10px"}}>{t.text}</span>
                  <button onClick={()=>{let x=[...tasks]; x[tasks.indexOf(t)].done=!x[tasks.indexOf(t)].done; setTasks(x)}} style={{marginRight:"5px"}}>{t.done?"완료":"미완료"}</button>
                  <button onClick={()=>setTasks(tasks.filter(tt=>tt!==t))}>삭제</button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* 달력 */}
      {tab === "calendar" && (
        <div>
          <div style={{display:"flex", justifyContent:"space-between", marginBottom:"10px"}}>
            <button onClick={()=>setMonthOffset(monthOffset-1)}>◀ 이전달</button>
            <h3>{year}년 {month+1}월</h3>
            <button onClick={()=>setMonthOffset(monthOffset+1)}>다음달 ▶</button>
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
              <input placeholder="일정" value={eventText} onChange={e=>setEventText(e.target.value)} style={{marginRight:"5px"}}/>
              <button onClick={()=>{if(eventText){setEvents([...events,{text:eventText,date:selectedDate}]); setEventText("");}}}>추가</button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}