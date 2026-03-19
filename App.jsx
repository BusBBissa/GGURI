import React, { useState, useEffect } from "react"; import { initializeApp } from "firebase/app"; import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth"; import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = { apiKey: "AIzaSyBzMM4swUjS08WjOqSF7RmfaHOsfVc8gSg", authDomain: "gguri-e94ae.firebaseapp.com", projectId: "gguri-e94ae", };

const app = initializeApp(firebaseConfig); const auth = getAuth(app); const db = getFirestore(app); const provider = new GoogleAuthProvider();

export default function App() { const [user, setUser] = useState(null); const [coupleId, setCoupleId] = useState(""); const [inputCoupleId, setInputCoupleId] = useState("");

const [tab, setTab] = useState("home"); const [events, setEvents] = useState([]); const [eventText, setEventText] = useState(""); const [eventDate, setEventDate] = useState(""); const [images, setImages] = useState([]);

useEffect(() => { onAuthStateChanged(auth, (u) => u && setUser(u)); }, []);

useEffect(() => { if (!coupleId) return; const load = async () => { const snap = await getDoc(doc(db, "couples", coupleId)); if (snap.exists()) { const d = snap.data(); setEvents(d.events || []); setImages(d.images || []); } }; load(); }, [coupleId]);

useEffect(() => { if (!coupleId) return; setDoc(doc(db, "couples", coupleId), { events, images }); }, [events, images, coupleId]);

const login = () => signInWithPopup(auth, provider); const logout = () => signOut(auth);

const createCouple = () => { const id = Math.random().toString(36).slice(2, 8); setCoupleId(id); navigator.clipboard.writeText(id); alert("초대 코드: " + id); };

const joinCouple = () => setCoupleId(inputCoupleId);

const today = new Date(); const daysInMonth = new Date(today.getFullYear(), today.getMonth()+1, 0).getDate();

if (!user) { return ( <div style={{ height:"100vh", display:"flex", justifyContent:"center", alignItems:"center", background:"linear-gradient(135deg,#fce3ec,#ffe8d6)" }}> <button onClick={login}>Google 로그인</button> </div> ); }

if (!coupleId) { return ( <div style={{ height:"100vh", display:"flex", justifyContent:"center", alignItems:"center" }}> <div> <button onClick={createCouple}>커플 생성</button> <input onChange={(e)=>setInputCoupleId(e.target.value)} /> <button onClick={joinCouple}>입장</button> </div> </div> ); }

return ( <div style={{ minHeight:"100vh", background:"linear-gradient(#fff,#fce3ec)", paddingBottom:"80px" }}>

{/* 이미지 */}
  <div style={{ padding:"10px" }}>
    <input type="file" multiple onChange={(e)=>{
      const files = Array.from(e.target.files);
      files.forEach(file=>{
        const reader = new FileReader();
        reader.onload = ()=> setImages(prev=>[...prev, reader.result]);
        reader.readAsDataURL(file);
      })
    }} />

    {images[0] && (
      <img src={images[0]} style={{ width:"100%", borderRadius:"20px", marginTop:"10px" }} />
    )}
  </div>

  {/* 홈: 사진 + 달력 */}
  {tab === "home" && (
    <div style={{ padding:"10px" }}>

      {/* 달력 */}
      <div style={{ background:"white", borderRadius:"20px", padding:"10px" }}>
        <h3>{today.getFullYear()}년 {today.getMonth()+1}월</h3>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"5px" }}>
          {[...Array(daysInMonth)].map((_,i)=>{
            const date = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`;
            const hasEvent = events.find(e=>e.date===date);
            return (
              <div key={i} style={{ padding:"10px", borderRadius:"10px", background: hasEvent ? "#ffd6e0" : "#f9f9f9", fontSize:"12px" }}>
                {i+1}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  )}

  {/* 달력 탭 */}
  {tab === "calendar" && (
    <div style={{ padding:"10px" }}>
      <input placeholder="일정" onChange={(e)=>setEventText(e.target.value)} />
      <input type="date" onChange={(e)=>setEventDate(e.target.value)} />
      <button onClick={()=>setEvents([...events,{text:eventText,date:eventDate}])}>추가</button>

      {events.map((e,i)=>(
        <div key={i}>{e.date} - {e.text}</div>
      ))}
    </div>
  )}

  {/* 하단 탭 */}
  <div style={{ position:"fixed", bottom:0, left:0, right:0, display:"flex", justifyContent:"space-around", background:"white", padding:"10px", borderTop:"1px solid #eee" }}>
    {["home","calendar"].map(t=>(
      <button key={t} onClick={()=>setTab(t)} style={{ border:"none", background: tab===t?"#ff8fa3":"transparent", color: tab===t?"white":"black", padding:"10px 20px", borderRadius:"20px" }}>
        {t === "home" ? "홈" : "달력"}
      </button>
    ))}
  </div>

  {/* 초대 버튼 */}
  <button onClick={createCouple} style={{ position:"fixed", bottom:"90px", right:"20px", background:"#ff8fa3", color:"white", border:"none", padding:"15px", borderRadius:"50%" }}>
    +
  </button>

</div>

); }