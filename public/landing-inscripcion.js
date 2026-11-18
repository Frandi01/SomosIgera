(() => {
const $=id=>document.getElementById(id);
const WA=document.body.dataset.whatsapp;
const ANIM=!matchMedia("(prefers-reduced-motion: reduce)").matches;

// Cuenta regresiva a la jornada (domingo 29/11/2026, 16 h Argentina), con conteo animado
(function(){
  const dias=Math.ceil((new Date("2026-11-29T16:00:00-03:00")-Date.now())/864e5);
  if(dias<0) return;
  const n=$("cuenta-n");
  $("cuenta-t").textContent=dias===0?"es la jornada, 16 h":dias===1?"día para la jornada":"días para la jornada";
  $("cuenta").hidden=false;
  if(dias===0){ n.textContent="Hoy"; return; }
  if(!ANIM){ n.textContent=dias; return; }
  const t0=performance.now(), dur=900;
  (function paso(t){ const k=Math.min(1,(t-t0)/dur); n.textContent=Math.round(dias*(1-Math.pow(1-k,3))); if(k<1) requestAnimationFrame(paso); })(t0);
})();

// Inscripción
const fuente=(new URLSearchParams(location.search).get("o")||"directo").replace(/[^a-z0-9_-]/gi,"").slice(0,20)||"directo";
function stats(){ fetch("/api/stats").then(r=>r.ok?r.json():null).then(s=>{ if(s&&s.inscriptos>=5){ $("social-n").textContent=s.inscriptos+" ya se anotaron"; $("social").hidden=false; } }).catch(()=>{}); }
stats();
function validar(){
  const req=[["i-nom","tu nombre"],["i-wa","tu WhatsApp"],["i-mail","tu email"],["i-rub","el rubro"],["i-rol","tu rol"]];
  for(const [id,n] of req){ if(!$(id).value.trim()) return [id,"Falta completar "+n+"."]; }
  if(!/^\S+@\S+\.\S+$/.test($("i-mail").value)) return ["i-mail","Revisá el email: le falta algo (ej: nombre@gmail.com)."];
  if($("i-wa").value.replace(/\D/g,"").length<8) return ["i-wa","Revisá el WhatsApp: escribilo con característica (ej: 221 555-1234)."];
  if(!$("i-ok").checked) return ["i-ok","Marcá la casilla para que podamos contactarte."];
  return null;
}
document.querySelectorAll("#f input,#f select").forEach(el=>el.addEventListener("input",()=>el.removeAttribute("aria-invalid")));
$("f").addEventListener("submit",async e=>{
  e.preventDefault();
  const err=validar(), et=$("f-err");
  document.querySelectorAll("#f [aria-invalid]").forEach(el=>el.removeAttribute("aria-invalid"));
  if(err){et.textContent=err[1];et.hidden=false;const c=$(err[0]);c.setAttribute("aria-invalid","true");c.focus();return;}
  et.hidden=true;
  const data={nombre:$("i-nom").value.trim(),whatsapp:$("i-wa").value.trim(),email:$("i-mail").value.trim(),negocio:$("i-neg").value.trim(),
    rubro:$("i-rub").value,rol:$("i-rol").value,asistentes:parseInt($("i-cant").value)||1,charla:"Jornada salones de belleza · La Plata",origen:$("i-orig").value,
    fuente:fuente};
  const m=$("f-msg"), b=$("f-btn"); b.disabled=true; b.textContent="Guardando…";
  let ok=false;
  try{ const r=await fetch("/api/inscripciones",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)}); ok=r.ok; }catch(x){}
  b.disabled=false; b.textContent="Reservar mi lugar gratis"; m.hidden=false;
  if(ok){
    m.className="msg ok"; m.replaceChildren();
    m.insertAdjacentHTML("afterbegin",'<svg class="tilde" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-16"/></svg>');
    const t=document.createElement("p"); t.textContent="Listo, "+data.nombre.split(" ")[0]+". Tu lugar quedó reservado para el domingo 29/11 a las 16 h. Te mandamos la sede por mail y WhatsApp.";
    const a=document.createElement("a"); a.href="/jornada.ics"; a.className="button button-calendar"; a.style.marginTop="12px"; a.textContent="Agregar a mi calendario";
    const d=document.createElement("div"); d.append(t,a); m.append(d);
    $("f").reset(); stats();
    m.scrollIntoView({block:"center"});
  }
  else{ m.className="msg err"; m.textContent="No pudimos guardar tu inscripción. Probá de nuevo en un minuto"+(WA?" o escribinos por WhatsApp al "+WA+".":"."); }
});
})();
