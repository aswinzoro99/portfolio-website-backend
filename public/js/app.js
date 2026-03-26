const API_BASE = '';

/* === STATE === */
let photos=[];
let slideIdx=0;
let slideTimer=null;
const likedSet=new Set();
const likeCountMap=new Map();

/* === API === */
async function fetchPhotos(){
  try{
    const res=await fetch(API_BASE+'/api/photos');
    if(res.ok){photos=await res.json();}
    else{photos=[];}
  }catch(err){
    console.error('Failed to fetch photos:',err);
    photos=[];
  }
  return photos;
}

/* === FILE INPUT LABEL === */
document.getElementById('addFile').addEventListener('change',function(){
  const label=document.getElementById('fileLabel');
  label.textContent=this.files[0]?this.files[0].name:'Choose image';
});

/* === SLIDESHOW === */
function renderSlideshow(){
  const el=document.getElementById("slideshow");
  const viewAllBtn=document.querySelector(".view-all-btn");
  el.innerHTML="";
  if(!photos.length){
    el.innerHTML='<div class="empty-state">'
      +'<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>'
      +'<p>No photos yet</p>'
      +'<p class="empty-hint">Login as admin to upload your work</p></div>';
    if(viewAllBtn)viewAllBtn.style.display="none";
    return;
  }
  if(viewAllBtn)viewAllBtn.style.display="";
  photos.forEach((p,i)=>{
    const img=document.createElement("img");
    img.src=p.url;img.alt=p.title;
    if(i===0)img.classList.add("active");
    el.appendChild(img);
  });
  slideIdx=0;
  startSlideshow();
}
function startSlideshow(){
  clearInterval(slideTimer);
  if(photos.length<2)return;
  slideTimer=setInterval(()=>{
    const imgs=document.querySelectorAll("#slideshow img");
    if(!imgs.length)return;
    imgs[slideIdx].classList.remove("active");
    slideIdx=(slideIdx+1)%imgs.length;
    imgs[slideIdx].classList.add("active");
  },2200);
}

/* === GALLERY === */
function openGallery(){
  if(!photos.length)return;
  const ov=document.getElementById("galleryOverlay");
  const grid=document.getElementById("galleryGrid");
  grid.innerHTML="";
  photos.forEach((p)=>{
    const d=document.createElement("div");
    d.className="g-item";
    d.innerHTML='<img src="'+p.url+'" alt="'+p.title+'">';
    d.onclick=()=>openLightbox(p.id);
    grid.appendChild(d);
  });
  ov.classList.add("open");
  document.body.style.overflow="hidden";
  requestAnimationFrame(()=>{
    gsap.to(".g-item",{opacity:1,y:0,duration:.35,stagger:.04,ease:"power2.out"});
  });
}
function closeGallery(){
  const items=document.querySelectorAll('.g-item');
  gsap.to(items,{opacity:0,y:10,duration:.2,stagger:.015,ease:"power2.in",onComplete:()=>{
    document.getElementById("galleryOverlay").classList.remove("open");
    document.body.style.overflow="";
  }});
}

