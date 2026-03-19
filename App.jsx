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
  const [tasks, setTasks] = useState([]);
  const [taskText, setTaskText] = useState("");
  const [events, setEvents] = useState([]);
  const [eventText, setEventText] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [image, setImage] = useState("");

  useEffect(() => {
    onAuthStateChanged(auth, (u) => u && setUser(u));
  }, []);

  useEffect(() => {
    if (!coupleId) return;
    const load = async () => {
      const snap = await getDoc(doc(db, "couples", coupleId));
      if (snap.exists()) {
        const d = snap.data();
        setTasks(d.tasks || []);
        setEvents(d.events || []);
        setImage(d.image || "");
      }
    };
    load();
  }, [coupleId]);

  useEffect(() => {
    if (!coupleId) return;
    setDoc(doc(db, "couples", coupleId), { tasks, events, image });
  }, [tasks, events, image, coupleId]);

  const login = () => signInWithPopup(auth, provider);

  const createCouple = () => {
    const id = Math.random().toString(36).slice(2, 8);
    setCoupleId(id);
    navigator.clipboard.writeText(id);
    alert("코드 복사됨: " + id);
  };

  const joinCouple = () => setCoupleId(inputCoupleId);

  if (!user) {
    return (
      <div style={{ height:"100vh", display:"flex", justifyContent:"center", alignItems:"center", background:"#f8f5f2" }}>
        <div style={{ background:"white", padding:"40px", borderRadius:"20px", textAlign:"center" }}>
          <h1>Wedding</h1>
          <button onClick={login}>Google 로그인</button>
        </div>
      </div>
    );
  }

  if (!coupleId) {
    return (
      <div style={{ height:"100vh", display:"flex", justifyContent:"center", alignItems:"center" }}>
        <div>
          <button onClick={createCouple}>커플 생성</button>
          <input onChange={(e)=>setInputCoupleId(e.target.value)} />
          <button onClick={joinCouple}>입장</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding:"20px", background:"#f8f5f2", minHeight:"100vh" }}>

      {/* 대표 이미지 */}
      <div style={{ marginBottom:"20px" }}>
        {image && <img src={image} style={{ width:"100%", borderRadius:"20px" }} />}
        <input type="file" onChange={(e)=>{
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = ()=> setImage(reader.result);
          reader.readAsDataURL(file);
        }} />
      </div>

      {/* 탭 */}
      <div style={{ display:"flex", justifyContent:"space-around", marginBottom:"20px" }}>
        <button onClick={()=>setTab("home")}>홈</button>
        <button onClick={()=>setTab("tasks")}>할일</button>
        <button onClick={()=>setTab("calendar")}>달력</button>
      </div>

      {/* 홈 */}
      {tab === "home" && (
        <div>
          <h2>우리의 웨딩</h2>
          <p>커플코드: {coupleId}</p>
        </div>
      )}

      {/* 할일 */}
      {tab === "tasks" && (
        <div>
          <input value={taskText} onChange={(e)=>setTaskText(e.target.value)} />
          <button onClick={()=>{setTasks([...tasks,{text:taskText,done:false}]);setTaskText("")}}>추가</button>
          {tasks.map((t,i)=>(
            <div key={i}>
              <span onClick={()=>{
                let x=[...tasks];x[i].done=!x[i].done;setTasks(x);
              }}>{t.done?"✅":"⬜"} {t.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* 달력 */}
      {tab === "calendar" && (
        <div>
          <input placeholder="일정" onChange={(e)=>setEventText(e.target.value)} />
          <input type="date" onChange={(e)=>setEventDate(e.target.value)} />
          <button onClick={()=>setEvents([...events,{text:eventText,date:eventDate}])}>추가</button>

          {events.map((e,i)=>(
            <div key={i}>{e.date} - {e.text}</div>
          ))}
        </div>
      )}

    </div>
  );
}