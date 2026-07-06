import { useState, useEffect, useRef } from "react";
import {
  Users, Heart, Pill, AlertTriangle, Home, Activity, FileText,
  Bell, Plus, ChevronRight, TrendingUp, Clock, X, Pencil, Trash2,
  Brain, Leaf, Shield, Zap, RefreshCw, Printer
} from "lucide-react";

const NAV = [
  { id:"dashboard",  label:"Dashboard",     icon:Home },
  { id:"residents",  label:"Residents",      icon:Users },
  { id:"health",     label:"Health Records", icon:Activity },
  { id:"medication", label:"Medication",     icon:Pill },
  { id:"ai",         label:"AI Insights",    icon:TrendingUp },
  { id:"reports",    label:"Reports",        icon:FileText },
];
const RISK = {
  high:     { bg:"#FEF2F2", fg:"#DC2626", dot:"#EF4444", label:"High risk" },
  moderate: { bg:"#FFFBEB", fg:"#B45309", dot:"#F59E0B", label:"Moderate" },
  stable:   { bg:"#F0FDF4", fg:"#15803D", dot:"#22C55E", label:"Stable" },
};
const BLOOD_GROUPS  = ["A+","A-","B+","B-","O+","O-","AB+","AB-"];
const STORAGE_KEY   = "smartcare:residents";
const RECORDS_KEY   = "smartcare:healthrecords";
const MEDS_KEY      = "smartcare:medications";
const LOGS_KEY      = "smartcare:medlogs";
const AI_KEY        = "smartcare:airesults";
const SUMMARY_KEY   = "smartcare:weeklysummary";
const genId         = () => `r_${Date.now()}_${Math.floor(Math.random()*999)}`;
const BLANK         = { name:"", age:"", gender:"M", room:"", blood:"B+", conditions:[], contact:"" };
const FREQ_OPTIONS  = [
  { value:"once",      label:"Once daily",       defaultTimes:["08:00"] },
  { value:"twice",     label:"Twice daily",       defaultTimes:["08:00","20:00"] },
  { value:"thrice",    label:"Three times daily", defaultTimes:["08:00","14:00","20:00"] },
  { value:"as_needed", label:"As needed",         defaultTimes:[] },
];
const METRICS = [
  { key:"blood_sugar", label:"Blood Sugar",   unit:"mg/dL", placeholder:"120",  min:70,  max:140 },
  { key:"temperature", label:"Temperature",   unit:"F",     placeholder:"98.6", min:97,  max:99  },
  { key:"heart_rate",  label:"Heart Rate",    unit:"bpm",   placeholder:"72",   min:60,  max:100 },
  { key:"weight",      label:"Weight",        unit:"kg",    placeholder:"65",   min:30,  max:150 },
  { key:"oxygen",      label:"Oxygen SpO2",   unit:"%",     placeholder:"98",   min:95,  max:100 },
];
const SAMPLE = [
  { id:"s1", name:"Muthukumar R.",  age:74, gender:"M", room:"101", blood:"B+", risk:"high",     conditions:["Diabetes","Hypertension"], contact:"98765 43210" },
  { id:"s2", name:"Lakshmi S.",     age:68, gender:"F", room:"102", blood:"A+", risk:"stable",   conditions:["Arthritis"],               contact:"98765 43211" },
  { id:"s3", name:"Ramasamy P.",    age:81, gender:"M", room:"103", blood:"O+", risk:"moderate", conditions:["Hypertension","Kidney"],    contact:"98765 43212" },
  { id:"s4", name:"Chellamuthu K.", age:76, gender:"M", room:"104", blood:"B-", risk:"stable",   conditions:["Joint pain"],              contact:"98765 43213" },
  { id:"s5", name:"Saraswathi M.",  age:70, gender:"F", room:"105", blood:"A-", risk:"moderate", conditions:["Diabetes"],                contact:"98765 43214" },
];
const SAMPLE_MEDS = [
  { id:"m1", residentId:"s1", name:"Metformin",  dosage:"500mg", frequency:"twice",  times:["08:00","20:00"], startDate:"2026-06-01", notes:"Take after food", active:true },
  { id:"m2", residentId:"s1", name:"Amlodipine", dosage:"5mg",   frequency:"once",   times:["08:00"],         startDate:"2026-06-01", notes:"",               active:true },
  { id:"m3", residentId:"s2", name:"Ibuprofen",  dosage:"400mg", frequency:"thrice", times:["08:00","14:00","20:00"], startDate:"2026-06-01", notes:"For joint pain", active:true },
  { id:"m4", residentId:"s3", name:"Enalapril",  dosage:"10mg",  frequency:"once",   times:["08:00"],         startDate:"2026-06-01", notes:"Monitor BP",     active:true },
];

const checkStatus  = (v,mn,mx) => { if(v===""||v===null||v===undefined)return null; const n=Number(v); if(isNaN(n))return null; if(n<mn)return"low"; if(n>mx)return"high"; return"normal"; };
const recordStatus = (rec) => { const c=[[rec.bp_systolic,90,140],[rec.bp_diastolic,60,90],[rec.blood_sugar,70,140],[rec.temperature,97,99],[rec.heart_rate,60,100],[rec.oxygen,95,100]]; const w=c.filter(([v,mn,mx])=>v!=null&&!isNaN(Number(v))&&(Number(v)<mn||Number(v)>mx)).length; return w===0?"stable":w<=2?"moderate":"critical"; };
const ROW_STATUS   = { stable:{bg:"#F0FDF4",fg:"#15803D",label:"Stable"}, moderate:{bg:"#FFFBEB",fg:"#B45309",label:"Warning"}, critical:{bg:"#FEF2F2",fg:"#DC2626",label:"Critical"} };
const todayStr     = () => new Date().toISOString().split("T")[0];
const nowStr       = () => { const d=new Date(); return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; };
const daysAgoStr   = (n) => { const d=new Date(); d.setDate(d.getDate()-n); return d.toISOString().split("T")[0]; };
const fmtDate      = (s) => { if(!s)return"--"; const [,m,d]=s.split("-"); return`${Number(d)} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][Number(m)-1]}`; };
const blankRecord  = () => ({ date:todayStr(), time:nowStr(), bp_systolic:"", bp_diastolic:"", blood_sugar:"", temperature:"", heart_rate:"", weight:"", oxygen:"", notes:"" });
const blankMed     = () => ({ name:"", dosage:"", frequency:"once", times:["08:00"], startDate:todayStr(), notes:"" });
const fmtTime      = (t) => { if(!t)return t; const [h,m]=t.split(":"); const hr=Number(h); return`${hr===0?12:hr>12?hr-12:hr}:${m} ${hr>=12?"PM":"AM"}`; };
const labelSt      = { display:"block", fontSize:11, fontWeight:600, color:"#374151", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:5 };
const baseInp      = { width:"100%", padding:"8px 10px", border:"1px solid #D1D5DB", borderRadius:8, fontSize:13, color:"#0F172A", outline:"none", boxSizing:"border-box", fontFamily:"inherit", background:"white" };

/* ── MAIN APP ── */
export default function SmartCare() {
  const [page,setPage]               = useState("dashboard");
  const [residents,setResidents]     = useState(SAMPLE);
  const [healthRecs,setHealthRecs]   = useState([]);
  const [medications,setMedications] = useState(SAMPLE_MEDS);
  const [medLogs,setMedLogs]         = useState([]);
  const [aiResults,setAiResults]     = useState({});
  const [summaryData,setSummaryData] = useState(null);
  const [modal,setModal]             = useState(null);

  useEffect(()=>{ const s=document.createElement("style"); s.id="sc-print"; s.textContent="@media print{#smartcare-app{display:none!important}#smartcare-print{display:block!important}@page{margin:14mm;size:A4}body{margin:0}}"; document.head.appendChild(s); return()=>{try{document.head.removeChild(s);}catch{}}; },[]);

  useEffect(()=>{
    (async()=>{
      try{const r=localStorage.getItem(STORAGE_KEY);if(r)setResidents(JSON.parse(r));}catch{}
      try{const h=localStorage.getItem(RECORDS_KEY);if(h)setHealthRecs(JSON.parse(h));}catch{}
      try{const m=localStorage.getItem(MEDS_KEY);if(m)setMedications(JSON.parse(m));}catch{}
      try{const l=localStorage.getItem(LOGS_KEY);if(l)setMedLogs(JSON.parse(l));}catch{}
      try{const a=localStorage.getItem(AI_KEY);if(a)setAiResults(JSON.parse(a));}catch{}
      try{const w=localStorage.getItem(SUMMARY_KEY);if(w)setSummaryData(JSON.parse(w));}catch{}
    })();
  },[]);

  const saveR  = async(u)=>{setResidents(u);try{localStorage.setItem(STORAGE_KEY,JSON.stringify(u));}catch{}};
  const addRec = async(rec)=>{const u=[...healthRecs,{...rec,id:`hr_${Date.now()}`}];setHealthRecs(u);try{localStorage.setItem(RECORDS_KEY,JSON.stringify(u));return true;}catch{return false;}};
  const addMed = async(med)=>{const u=[...medications,{...med,id:`med_${Date.now()}`,active:true}];setMedications(u);try{localStorage.setItem(MEDS_KEY,JSON.stringify(u));return true;}catch{return false;}};
  const togMed = async(id)=>{const u=medications.map(m=>m.id===id?{...m,active:!m.active}:m);setMedications(u);try{localStorage.setItem(MEDS_KEY,JSON.stringify(u));}catch{}};
  const delMed = async(id)=>{const u=medications.filter(m=>m.id!==id);setMedications(u);try{localStorage.setItem(MEDS_KEY,JSON.stringify(u));}catch{}};
  const markMed= async(medicationId,residentId,time,status)=>{const ex=medLogs.find(l=>l.medicationId===medicationId&&l.date===todayStr()&&l.time===time);const u=ex?medLogs.map(l=>l.id===ex.id?{...l,status}:l):[...medLogs,{id:`log_${Date.now()}`,medicationId,residentId,date:todayStr(),time,status}];setMedLogs(u);try{localStorage.setItem(LOGS_KEY,JSON.stringify(u));}catch{}};
  const saveAI = async(residentId,result)=>{const upd={...aiResults,[residentId]:{...result,analyzedAt:new Date().toISOString()}};setAiResults(upd);try{localStorage.setItem(AI_KEY,JSON.stringify(upd));}catch{} const rm={"Low":"stable","Moderate":"moderate","High":"high"};const ur=residents.map(r=>r.id===residentId?{...r,risk:rm[result.riskLevel]||"stable"}:r);setResidents(ur);try{localStorage.setItem(STORAGE_KEY,JSON.stringify(ur));}catch{}};
  const saveSum= async(s)=>{setSummaryData(s);try{localStorage.setItem(SUMMARY_KEY,JSON.stringify(s));}catch{}};
  const addRes =(d)=>saveR([...residents,{...d,id:genId(),risk:"stable"}]).then(()=>setModal(null));
  const editRes=(d)=>saveR(residents.map(r=>r.id===d.id?{...r,...d}:r)).then(()=>setModal(null));
  const delRes =(id)=>saveR(residents.filter(r=>r.id!==id)).then(()=>setModal(null));

  const counts={total:residents.length,high:residents.filter(r=>r.risk==="high").length,moderate:residents.filter(r=>r.risk==="moderate").length,stable:residents.filter(r=>r.risk==="stable").length};
  const todayCount=healthRecs.filter(r=>r.date===todayStr()).length;
  const missedToday=medLogs.filter(l=>l.date===todayStr()&&l.status==="missed").length;
  const alertCount=counts.high+missedToday;

  return(<>
    <div id="smartcare-app" style={{display:"flex",height:"100vh",fontFamily:"'Segoe UI',system-ui,sans-serif",fontSize:14,overflow:"hidden"}}>
      <Sidebar page={page} setPage={setPage} alertCount={alertCount}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:"#F1F5F9"}}>
        <TopBar page={page} alertCount={alertCount}/>
        <main style={{flex:1,overflowY:"auto",padding:"24px 28px"}}>
          {page==="dashboard"  &&<DashboardPage counts={counts} residents={residents} todayCount={todayCount} missedToday={missedToday} setPage={setPage}/>}
          {page==="residents"  &&<ResidentsPage residents={residents} setModal={setModal}/>}
          {page==="health"     &&<HealthPage residents={residents} healthRecs={healthRecs} onAddRecord={addRec}/>}
          {page==="medication" &&<MedicationPage residents={residents} medications={medications} medLogs={medLogs} onAddMed={addMed} onToggleActive={togMed} onDeleteMed={delMed} onMarkMed={markMed}/>}
          {page==="ai"         &&<AIPage residents={residents} healthRecs={healthRecs} medications={medications} medLogs={medLogs} aiResults={aiResults} onSaveResult={saveAI}/>}
          {page==="reports"    &&<ReportsPage residents={residents} healthRecs={healthRecs} medications={medications} medLogs={medLogs} aiResults={aiResults} summaryData={summaryData} onSummarySave={saveSum}/>}
        </main>
      </div>
      {modal?.mode==="add"    &&<ResidentModal mode="add"  onSave={addRes}  onClose={()=>setModal(null)}/>}
      {modal?.mode==="edit"   &&<ResidentModal mode="edit" onSave={editRes} onClose={()=>setModal(null)} resident={modal.resident}/>}
      {modal?.mode==="delete" &&<DeleteConfirm resident={modal.resident} onConfirm={()=>delRes(modal.resident.id)} onClose={()=>setModal(null)}/>}
      {modal?.mode==="view"   &&<ViewResident  resident={modal.resident} onEdit={()=>setModal({mode:"edit",resident:modal.resident})} onDelete={()=>setModal({mode:"delete",resident:modal.resident})} onClose={()=>setModal(null)}/>}
    </div>
    <PrintReport residents={residents} healthRecs={healthRecs} medications={medications} medLogs={medLogs} aiResults={aiResults} summary={summaryData}/>
  </>);
}