/* === LIGHTBOX === */
function openLightbox(id){
  const p=photos.find(x=>x.id===id);
  if(!p)return;
  const lb=document.getElementById("lightbox");
  const c=document.getElementById("lbContent");
  const liked=likedSet.has(id);
  const count=likeCountMap.get(id)||0;
  c.innerHTML='<img src="'+p.url+'" alt="'+p.title+'">'
    +'<div class="lb-info"><div class="lb-desc">'+(p.desc||p.title)+'</div>'
    +'<div class="lb-like-wrap"><button class="lb-like'+(liked?" liked":"")+'" data-id="'+id+'" onclick="toggleLike('+id+',this)">'
    +'<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>'
    +'<span class="like-count">'+count+'</span></button></div></div>';
  lb.classList.add("open");
  gsap.fromTo("#lbContent img",{opacity:0,scale:.97},{opacity:1,scale:1,duration:.4,ease:"power2.out"});
  gsap.fromTo(".lb-info",{opacity:0,y:12},{opacity:1,y:0,duration:.35,delay:.15,ease:"power2.out"});
}
function closeLightbox(){
  const lb=document.getElementById("lightbox");
  gsap.to("#lbContent",{opacity:0,y:10,duration:.2,ease:"power2.in",onComplete:()=>{
    lb.classList.remove("open");
    gsap.set("#lbContent",{opacity:1,y:0});
  }});
}
function toggleLike(id,btn){
  const countEl=btn.querySelector('.like-count');
  const wrap=btn.closest('.lb-like-wrap');
  if(likedSet.has(id)){
    likedSet.delete(id);
    likeCountMap.set(id,(likeCountMap.get(id)||1)-1);
    btn.classList.remove("liked");
    gsap.to(btn.querySelector('svg'),{scale:0.85,duration:.15,ease:"power2.in",onComplete:()=>{
      gsap.to(btn.querySelector('svg'),{scale:1,duration:.25,ease:"back.out(2)"});
    }});
  }else{
    likedSet.add(id);
    likeCountMap.set(id,(likeCountMap.get(id)||0)+1);
    btn.classList.add("liked");
    gsap.fromTo(btn.querySelector('svg'),{scale:1},{scale:1.3,duration:.15,ease:"power2.out",onComplete:()=>{
      gsap.to(btn.querySelector('svg'),{scale:1,duration:.4,ease:"elastic.out(1,.3)"});
    }});
    spawnParticles(wrap);
  }
  countEl.textContent=likeCountMap.get(id)||0;
}
function spawnParticles(container){
  const colors=['#e25555','#ff8a80','#ff5252','#f48fb1','#ef9a9a','#e57373'];
  for(let i=0;i<8;i++){
    const dot=document.createElement('div');
    dot.className='like-particle';
    dot.style.background=colors[i%colors.length];
    container.appendChild(dot);
    const angle=(i/8)*Math.PI*2;
    const dist=18+Math.random()*14;
    gsap.fromTo(dot,
      {x:0,y:0,scale:1,opacity:1},
      {x:Math.cos(angle)*dist,y:Math.sin(angle)*dist,scale:0,opacity:0,duration:.5+Math.random()*.2,ease:"power2.out",
       onComplete:()=>dot.remove()}
    );
  }
}

