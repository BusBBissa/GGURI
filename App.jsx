import React, { useState, useEffect } from "react"; import { initializeApp } from "firebase/app"; import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth"; import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = { apiKey: "AIzaSyBzMM4swUjS08WjOqSF7RmfaHOsfVc8gSg", authDomain: "gguri-e94ae.firebaseapp.com", projectId: "gguri-e94ae", };

const app = initializeApp(firebaseConfig); const auth = getAuth(app); const db = getFirestore(app); const provider = new GoogleAuthProvider();

export default function App() { const [user, setUser] = useState(null); const [coupleId, setCoupleId] = useState(""); const [inputCoupleId, setInputCoupleId] = useState("");

const [tab, setTab] = useState("home"); const [tasks, setTasks] = useState([]); const [taskText, setTaskText] = useState(""); const [events, setEvents] = useState([]); const [eventText, setEventText] = useState(""); const [eventDate, setEventDate] = useState(""); const [images, setImages] = useState([]);

useEffect(() => { onAuthStateChanged(auth, (u) => u && setUser(u)); }, []);

useEffect(() => { if (!coupleId) return; const load = async () => { const snap = await getDoc(doc(db, "couples", coupleId)); if (snap.exists()) { const d = snap.data(); setTasks(d.tasks || []); setEvents(d.events || []); setImages(d.images || []); } }; load(); }, [coupleId]);

useEffect(() => { if (!coupleId) return; setDoc(doc(db, "couples", coupleId), { tasks, events, images }); }, [tasks, events, images, coupleId]);

const login = () => signInWithPopup(auth, provider); const logout = () => signOut(auth);

const createCouple = () => { const id = Math.random().toString(36).slice(2, 8); setCoupleId(id); navigator.clipboard.writeText(id); alert("초대 링크 복사됨: " + window.location.origin + "?id=" + id); };

const joinCouple = () => setCoupleId(inputCoupleId);

if (!user) { return ( <div style={{ height:"100vh", display:"flex", justifyContent:"center", alignItems:"center", background:"linear-gradient(135deg,#fce3ec,#ffe8d6)" }}> <div style={{ background:"white", padding:"40px", borderRadius:"30px", textAlign:"center", boxShadow:"0 10px 40px rgba(0,0,0,0.1)" }}> <h1 style={{ marginBottom:"20px" }}>💍 Wedding Planner</h1> <button onClick={login} style={{ padding:"12px 24px", borderRadius:"12px", border:"none", background:"#ff8fa3", color:"white" }}> Google로 시작하기 </button> </div> </div> ); }

if (!coupleId) { return ( <div style={{ height:"100vh", display:"flex", justifyContent:"center", alignItems:"center", background:"linear-gradient(135deg,#fce3ec,#ffe8d6)" }}> <div style={{ background:"white", padding:"40px", borderRadius:"30px", textAlign:"center" }}> <h2>커플 연결</h2> <button onClick={createCouple} style={{ marginBottom:"20px" }}>초대 링크 생성</button> <div> <input placeholder="코드 입력" onChange={(e)=>setInputCoupleId(e.target.value)} /> <button onClick={joinCouple}>입장</button> </div> </div> </div> ); }

return ( <div style={{ minHeight:"100vh", background:"linear-gradient(180deg,#fff,#fce3ec)" }}>

{/* 헤더 */}
  <div style={{ padding:"20px", display:"flex", justifyContent:"space-between" }}>
    <h2>💖 Our Wedding</h2>
    <button onClick={logout}>로그아웃</button>
  </div>

  {/* 갤러리 */}
  <div style={{ padding:"10px" }}>
    <input type="file" multiple onChange={(e)=>{
      const files = Array.from(e.target.files);
      files.forEach(file=>{
        const reader = new FileReader();
        reader.onload = ()=> setImages(prev=>[...prev, reader.result]);
        reader.readAsDataURL(file);
      })
    }} />

    <div style={{ display:"flex", overflowX:"auto", gap:"10px", marginTop:"10px" }}>
      {images.map((img,i)=>(
        <img key={i} src={img} style={{ height:"160px", borderRadius:"20px" }} />
      ))}
    </div>
  </div>

  {/* 컨텐츠 */}
  <div style={{ padding:"20px" }}>

    {tab === "home" && (
      <div style={{ background:"white", padding:"20px", borderRadius:"20px" }}>
        <h3>커플 코드</h3>
        <p>{coupleId}</p>
      </div>
    )}

    {tab === "tasks" && (
      <div style={{ background:"white", padding:"20px", borderRadius:"20px" }}>
        <input value={taskText} onChange={(e)=>setTaskText(e.target.value)} />
        <button onClick={()=>{setTasks([...tasks,{text:taskText,done:false}]);setTaskText("")}}>추가</button>
        {tasks.map((t,i)=>(
          <div key={i} style={{ display:"flex", justifyContent:"space-between" }}>
            <span onClick={()=>{
              let x=[...tasks];x[i].done=!x[i].done;setTasks(x);
            }}>{t.done?"✅":"⬜"} {t.text}</span>
            <button onClick={()=>setTasks(tasks.filter((_,idx)=>idx!==i))}>삭제</button>
          </div>
        ))}
      </div>
    )}

    {tab === "calendar" && (
      <div style={{ background:"white", padding:"20px", borderRadius:"20px" }}>
        <input placeholder="일정" onChange={(e)=>setEventText(e.target.value)} />
        <input type="date" onChange={(e)=>setEventDate(e.target.value)} />
        <button onClick={()=>setEvents([...events,{text:eventText,date:eventDate}])}>추가</button>
        {events.map((e,i)=>(
          <div key={i}>{e.date} - {e.text}</div>
        ))}
      </div>
    )}

  </div>

  {/* 하단 네비 */}
  <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"white", display:"flex", justifyContent:"space-around", padding:"10px" }}>
    <button onClick={()=>setTab("home")}>홈</button>
    <button onClick={()=>setTab("tasks")}>할일</button>
    <button onClick={()=>setTab("calendar")}>달력</button>
  </div>

</div>

); }