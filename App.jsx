import React, { useState, useEffect } from "react"; import { initializeApp } from "firebase/app"; import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth"; import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = { apiKey: "AIzaSyBzMM4swUjS08WjOqSF7RmfaHOsfVc8gSg", authDomain: "gguri-e94ae.firebaseapp.com", projectId: "gguri-e94ae", };

const app = initializeApp(firebaseConfig); const auth = getAuth(app); const db = getFirestore(app); const provider = new GoogleAuthProvider();

export default function App() { const [user, setUser] = useState(null); const [coupleId, setCoupleId] = useState(""); const [inputCoupleId, setInputCoupleId] = useState("");

const [tab, setTab] = useState("home");

// 이미지 슬라이드 const [images, setImages] = useState([]); const [currentImage, setCurrentImage] = useState(0);

// 일정 const [events, setEvents] = useState([]); const [selectedDate, setSelectedDate] = useState(""); const [eventText, setEventText] = useState(""); const [eventDate, setEventDate] = useState("");

// 하객 const [guests, setGuests] = useState([]); const [guestTab, setGuestTab] = useState("신랑"); const [guestSub, setGuestSub] = useState("고등학교"); const [guestName, setGuestName] = useState(""); const [guestSearch, setGuestSearch] = useState(""); const [newSubCategory, setNewSubCategory] = useState(""); const [subCategories, setSubCategories] = useState(["고등학교","대학교","직장","가족"]);

const [weddingDate, setWeddingDate] = useState(""); const [monthOffset, setMonthOffset] = useState(0);

useEffect(() => { onAuthStateChanged(auth, (u) => u && setUser(u)); }, []);

useEffect(() => { if (!coupleId) return; const load = async () => { const snap = await getDoc(doc(db, "couples", coupleId)); if (snap.exists()) { const d = snap.data(); setImages(d.images || []); setEvents(d.events || []); setGuests(d.guests || []); setWeddingDate(d.weddingDate || ""); setSubCategories(d.subCategories || subCategories); } }; load(); }, [coupleId]);

useEffect(() => { if (!coupleId) return; setDoc(doc(db, "couples", coupleId), { images, events, guests, weddingDate, subCategories }); }, [images, events, guests, weddingDate, subCategories, coupleId]);

useEffect(() => { if (images.length > 1) { const interval = setInterval(() => { setCurrentImage((prev) => (prev + 1) % images.length); }, 3000); return () => clearInterval(interval); } }, [images]);

const login = () => signInWithPopup(auth, provider); const createCouple = () => { const id = Math.random().toString(36).slice(2, 8); setCoupleId(id); navigator.clipboard.writeText(id); alert("초대코드: " + id); }; const joinCouple = () => setCoupleId(inputCoupleId); const exportCSV = () => { const rows = guests.map(g => ${g.group},${g.sub},${g.name},${g.status||"미정"}); const csv = "그룹,카테고리,이름,상태\n" + rows.join("\n"); const blob = new Blob([csv], { type: "text/csv" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "guests.csv"; a.click(); };

const baseDate = new Date(); baseDate.setMonth(baseDate.getMonth() + monthOffset); const year = baseDate.getFullYear(); const month = baseDate.getMonth(); const daysInMonth = new Date(year, month + 1, 0).getDate(); const dday = weddingDate ? Math.ceil((new Date(weddingDate) - new Date())/(10006060*24)) : "?";

if (!user) return (<div style={{height:"100vh",display:"flex",justifyContent:"center",alignItems:"center"}}><button onClick={login}>Google 로그인</button></div>); if (!coupleId) return (<div style={{height:"100vh",display:"flex",justifyContent:"center",alignItems:"center"}}><div><button onClick={createCouple}>커플 생성</button><input onChange={(e)=>setInputCoupleId(e.target.value)} /><button onClick={joinCouple}>입장</button></div></div>);

return ( <div style={{minHeight:"100vh",padding:"20px",background:"#fffaf0"}}>

{/* 탭 */}
  <div style={{display:"flex",gap:"10px",marginBottom:"20px"}}>
    {["home","guests"].map(t=>(<button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"12px",borderRadius:"20px",border:"none",background:tab===t?"#ff8fa3":"#eee"}}>{t === "home" ? "홈" : "하객"}</button>))}
  </div>

  {/* 홈 화면 */}
  {tab === "home" && (
    <div>
      {images.length>0 && <img src={images[currentImage]} style={{width:"100%",borderRadius:"20px",marginBottom:"10px"}} />}
      <div style={{display:"flex",gap:"5px",overflowX:"auto",marginBottom:"10px"}}>{images.map((img,i)=><img key={i} src={img} onClick={()=>setCurrentImage(i)} style={{width:"60px",height:"60px",borderRadius:"10px"}} />)}</div>

      <label style={{display:"block",textAlign:"center",marginBottom:"20px"}}>사진 추가<input type="file" multiple style={{display:"none"}} onChange={(e)=>{Array.from(e.target.files).forEach(file=>{const reader=new FileReader();reader.onload=()=>setImages(prev=>[...prev,reader.result]);reader.readAsDataURL(file);});}} /></label>

      <div style={{background:"white",padding:"20px",borderRadius:"20px",marginBottom:"20px",textAlign:"center"}}>
        <h2>D-{dday}</h2>
        <input type="date" onChange={(e)=>setWeddingDate(e.target.value)} />
      </div>

      <div style={{background:"white",padding:"20px",borderRadius:"20px",marginBottom:"20px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"5px",marginBottom:"10px"}}>{[...Array(daysInMonth)].map((_,i)=>{
          const date = `${year}-${String(month+1).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`;
          const hasEvent = events.find(e=>e.date===date);
          return (<div key={i} onClick={()=>setSelectedDate(date)} style={{padding:"10px",borderRadius:"10px",background:hasEvent?"#ffccd5":"#eee"}}>{i+1}</div>);
        })}</div>
        {selectedDate && (<div><h4>{selectedDate}</h4>{events.filter(e=>e.date===selectedDate).map((e,i)=><div key={i}>{e.text}</div>)}</div>)}
        <input placeholder="일정" onChange={(e)=>setEventText(e.target.value)} />
        <input type="date" onChange={(e)=>setEventDate(e.target.value)} />
        <button onClick={()=>setEvents([...events,{text:eventText,date:eventDate}])}>추가</button>
      </div>
    </div>
  )}

  {/* 하객 화면 */}
  {tab === "guests" && (
    <div style={{background:"white",padding:"20px",borderRadius:"20px"}}>
      <button onClick={exportCSV}>엑셀 다운로드</button>
      <input placeholder="🔍 통합 검색" value={guestSearch} onChange={(e)=>setGuestSearch(e.target.value)} style={{width:"100%",marginBottom:"10px"}} />
      <div style={{display:"flex",marginBottom:"10px"}}>{["신랑","신부"].map(t=><button key={t} onClick={()=>setGuestTab(t)} style={{flex:1,background:guestTab===t?"#ff8fa3":"#eee"}}>{t}</button>)}</div>
      <div style={{display:"flex",gap:"5px",marginBottom:"10px"}}><input placeholder="카테고리 추가" onChange={(e)=>setNewSubCategory(e.target.value)} /><button onClick={()=>{if(newSubCategory && !subCategories.includes(newSubCategory)){setSubCategories([...subCategories,newSubCategory]);setNewSubCategory("");}}}>추가</button></div>
      <select onChange={(e)=>setGuestSub(e.target.value)} value={guestSub}>{subCategories.map((s,i)=><option key={i}>{s}</option>)}</select>
      <input placeholder="이름" onChange={(e)=>setGuestName(e.target.value)} />
      <button onClick={()=>setGuests([...guests,{group:guestTab,sub:guestSub,name:guestName,status:"미정"}])}>추가</button>

      {Object.entries(guests.filter(g => g.name.includes(guestSearch) || g.group.includes(guestSearch) || g.sub.includes(guestSearch)).reduce((acc,g)=>{acc[g.group]=acc[g.group]||{};acc[g.group][g.sub]=acc[g.group][g.sub]||[];acc[g.group][g.sub].push(g);return acc;},{})).map(([group,subs])=>(
        <div key={group}><h3>{group}</h3>{Object.entries(subs).map(([sub,list])=>(
          <div key={sub}><b>{sub}</b>{list.map((g,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between"}}><span>{g.name} ({g.status})</span><div><button onClick={()=>{let x=[...guests];const idx=guests.indexOf(g);x[idx].status=x[idx].status==="확정"?"미정":"확정";setGuests(x);}}>상태</button><button onClick={()=>setGuests(guests.filter(item=>item!==g))}>삭제</button></div></div>))}</div>
        ))}</div>
      ))}
    </div>
  )}

  <button onClick={createCouple} style={{position:"fixed",bottom:"20px",right:"20px",background:"#ff8fa3",color:"white",border:"none",padding:"16px",borderRadius:"50%"}}>+</button>

</div>

); }