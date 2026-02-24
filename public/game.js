(function () {
  'use strict';

  const SESSION_ID = 'session_' + Math.random().toString(36).slice(2, 10);
  let worldData = null, npcList = [], storyData = null, playerData = null;
  let selectedClass = null, selectedBackground = null, isProcessing = false, turnCount = 0;

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function showScreen(id) {
    $$('.screen').forEach(s => s.classList.remove('active'));
    const t = $('#' + id);
    if (t) t.classList.add('active');
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    return { r: parseInt(hex.slice(0,2),16), g: parseInt(hex.slice(2,4),16), b: parseInt(hex.slice(4,6),16) };
  }
  function rgbToHex(r,g,b) {
    return '#'+[r,g,b].map(c=>Math.max(0,Math.min(255,Math.round(c))).toString(16).padStart(2,'0')).join('');
  }
  function darken(hex, a) { var c=hexToRgb(hex); return rgbToHex(c.r*(1-a),c.g*(1-a),c.b*(1-a)); }
  function lighten(hex, a) { var c=hexToRgb(hex); return rgbToHex(c.r+(255-c.r)*a,c.g+(255-c.g)*a,c.b+(255-c.b)*a); }

  function seededRandom(seed) {
    var s = seed;
    return function() { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  }

  function escapeHtml(text) {
    var d = document.createElement('div'); d.textContent = text; return d.innerHTML;
  }

  // ==================== TITLE PARTICLES ====================
  function initTitleParticles() {
    var canvas = $('#title-particles');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var particles = [];

    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resize();
    window.addEventListener('resize', resize);

    function Particle() { this.reset(); }
    Particle.prototype.reset = function() {
      this.x = Math.random()*canvas.width; this.y = Math.random()*canvas.height;
      this.size = Math.random()*2+0.5; this.sy = -(Math.random()*0.5+0.1);
      this.sx = (Math.random()-0.5)*0.3; this.op = Math.random()*0.6+0.2;
      this.life = Math.random()*200+100; this.ml = this.life;
    };
    Particle.prototype.update = function() {
      this.x += this.sx; this.y += this.sy; this.life--;
      this.op = (this.life/this.ml)*0.6;
      if (this.life <= 0) this.reset();
    };
    Particle.prototype.draw = function() {
      ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(212,168,83,' + this.op + ')'; ctx.fill();
    };

    for (var i = 0; i < 80; i++) particles.push(new Particle());
    (function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(function(p) { p.update(); p.draw(); });
      requestAnimationFrame(animate);
    })();
  }

  // ==================== MAP DRAWING ====================
  function drawMap(canvas, world, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d'), W = canvas.width, H = canvas.height;

    var og = ctx.createLinearGradient(0,0,0,H);
    og.addColorStop(0,'#0d1b2a'); og.addColorStop(0.5,'#1b2838'); og.addColorStop(1,'#0d1b2a');
    ctx.fillStyle = og; ctx.fillRect(0,0,W,H);

    ctx.strokeStyle = 'rgba(40,80,120,0.15)'; ctx.lineWidth = 1;
    for (var y = 0; y < H; y += 20) {
      ctx.beginPath();
      for (var x = 0; x < W; x += 5) {
        var w = Math.sin((x+y)*0.02)*3;
        if (x===0) ctx.moveTo(x,y+w); else ctx.lineTo(x,y+w);
      }
      ctx.stroke();
    }

    if (world.continents) world.continents.forEach(function(cont) {
      var cx=cont.x*W, cy=cont.y*H, cw=cont.width*W, ch=cont.height*H;
      ctx.save(); ctx.beginPath();
      for (var i=0; i<=40; i++) {
        var a=(i/40)*Math.PI*2;
        var rx=cw/2+Math.sin(a*3.7)*cw*0.08+Math.cos(a*7.1)*cw*0.04;
        var ry=ch/2+Math.cos(a*2.9)*ch*0.1+Math.sin(a*5.3)*ch*0.05;
        if (i===0) ctx.moveTo(cx+Math.cos(a)*rx,cy+Math.sin(a)*ry);
        else ctx.lineTo(cx+Math.cos(a)*rx,cy+Math.sin(a)*ry);
      }
      ctx.closePath();
      var lg=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(cw,ch)/2);
      lg.addColorStop(0,'#3d5c3a'); lg.addColorStop(0.6,'#2d4a2a'); lg.addColorStop(1,'#1e3620');
      ctx.fillStyle=lg; ctx.fill();
      ctx.strokeStyle='rgba(80,120,80,0.5)'; ctx.lineWidth=2; ctx.stroke();
      ctx.restore();
      ctx.font='bold '+(opts.mini?10:16)+'px Cinzel,serif';
      ctx.fillStyle='rgba(220,200,160,0.8)'; ctx.textAlign='center';
      ctx.fillText(cont.name,cx,cy-ch*0.3);
    });

    if (world.islands) world.islands.forEach(function(isle) {
      var ix=isle.x*W, iy=isle.y*H, is2=isle.size*W;
      ctx.beginPath();
      for (var i=0;i<=16;i++) {
        var a=(i/16)*Math.PI*2, r=is2/2+Math.sin(a*4.3)*is2*0.15;
        if (i===0) ctx.moveTo(ix+Math.cos(a)*r,iy+Math.sin(a)*r*0.7);
        else ctx.lineTo(ix+Math.cos(a)*r,iy+Math.sin(a)*r*0.7);
      }
      ctx.closePath(); ctx.fillStyle='#2a4a28'; ctx.fill();
      ctx.font=(opts.mini?8:11)+'px Noto Sans KR,sans-serif';
      ctx.fillStyle='rgba(180,170,140,0.7)'; ctx.textAlign='center';
      ctx.fillText(isle.name,ix,iy+is2/2+(opts.mini?8:14));
    });

    if (world.locations) world.locations.forEach(function(loc) {
      var lx=loc.x*W, ly=loc.y*H;
      var colors = {'\uC218\uB3C4':'#d4a853','\uB3C4\uC2DC':'#a0c0d0','\uB9C8\uC744':'#90b090','\uD56D\uAD6C':'#6090c0','\uC694\uC0C8':'#c07050','\uB358\uC804':'#8050a0','\uC232':'#40804a','\uC0B0':'#808080'};
      var sizes = {'\uC218\uB3C4':opts.mini?4:7,'\uB3C4\uC2DC':opts.mini?3:6,'\uB9C8\uC744':opts.mini?2.5:5};
      var col = colors[loc.type]||'#d0d0d0';
      var sz = sizes[loc.type]||(opts.mini?3:5);
      var rgb = hexToRgb(col);
      ctx.beginPath(); ctx.arc(lx,ly,sz*2,0,Math.PI*2);
      ctx.fillStyle='rgba('+rgb.r+','+rgb.g+','+rgb.b+',0.15)'; ctx.fill();
      ctx.beginPath(); ctx.arc(lx,ly,sz,0,Math.PI*2);
      ctx.fillStyle=col; ctx.fill();
      if (!opts.mini) {
        ctx.font='12px Noto Sans KR,sans-serif';
        ctx.fillStyle='rgba(220,210,190,0.9)'; ctx.textAlign='center';
        ctx.fillText(loc.name,lx,ly-sz-6);
      }
    });

    if (!opts.mini) {
      ctx.save(); ctx.translate(W-50,50);
      ctx.strokeStyle='rgba(212,168,83,0.5)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.arc(0,0,20,0,Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,-25); ctx.lineTo(-4,-15); ctx.lineTo(4,-15); ctx.closePath();
      ctx.fillStyle='rgba(212,168,83,0.7)'; ctx.fill();
      ctx.font='bold 10px Cinzel,serif'; ctx.textAlign='center';
      ctx.fillText('N',0,-28); ctx.restore();
    }
    ctx.strokeStyle='rgba(212,168,83,0.3)'; ctx.lineWidth=opts.mini?1:3;
    ctx.strokeRect(2,2,W-4,H-4);
  }

  // ==================== NPC PORTRAIT ====================
  function drawPortrait(canvas, npc, opts) {
    opts = opts || {};
    var ctx=canvas.getContext('2d'), W=canvas.width, H=canvas.height;
    var rand=seededRandom(npc.id*7919+(npc.name.charCodeAt(0)||0)*31);

    var bg=ctx.createLinearGradient(0,0,0,H);
    bg.addColorStop(0,'#1a1a2e'); bg.addColorStop(1,'#0f0f1e');
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

    var cx=W/2, sc=W/300, sy=H*0.75;
    var title=npc.title||'';

    ctx.beginPath();
    ctx.ellipse(cx,sy+60*sc,100*sc,70*sc,0,Math.PI,0,true);
    ctx.fillStyle=title.indexOf('\uC655')>=0?'#2a2050':title.indexOf('\uC81C\uAD6D')>=0?'#3a2020':'#1e2830';
    ctx.fill();

    ctx.fillStyle='#d4a880';
    ctx.fillRect(cx-12*sc,sy-20*sc,24*sc,30*sc);

    var hy=H*0.38, hw=55*sc, hh=70*sc;
    ctx.beginPath(); ctx.ellipse(cx,hy,hw,hh,0,0,Math.PI*2);
    var skin=rand()>0.7?'#c49070':rand()>0.4?'#d4a880':'#e0c0a0';
    ctx.fillStyle=skin; ctx.fill();

    var hc=npc.hairColor||'#2a1a0a';
    var hs=Math.floor(rand()*4);
    ctx.fillStyle=hc;
    ctx.beginPath(); ctx.ellipse(cx,hy-hh*0.35,hw*1.1,hh*0.5,0,Math.PI,0,true); ctx.fill();

    if (hs<2) {
      ctx.beginPath(); ctx.moveTo(cx-hw*1.05,hy-hh*0.1);
      ctx.quadraticCurveTo(cx-hw*1.3,hy+hh*0.8,cx-hw*0.6,sy+30*sc);
      ctx.lineTo(cx-hw*0.85,hy); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx+hw*1.05,hy-hh*0.1);
      ctx.quadraticCurveTo(cx+hw*1.3,hy+hh*0.8,cx+hw*0.6,sy+30*sc);
      ctx.lineTo(cx+hw*0.85,hy); ctx.fill();
    } else {
      ctx.beginPath(); ctx.ellipse(cx-hw*0.8,hy-hh*0.05,hw*0.35,hh*0.55,-0.2,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx+hw*0.8,hy-hh*0.05,hw*0.35,hh*0.55,0.2,0,Math.PI*2); ctx.fill();
    }

    var ec=npc.eyeColor||'#4a7c59', ey2=hy+hh*0.05, es=hw*0.35;
    [-1,1].forEach(function(side) {
      var ex=cx+side*es;
      ctx.beginPath(); ctx.ellipse(ex,ey2,10*sc,6*sc,0,0,Math.PI*2); ctx.fillStyle='#f0e8e0'; ctx.fill();
      ctx.beginPath(); ctx.arc(ex,ey2,5*sc,0,Math.PI*2); ctx.fillStyle=ec; ctx.fill();
      ctx.beginPath(); ctx.arc(ex,ey2,2.5*sc,0,Math.PI*2); ctx.fillStyle='#111'; ctx.fill();
      ctx.beginPath(); ctx.arc(ex+1.5*sc,ey2-1.5*sc,1.5*sc,0,Math.PI*2);
      ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(ex-10*sc,ey2-10*sc);
      ctx.quadraticCurveTo(ex,ey2-14*sc,ex+10*sc,ey2-10*sc);
      ctx.strokeStyle=darken(hc,0.2); ctx.lineWidth=2*sc; ctx.stroke();
    });

    ctx.beginPath(); ctx.moveTo(cx,ey2+5*sc);
    ctx.lineTo(cx-4*sc,hy+hh*0.35); ctx.lineTo(cx+4*sc,hy+hh*0.35);
    ctx.strokeStyle=darken(skin,0.15); ctx.lineWidth=1.5*sc; ctx.stroke();

    var my=hy+hh*0.5;
    ctx.beginPath(); ctx.moveTo(cx-10*sc,my);
    ctx.quadraticCurveTo(cx,my+4*sc,cx+10*sc,my);
    ctx.strokeStyle='#b08070'; ctx.lineWidth=2*sc; ctx.stroke();

    if (title.indexOf('\uC655')>=0||title.indexOf('\uD669\uC81C')>=0) {
      ctx.fillStyle='#d4a853';
      var cry=hy-hh*0.85;
      ctx.beginPath();
      ctx.moveTo(cx-30*sc,cry+15*sc); ctx.lineTo(cx-30*sc,cry);
      ctx.lineTo(cx-15*sc,cry+10*sc); ctx.lineTo(cx,cry-5*sc);
      ctx.lineTo(cx+15*sc,cry+10*sc); ctx.lineTo(cx+30*sc,cry);
      ctx.lineTo(cx+30*sc,cry+15*sc); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(cx,cry+5*sc,3*sc,0,Math.PI*2);
      ctx.fillStyle='#c44e4e'; ctx.fill();
    } else if (title.indexOf('\uAE30\uC0AC')>=0||title.indexOf('\uC6A9\uC0AC')>=0) {
      ctx.fillStyle='#606080';
      ctx.beginPath(); ctx.ellipse(cx-65*sc,sy,25*sc,15*sc,-0.3,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx+65*sc,sy,25*sc,15*sc,0.3,0,Math.PI*2); ctx.fill();
    } else if (title.indexOf('\uB9C8\uBC95\uC0AC')>=0||title.indexOf('\uD604\uC790')>=0) {
      ctx.beginPath(); ctx.arc(cx,hy,hw*1.3,0,Math.PI*2);
      ctx.strokeStyle='rgba(110,92,196,0.3)'; ctx.lineWidth=2; ctx.stroke();
    }

    if (!opts.mini) {
      ctx.strokeStyle='rgba(212,168,83,0.3)'; ctx.lineWidth=2;
      ctx.strokeRect(4,4,W-8,H-8);
    }
  }

  function drawMiniPortrait(canvas, npc) {
    var ctx=canvas.getContext('2d'), size=canvas.width;
    var tmp=document.createElement('canvas'); tmp.width=100; tmp.height=150;
    drawPortrait(tmp,npc,{mini:true});
    ctx.save(); ctx.beginPath(); ctx.arc(size/2,size/2,size/2,0,Math.PI*2); ctx.clip();
    ctx.drawImage(tmp,10,10,80,80,0,0,size,size); ctx.restore();
  }

  // ==================== SCENE ILLUSTRATION ====================
  function drawScene(canvas, scene, emotion) {
    var ctx=canvas.getContext('2d'), W=canvas.width, H=canvas.height;
    var palettes={
      forest:{sky:['#0a1a10','#1a3020'],ground:'#1a2a15'},
      castle:{sky:['#1a1028','#2a1a38'],ground:'#1e1a28'},
      town:{sky:['#1a1828','#2a2838'],ground:'#2a2530'},
      dungeon:{sky:['#0a0a10','#151520'],ground:'#0e0e18'},
      field:{sky:['#0a1520','#1a2a35'],ground:'#1a2518'},
      mountain:{sky:['#101825','#1a2535'],ground:'#2a3040'},
      port:{sky:['#0a1525','#152535'],ground:'#1a2030'},
      temple:{sky:['#1a1528','#2a2040'],ground:'#1e1a2a'},
      cave:{sky:['#080810','#101018'],ground:'#0a0a12'},
      road:{sky:['#101520','#1a2530'],ground:'#1e2218'}
    };
    var timeOv={dawn:'rgba(180,100,60,0.15)',morning:'rgba(100,140,180,0.1)',afternoon:'rgba(180,160,100,0.1)',evening:'rgba(180,80,40,0.2)',night:'rgba(20,20,60,0.2)'};

    var type=scene.locationType||'field';
    var pal=palettes[type]||palettes.field;
    var tov=timeOv[scene.timeOfDay]||timeOv.morning;

    var sg=ctx.createLinearGradient(0,0,0,H*0.6);
    sg.addColorStop(0,pal.sky[0]); sg.addColorStop(1,pal.sky[1]);
    ctx.fillStyle=sg; ctx.fillRect(0,0,W,H);
    ctx.fillStyle=tov; ctx.fillRect(0,0,W,H);

    if (scene.timeOfDay==='night') {
      for (var i=0;i<60;i++) {
        ctx.beginPath(); ctx.arc(Math.sin(i*137)*W*0.5+W*0.5,Math.cos(i*97)*H*0.25+H*0.25,Math.abs(Math.sin(i*7))*1.5+0.5,0,Math.PI*2);
        ctx.fillStyle='rgba(200,210,240,'+(Math.abs(Math.sin(i*3))*0.5+0.3)+')'; ctx.fill();
      }
    }
    if (scene.timeOfDay==='night'||scene.timeOfDay==='evening') {
      ctx.beginPath(); ctx.arc(W*0.8,H*0.15,30,0,Math.PI*2);
      var mg=ctx.createRadialGradient(W*0.8,H*0.15,0,W*0.8,H*0.15,30);
      mg.addColorStop(0,'rgba(220,220,200,0.9)'); mg.addColorStop(1,'rgba(180,180,160,0.3)');
      ctx.fillStyle=mg; ctx.fill();
    }
    if (scene.timeOfDay==='dawn'||scene.timeOfDay==='morning'||scene.timeOfDay==='afternoon') {
      var sunX=scene.timeOfDay==='dawn'?W*0.15:scene.timeOfDay==='afternoon'?W*0.75:W*0.5;
      var sunY=scene.timeOfDay==='dawn'?H*0.35:H*0.12;
      var sug=ctx.createRadialGradient(sunX,sunY,0,sunX,sunY,60);
      sug.addColorStop(0,'rgba(255,220,150,0.8)'); sug.addColorStop(0.5,'rgba(255,180,80,0.2)'); sug.addColorStop(1,'rgba(255,150,50,0)');
      ctx.beginPath(); ctx.arc(sunX,sunY,60,0,Math.PI*2); ctx.fillStyle=sug; ctx.fill();
    }

    var gY=H*0.6;
    var gg=ctx.createLinearGradient(0,gY,0,H);
    gg.addColorStop(0,pal.ground); gg.addColorStop(1,darken(pal.ground,0.3));
    ctx.fillStyle=gg; ctx.fillRect(0,gY,W,H-gY);

    if (type==='forest'||type==='field') {
      for (var i=0;i<8;i++) {
        var tx=(i/8)*W+Math.sin(i*3)*40;
        ctx.fillStyle='#2a1a10'; ctx.fillRect(tx-4,gY-20,8,40);
        ctx.beginPath(); ctx.ellipse(tx,gY-50,25+Math.sin(i*5)*10,35,0,0,Math.PI*2);
        ctx.fillStyle='rgba('+(30+i*3)+','+(60+i*5)+','+(30+i*2)+',0.8)'; ctx.fill();
      }
    } else if (type==='castle'||type==='town') {
      for (var i=0;i<6;i++) {
        var bx=(i/6)*W+40, bw=60+Math.sin(i*4)*20, bh=80+Math.sin(i*7)*50;
        ctx.fillStyle='rgba(30,25,40,'+(0.6+i*0.05)+')'; ctx.fillRect(bx,gY-bh,bw,bh);
        for (var wy=gY-bh+15;wy<gY-10;wy+=20)
          for (var wx=bx+10;wx<bx+bw-10;wx+=18) {
            ctx.fillStyle='rgba(200,180,100,'+(0.1+Math.sin(wx+wy)*0.15)+')';
            ctx.fillRect(wx,wy,6,8);
          }
      }
      if (type==='castle') {
        ctx.fillStyle='rgba(40,35,55,0.8)'; ctx.fillRect(W/2-20,gY-180,40,180);
        ctx.beginPath(); ctx.moveTo(W/2-25,gY-180); ctx.lineTo(W/2,gY-220); ctx.lineTo(W/2+25,gY-180);
        ctx.fillStyle='rgba(50,40,65,0.9)'; ctx.fill();
      }
    } else if (type==='mountain') {
      for (var i=0;i<5;i++) {
        var mx=(i/5)*W+Math.sin(i*6)*60, mh=100+Math.sin(i*9)*60;
        ctx.beginPath(); ctx.moveTo(mx-80,gY); ctx.lineTo(mx,gY-mh); ctx.lineTo(mx+80,gY); ctx.closePath();
        ctx.fillStyle='rgba(60,65,80,'+(0.5+i*0.05)+')'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(mx-15,gY-mh+20); ctx.lineTo(mx,gY-mh); ctx.lineTo(mx+15,gY-mh+20); ctx.closePath();
        ctx.fillStyle='rgba(200,200,210,0.5)'; ctx.fill();
      }
    } else if (type==='dungeon'||type==='cave') {
      ctx.beginPath(); ctx.ellipse(W/2,gY+20,200,150,0,Math.PI,0,true);
      ctx.fillStyle='#050508'; ctx.fill();
    } else if (type==='port') {
      ctx.fillStyle='rgba(20,50,80,0.5)'; ctx.fillRect(0,gY+20,W,H-gY-20);
      ctx.fillStyle='#3a2a1a'; ctx.fillRect(W*0.3,gY,W*0.4,15);
    } else if (type==='temple') {
      ctx.fillStyle='rgba(50,40,65,0.7)'; ctx.fillRect(W/2-60,gY-120,120,120);
      ctx.beginPath(); ctx.moveTo(W/2-75,gY-120); ctx.lineTo(W/2,gY-160); ctx.lineTo(W/2+75,gY-120);
      ctx.fillStyle='rgba(60,50,80,0.8)'; ctx.fill();
    }

    if (scene.weather==='rain') {
      for (var i=0;i<100;i++) {
        ctx.strokeStyle='rgba(150,170,200,0.3)'; ctx.lineWidth=1;
        ctx.beginPath(); var rx=Math.sin(i*173)*W*0.5+W*0.5, ry=Math.sin(i*97)*H*0.5+H*0.5;
        ctx.moveTo(rx,ry); ctx.lineTo(rx-2,ry+10); ctx.stroke();
      }
    } else if (scene.weather==='snow') {
      for (var i=0;i<60;i++) {
        ctx.beginPath(); ctx.arc(Math.sin(i*137)*W*0.5+W*0.5,Math.cos(i*97)*H*0.5+H*0.5,Math.abs(Math.sin(i*7))*2+1,0,Math.PI*2);
        ctx.fillStyle='rgba(220,225,240,0.4)'; ctx.fill();
      }
    } else if (scene.weather==='fog') {
      for (var i=0;i<5;i++) { ctx.fillStyle='rgba(120,120,140,'+(0.05+i*0.02)+')'; ctx.fillRect(0,gY-30+i*20,W,40); }
    }

    var moods={peaceful:'rgba(80,120,80,0.05)',tense:'rgba(120,40,40,0.08)',mysterious:'rgba(80,60,120,0.08)',battle:'rgba(150,30,30,0.1)',romantic:'rgba(150,80,100,0.06)',sad:'rgba(40,50,80,0.1)',joyful:'rgba(150,140,60,0.06)',dark:'rgba(10,10,20,0.15)'};
    if (moods[scene.mood]) { ctx.fillStyle=moods[scene.mood]; ctx.fillRect(0,0,W,H); }

    if (emotion && emotion.colors && emotion.colors.length>=2) {
      var c1=hexToRgb(emotion.colors[0]), c2=hexToRgb(emotion.colors[1]);
      var eg=ctx.createLinearGradient(0,H-60,0,H);
      eg.addColorStop(0,'rgba('+c1.r+','+c1.g+','+c1.b+',0)');
      eg.addColorStop(1,'rgba('+c2.r+','+c2.g+','+c2.b+',0.15)');
      ctx.fillStyle=eg; ctx.fillRect(0,H-60,W,60);
    }

    var vg=ctx.createRadialGradient(W/2,H/2,W*0.3,W/2,H/2,W*0.7);
    vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.4)');
    ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
  }

  // ==================== LOADING ====================
  function updateLoading(progress, status) {
    var bar=$('#loading-progress'), st=$('#loading-status');
    if (bar) bar.style.width=progress+'%';
    if (st) st.textContent=status;
  }

  // ==================== NPC GALLERY ====================
  function renderNpcGallery() {
    var gallery=$('#npc-gallery');
    if (!gallery) return;
    gallery.innerHTML='';
    npcList.forEach(function(npc) {
      var card=document.createElement('div');
      card.className='npc-card';
      card.innerHTML='<canvas width="120" height="160"></canvas><div class="npc-card-name">'+npc.name+'</div><div class="npc-card-title">'+npc.title+'</div>';
      drawPortrait(card.querySelector('canvas'),npc,{mini:true});
      card.addEventListener('click',function(){showNpcDetail(npc);});
      gallery.appendChild(card);
    });
  }

  function showNpcDetail(npc) {
    drawPortrait($('#npc-detail-canvas'),npc);
    $('#npc-detail-name').textContent=npc.name;
    $('#npc-detail-title').textContent=npc.title;
    $('#npc-detail-stats').innerHTML=
      '<div class="npc-stat"><div class="npc-stat-label">나이</div><div class="npc-stat-value">'+npc.age+'세</div></div>'+
      '<div class="npc-stat"><div class="npc-stat-label">성별</div><div class="npc-stat-value">'+npc.gender+'</div></div>'+
      '<div class="npc-stat"><div class="npc-stat-label">소속</div><div class="npc-stat-value">'+npc.faction+'</div></div>'+
      '<div class="npc-stat"><div class="npc-stat-label">위치</div><div class="npc-stat-value">'+npc.location+'</div></div>'+
      '<div class="npc-stat"><div class="npc-stat-label">성격</div><div class="npc-stat-value">'+npc.personality.join(', ')+'</div></div>'+
      '<div class="npc-stat"><div class="npc-stat-label">외모</div><div class="npc-stat-value">'+npc.appearance+'</div></div>';
    $('#npc-detail-desc').textContent=npc.description+(npc.relationship.length>0?'\n\n관계: '+npc.relationship.join(' / '):'');
    $('#npc-modal').classList.remove('hidden');
  }

  // ==================== STORY TYPEWRITER ====================
  async function showStoryNarration(paragraphs, worldDescription) {
    var narration=$('#story-narration'), worldDesc=$('#story-world-desc'), nextBtn=$('#btn-story-next');
    narration.innerHTML=''; worldDesc.textContent='';

    for (var i=0;i<paragraphs.length;i++) {
      var p=document.createElement('p');
      p.className='story-paragraph'; p.style.animationDelay=i*0.3+'s';
      narration.appendChild(p);
      await typeWriter(p,paragraphs[i],30);
      await sleep(400);
    }

    if (worldDescription) {
      worldDesc.style.opacity='0'; worldDesc.textContent=worldDescription;
      worldDesc.style.transition='opacity 1s ease';
      await sleep(200); worldDesc.style.opacity='1';
    }
    await sleep(500);
    nextBtn.classList.remove('hidden');
  }

  function typeWriter(el, text, speed) {
    return new Promise(function(resolve) {
      var i=0;
      (function type() { if(i<text.length){el.textContent+=text[i];i++;setTimeout(type,speed);}else resolve(); })();
    });
  }

  // ==================== CHARACTER CREATION ====================
  function updateCharPreview() {
    var canvas=$('#char-preview-canvas');
    if (!canvas) return;
    drawPortrait(canvas,{
      id:999, name:$('#char-name').value||'???', title:selectedClass||'모험자',
      age:parseInt($('#char-age').value)||20, gender:$('#char-gender').value,
      personality:[], appearance:'', hairColor:$('#char-hair-color').value,
      eyeColor:$('#char-eye-color').value, faction:'', location:'', description:'', relationship:[]
    });
  }

  async function loadBackgrounds(className) {
    var container=$('#background-options');
    container.innerHTML='<p class="bg-loading">배경 스토리를 생성하고 있습니다...</p>';
    try {
      var res=await fetch('/api/generate-backgrounds',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({sessionId:SESSION_ID,className:className})
      });
      var result=await res.json();
      if (!result.success) throw new Error(result.error);
      container.innerHTML='';
      result.data.backgrounds.forEach(function(bg) {
        var opt=document.createElement('div');
        opt.className='bg-option';
        opt.innerHTML='<div class="bg-option-title">'+bg.title+'</div><div class="bg-option-desc">'+bg.description+'</div><div class="bg-option-tone">'+bg.tone+'</div>';
        opt.addEventListener('click',function(){
          container.querySelectorAll('.bg-option').forEach(function(o){o.classList.remove('selected');});
          opt.classList.add('selected');
          selectedBackground=bg; checkCharFormComplete();
        });
        container.appendChild(opt);
      });
    } catch(err) {
      container.innerHTML='<p class="bg-loading">배경 생성 실패: '+err.message+'</p>';
    }
  }

  function checkCharFormComplete() {
    var name=$('#char-name').value.trim();
    var customArea=$('#custom-bg-area');
    var hasBg=selectedBackground||(customArea&&!customArea.classList.contains('hidden')&&$('#custom-bg-text').value.trim());
    $('#btn-create-char').disabled=!(name&&selectedClass&&hasBg);
  }

  // ==================== GAME PLAY ====================
  async function sendPlayerAction(input) {
    if (isProcessing||!input.trim()) return;
    isProcessing=true;
    var sendBtn=$('#btn-send'), playerInput=$('#player-input');
    sendBtn.disabled=true; playerInput.disabled=true;

    var narrative=$('#narrative-text');
    narrative.innerHTML+='<div style="color:var(--accent-bright);margin:12px 0;">&#9656; '+escapeHtml(input)+'</div>';
    narrative.innerHTML+='<div class="thinking" style="color:var(--text-dim);font-style:italic;">이야기를 만들고 있습니다...</div>';
    narrative.scrollTop=narrative.scrollHeight;

    try {
      var res=await fetch('/api/play',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({sessionId:SESSION_ID,userInput:input,isFirstTurn:turnCount===0})
      });
      var result=await res.json();
      if (!result.success) throw new Error(result.error);

      turnCount++;
      var data=result.data;
      var thinkEl=narrative.querySelector('.thinking');
      if (thinkEl) thinkEl.remove();

      drawScene($('#scene-canvas'),data.scene,data.emotion);
      $('#scene-location').textContent=data.scene.location;
      updateSceneNpcPortraits(data.presentNpcData||[]);

      var narDiv=document.createElement('div');
      narDiv.style.marginBottom='16px';
      narDiv.innerHTML=formatNarrative(data.narrative);
      narrative.appendChild(narDiv);
      narrative.scrollTop=narrative.scrollHeight;

      var choicesContainer=$('#choices-container');
      if (data.choices&&data.choices.length>0) {
        choicesContainer.innerHTML=''; choicesContainer.classList.remove('hidden');
        data.choices.forEach(function(choice) {
          var btn=document.createElement('button');
          btn.className='choice-btn'; btn.textContent=choice;
          btn.addEventListener('click',function(){
            choicesContainer.classList.add('hidden');
            playerInput.value=''; sendPlayerAction(choice);
          });
          choicesContainer.appendChild(btn);
        });
      } else choicesContainer.classList.add('hidden');

      addGameLog(data.scene.location,input);
      updateSideNpcList();
    } catch(err) {
      var thinkEl=narrative.querySelector('.thinking');
      if (thinkEl) thinkEl.textContent='오류: '+err.message;
    }

    playerInput.value=''; playerInput.disabled=false;
    sendBtn.disabled=false; playerInput.focus();
    isProcessing=false;
  }

  function formatNarrative(text) {
    var html=escapeHtml(text).replace(/\n/g,'<br>');
    html=html.replace(/\u300C([^\u300D]*)\u300D/g,'<span class="dialogue">\u300C$1\u300D</span>');
    return html;
  }

  function updateSceneNpcPortraits(npcs) {
    var container=$('#scene-npc-portraits'); container.innerHTML='';
    npcs.forEach(function(npc) {
      if (!npc) return;
      var thumb=document.createElement('div'); thumb.className='scene-npc-thumb'; thumb.title=npc.name;
      var c=document.createElement('canvas'); c.width=50; c.height=50;
      drawMiniPortrait(c,npc); thumb.appendChild(c); container.appendChild(thumb);
    });
  }

  function addGameLog(location, action) {
    var log=$('#game-log'); if (!log) return;
    var entry=document.createElement('div'); entry.className='log-entry';
    entry.innerHTML='<div class="log-entry-time">Turn '+turnCount+' | '+escapeHtml(location)+'</div><div>'+escapeHtml(action)+'</div>';
    log.appendChild(entry); log.scrollTop=log.scrollHeight;
  }

  function updateSideNpcList() {
    var list=$('#side-npc-list'); if (!list) return;
    list.innerHTML='';
    npcList.forEach(function(npc) {
      var item=document.createElement('div'); item.className='side-npc-item';
      item.innerHTML='<div class="npc-mini-portrait"><canvas width="36" height="36"></canvas></div><div><div class="side-npc-item-name">'+npc.name+'</div><div class="side-npc-item-title">'+npc.title+' | '+npc.location+'</div></div>';
      drawMiniPortrait(item.querySelector('canvas'),npc);
      item.addEventListener('click',function(){showNpcDetail(npc);});
      list.appendChild(item);
    });
  }

  // ==================== EVENTS ====================
  function initEvents() {
    $('#btn-start').addEventListener('click', async function() {
      showScreen('screen-loading');
      updateLoading(5,'세계의 윤곽을 잡는 중...');
      try {
        updateLoading(15,'대륙과 바다를 만드는 중...');
        var res=await fetch('/api/init-world',{
          method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({sessionId:SESSION_ID})
        });
        updateLoading(60,'NPC와 스토리를 만드는 중...');
        var result=await res.json();
        if (!result.success) throw new Error(result.error);

        worldData=result.data.world; npcList=result.data.npcs; storyData=result.data.story;
        updateLoading(80,'지도를 그리는 중...');
        await sleep(300);

        drawMap($('#map-canvas'),worldData);
        $('#world-name').textContent=worldData.name;
        $('#world-era').textContent=worldData.era;

        updateLoading(95,'완료!');
        await sleep(500);
        updateLoading(100,'세계가 완성되었습니다!');
        await sleep(500);
        showScreen('screen-map');
      } catch(err) {
        updateLoading(0,'오류: '+err.message);
        $('#loading-title').textContent='세계 생성 실패';
        $('#loading-subtitle').textContent='다시 시도해주세요';
      }
    });

    $('#btn-map-next').addEventListener('click',function(){ renderNpcGallery(); showScreen('screen-npcs'); });

    $('#btn-npcs-next').addEventListener('click',function(){
      showScreen('screen-story');
      if (storyData) showStoryNarration(storyData.paragraphs,storyData.worldDescription);
    });

    $('#btn-story-next').addEventListener('click',function(){ showScreen('screen-character'); updateCharPreview(); });

    $('.modal-close').addEventListener('click',function(){$('#npc-modal').classList.add('hidden');});
    $('.modal-backdrop').addEventListener('click',function(){$('#npc-modal').classList.add('hidden');});

    $$('.class-btn').forEach(function(btn) {
      btn.addEventListener('click',function(){
        $$('.class-btn').forEach(function(b){b.classList.remove('selected');});
        btn.classList.add('selected');
        selectedClass=btn.dataset.class;
        updateCharPreview(); loadBackgrounds(selectedClass); checkCharFormComplete();
      });
    });

    ['#char-name','#char-age','#char-gender','#char-hair-color','#char-eye-color'].forEach(function(sel) {
      var el=$(sel);
      if (el) {
        el.addEventListener('input',function(){updateCharPreview();checkCharFormComplete();});
        el.addEventListener('change',function(){updateCharPreview();checkCharFormComplete();});
      }
    });

    $('#btn-custom-bg').addEventListener('click',function(){
      var area=$('#custom-bg-area');
      area.classList.toggle('hidden');
      if (!area.classList.contains('hidden')) {
        selectedBackground=null;
        $$('.bg-option').forEach(function(o){o.classList.remove('selected');});
        $('#btn-custom-bg').textContent='AI 배경 선택하기';
      } else { $('#btn-custom-bg').textContent='직접 작성하기'; }
      checkCharFormComplete();
    });
    $('#custom-bg-text').addEventListener('input',checkCharFormComplete);

    $('#btn-create-char').addEventListener('click', async function() {
      var bgText=selectedBackground?selectedBackground.description:$('#custom-bg-text').value.trim();
      playerData={
        name:$('#char-name').value.trim(),
        age:parseInt($('#char-age').value),
        gender:$('#char-gender').value,
        class:selectedClass,
        hairColor:$('#char-hair-color').value,
        eyeColor:$('#char-eye-color').value,
        background:bgText
      };

      await fetch('/api/save-player',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({sessionId:SESSION_ID,player:playerData})
      });

      showScreen('screen-game');
      var firstLoc=(worldData&&worldData.locations&&worldData.locations[0])?worldData.locations[0].name:'마을';
      drawScene($('#scene-canvas'),{locationType:'town',timeOfDay:'morning',weather:'clear',mood:'peaceful',location:firstLoc});
      $('#scene-location').textContent=firstLoc;

      drawMap($('#minimap-canvas'),worldData,{mini:true});
      updateSideNpcList();

      var firstMsg='나의 이름은 '+playerData.name+'. '+playerData.age+'세 '+playerData.gender+' '+playerData.class+'이다.\n배경: '+playerData.background+'\n\n이 세계에서 나의 모험이 시작된다. 첫 장면을 시작해주세요.';
      sendPlayerAction(firstMsg);
    });

    $('#btn-send').addEventListener('click',function(){
      var input=$('#player-input').value.trim();
      if (input) sendPlayerAction(input);
    });
    $('#player-input').addEventListener('keydown',function(e){
      if (e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); var input=$('#player-input').value.trim(); if(input) sendPlayerAction(input); }
    });

    $('#btn-side-panel').addEventListener('click',function(){$('#side-panel').classList.toggle('hidden');});
    $$('.side-tab').forEach(function(tab){
      tab.addEventListener('click',function(){
        $$('.side-tab').forEach(function(t){t.classList.remove('active');});
        $$('.side-content').forEach(function(c){c.classList.remove('active');});
        tab.classList.add('active');
        $('#'+tab.dataset.tab).classList.add('active');
      });
    });
  }

  // ==================== INIT ====================
  document.addEventListener('DOMContentLoaded',function(){
    initTitleParticles();
    initEvents();
  });
})();