/* === ADMIN === */
let adminAuth=false;
let authToken=null;
function openAdmin(){
  const ov=document.getElementById("adminOverlay");
  ov.classList.add("open");
  document.body.style.overflow="hidden";
  if(adminAuth){showPanel();}else{showLogin();}
  gsap.fromTo(adminAuth?"#adminPanel":"#adminLogin",{opacity:0,y:15},{opacity:1,y:0,duration:.35,ease:"power2.out"});
}
function closeAdmin(){
  gsap.to("#adminOverlay > .show",{opacity:0,y:10,duration:.2,ease:"power2.in",onComplete:()=>{
    document.getElementById("adminOverlay").classList.remove("open");
    document.body.style.overflow="";
    gsap.set("#adminOverlay > *",{opacity:1,y:0});
  }});
  document.body.style.overflow="";
}
function showLogin(){
  document.getElementById("adminLogin").classList.add("show");
  document.getElementById("adminPanel").classList.remove("show");
  clearAdminMessages();
  showView('viewLogin');
}
function showPanel(){
  document.getElementById("adminLogin").classList.remove("show");
  document.getElementById("adminPanel").classList.add("show");
  renderAdminList();
}
function showView(id){
  document.querySelectorAll('.form-view').forEach(v=>v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  clearAdminMessages();
}
function clearAdminMessages(){
  document.getElementById("adminErr").classList.remove("show");
  document.getElementById("adminErr").textContent="";
  document.getElementById("adminMsg").classList.remove("show");
  document.getElementById("adminMsg").textContent="";
}
function showErr(msg){const el=document.getElementById("adminErr");el.textContent=msg;el.classList.add("show");}
function showMsg(msg){const el=document.getElementById("adminMsg");el.textContent=msg;el.classList.add("show");}
async function handleLogin(e){
  e.preventDefault();
  clearAdminMessages();
  const u=document.getElementById("loginUser").value;
  const p=document.getElementById("loginPass").value;
  try{
    const res=await fetch(API_BASE+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p})});
    if(res.ok){const d=await res.json();authToken=d.token;adminAuth=true;showPanel();}
    else{const d=await res.json();showErr(d.error||'Wrong credentials');}
  }catch(err){showErr('Server unavailable. Make sure the backend is running.');}
}
async function handleForgot(e){
  e.preventDefault();
  clearAdminMessages();
  const u=document.getElementById("forgotUser").value.trim();
  if(!u){showErr('Enter your username');return;}
  try{
    const res=await fetch(API_BASE+'/api/forgot-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u})});
    const d=await res.json();
    if(res.ok){showMsg(d.message||'Reset link sent to admin email');showView('viewReset');}
    else{showErr(d.error||'User not found');}
  }catch(err){showErr('Server unavailable. Make sure the backend is running.');}
}
async function handleReset(e){
  e.preventDefault();
  clearAdminMessages();
  const token=document.getElementById("resetToken").value.trim();
  const pw=document.getElementById("resetNewPass").value;
  const confirm=document.getElementById("resetConfirm").value;
  if(!token){showErr('Enter the reset token');return;}
  if(!pw||pw.length<6){showErr('Password must be at least 6 characters');return;}
  if(pw!==confirm){showErr('Passwords do not match');return;}
  try{
    const res=await fetch(API_BASE+'/api/reset-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,password:pw})});
    const d=await res.json();
    if(res.ok){showMsg('Password reset successful. You can now login.');showView('viewLogin');}
    else{showErr(d.error||'Invalid or expired token');}
  }catch(err){showErr('Server unavailable. Make sure the backend is running.');}
}
function handleLogout(){adminAuth=false;closeAdmin();}
function renderAdminList(){
  const el=document.getElementById("adminList");
  el.innerHTML="";
  photos.forEach(p=>{
    const d=document.createElement("div");
    d.className="admin-item";
    d.innerHTML='<img src="'+p.url+'" alt="">'
      +'<div class="admin-item-info"><span>'+p.title+'</span><span>'+(p.desc||"")+'</span></div>'
      +'<div class="admin-item-actions"><button onclick="editPhoto('+p.id+')">Edit</button><button class="del-btn" onclick="deletePhoto('+p.id+')">Del</button></div>';
    el.appendChild(d);
  });
}
async function addPhoto(e){
  e.preventDefault();
  const form=new FormData();
  const fileInput=document.getElementById("addFile");
  const title=document.getElementById("addTitle").value.trim();
  const desc=document.getElementById("addDesc").value.trim();
  if(!title||!fileInput.files[0])return;
  form.append('title',title);
  form.append('desc',desc);
  form.append('image',fileInput.files[0]);
  try{
    const res=await fetch(API_BASE+'/api/photos',{method:'POST',body:form});
    if(res.ok){
      await fetchPhotos();
      document.getElementById("addForm").reset();
      document.getElementById("fileLabel").textContent="Choose image";
      renderAdminList();
      renderSlideshow();
    }
  }catch(err){console.error(err);alert('Upload failed. Check server connection.');}
}
async function deletePhoto(id){
  try{
    await fetch(API_BASE+'/api/photos/'+id,{method:'DELETE'});
    await fetchPhotos();
    renderAdminList();
    renderSlideshow();
  }catch(err){console.error(err);alert('Delete failed. Check server connection.');}
}
async function editPhoto(id){
  const p=photos.find(x=>x.id===id);
  if(!p)return;
  const nt=prompt("Title:",p.title);
  if(nt===null)return;
  const nd=prompt("Description:",p.desc||"");
  if(nd===null)return;
  try{
    await fetch(API_BASE+'/api/photos/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:nt||p.title,desc:nd})});
    await fetchPhotos();
    renderAdminList();
    renderSlideshow();
  }catch(err){console.error(err);}
}

/* === THEME === */
function toggleTheme(){
  const html=document.documentElement;
  const current=html.getAttribute('data-theme');
  const next=current==='dark'?'light':'dark';
  html.setAttribute('data-theme',next);
  localStorage.setItem('ar_theme',next);
  updateThemeIcon(next);
}
function updateThemeIcon(theme){
  const icon=document.getElementById('themeIcon');
  if(theme==='dark'){
    icon.innerHTML='<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>';
  }else{
    icon.innerHTML='<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
  }
}
(function(){
  const saved=localStorage.getItem('ar_theme');
  if(saved){document.documentElement.setAttribute('data-theme',saved);updateThemeIcon(saved);}
})();

/* === INIT === */
(async()=>{
  await fetchPhotos();
  renderSlideshow();
  gsap.fromTo(".name",{opacity:0,y:-10},{opacity:1,y:0,duration:.4,delay:.1,ease:"power2.out"});
  gsap.fromTo(".slideshow-wrap",{opacity:0},{opacity:1,duration:.45,delay:.2,ease:"power2.out"});
  gsap.fromTo(".view-all-btn",{opacity:0},{opacity:1,duration:.35,delay:.3,ease:"power2.out"});
  gsap.fromTo(".bottom-contact",{opacity:0,y:8},{opacity:1,y:0,duration:.35,delay:.38,ease:"power2.out"});
})();

document.addEventListener("keydown",e=>{
  if(e.key==="Escape"){
    if(document.getElementById("lightbox").classList.contains("open"))closeLightbox();
    else if(document.getElementById("galleryOverlay").classList.contains("open"))closeGallery();
    else if(document.getElementById("adminOverlay").classList.contains("open"))closeAdmin();
  }
});