/* ── SIDEBAR ── */
function Sidebar({page,setPage,alertCount}){
  return(<aside style={{width:224,background:"#1E3A8A",color:"white",display:"flex",flexDirection:"column",flexShrink:0}}>
    <div style={{padding:"20px 18px 16px",borderBottom:"1px solid rgba(255,255,255,0.1)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:36,height:36,background:"#2563EB",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}}><Heart size={17} color="white" fill="white"/></div>
        <div><div style={{fontWeight:700,fontSize:15}}>SmartCare</div><div style={{fontSize:10,color:"rgba(255,255,255,0.5)",marginTop:1}}>Health Monitor</div></div>
      </div>
    </div>
    <div style={{margin:"12px 12px 4px",padding:"10px 12px",background:"rgba(255,255,255,0.07)",borderRadius:8,border:"1px solid rgba(255,255,255,0.11)"}}>
      <div style={{fontSize:9,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3}}>Partner NGO</div>
      <div style={{fontSize:11,color:"rgba(255,255,255,0.88)",fontWeight:600,lineHeight:1.4}}>Bharathamatha Family Welfare Foundation</div>
      <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",marginTop:4}}>TN/2009/0002669</div>
    </div>
    <nav style={{flex:1,padding:"8px 10px"}}>
      {NAV.map(({id,label,icon:Icon})=>{const active=page===id;return(<button key={id} onClick={()=>setPage(id)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 10px",borderRadius:8,border:"none",cursor:"pointer",background:active?"rgba(255,255,255,0.15)":"transparent",color:active?"white":"rgba(255,255,255,0.58)",fontWeight:active?600:400,fontSize:13,marginBottom:2,textAlign:"left"}}>
        <Icon size={15}/><span style={{flex:1}}>{label}</span>
        {id==="ai"&&<span style={{background:"#2563EB",color:"white",fontSize:9,padding:"1px 6px",borderRadius:10,fontWeight:700}}>AI</span>}
        {id==="reports"&&alertCount>0&&<span style={{background:"#EF4444",color:"white",fontSize:9,padding:"1px 7px",borderRadius:10,fontWeight:700}}>{alertCount}</span>}
      </button>);})}
    </nav>
    <div style={{padding:"14px 16px",borderTop:"1px solid rgba(255,255,255,0.1)",fontSize:10,color:"rgba(255,255,255,0.3)",lineHeight:1.7}}>21GNP301L Community Connect<br/>SRM IST Trichy · AIML</div>
  </aside>);
}

/* ── TOP BAR ── */
function TopBar({page,alertCount}){
  const [show,setShow]=useState(false);
  return(<header style={{background:"white",padding:"13px 28px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #E5E7EB",flexShrink:0}}>
    <div>
      <div style={{fontSize:17,fontWeight:700,color:"#0F172A"}}>{NAV.find(n=>n.id===page)?.label}</div>
      <div style={{fontSize:11,color:"#94A3B8",marginTop:2}}>{new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:14}}>
      <div style={{position:"relative",cursor:"pointer"}}>
        <Bell size={18} color="#64748B"/>
        {alertCount>0&&<span style={{position:"absolute",top:-5,right:-6,background:"#EF4444",color:"white",borderRadius:10,fontSize:9,padding:"1px 5px",fontWeight:700}}>{alertCount}</span>}
      </div>
      <div style={{position:"relative"}}>
        <div onClick={()=>setShow(p=>!p)} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"5px 10px",borderRadius:8,border:"1px solid transparent"}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:"#EFF6FF",border:"2px solid #BFDBFE",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#1E40AF"}}>CA</div>
          <span style={{fontSize:12,color:"#374151",fontWeight:600}}>Caretaker</span>
          <ChevronRight size={12} color="#94A3B8"/>
        </div>
        {show&&<div style={{position:"absolute",right:0,top:"calc(100% + 8px)",background:"white",borderRadius:12,border:"1px solid #E2E8F0",boxShadow:"0 8px 24px rgba(0,0,0,0.12)",width:240,zIndex:200,padding:8}}>
          <div style={{padding:"10px 12px",fontSize:13,color:"#374151",fontWeight:600}}>Bharathamatha FWF</div>
          <div style={{padding:"4px 12px",fontSize:11,color:"#94A3B8",marginBottom:6}}>DARPAN: TN/2009/0002669</div>
          <button onClick={()=>setShow(false)} style={{width:"100%",padding:"8px 12px",textAlign:"left",border:"none",borderRadius:8,background:"transparent",cursor:"pointer",fontSize:12,color:"#64748B",display:"flex",alignItems:"center",gap:6}}><X size={12}/> Close</button>
        </div>}
      </div>
    </div>
  </header>);
}

/* ── STAT CARD ── */
function StatCard({label,value,icon:Icon,bg,fg}){
  return(<div style={{background:"white",borderRadius:12,padding:"18px 20px",border:"1px solid #E2E8F0"}}>
    <div style={{marginBottom:14}}><div style={{width:38,height:38,background:bg,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon size={18} color={fg}/></div></div>
    <div style={{fontSize:30,fontWeight:700,color:"#0F172A",lineHeight:1}}>{value}</div>
    <div style={{fontSize:12,color:"#94A3B8",marginTop:6,fontWeight:500}}>{label}</div>
  </div>);
}

/* ── DASHBOARD ── */
function DashboardPage({counts,residents,todayCount,missedToday,setPage}){
  const ACTIONS=[{label:"Add resident",icon:Plus,target:"residents",color:"#1D4ED8"},{label:"Log health data",icon:Activity,target:"health",color:"#15803D"},{label:"Medication schedule",icon:Pill,target:"medication",color:"#B45309"},{label:"Run AI analysis",icon:Brain,target:"ai",color:"#7C3AED"}];
  return(<div>
    {counts.high>0&&<div style={{background:"#FFF1F2",border:"1px solid #FECDD3",borderRadius:10,padding:"11px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}><AlertTriangle size={15} color="#DC2626"/><span style={{color:"#BE123C",fontSize:13,fontWeight:600}}>{counts.high} resident{counts.high>1?"s":""} require immediate attention</span></div>}
    {missedToday>0&&<div style={{background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:10,padding:"11px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}><Pill size={15} color="#D97706"/><span style={{color:"#92400E",fontSize:13,fontWeight:600}}>{missedToday} dose{missedToday>1?"s":""} missed today</span></div>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
      <StatCard label="Total residents" value={counts.total}    icon={Users}         bg="#EFF6FF" fg="#1D4ED8"/>
      <StatCard label="High risk"       value={counts.high}     icon={AlertTriangle} bg="#FEF2F2" fg="#DC2626"/>
      <StatCard label="Moderate risk"   value={counts.moderate} icon={Activity}      bg="#FFFBEB" fg="#D97706"/>
      <StatCard label="Stable"          value={counts.stable}   icon={Heart}         bg="#F0FDF4" fg="#16A34A"/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:20}}>
      <div style={{background:"white",borderRadius:12,border:"1px solid #E2E8F0",overflow:"hidden"}}>
        <div style={{padding:"15px 20px",borderBottom:"1px solid #F1F5F9",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontWeight:700,fontSize:14,color:"#0F172A"}}>Residents overview</span>
          <button onClick={()=>setPage("residents")} style={{display:"flex",alignItems:"center",gap:4,fontSize:12,color:"#2563EB",background:"none",border:"none",cursor:"pointer",fontWeight:600}}>View all <ChevronRight size={12}/></button>
        </div>
        {residents.map((r,i)=>{const rs=RISK[r.risk];return(<div key={r.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 20px",borderBottom:i<residents.length-1?"1px solid #F8FAFC":"none"}}>
          <div style={{width:36,height:36,borderRadius:"50%",background:"#EFF6FF",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#1D4ED8",flexShrink:0}}>{r.name.charAt(0)}</div>
          <div style={{flex:1}}><div style={{fontWeight:600,fontSize:13,color:"#1E293B"}}>{r.name}</div><div style={{fontSize:11,color:"#94A3B8"}}>{r.conditions.join(", ")||"No conditions"}</div></div>
          <span style={{display:"inline-flex",alignItems:"center",gap:4,background:rs.bg,color:rs.fg,padding:"3px 9px",borderRadius:20,fontSize:11,fontWeight:600}}><span style={{width:5,height:5,borderRadius:"50%",background:rs.dot}}/>{rs.label}</span>
        </div>);})}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{background:"white",borderRadius:12,border:"1px solid #E2E8F0",padding:"16px 18px"}}><div style={{fontSize:12,color:"#94A3B8",marginBottom:4,fontWeight:600}}>Today's health checks</div><div style={{fontSize:28,fontWeight:700,color:"#0F172A"}}>{todayCount}</div></div>
        <div style={{background:"white",borderRadius:12,border:"1px solid #E2E8F0",padding:"16px 18px"}}><div style={{fontSize:12,color:"#94A3B8",marginBottom:4,fontWeight:600}}>Missed doses today</div><div style={{fontSize:28,fontWeight:700,color:missedToday>0?"#DC2626":"#0F172A"}}>{missedToday}</div></div>
        <div style={{background:"white",borderRadius:12,border:"1px solid #E2E8F0",padding:"14px 16px"}}>
          <div style={{fontSize:12,color:"#94A3B8",marginBottom:10,fontWeight:600}}>Quick actions</div>
          {ACTIONS.map(a=><button key={a.target} onClick={()=>setPage(a.target)} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"8px 10px",border:"none",borderRadius:8,background:a.color+"10",cursor:"pointer",fontSize:12,color:a.color,fontWeight:600,textAlign:"left",marginBottom:6}}><a.icon size={13}/>{a.label}</button>)}
        </div>
      </div>
    </div>
  </div>);
}

/* ── RESIDENTS PAGE ── */
function ResidentsPage({residents,setModal}){
  return(<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <div style={{fontSize:13,color:"#64748B"}}>{residents.length} residents</div>
      <button onClick={()=>setModal({mode:"add"})} style={{display:"flex",alignItems:"center",gap:6,background:"#1E3A8A",color:"white",border:"none",borderRadius:8,padding:"9px 18px",fontSize:13,fontWeight:600,cursor:"pointer"}}><Plus size={14}/> Add resident</button>
    </div>
    <div style={{background:"white",borderRadius:12,border:"1px solid #E2E8F0",overflow:"hidden"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr style={{background:"#F8FAFC",borderBottom:"1px solid #E2E8F0"}}>{["Resident","Age","Room","Blood","Conditions","Risk","Actions"].map(h=><th key={h} style={{padding:"11px 16px",textAlign:"left",fontSize:11,fontWeight:600,color:"#64748B",textTransform:"uppercase",letterSpacing:"0.06em",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
        <tbody>
          {residents.length===0?<tr><td colSpan={7} style={{padding:"48px 16px",textAlign:"center",color:"#94A3B8",fontSize:13}}>No residents yet.</td></tr>
          :residents.map((r,i)=>{const rs=RISK[r.risk];return(<tr key={r.id} style={{borderBottom:i<residents.length-1?"1px solid #F1F5F9":"none"}}>
            <td style={{padding:"13px 16px"}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:34,height:34,borderRadius:"50%",background:"#EFF6FF",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#1D4ED8"}}>{r.name.charAt(0)}</div><div><div style={{fontWeight:600,fontSize:13,color:"#1E293B"}}>{r.name}</div><div style={{fontSize:11,color:"#94A3B8"}}>{r.gender==="M"?"Male":"Female"}</div></div></div></td>
            <td style={{padding:"13px 16px",fontSize:13,color:"#374151"}}>{r.age}</td>
            <td style={{padding:"13px 16px"}}><span style={{background:"#F1F5F9",color:"#475569",fontSize:11,padding:"2px 8px",borderRadius:5,fontWeight:600}}>{r.room}</span></td>
            <td style={{padding:"13px 16px",fontSize:13,color:"#374151"}}>{r.blood}</td>
            <td style={{padding:"13px 16px"}}>{r.conditions.length>0?<div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{r.conditions.map(c=><span key={c} style={{background:"#F1F5F9",color:"#475569",fontSize:11,padding:"2px 8px",borderRadius:5}}>{c}</span>)}</div>:<span style={{color:"#CBD5E1",fontSize:12}}>None</span>}</td>
            <td style={{padding:"13px 16px"}}><span style={{display:"inline-flex",alignItems:"center",gap:5,background:rs.bg,color:rs.fg,padding:"4px 10px",borderRadius:20,fontSize:11,fontWeight:600}}><span style={{width:6,height:6,borderRadius:"50%",background:rs.dot}}/>{rs.label}</span></td>
            <td style={{padding:"13px 16px"}}><div style={{display:"flex",gap:6}}>
              <button onClick={()=>setModal({mode:"view",resident:r})} style={{background:"#EFF6FF",color:"#1D4ED8",border:"1px solid #BFDBFE",borderRadius:6,padding:"5px 10px",fontSize:11,cursor:"pointer",fontWeight:600}}>View</button>
              <button onClick={()=>setModal({mode:"edit",resident:r})} style={{background:"#F8FAFC",color:"#475569",border:"1px solid #E2E8F0",borderRadius:6,padding:"5px 8px",fontSize:11,cursor:"pointer",display:"flex",alignItems:"center"}}><Pencil size={12}/></button>
              <button onClick={()=>setModal({mode:"delete",resident:r})} style={{background:"#FFF1F2",color:"#BE123C",border:"1px solid #FECDD3",borderRadius:6,padding:"5px 8px",fontSize:11,cursor:"pointer",display:"flex",alignItems:"center"}}><Trash2 size={12}/></button>
            </div></td>
          </tr>);})}
        </tbody>
      </table>
    </div>
  </div>);
}

/* ── HEALTH PAGE ── */
function HealthPage({residents,healthRecs,onAddRecord}){
  const [selectedId,setSelectedId]=useState(residents[0]?.id??null);
  const selected=residents.find(r=>r.id===selectedId);
  const records=healthRecs.filter(r=>r.residentId===selectedId).sort((a,b)=>new Date(`${b.date}T${b.time||"00:00"}`)-new Date(`${a.date}T${a.time||"00:00"}`));
  return(<div>
    <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
      {residents.map(r=>{const active=r.id===selectedId;return(<button key={r.id} onClick={()=>setSelectedId(r.id)} style={{display:"flex",alignItems:"center",gap:7,padding:"7px 14px",borderRadius:30,border:`1.5px solid ${active?"#1E3A8A":"#E2E8F0"}`,background:active?"#EFF6FF":"white",cursor:"pointer",fontSize:13,color:active?"#1E3A8A":"#374151",fontWeight:active?700:500}}><span style={{width:7,height:7,borderRadius:"50%",background:RISK[r.risk].dot,flexShrink:0}}/>{r.name}</button>);})}
    </div>
    {selected&&<>
      <div style={{background:"white",borderRadius:12,border:"1px solid #E2E8F0",padding:"14px 20px",marginBottom:20,display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:44,height:44,borderRadius:"50%",background:"#EFF6FF",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:"#1D4ED8"}}>{selected.name.charAt(0)}</div>
        <div style={{flex:1}}><div style={{fontWeight:700,fontSize:15,color:"#0F172A"}}>{selected.name}</div><div style={{fontSize:12,color:"#94A3B8",marginTop:2}}>Age {selected.age} · Room {selected.room} · {selected.conditions.join(", ")||"No conditions"}</div></div>
        <span style={{display:"inline-flex",alignItems:"center",gap:5,background:RISK[selected.risk].bg,color:RISK[selected.risk].fg,padding:"4px 12px",borderRadius:20,fontSize:12,fontWeight:600}}><span style={{width:6,height:6,borderRadius:"50%",background:RISK[selected.risk].dot}}/>{RISK[selected.risk].label}</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"400px 1fr",gap:20,alignItems:"start"}}>
        <HealthForm resident={selected} onSave={onAddRecord}/>
        <HealthHistory records={records} residentName={selected.name}/>
      </div>
    </>}
  </div>);
}

function HealthForm({resident,onSave}){
  const [form,setForm]=useState(blankRecord());const [saved,setSaved]=useState(false);const [error,setError]=useState("");
  const upd=(k,v)=>setForm(f=>({...f,[k]:v}));
  const dyn=(val,mn,mx)=>{const s=checkStatus(val,mn,mx);return{border:`1.5px solid ${!s?"#D1D5DB":s==="normal"?"#22C55E":s==="high"?"#EF4444":"#F59E0B"}`,background:!s?"white":s==="normal"?"#F0FDF4":s==="high"?"#FEF2F2":"#FFFBEB"};};
  const handleSave=async()=>{setError("");const hasData=form.bp_systolic||form.blood_sugar||form.temperature||form.heart_rate||form.oxygen;if(!hasData){setError("Enter at least one reading.");return;}const ok=await onSave({residentId:resident.id,date:form.date,time:form.time,bp_systolic:form.bp_systolic!==""?Number(form.bp_systolic):null,bp_diastolic:form.bp_diastolic!==""?Number(form.bp_diastolic):null,blood_sugar:form.blood_sugar!==""?Number(form.blood_sugar):null,temperature:form.temperature!==""?Number(form.temperature):null,heart_rate:form.heart_rate!==""?Number(form.heart_rate):null,weight:form.weight!==""?Number(form.weight):null,oxygen:form.oxygen!==""?Number(form.oxygen):null,notes:form.notes});if(ok){setSaved(true);setTimeout(()=>setSaved(false),3000);setForm(f=>({...blankRecord(),date:f.date,time:f.time}));}};
  return(<div style={{background:"white",borderRadius:12,border:"1px solid #E2E8F0",overflow:"hidden"}}>
    <div style={{padding:"14px 18px",borderBottom:"1px solid #F1F5F9",background:"#F8FAFC"}}><div style={{fontWeight:700,fontSize:14,color:"#0F172A"}}>Log Health Data</div><div style={{fontSize:11,color:"#94A3B8",marginTop:2}}>For {resident.name}</div></div>
    <div style={{padding:"16px 18px"}}>
      {saved&&<div style={{padding:"9px 14px",background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:8,color:"#15803D",fontSize:13,fontWeight:600,marginBottom:14}}>Saved!</div>}
      {error&&<div style={{padding:"9px 14px",background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,color:"#DC2626",fontSize:12,marginBottom:14}}>{error}</div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
        <div><label style={labelSt}>Date</label><input type="date" value={form.date} onChange={e=>upd("date",e.target.value)} style={baseInp}/></div>
        <div><label style={labelSt}>Time</label><input type="time" value={form.time} onChange={e=>upd("time",e.target.value)} style={baseInp}/></div>
      </div>
      <div style={{marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:5}}><label style={labelSt}>Blood Pressure</label><span style={{fontSize:10,color:"#94A3B8"}}>90-140 / 60-90 mmHg</span></div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <input type="number" value={form.bp_systolic} onChange={e=>upd("bp_systolic",e.target.value)} placeholder="120" style={{flex:1,padding:"8px 10px",borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit",...dyn(form.bp_systolic,90,140)}}/>
          <span style={{color:"#94A3B8",fontWeight:700,fontSize:18}}>/</span>
          <input type="number" value={form.bp_diastolic} onChange={e=>upd("bp_diastolic",e.target.value)} placeholder="80" style={{flex:1,padding:"8px 10px",borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit",...dyn(form.bp_diastolic,60,90)}}/>
          <span style={{color:"#64748B",fontSize:12,fontWeight:600}}>mmHg</span>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>{METRICS.map(m=><MetricInput key={m.key} {...m} value={form[m.key]} onChange={v=>upd(m.key,v)}/>)}</div>
      <div style={{marginBottom:16}}><label style={labelSt}>Notes</label><textarea value={form.notes} onChange={e=>upd("notes",e.target.value)} placeholder="Observations..." rows={2} style={{width:"100%",padding:"8px 10px",border:"1px solid #D1D5DB",borderRadius:8,fontSize:13,outline:"none",resize:"none",boxSizing:"border-box",fontFamily:"inherit"}}/></div>
      <button onClick={handleSave} style={{width:"100%",padding:"11px",background:"#1E3A8A",color:"white",border:"none",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer"}}>Save Health Record</button>
    </div>
  </div>);
}

function MetricInput({label,unit,placeholder,min,max,value,onChange}){
  const s=checkStatus(value,min,max);const bc=!s?"#D1D5DB":s==="normal"?"#22C55E":s==="high"?"#EF4444":"#F59E0B";const bg=!s?"white":s==="normal"?"#F0FDF4":s==="high"?"#FEF2F2":"#FFFBEB";
  return(<div><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><label style={{fontSize:11,fontWeight:600,color:"#374151",textTransform:"uppercase",letterSpacing:"0.04em"}}>{label}</label><span style={{fontSize:9,color:"#94A3B8"}}>{min}-{max}</span></div><div style={{position:"relative"}}><input type="number" step="any" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{width:"100%",padding:"8px 36px 8px 10px",border:`1.5px solid ${bc}`,borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box",background:bg,fontFamily:"inherit"}}/><span style={{position:"absolute",right:7,top:"50%",transform:"translateY(-50%)",fontSize:10,color:"#94A3B8",fontWeight:600,pointerEvents:"none"}}>{unit}</span></div>{s&&s!=="normal"&&<div style={{fontSize:10,color:s==="high"?"#DC2626":"#B45309",marginTop:2,fontWeight:600}}>{s==="high"?"Above normal":"Below normal"}</div>}</div>);
}

function HealthHistory({records,residentName}){
  const fd=(d)=>{if(!d)return"--";const[,m,day]=d.split("-");return`${Number(day)} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][Number(m)-1]}`;};
  const cc=(val,mn,mx)=>val==null?"#374151":(Number(val)<mn||Number(val)>mx)?"#DC2626":"#374151";
  if(records.length===0)return(<div style={{background:"white",borderRadius:12,border:"1px solid #E2E8F0"}}><div style={{padding:"14px 18px",borderBottom:"1px solid #F1F5F9",background:"#F8FAFC"}}><div style={{fontWeight:700,fontSize:14,color:"#0F172A"}}>Health History</div></div><div style={{padding:"56px 20px",textAlign:"center",color:"#94A3B8",fontSize:13}}>No records yet for {residentName}</div></div>);
  return(<div style={{background:"white",borderRadius:12,border:"1px solid #E2E8F0",overflow:"hidden"}}>
    <div style={{padding:"14px 18px",borderBottom:"1px solid #F1F5F9",background:"#F8FAFC"}}><div style={{fontWeight:700,fontSize:14,color:"#0F172A"}}>Health History</div><div style={{fontSize:11,color:"#94A3B8",marginTop:1}}>Abnormal values in red</div></div>
    <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:520}}>
      <thead><tr style={{background:"#F8FAFC",borderBottom:"1px solid #E2E8F0"}}>{["Date","Time","BP","Sugar","Temp","HR","O2","Status"].map(h=><th key={h} style={{padding:"10px 12px",textAlign:"left",fontSize:11,fontWeight:600,color:"#64748B",textTransform:"uppercase",letterSpacing:"0.05em",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
      <tbody>{records.slice(0,15).map((rec,i)=>{const st=recordStatus(rec);const rs=ROW_STATUS[st];const bpBad=(rec.bp_systolic!=null&&(rec.bp_systolic>140||rec.bp_systolic<90))||(rec.bp_diastolic!=null&&(rec.bp_diastolic>90||rec.bp_diastolic<60));return(<tr key={rec.id} style={{borderBottom:i<Math.min(records.length,15)-1?"1px solid #F1F5F9":"none"}}>
        <td style={{padding:"11px 12px",fontSize:13,color:"#1E293B",fontWeight:600,whiteSpace:"nowrap"}}>{fd(rec.date)}</td>
        <td style={{padding:"11px 12px",fontSize:12,color:"#64748B"}}>{rec.time||"--"}</td>
        <td style={{padding:"11px 12px",fontSize:12,color:bpBad?"#DC2626":"#374151",fontWeight:bpBad?700:400}}>{rec.bp_systolic!=null||rec.bp_diastolic!=null?`${rec.bp_systolic??"-"}/${rec.bp_diastolic??"-"}`:"--"}</td>
        <td style={{padding:"11px 12px",fontSize:12,color:cc(rec.blood_sugar,70,140)}}>{rec.blood_sugar!=null?rec.blood_sugar:"--"}</td>
        <td style={{padding:"11px 12px",fontSize:12,color:cc(rec.temperature,97,99)}}>{rec.temperature!=null?rec.temperature:"--"}</td>
        <td style={{padding:"11px 12px",fontSize:12,color:cc(rec.heart_rate,60,100)}}>{rec.heart_rate!=null?rec.heart_rate:"--"}</td>
        <td style={{padding:"11px 12px",fontSize:12,color:cc(rec.oxygen,95,100)}}>{rec.oxygen!=null?`${rec.oxygen}%`:"--"}</td>
        <td style={{padding:"11px 12px"}}><span style={{display:"inline-flex",alignItems:"center",background:rs.bg,color:rs.fg,padding:"3px 9px",borderRadius:20,fontSize:11,fontWeight:600}}>{rs.label}</span></td>
      </tr>);})}</tbody>
    </table></div>
  </div>);
}

/* ── MEDICATION PAGE ── */
function MedicationPage({residents,medications,medLogs,onAddMed,onToggleActive,onDeleteMed,onMarkMed}){
  const [selectedId,setSelectedId]=useState(residents[0]?.id??null);const [showAdd,setShowAdd]=useState(false);
  const selected=residents.find(r=>r.id===selectedId);const resMeds=medications.filter(m=>m.residentId===selectedId);const activeMeds=resMeds.filter(m=>m.active);
  const missedNow=medLogs.filter(l=>{const med=medications.find(m=>m.id===l.medicationId&&m.residentId===selectedId);return med&&l.date===todayStr()&&l.status==="missed";}).length;
  return(<div>
    <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
      {residents.map(r=>{const active=r.id===selectedId;const mc=medications.filter(m=>m.residentId===r.id&&m.active).length;return(<button key={r.id} onClick={()=>setSelectedId(r.id)} style={{display:"flex",alignItems:"center",gap:7,padding:"7px 14px",borderRadius:30,border:`1.5px solid ${active?"#1E3A8A":"#E2E8F0"}`,background:active?"#EFF6FF":"white",cursor:"pointer",fontSize:13,color:active?"#1E3A8A":"#374151",fontWeight:active?700:500}}>
        <span style={{width:7,height:7,borderRadius:"50%",background:RISK[r.risk].dot}}/>{r.name}
        {mc>0&&<span style={{background:active?"#BFDBFE":"#F1F5F9",color:active?"#1E3A8A":"#64748B",fontSize:10,padding:"1px 6px",borderRadius:10,fontWeight:700}}>{mc}</span>}
      </button>);})}
    </div>
    {selected&&<>
      <div style={{background:"white",borderRadius:12,border:"1px solid #E2E8F0",padding:"14px 20px",marginBottom:20,display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:44,height:44,borderRadius:"50%",background:"#EFF6FF",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:"#1D4ED8"}}>{selected.name.charAt(0)}</div>
        <div style={{flex:1}}><div style={{fontWeight:700,fontSize:15,color:"#0F172A"}}>{selected.name}</div><div style={{fontSize:12,color:"#94A3B8",marginTop:2}}>{activeMeds.length} active medication{activeMeds.length!==1?"s":""}</div></div>
        {missedNow>0&&<div style={{display:"flex",alignItems:"center",gap:6,background:"#FFF1F2",color:"#BE123C",padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:600}}><AlertTriangle size={12}/>{missedNow} missed today</div>}
        <button onClick={()=>setShowAdd(true)} style={{display:"flex",alignItems:"center",gap:6,background:"#1E3A8A",color:"white",border:"none",borderRadius:8,padding:"9px 16px",fontSize:13,fontWeight:600,cursor:"pointer"}}><Plus size={14}/> Add Medication</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <TodaySchedule activeMeds={activeMeds} medLogs={medLogs} onMark={onMarkMed} residentId={selectedId}/>
        <MedList resMeds={resMeds} medLogs={medLogs} onToggle={onToggleActive} onDelete={onDeleteMed}/>
      </div>
    </>}
    {showAdd&&selected&&<AddMedModal resident={selected} onSave={onAddMed} onClose={()=>setShowAdd(false)}/>}
  </div>);
}

function TodaySchedule({activeMeds,medLogs,onMark,residentId}){
  const today=todayStr();const getLog=(medId,time)=>medLogs.find(l=>l.medicationId===medId&&l.date===today&&l.time===time);
  const bSt=(active,color)=>({flex:1,padding:"6px 8px",border:`1.5px solid ${active?color+"88":"#E2E8F0"}`,borderRadius:7,background:active?color+"12":"white",cursor:"pointer",fontSize:12,color:active?color:"#374151",fontWeight:600});
  if(activeMeds.length===0)return(<div style={{background:"white",borderRadius:12,border:"1px solid #E2E8F0",padding:"48px 20px",textAlign:"center"}}><Pill size={24} color="#CBD5E1" style={{margin:"0 auto 12px",display:"block"}}/><div style={{fontSize:13,color:"#64748B",fontWeight:600}}>No active medications</div></div>);
  const gc=activeMeds.reduce((a,med)=>a+(med.frequency==="as_needed"?[med.id].filter(id=>getLog(id,"as_needed")?.status==="given").length:(med.times||["08:00"]).filter(t=>getLog(med.id,t)?.status==="given").length),0);
  const ts=activeMeds.reduce((a,med)=>a+(med.frequency==="as_needed"?1:(med.times?.length||1)),0);
  return(<div style={{background:"white",borderRadius:12,border:"1px solid #E2E8F0",overflow:"hidden"}}>
    <div style={{padding:"14px 18px",borderBottom:"1px solid #F1F5F9",background:"#F8FAFC",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div><div style={{fontWeight:700,fontSize:14,color:"#0F172A"}}>Today's Schedule</div></div>
      <div style={{background:"#F0FDF4",color:"#15803D",padding:"4px 10px",borderRadius:20,fontSize:12,fontWeight:700}}>{gc}/{ts} given</div>
    </div>
    <div style={{padding:"12px 16px"}}>
      {activeMeds.map((med,i)=>{const slots=med.frequency==="as_needed"?null:(med.times?.length>0?med.times:["08:00"]);return(<div key={med.id} style={{marginBottom:i<activeMeds.length-1?16:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,padding:"10px 12px",background:"#F8FAFC",borderRadius:8}}>
          <div style={{width:32,height:32,borderRadius:8,background:"#EFF6FF",display:"flex",alignItems:"center",justifyContent:"center"}}><Pill size={14} color="#1D4ED8"/></div>
          <div><div style={{fontWeight:700,fontSize:13,color:"#0F172A"}}>{med.name}</div><div style={{fontSize:11,color:"#94A3B8"}}>{med.dosage}</div></div>
        </div>
        {med.frequency==="as_needed"?(()=>{const log=getLog(med.id,"as_needed");return(<div style={{display:"flex",gap:8}}><button onClick={()=>onMark(med.id,residentId,"as_needed","given")} style={bSt(log?.status==="given","#15803D")}>Given</button><button onClick={()=>onMark(med.id,residentId,"as_needed","missed")} style={bSt(log?.status==="missed","#DC2626")}>Missed</button></div>);})()
        :<div style={{display:"flex",flexDirection:"column",gap:6}}>{slots.map(time=>{const log=getLog(med.id,time);return(<div key={time} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 10px",border:"1px solid #F1F5F9",borderRadius:8}}><span style={{fontSize:12,fontWeight:700,color:"#475569",width:56,flexShrink:0}}>{fmtTime(time)}</span><div style={{flex:1,display:"flex",gap:6}}><button onClick={()=>onMark(med.id,residentId,time,"given")} style={bSt(log?.status==="given","#15803D")}>Given</button><button onClick={()=>onMark(med.id,residentId,time,"missed")} style={bSt(log?.status==="missed","#DC2626")}>Missed</button></div></div>);})}</div>}
        {i<activeMeds.length-1&&<div style={{borderBottom:"1px solid #F1F5F9",marginTop:12}}/>}
      </div>);})}
    </div>
  </div>);
}

function MedList({resMeds,medLogs,onToggle,onDelete}){
  const [cd,setCd]=useState(null);
  const comp=(id)=>{const l=medLogs.filter(m=>m.medicationId===id);return l.length?`${l.filter(x=>x.status==="given").length}/${l.length} given`:null;};
  if(resMeds.length===0)return(<div style={{background:"white",borderRadius:12,border:"1px solid #E2E8F0",padding:"48px 20px",textAlign:"center",color:"#94A3B8",fontSize:13}}>No medications yet.</div>);
  return(<div style={{background:"white",borderRadius:12,border:"1px solid #E2E8F0",overflow:"hidden"}}>
    <div style={{padding:"14px 18px",borderBottom:"1px solid #F1F5F9",background:"#F8FAFC"}}><div style={{fontWeight:700,fontSize:14,color:"#0F172A"}}>All Medications</div><div style={{fontSize:11,color:"#94A3B8",marginTop:1}}>{resMeds.filter(m=>m.active).length} active</div></div>
    <div style={{padding:"8px 16px"}}>
      {resMeds.map((med,i)=>{const c=comp(med.id);return(<div key={med.id} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"12px 0",borderBottom:i<resMeds.length-1?"1px solid #F1F5F9":"none"}}>
        <div style={{width:36,height:36,borderRadius:8,background:med.active?"#EFF6FF":"#F1F5F9",display:"flex",alignItems:"center",justifyContent:"center"}}><Pill size={15} color={med.active?"#1D4ED8":"#94A3B8"}/></div>
        <div style={{flex:1}}>
          <div style={{fontWeight:600,fontSize:13,color:med.active?"#0F172A":"#94A3B8"}}>{med.name}{!med.active&&<span style={{fontSize:10,background:"#F1F5F9",color:"#94A3B8",padding:"1px 6px",borderRadius:4,marginLeft:6}}>Paused</span>}</div>
          <div style={{fontSize:11,color:"#94A3B8",marginTop:2}}>{med.dosage} · {FREQ_OPTIONS.find(f=>f.value===med.frequency)?.label}</div>
          {med.notes&&<div style={{fontSize:11,color:"#64748B",marginTop:2,fontStyle:"italic"}}>{med.notes}</div>}
          {c&&<div style={{fontSize:10,color:"#15803D",marginTop:3,fontWeight:600}}>Compliance: {c}</div>}
        </div>
        <div style={{display:"flex",gap:5}}>
          <button onClick={()=>onToggle(med.id)} style={{padding:"4px 10px",border:"1px solid #E2E8F0",borderRadius:6,background:"white",cursor:"pointer",fontSize:11,color:"#374151"}}>{med.active?"Pause":"Resume"}</button>
          {cd===med.id?<><button onClick={()=>{onDelete(med.id);setCd(null);}} style={{padding:"4px 8px",border:"1px solid #FECDD3",borderRadius:6,background:"#FFF1F2",cursor:"pointer",fontSize:11,color:"#BE123C",fontWeight:700}}>Delete</button><button onClick={()=>setCd(null)} style={{padding:"4px 8px",border:"1px solid #E2E8F0",borderRadius:6,background:"white",cursor:"pointer",fontSize:11}}>x</button></>
          :<button onClick={()=>setCd(med.id)} style={{padding:"4px 8px",border:"1px solid #FECDD3",borderRadius:6,background:"#FFF1F2",cursor:"pointer",fontSize:11,color:"#BE123C",display:"flex",alignItems:"center"}}><Trash2 size={11}/></button>}
        </div>
      </div>);})}
    </div>
  </div>);
}

function AddMedModal({resident,onSave,onClose}){
  const [form,setForm]=useState(blankMed());const [errors,setErrors]=useState({});const [saving,setSaving]=useState(false);
  const upd=(k,v)=>{setForm(f=>{const u={...f,[k]:v};if(k==="frequency"){const opt=FREQ_OPTIONS.find(o=>o.value===v);u.times=opt?[...opt.defaultTimes]:[];}return u;});setErrors(e=>({...e,[k]:undefined}));};
  const submit=async()=>{const e={};if(!form.name.trim())e.name="Required";if(Object.keys(e).length){setErrors(e);return;}setSaving(true);const ok=await onSave({...form,residentId:resident.id});if(ok)onClose();setSaving(false);};
  return(<div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}}>
    <div style={{background:"white",borderRadius:16,width:"100%",maxWidth:480,maxHeight:"90vh",overflow:"auto",boxShadow:"0 24px 48px rgba(0,0,0,0.3)"}}>
      <div style={{padding:"20px 24px 16px",borderBottom:"1px solid #F1F5F9",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"white"}}>
        <div style={{fontSize:16,fontWeight:700,color:"#0F172A"}}>Add Medication — {resident.name}</div>
        <button onClick={onClose} style={{width:32,height:32,borderRadius:"50%",background:"#F1F5F9",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={15} color="#64748B"/></button>
      </div>
      <div style={{padding:"20px 24px"}}>
        <Field label="Medicine name *" error={errors.name}><input value={form.name} onChange={e=>upd("name",e.target.value)} placeholder="e.g. Metformin" style={iStyle(errors.name)}/></Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <Field label="Dosage"><input value={form.dosage} onChange={e=>upd("dosage",e.target.value)} placeholder="e.g. 500mg" style={iStyle()}/></Field>
          <Field label="Frequency"><select value={form.frequency} onChange={e=>upd("frequency",e.target.value)} style={iStyle()}>{FREQ_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
        </div>
        {form.frequency!=="as_needed"&&form.times.length>0&&<div style={{marginBottom:16}}><label style={labelSt}>Times</label><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{form.times.map((t,idx)=><div key={idx} style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:12,color:"#64748B"}}>Dose {idx+1}:</span><input type="time" value={t} onChange={e=>{const times=[...form.times];times[idx]=e.target.value;upd("times",times);}} style={{padding:"7px 10px",border:"1px solid #D1D5DB",borderRadius:7,fontSize:13,outline:"none",fontFamily:"inherit"}}/></div>)}</div></div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <Field label="Start date"><input type="date" value={form.startDate} onChange={e=>upd("startDate",e.target.value)} style={iStyle()}/></Field>
          <Field label="Notes"><input value={form.notes} onChange={e=>upd("notes",e.target.value)} placeholder="e.g. After food" style={iStyle()}/></Field>
        </div>
      </div>
      <div style={{padding:"14px 24px",borderTop:"1px solid #F1F5F9",display:"flex",gap:10,justifyContent:"flex-end",position:"sticky",bottom:0,background:"white"}}>
        <button onClick={onClose} style={{padding:"9px 20px",border:"1px solid #E2E8F0",borderRadius:8,background:"white",cursor:"pointer",fontSize:13,color:"#374151"}}>Cancel</button>
        <button onClick={submit} disabled={saving} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 20px",border:"none",borderRadius:8,background:"#1E3A8A",cursor:"pointer",fontSize:13,color:"white",fontWeight:600,opacity:saving?0.7:1}}><Plus size={14}/>{saving?"Saving...":"Add Medication"}</button>
      </div>
    </div>
  </div>);
}

/* ── AI PAGE ── */
function AIPage({residents,healthRecs,medications,medLogs,aiResults,onSaveResult}){
  const [selectedId,setSelectedId]=useState(residents[0]?.id??null);
  const [loading,setLoading]=useState(false);const [error,setError]=useState("");
  const selected=residents.find(r=>r.id===selectedId);const result=selected?aiResults[selectedId]:null;
  const run=async()=>{
    if(!selected)return;setLoading(true);setError("");
    const recentRecs=healthRecs.filter(r=>r.residentId===selectedId).sort((a,b)=>new Date(`${b.date}T${b.time||"00:00"}`)-new Date(`${a.date}T${a.time||"00:00"}`)).slice(0,3);
    const hs=recentRecs.length>0?recentRecs.map((r,i)=>`Reading ${i+1} (${r.date}): BP=${r.bp_systolic!=null?`${r.bp_systolic}/${r.bp_diastolic}mmHg`:"N/R"}, Sugar=${r.blood_sugar!=null?`${r.blood_sugar}mg/dL`:"N/R"}, Temp=${r.temperature!=null?`${r.temperature}F`:"N/R"}, HR=${r.heart_rate!=null?`${r.heart_rate}bpm`:"N/R"}, O2=${r.oxygen!=null?`${r.oxygen}%`:"N/R"}`).join("\n"):"No health records";
    const resMeds=medications.filter(m=>m.residentId===selectedId&&m.active);
    const sevenAgo=new Date();sevenAgo.setDate(sevenAgo.getDate()-7);
    const recLogs=medLogs.filter(l=>l.residentId===selectedId&&new Date(l.date)>=sevenAgo);
    const ms=resMeds.length>0?resMeds.map(med=>{const logs=recLogs.filter(l=>l.medicationId===med.id);return`${med.name} ${med.dosage}: ${logs.filter(l=>l.status==="given").length} given, ${logs.filter(l=>l.status==="missed").length} missed`;}).join("\n"):"No active medications";
    try{
      const response=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":"sk-ant-api03-Fx39-fL60ATBNDeSKKarb38L8aXF1IWoPFNv7t6P7DN_WQ7dYbSHleze46mnQaSaa9XrTuZ9vAuzEytKinisjw-1K0kOQAA","anthropic-version":"2023-06-01"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,messages:[{role:"user",content:`You are a medical AI for SmartCare, Bharathamatha Family Welfare Foundation old age home, Tamil Nadu.\nAnalyze this resident and respond ONLY with valid JSON:\n\nRESIDENT: ${selected.name}, Age ${selected.age}, ${selected.gender==="M"?"Male":"Female"}\nCONDITIONS: ${selected.conditions.join(", ")||"None"}\nHEALTH:\n${hs}\nMEDICATION (last 7 days):\n${ms}\n\nJSON:\n{"riskLevel":"Low or Moderate or High","riskScore":0-100,"riskFactors":["f1","f2","f3"],"recommendations":{"medication":["r1","r2"],"diet":["r1","r2"],"activity":["r1","r2"],"monitoring":["r1","r2"]},"summary":"one sentence"}`}]})});
      const data=await response.json();
      const text=data.content?.find(b=>b.type==="text")?.text||"";
      const parsed=JSON.parse(text.replace(/```json|```/g,"").trim());
      await onSaveResult(selectedId,parsed);
    }catch{setError("Analysis failed. Check connection and try again.");}
    finally{setLoading(false);}
  };
  return(<div>
    <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
      {residents.map(r=>{const active=r.id===selectedId;const done=!!aiResults[r.id];return(<button key={r.id} onClick={()=>setSelectedId(r.id)} style={{display:"flex",alignItems:"center",gap:7,padding:"7px 14px",borderRadius:30,border:`1.5px solid ${active?"#1E3A8A":"#E2E8F0"}`,background:active?"#EFF6FF":"white",cursor:"pointer",fontSize:13,color:active?"#1E3A8A":"#374151",fontWeight:active?700:500}}>
        <span style={{width:7,height:7,borderRadius:"50%",background:RISK[r.risk].dot}}/>{r.name}
        {done&&<span style={{fontSize:10,background:active?"#BFDBFE":"#F0FDF4",color:active?"#1E3A8A":"#15803D",padding:"1px 6px",borderRadius:10,fontWeight:700}}>done</span>}
      </button>);})}
    </div>
    {selected&&<>
      <div style={{background:"white",borderRadius:12,border:"1px solid #E2E8F0",padding:"14px 20px",marginBottom:20,display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:44,height:44,borderRadius:"50%",background:"#EFF6FF",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:"#1D4ED8"}}>{selected.name.charAt(0)}</div>
        <div style={{flex:1}}><div style={{fontWeight:700,fontSize:15,color:"#0F172A"}}>{selected.name}</div><div style={{fontSize:12,color:"#94A3B8",marginTop:2}}>Age {selected.age} — {selected.conditions.join(", ")||"No conditions"}</div></div>
        {result&&<div style={{fontSize:11,color:"#94A3B8"}}>Analysed: {new Date(result.analyzedAt).toLocaleDateString("en-IN")}</div>}
        <button onClick={run} disabled={loading} style={{display:"flex",alignItems:"center",gap:7,padding:"9px 18px",background:"#1E3A8A",color:"white",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1}}>
          <Brain size={14}/>{loading?"Analysing...":result?"Re-analyse":"Run AI Analysis"}
        </button>
      </div>
      {loading&&<div style={{background:"white",borderRadius:12,border:"1px solid #E2E8F0",padding:"72px 20px",textAlign:"center"}}><Brain size={32} color="#1D4ED8" style={{margin:"0 auto 16px",display:"block"}}/><div style={{fontSize:16,fontWeight:700,color:"#0F172A"}}>Analysing...</div></div>}
      {!loading&&error&&<div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:12,padding:"32px 20px",textAlign:"center"}}><div style={{fontSize:13,color:"#DC2626",fontWeight:600,marginBottom:12}}>{error}</div><button onClick={run} style={{padding:"9px 24px",background:"#DC2626",color:"white",border:"none",borderRadius:8,fontSize:13,cursor:"pointer",fontWeight:600}}>Try Again</button></div>}
      {!loading&&!error&&!result&&<div style={{background:"white",borderRadius:12,border:"2px dashed #BFDBFE",padding:"56px 20px",textAlign:"center"}}><Brain size={32} color="#1D4ED8" style={{margin:"0 auto 20px",display:"block"}}/><div style={{fontSize:17,fontWeight:700,color:"#0F172A",marginBottom:8}}>AI Health Analysis</div><div style={{fontSize:13,color:"#64748B",marginBottom:20}}>Analyse {selected.name} health records and vitals for a personalised risk assessment.</div><button onClick={run} style={{display:"inline-flex",alignItems:"center",gap:8,padding:"12px 32px",background:"#1E3A8A",color:"white",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer"}}><Brain size={16}/> Run AI Analysis</button></div>}
      {!loading&&!error&&result&&<AnalysisResults result={result} onRerun={run}/>}
    </>}
  </div>);
}

function AnalysisResults({result,onRerun}){
  const RC={"Low":{bg:"#F0FDF4",fg:"#15803D",border:"#86EFAC",bar:"#22C55E"},"Moderate":{bg:"#FFFBEB",fg:"#B45309",border:"#FCD34D",bar:"#F59E0B"},"High":{bg:"#FEF2F2",fg:"#DC2626",border:"#FCA5A5",bar:"#EF4444"}};
  const rc=RC[result.riskLevel]||RC["Low"];
  const CATS=[{key:"medication",label:"Medication",icon:Pill,color:"#1D4ED8"},{key:"diet",label:"Diet",icon:Leaf,color:"#15803D"},{key:"activity",label:"Activity",icon:Zap,color:"#B45309"},{key:"monitoring",label:"Monitoring",icon:Shield,color:"#7C3AED"}];
  return(<div>
    <div style={{background:rc.bg,borderRadius:12,border:`1.5px solid ${rc.border}`,padding:"20px 24px",marginBottom:20}}>
      <div style={{display:"flex",alignItems:"center",gap:20}}>
        <div style={{textAlign:"center",minWidth:100}}>
          <div style={{fontSize:11,fontWeight:600,color:rc.fg,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>Risk Level</div>
          <div style={{fontSize:34,fontWeight:800,color:rc.fg}}>{result.riskLevel}</div>
          <div style={{fontSize:12,color:rc.fg,marginTop:4,fontWeight:600}}>Score: {result.riskScore}/100</div>
        </div>
        <div style={{flex:1}}>
          <div style={{height:10,background:"rgba(0,0,0,0.08)",borderRadius:5,marginBottom:14,overflow:"hidden"}}><div style={{height:"100%",width:`${result.riskScore}%`,background:rc.bar,borderRadius:5}}/></div>
          <div style={{fontSize:13,color:"#374151",lineHeight:1.7,fontStyle:"italic"}}>"{result.summary}"</div>
        </div>
        <button onClick={onRerun} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",border:`1px solid ${rc.border}`,borderRadius:8,background:"white",cursor:"pointer",fontSize:12,color:rc.fg,fontWeight:600}}><RefreshCw size={12}/> Re-analyse</button>
      </div>
    </div>
    <div style={{background:"white",borderRadius:12,border:"1px solid #E2E8F0",padding:"16px 20px",marginBottom:20}}>
      <div style={{fontWeight:700,fontSize:14,color:"#0F172A",marginBottom:14,display:"flex",alignItems:"center",gap:8}}><AlertTriangle size={15} color="#D97706"/> Risk Factors</div>
      {(result.riskFactors||[]).map((f,i)=><div key={i} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:i<(result.riskFactors?.length||0)-1?"1px solid #F1F5F9":"none"}}><span style={{width:8,height:8,borderRadius:"50%",background:rc.bar,flexShrink:0,marginTop:5}}/><span style={{fontSize:13,color:"#374151",lineHeight:1.6}}>{f}</span></div>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      {CATS.map(cat=><div key={cat.key} style={{background:"white",borderRadius:12,border:"1px solid #E2E8F0",overflow:"hidden"}}>
        <div style={{padding:"12px 16px",borderBottom:"1px solid #F1F5F9",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:30,height:30,borderRadius:8,background:cat.color+"18",display:"flex",alignItems:"center",justifyContent:"center"}}><cat.icon size={14} color={cat.color}/></div>
          <span style={{fontWeight:700,fontSize:13,color:"#0F172A"}}>{cat.label}</span>
        </div>
        <div style={{padding:"14px 16px"}}>
          {(result.recommendations?.[cat.key]||[]).map((rec,i)=><div key={i} style={{display:"flex",gap:8,marginBottom:i<(result.recommendations?.[cat.key]?.length||0)-1?10:0}}><span style={{color:cat.color,fontWeight:700,flexShrink:0}}>·</span><span style={{fontSize:12,color:"#374151",lineHeight:1.7}}>{rec}</span></div>)}
        </div>
      </div>)}
    </div>
    <div style={{marginTop:14,textAlign:"center",fontSize:11,color:"#94A3B8"}}>Powered by Claude (claude-sonnet-4-6) · {new Date(result.analyzedAt).toLocaleString("en-IN")}</div>
  </div>);
}

/* ══════════════════════════════════════════════
   STEP 6 — REPORTS & ALERTS PAGE
══════════════════════════════════════════════ */
function ReportsPage({residents,healthRecs,medications,medLogs,aiResults,summaryData,onSummarySave}){
  const [summaryLoading,setSummaryLoading]=useState(false);
  const [summaryError,setSummaryError]=useState("");
  const [missedRange,setMissedRange]=useState(7);

  const today=todayStr(); const weekAgo=daysAgoStr(7);
  const weekRecs=healthRecs.filter(r=>r.date>=weekAgo);
  const weekLogs=medLogs.filter(l=>l.date>=weekAgo);
  const weekGiven=weekLogs.filter(l=>l.status==="given").length;
  const weekMissed=weekLogs.filter(l=>l.status==="missed").length;
  const compRate=weekLogs.length>0?Math.round((weekGiven/weekLogs.length)*100):null;
  const highRisk=residents.filter(r=>r.risk==="high");
  const todayMissed=medLogs.filter(l=>l.date===today&&l.status==="missed");
  const missedHistory=medLogs.filter(l=>l.status==="missed"&&l.date>=daysAgoStr(missedRange)).sort((a,b)=>b.date.localeCompare(a.date));
  const snapshots=residents.map(r=>{const recs=healthRecs.filter(h=>h.residentId===r.id).sort((a,b)=>new Date(`${b.date}T${b.time||"00:00"}`)-new Date(`${a.date}T${a.time||"00:00"}`));return{r,latest:recs[0]||null,ai:aiResults[r.id]||null};});

  const generateSummary=async()=>{
    setSummaryLoading(true);setSummaryError("");
    const lines=residents.map(res=>{const rm=medications.filter(m=>m.residentId===res.id&&m.active);const rl=medLogs.filter(l=>l.residentId===res.id&&l.date>=weekAgo);const g=rl.filter(l=>l.status==="given").length;const ms=rl.filter(l=>l.status==="missed").length;const ai=aiResults[res.id];return`${res.name} (age ${res.age}, ${res.risk} risk): ${rm.length} meds, ${g} given, ${ms} missed${ai?`, AI score ${ai.riskScore}/100`:""}`;}).join("\n");
    const prompt=`You are a medical coordinator AI for SmartCare, Bharathamatha Family Welfare Foundation old age home, Tamil Nadu.\nGenerate a weekly health summary. Respond ONLY with valid JSON.\n\nFACILITY: ${residents.length} residents, ${residents.filter(r=>r.risk==="high").length} high risk, ${residents.filter(r=>r.risk==="moderate").length} moderate, ${residents.filter(r=>r.risk==="stable").length} stable\nRECORDS THIS WEEK: ${weekRecs.length}\nMEDICATION: ${weekLogs.length>0?`${compRate}% compliance (${weekGiven} given, ${weekMissed} missed)`:"No logs"}\n\nRESIDENTS:\n${lines}\n\nJSON:\n{"overallStatus":"stable or concerning or critical","headline":"one sentence","highlights":["str","str","str"],"concerns":["str","str"],"recommendations":["str","str"],"medicationNote":"one sentence"}`;
    try{
      const response=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":"sk-ant-api03-Fx39-fL60ATBNDeSKKarb38L8aXF1IWoPFNv7t6P7DN_WQ7dYbSHleze46mnQaSaa9XrTuZ9vAuzEytKinisjw-1K0kOQAA","anthropic-version":"2023-06-01"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,messages:[{role:"user",content:prompt}]})});
      const data=await res.json();
      const text=data.content?.find(b=>b.type==="text")?.text||"";
      const parsed=JSON.parse(text.replace(/```json|```/g,"").trim());
      onSummarySave({...parsed,generatedAt:new Date().toISOString()});
    }catch{setSummaryError("Failed to generate. Check your connection.");}
    finally{setSummaryLoading(false);}
  };

  const ageHrs=summaryData?Math.floor((Date.now()-new Date(summaryData.generatedAt))/(1000*3600)):null;
  const stale=ageHrs!==null&&ageHrs>168;
  const ageStr=ageHrs===null?"":ageHrs<1?"just now":ageHrs<24?`${ageHrs}h ago`:`${Math.floor(ageHrs/24)}d ago`;
  const SC={stable:{bg:"#F0FDF4",fg:"#15803D",dot:"#22C55E"},concerning:{bg:"#FFFBEB",fg:"#B45309",dot:"#F59E0B"},critical:{bg:"#FEF2F2",fg:"#DC2626",dot:"#EF4444"}};
  const sc=SC[summaryData?.overallStatus]||SC.stable;
  const vc=(val,lo,hi)=>val==null?"#374151":(Number(val)<lo||Number(val)>hi)?"#DC2626":"#374151";

  return(<div>

    {/* NEEDS ATTENTION */}
    {(highRisk.length>0||todayMissed.length>0)&&<div style={{background:"#FFF1F2",border:"1px solid #FECDD3",borderRadius:12,padding:"16px 20px",marginBottom:20}}>
      <div style={{fontWeight:700,fontSize:14,color:"#BE123C",marginBottom:12,display:"flex",alignItems:"center",gap:8}}><AlertTriangle size={15} color="#DC2626"/> Needs Attention</div>
      {highRisk.map((r,i)=><div key={r.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<highRisk.length-1||todayMissed.length>0?"1px solid #FECDD3":"none"}}>
        <div style={{width:34,height:34,borderRadius:"50%",background:"#FEE2E2",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#DC2626"}}>{r.name.charAt(0)}</div>
        <div style={{flex:1}}><div style={{fontWeight:600,fontSize:13,color:"#0F172A"}}>{r.name}</div><div style={{fontSize:11,color:"#94A3B8"}}>{r.conditions.join(", ")||"No conditions"} — Room {r.room}</div></div>
        <span style={{background:"#FEE2E2",color:"#DC2626",fontSize:11,padding:"3px 10px",borderRadius:20,fontWeight:700}}>High Risk</span>
      </div>)}
      {todayMissed.length>0&&<div style={{display:"flex",alignItems:"center",gap:8,paddingTop:highRisk.length>0?12:0,fontSize:13,color:"#92400E",fontWeight:600}}><Pill size={13} color="#D97706"/>{todayMissed.length} dose{todayMissed.length!==1?"s":""} missed today</div>}
    </div>}

    {/* STAT CARDS */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:20}}>
      <StatCard label="Records this week"  value={weekRecs.length}                              icon={Activity}      bg="#EFF6FF" fg="#1D4ED8"/>
      <StatCard label="Compliance rate"    value={compRate!==null?`${compRate}%`:"--"}          icon={Pill}          bg="#F0FDF4" fg="#15803D"/>
      <StatCard label="High risk"          value={residents.filter(r=>r.risk==="high").length}  icon={AlertTriangle} bg="#FEF2F2" fg="#DC2626"/>
      <StatCard label="Missed this week"   value={weekMissed}                                   icon={Clock}         bg="#FFFBEB" fg="#D97706"/>
    </div>

    {/* AI WEEKLY SUMMARY */}
    <div style={{background:"white",borderRadius:12,border:"1px solid #E2E8F0",marginBottom:20,overflow:"hidden"}}>
      <div style={{padding:"14px 20px",borderBottom:"1px solid #F1F5F9",background:"#F8FAFC",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:8,background:"#7C3AED18",display:"flex",alignItems:"center",justifyContent:"center"}}><Brain size={15} color="#7C3AED"/></div>
          <div><div style={{fontWeight:700,fontSize:14,color:"#0F172A"}}>AI Weekly Summary</div><div style={{fontSize:11,color:"#94A3B8",marginTop:1}}>{summaryData?`Generated ${ageStr}${stale?" · Stale":""}` : "Not yet generated"}</div></div>
        </div>
        <button onClick={generateSummary} disabled={summaryLoading} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",background:"#7C3AED",color:"white",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:summaryLoading?"not-allowed":"pointer",opacity:summaryLoading?0.7:1}}>
          <RefreshCw size={12}/>{summaryLoading?"Generating...":summaryData?"Refresh":"Generate"}
        </button>
      </div>
      <div style={{padding:"20px"}}>
        {summaryLoading&&<div style={{textAlign:"center",padding:"32px 0"}}><div style={{width:48,height:48,background:"#F3E8FF",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}><Brain size={22} color="#7C3AED"/></div><div style={{fontSize:13,color:"#64748B",fontWeight:600}}>Generating weekly summary...</div></div>}
        {!summaryLoading&&summaryError&&<div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,padding:"12px 16px",color:"#DC2626",fontSize:13}}>{summaryError}</div>}
        {!summaryLoading&&!summaryError&&!summaryData&&<div style={{textAlign:"center",padding:"32px 0"}}><div style={{fontSize:13,color:"#64748B",lineHeight:1.7,marginBottom:18}}>Generate an AI-powered weekly summary for all {residents.length} residents including medication compliance and risk trends.</div><button onClick={generateSummary} style={{display:"inline-flex",alignItems:"center",gap:7,padding:"10px 24px",background:"#7C3AED",color:"white",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}><Brain size={14}/> Generate Weekly Summary</button></div>}
        {!summaryLoading&&!summaryError&&summaryData&&<div>
          {stale&&<div style={{background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:8,padding:"8px 14px",fontSize:12,color:"#92400E",marginBottom:14,display:"flex",alignItems:"center",gap:8}}><Clock size={12}/> Summary is over 7 days old — click Refresh to update</div>}
          <div style={{display:"flex",alignItems:"flex-start",gap:12,padding:"14px 16px",background:sc.bg,borderRadius:10,border:`1px solid ${sc.dot}40`,marginBottom:16}}>
            <span style={{width:10,height:10,borderRadius:"50%",background:sc.dot,flexShrink:0,marginTop:4}}/>
            <div><div style={{fontSize:12,fontWeight:700,color:sc.fg,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3}}>{summaryData.overallStatus}</div><div style={{fontSize:13,color:"#374151",fontStyle:"italic",lineHeight:1.6}}>"{summaryData.headline}"</div></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:14}}>
            <div><div style={{fontSize:11,fontWeight:700,color:"#15803D",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:8}}>Highlights</div>{(summaryData.highlights||[]).map((h,i)=><div key={i} style={{display:"flex",gap:8,marginBottom:7,fontSize:12,color:"#374151"}}><span style={{color:"#22C55E",fontWeight:700,flexShrink:0}}>+</span>{h}</div>)}</div>
            <div><div style={{fontSize:11,fontWeight:700,color:"#DC2626",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:8}}>Concerns</div>{(summaryData.concerns||[]).map((c,i)=><div key={i} style={{display:"flex",gap:8,marginBottom:7,fontSize:12,color:"#374151"}}><span style={{color:"#EF4444",fontWeight:700,flexShrink:0}}>!</span>{c}</div>)}</div>
          </div>
          {(summaryData.recommendations||[]).length>0&&<div style={{marginBottom:14}}><div style={{fontSize:11,fontWeight:700,color:"#1D4ED8",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:8}}>Recommendations</div>{summaryData.recommendations.map((r,i)=><div key={i} style={{display:"flex",gap:8,marginBottom:7,fontSize:12,color:"#374151"}}><span style={{color:"#2563EB",fontWeight:700,flexShrink:0}}>-&gt;</span>{r}</div>)}</div>}
          {summaryData.medicationNote&&<div style={{padding:"10px 14px",background:"#F1F5F9",borderRadius:8,fontSize:12,color:"#475569"}}><b>Medication note:</b> {summaryData.medicationNote}</div>}
        </div>}
      </div>
    </div>

    {/* HEALTH SNAPSHOT */}
    <div style={{background:"white",borderRadius:12,border:"1px solid #E2E8F0",marginBottom:20,overflow:"hidden"}}>
      <div style={{padding:"14px 20px",borderBottom:"1px solid #F1F5F9",background:"#F8FAFC"}}><div style={{fontWeight:700,fontSize:14,color:"#0F172A"}}>Resident Health Snapshot</div><div style={{fontSize:11,color:"#94A3B8",marginTop:1}}>Latest vitals per resident — abnormal values in red</div></div>
      <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:720}}>
        <thead><tr style={{background:"#F8FAFC",borderBottom:"1px solid #E2E8F0"}}>{["Resident","Risk","Last Check","BP","Sugar","Temp","HR","O2","AI Score"].map(h=><th key={h} style={{padding:"10px 12px",textAlign:"left",fontSize:11,fontWeight:600,color:"#64748B",textTransform:"uppercase",letterSpacing:"0.05em",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
        <tbody>{snapshots.map(({r,latest,ai},i)=>{const rs=RISK[r.risk];const bpBad=latest&&((latest.bp_systolic>140||latest.bp_systolic<90)||(latest.bp_diastolic>90||latest.bp_diastolic<60));return(<tr key={r.id} style={{borderBottom:i<snapshots.length-1?"1px solid #F1F5F9":"none"}}>
          <td style={{padding:"11px 12px"}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:30,height:30,borderRadius:"50%",background:"#EFF6FF",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#1D4ED8"}}>{r.name.charAt(0)}</div><div><div style={{fontWeight:600,fontSize:13,color:"#1E293B"}}>{r.name}</div><div style={{fontSize:10,color:"#94A3B8"}}>Age {r.age} · Rm {r.room}</div></div></div></td>
          <td style={{padding:"11px 12px"}}><span style={{display:"inline-flex",alignItems:"center",gap:4,background:rs.bg,color:rs.fg,padding:"3px 8px",borderRadius:20,fontSize:11,fontWeight:600}}><span style={{width:5,height:5,borderRadius:"50%",background:rs.dot}}/>{rs.label}</span></td>
          <td style={{padding:"11px 12px",fontSize:12,color:"#64748B"}}>{latest?fmtDate(latest.date):"--"}</td>
          <td style={{padding:"11px 12px",fontSize:12,color:bpBad?"#DC2626":"#374151",fontWeight:bpBad?700:400}}>{latest&&(latest.bp_systolic!=null||latest.bp_diastolic!=null)?`${latest.bp_systolic??"-"}/${latest.bp_diastolic??"-"}`:"--"}</td>
          <td style={{padding:"11px 12px",fontSize:12,color:vc(latest?.blood_sugar,70,140)}}>{latest?.blood_sugar!=null?latest.blood_sugar:"--"}</td>
          <td style={{padding:"11px 12px",fontSize:12,color:vc(latest?.temperature,97,99)}}>{latest?.temperature!=null?latest.temperature:"--"}</td>
          <td style={{padding:"11px 12px",fontSize:12,color:vc(latest?.heart_rate,60,100)}}>{latest?.heart_rate!=null?latest.heart_rate:"--"}</td>
          <td style={{padding:"11px 12px",fontSize:12,color:latest?.oxygen!=null&&latest.oxygen<95?"#DC2626":"#374151"}}>{latest?.oxygen!=null?`${latest.oxygen}%`:"--"}</td>
          <td style={{padding:"11px 12px"}}>{ai?<span style={{fontWeight:700,fontSize:13,color:ai.riskLevel==="High"?"#DC2626":ai.riskLevel==="Moderate"?"#B45309":"#15803D"}}>{ai.riskScore}<span style={{fontSize:10,fontWeight:400,color:"#94A3B8"}}>/100</span></span>:<span style={{color:"#CBD5E1",fontSize:12}}>--</span>}</td>
        </tr>);})}
        </tbody>
      </table></div>
    </div>

    {/* MISSED MED HISTORY */}
    <div style={{background:"white",borderRadius:12,border:"1px solid #E2E8F0",marginBottom:20,overflow:"hidden"}}>
      <div style={{padding:"14px 20px",borderBottom:"1px solid #F1F5F9",background:"#F8FAFC",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div><div style={{fontWeight:700,fontSize:14,color:"#0F172A"}}>Missed Medication History</div><div style={{fontSize:11,color:"#94A3B8",marginTop:1}}>{missedHistory.length} missed dose{missedHistory.length!==1?"s":""}</div></div>
        <select value={missedRange} onChange={e=>setMissedRange(Number(e.target.value))} style={{padding:"6px 12px",border:"1px solid #E2E8F0",borderRadius:8,fontSize:12,color:"#374151",background:"white",outline:"none",cursor:"pointer"}}>
          <option value={7}>Last 7 days</option><option value={14}>Last 14 days</option><option value={30}>Last 30 days</option>
        </select>
      </div>
      {missedHistory.length===0?<div style={{padding:"44px 20px",textAlign:"center"}}><div style={{fontSize:30,marginBottom:8}}>🎉</div><div style={{fontSize:13,color:"#64748B",fontWeight:600}}>No missed doses in this period</div></div>
      :<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr style={{background:"#F8FAFC",borderBottom:"1px solid #E2E8F0"}}>{["Date","Resident","Medication","Dose","Scheduled"].map(h=><th key={h} style={{padding:"10px 12px",textAlign:"left",fontSize:11,fontWeight:600,color:"#64748B",textTransform:"uppercase",letterSpacing:"0.05em"}}>{h}</th>)}</tr></thead>
        <tbody>{missedHistory.slice(0,40).map((log,i)=>{const res=residents.find(r=>r.id===log.residentId);const med=medications.find(m=>m.id===log.medicationId);return(<tr key={`ml${i}`} style={{borderBottom:i<Math.min(missedHistory.length,40)-1?"1px solid #F1F5F9":"none"}}>
          <td style={{padding:"10px 12px",fontSize:12,color:"#374151",fontWeight:600,whiteSpace:"nowrap"}}>{fmtDate(log.date)}</td>
          <td style={{padding:"10px 12px",fontSize:12,color:"#374151"}}>{res?.name||"Unknown"}</td>
          <td style={{padding:"10px 12px"}}><span style={{background:"#FFF1F2",color:"#BE123C",padding:"2px 8px",borderRadius:5,fontSize:11,fontWeight:600}}>{med?.name||"Unknown"}</span></td>
          <td style={{padding:"10px 12px",fontSize:12,color:"#64748B"}}>{med?.dosage||"--"}</td>
          <td style={{padding:"10px 12px",fontSize:12,color:"#64748B"}}>{log.time&&log.time!=="as_needed"?fmtTime(log.time):"As needed"}</td>
        </tr>);})}</tbody>
      </table>
      {missedHistory.length>40&&<div style={{padding:"10px 16px",fontSize:11,color:"#94A3B8",textAlign:"center"}}>Showing 40 of {missedHistory.length}</div>}
      </div>}
    </div>

    {/* PRINT BUTTON */}
    <div style={{display:"flex",justifyContent:"flex-end",paddingBottom:8}}>
      <button onClick={()=>window.print()} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 22px",background:"#1E3A8A",color:"white",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}><Printer size={14}/> Print Institutional Report</button>
    </div>
  </div>);
}

/* ── PRINT REPORT (screen-hidden, print-only via @media print) ── */
function PrintReport({residents,healthRecs,medications,medLogs,aiResults,summary}){
  const today=new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  const weekAgo=daysAgoStr(7);
  const wl=medLogs.filter(l=>l.date>=weekAgo);
  const wg=wl.filter(l=>l.status==="given").length;
  const wm=wl.filter(l=>l.status==="missed").length;
  const cr=wl.length>0?Math.round((wg/wl.length)*100):null;
  const snaps=residents.map(r=>{const recs=healthRecs.filter(h=>h.residentId===r.id).sort((a,b)=>new Date(`${b.date}T${b.time||"00:00"}`)-new Date(`${a.date}T${a.time||"00:00"}`));return{r,latest:recs[0]||null,ai:aiResults[r.id]||null};});
  const mw=medLogs.filter(l=>l.status==="missed"&&l.date>=weekAgo).sort((a,b)=>b.date.localeCompare(a.date));
  const th={border:"1px solid #bbb",padding:"6px 8px",textAlign:"left",fontWeight:700,background:"#eee",fontSize:10};
  const td={border:"1px solid #ccc",padding:"5px 8px",fontSize:10};
  return(<div id="smartcare-print" style={{display:"none",fontFamily:"Georgia,serif",color:"#000"}}>
    <div style={{textAlign:"center",borderBottom:"2px solid #000",paddingBottom:14,marginBottom:18}}>
      <div style={{fontSize:20,fontWeight:700}}>SmartCare — Weekly Health Report</div>
      <div style={{fontSize:13,marginTop:5}}>Bharathamatha Family Welfare Foundation · DARPAN: TN/2009/0002669</div>
      <div style={{fontSize:11,color:"#555",marginTop:3}}>Thiruthuraipundi, Thiruvarur District, Tamil Nadu</div>
      <div style={{fontSize:12,fontWeight:700,marginTop:8}}>{today}</div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,marginBottom:18,border:"1px solid #ccc",padding:12}}>
      {[["Total Residents",residents.length],["High Risk",residents.filter(r=>r.risk==="high").length],["Compliance",cr!=null?`${cr}%`:"--"],["Missed Doses",wm]].map(([l,v])=>(<div key={l} style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:700}}>{v}</div><div style={{fontSize:10,textTransform:"uppercase",color:"#555"}}>{l}</div></div>))}
    </div>
    {summary&&<div style={{marginBottom:18,border:"1px solid #ccc",padding:12}}>
      <div style={{fontWeight:700,fontSize:12,marginBottom:6}}>AI Weekly Analysis — {(summary.overallStatus||"").toUpperCase()}</div>
      <div style={{fontStyle:"italic",fontSize:11,marginBottom:8}}>"{summary.headline}"</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div><div style={{fontWeight:700,fontSize:10,marginBottom:4}}>Highlights</div>{(summary.highlights||[]).map((h,i)=><div key={i} style={{fontSize:9,marginBottom:2}}>+ {h}</div>)}</div>
        <div><div style={{fontWeight:700,fontSize:10,marginBottom:4}}>Concerns</div>{(summary.concerns||[]).map((c,i)=><div key={i} style={{fontSize:9,marginBottom:2}}>! {c}</div>)}</div>
      </div>
      {summary.medicationNote&&<div style={{marginTop:6,fontSize:9,borderTop:"1px solid #eee",paddingTop:5}}><b>Medication:</b> {summary.medicationNote}</div>}
    </div>}
    <div style={{marginBottom:18}}>
      <div style={{fontWeight:700,fontSize:12,marginBottom:6,borderBottom:"1px solid #000",paddingBottom:3}}>Resident Health Overview</div>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr>{["Resident","Age","Rm","Risk","Last Check","BP","Sugar","Temp","HR","O2","AI Score"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
        <tbody>{snaps.map(({r,latest,ai})=>(<tr key={r.id}>
          <td style={{...td,fontWeight:600}}>{r.name}</td><td style={td}>{r.age}</td><td style={td}>{r.room}</td>
          <td style={{...td,fontWeight:700}}>{RISK[r.risk].label}</td>
          <td style={td}>{latest?fmtDate(latest.date):"--"}</td>
          <td style={td}>{latest&&(latest.bp_systolic!=null||latest.bp_diastolic!=null)?`${latest.bp_systolic??"-"}/${latest.bp_diastolic??"-"}`:"--"}</td>
          <td style={td}>{latest?.blood_sugar!=null?latest.blood_sugar:"--"}</td>
          <td style={td}>{latest?.temperature!=null?latest.temperature:"--"}</td>
          <td style={td}>{latest?.heart_rate!=null?latest.heart_rate:"--"}</td>
          <td style={td}>{latest?.oxygen!=null?`${latest.oxygen}%`:"--"}</td>
          <td style={{...td,fontWeight:700}}>{ai?`${ai.riskScore}/100`:"--"}</td>
        </tr>))}</tbody>
      </table>
    </div>
    {mw.length>0&&<div style={{marginBottom:18}}>
      <div style={{fontWeight:700,fontSize:12,marginBottom:6,borderBottom:"1px solid #000",paddingBottom:3}}>Missed Doses This Week</div>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr>{["Date","Resident","Medication","Dose","Time"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
        <tbody>{mw.map((log,i)=>{const res=residents.find(r=>r.id===log.residentId);const med=medications.find(m=>m.id===log.medicationId);return(<tr key={i}><td style={td}>{fmtDate(log.date)}</td><td style={{...td,fontWeight:600}}>{res?.name||"--"}</td><td style={td}>{med?.name||"--"}</td><td style={td}>{med?.dosage||"--"}</td><td style={td}>{log.time&&log.time!=="as_needed"?fmtTime(log.time):"As needed"}</td></tr>);})}</tbody>
      </table>
    </div>}
    <div style={{borderTop:"1px solid #ccc",paddingTop:10,fontSize:8,color:"#666",textAlign:"center"}}>
      <div>SmartCare AI Health Monitoring System · Bharathamatha Family Welfare Foundation, Thiruthuraipundi</div>
      <div style={{marginTop:2}}>21GNP301L Community Connect · SRM Institute of Science and Technology, Tiruchirappalli · AIML Department</div>
      <div style={{marginTop:2}}>Generated: {new Date().toLocaleString("en-IN")} · AI powered by Claude (claude-sonnet-4-6) · Anthropic</div>
    </div>
  </div>);
}

/* ── SHARED MODALS ── */
function ResidentModal({mode,resident,onSave,onClose}){
  const [form,setForm]=useState(mode==="edit"?{...resident,conditions:[...(resident.conditions||[])]}:{...BLANK,conditions:[]});
  const [errors,setErrors]=useState({});
  const validate=()=>{const e={};if(!form.name.trim())e.name="Name required";if(!form.age||form.age<1||form.age>120)e.age="Valid age required";if(!form.room.trim())e.room="Room required";return e;};
  const submit=()=>{const e=validate();if(Object.keys(e).length){setErrors(e);return;}onSave({...form,age:Number(form.age)});};
  const upd=(k,v)=>{setForm(f=>({...f,[k]:v}));setErrors(e=>({...e,[k]:undefined}));};
  return(<div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}}>
    <div style={{background:"white",borderRadius:16,width:"100%",maxWidth:520,maxHeight:"92vh",overflow:"auto",boxShadow:"0 24px 48px rgba(0,0,0,0.3)"}}>
      <div style={{padding:"20px 24px 16px",borderBottom:"1px solid #F1F5F9",display:"flex",justifyContent:"space-between",alignItems:"flex-start",position:"sticky",top:0,background:"white"}}>
        <div><div style={{fontSize:16,fontWeight:700,color:"#0F172A"}}>{mode==="add"?"Add New Resident":"Edit Resident"}</div><div style={{fontSize:12,color:"#94A3B8",marginTop:2}}>{mode==="edit"&&`Editing ${resident?.name}`}</div></div>
        <button onClick={onClose} style={{width:32,height:32,borderRadius:"50%",background:"#F1F5F9",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={15} color="#64748B"/></button>
      </div>
      <div style={{padding:"20px 24px"}}>
        <Field label="Full name *" error={errors.name}><input value={form.name} onChange={e=>upd("name",e.target.value)} placeholder="e.g. Muthukumar R." style={iStyle(errors.name)}/></Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <Field label="Age *" error={errors.age}><input type="number" min={1} max={120} value={form.age} onChange={e=>upd("age",e.target.value)} placeholder="e.g. 72" style={iStyle(errors.age)}/></Field>
          <Field label="Gender"><select value={form.gender} onChange={e=>upd("gender",e.target.value)} style={iStyle()}><option value="M">Male</option><option value="F">Female</option></select></Field>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <Field label="Room *" error={errors.room}><input value={form.room} onChange={e=>upd("room",e.target.value)} placeholder="e.g. 101" style={iStyle(errors.room)}/></Field>
          <Field label="Blood group"><select value={form.blood} onChange={e=>upd("blood",e.target.value)} style={iStyle()}>{BLOOD_GROUPS.map(b=><option key={b} value={b}>{b}</option>)}</select></Field>
        </div>
        <Field label="Medical conditions"><TagInput value={form.conditions} onChange={v=>upd("conditions",v)}/><div style={{fontSize:11,color:"#94A3B8",marginTop:5}}>Press Enter to add each condition</div></Field>
        <Field label="Emergency contact"><input value={form.contact} onChange={e=>upd("contact",e.target.value)} placeholder="e.g. 98765 43210" style={iStyle()}/></Field>
      </div>
      <div style={{padding:"14px 24px",borderTop:"1px solid #F1F5F9",display:"flex",gap:10,justifyContent:"flex-end",position:"sticky",bottom:0,background:"white"}}>
        <button onClick={onClose} style={{padding:"9px 20px",border:"1px solid #E2E8F0",borderRadius:8,background:"white",cursor:"pointer",fontSize:13,color:"#374151"}}>Cancel</button>
        <button onClick={submit} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 20px",border:"none",borderRadius:8,background:"#1E3A8A",cursor:"pointer",fontSize:13,color:"white",fontWeight:600}}>{mode==="add"?<><Plus size={14}/> Add Resident</>:"Save Changes"}</button>
      </div>
    </div>
  </div>);
}

function TagInput({value,onChange}){
  const [input,setInput]=useState("");const ref=useRef(null);
  const add=()=>{const t=input.trim();if(t&&!value.includes(t))onChange([...value,t]);setInput("");};
  const remove=(tag)=>onChange(value.filter(t=>t!==tag));
  const hkd=(e)=>{if(e.key==="Enter"||e.key===","){e.preventDefault();add();}if(e.key==="Backspace"&&!input&&value.length)remove(value[value.length-1]);};
  return(<div onClick={()=>ref.current?.focus()} style={{display:"flex",flexWrap:"wrap",gap:6,padding:"8px 10px",border:"1px solid #D1D5DB",borderRadius:8,minHeight:46,cursor:"text",alignItems:"center"}}>
    {value.map(tag=><span key={tag} style={{display:"inline-flex",alignItems:"center",gap:4,background:"#EFF6FF",color:"#1D4ED8",padding:"3px 10px",borderRadius:20,fontSize:12}}>{tag}<button onClick={e=>{e.stopPropagation();remove(tag);}} style={{background:"none",border:"none",cursor:"pointer",color:"#93C5FD",display:"flex",padding:0}}><X size={11}/></button></span>)}
    <input ref={ref} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={hkd} onBlur={add} placeholder={value.length===0?"Type condition, Enter to add...":"More..."} style={{border:"none",outline:"none",fontSize:13,color:"#374151",flex:1,minWidth:140,background:"transparent"}}/>
  </div>);
}

function Field({label,error,children}){return(<div style={{marginBottom:16}}><label style={{display:"block",fontSize:11,fontWeight:600,color:"#374151",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.05em"}}>{label}</label>{children}{error&&<div style={{fontSize:11,color:"#DC2626",marginTop:4}}>{error}</div>}</div>);}
const iStyle=(error)=>({width:"100%",padding:"9px 12px",border:`1px solid ${error?"#EF4444":"#D1D5DB"}`,borderRadius:8,fontSize:13,color:"#0F172A",outline:"none",boxSizing:"border-box",background:"white",fontFamily:"inherit"});

function DeleteConfirm({resident,onConfirm,onClose}){
  return(<div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}}>
    <div style={{background:"white",borderRadius:16,width:"100%",maxWidth:380,padding:"28px",boxShadow:"0 24px 48px rgba(0,0,0,0.3)",textAlign:"center"}}>
      <div style={{width:52,height:52,background:"#FEF2F2",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}><Trash2 size={22} color="#DC2626"/></div>
      <div style={{fontSize:16,fontWeight:700,color:"#0F172A",marginBottom:8}}>Remove resident?</div>
      <div style={{fontSize:13,color:"#64748B",lineHeight:1.7,marginBottom:24}}>This will permanently remove <b>{resident.name}</b> and all records.</div>
      <div style={{display:"flex",gap:10}}>
        <button onClick={onClose} style={{flex:1,padding:"10px",border:"1px solid #E2E8F0",borderRadius:8,background:"white",cursor:"pointer",fontSize:13,fontWeight:600,color:"#374151"}}>Cancel</button>
        <button onClick={onConfirm} style={{flex:1,padding:"10px",border:"none",borderRadius:8,background:"#DC2626",cursor:"pointer",fontSize:13,fontWeight:700,color:"white"}}>Yes, remove</button>
      </div>
    </div>
  </div>);
}

function ViewResident({resident,onEdit,onDelete,onClose}){
  const rs=RISK[resident.risk];
  return(<div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}}>
    <div style={{background:"white",borderRadius:16,width:"100%",maxWidth:440,boxShadow:"0 24px 48px rgba(0,0,0,0.3)"}}>
      <div style={{padding:"20px 24px",borderBottom:"1px solid #F1F5F9",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div style={{display:"flex",gap:14,alignItems:"center"}}>
          <div style={{width:50,height:50,borderRadius:"50%",background:"#EFF6FF",border:"2px solid #BFDBFE",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:"#1D4ED8"}}>{resident.name.charAt(0)}</div>
          <div><div style={{fontSize:16,fontWeight:700,color:"#0F172A"}}>{resident.name}</div><div style={{fontSize:12,color:"#94A3B8",marginTop:2}}>{resident.gender==="M"?"Male":"Female"} · Age {resident.age}</div></div>
        </div>
        <button onClick={onClose} style={{width:32,height:32,borderRadius:"50%",background:"#F1F5F9",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={15} color="#64748B"/></button>
      </div>
      <div style={{padding:"20px 24px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
          {[["Room",resident.room],["Blood group",resident.blood],["Contact",resident.contact||"--"],["Risk",(<span style={{display:"inline-flex",alignItems:"center",gap:5,background:rs.bg,color:rs.fg,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600}}><span style={{width:5,height:5,borderRadius:"50%",background:rs.dot}}/>{rs.label}</span>)]].map(([label,val])=>(<div key={label}><div style={{fontSize:11,fontWeight:600,color:"#94A3B8",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>{label}</div><div style={{fontSize:13,color:"#1E293B",fontWeight:500}}>{val}</div></div>))}
        </div>
        <div><div style={{fontSize:11,fontWeight:600,color:"#94A3B8",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Medical conditions</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{resident.conditions.length>0?resident.conditions.map(c=><span key={c} style={{background:"#EFF6FF",color:"#1D4ED8",padding:"4px 12px",borderRadius:20,fontSize:12,fontWeight:500}}>{c}</span>):<span style={{color:"#CBD5E1",fontSize:13}}>None</span>}</div></div>
      </div>
      <div style={{padding:"16px 24px",borderTop:"1px solid #F1F5F9",display:"flex",gap:10}}>
        <button onClick={onDelete} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 16px",border:"1px solid #FECDD3",borderRadius:8,background:"#FFF1F2",cursor:"pointer",fontSize:13,color:"#BE123C",fontWeight:600}}><Trash2 size={13}/> Remove</button>
        <button onClick={onEdit} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"9px",border:"none",borderRadius:8,background:"#1E3A8A",cursor:"pointer",fontSize:13,color:"white",fontWeight:600}}><Pencil size={13}/> Edit</button>
      </div>
    </div>
  </div>);
}
