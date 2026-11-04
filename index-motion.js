(function(){
  'use strict';
  var d=document,w=window;
  var reduce=w.matchMedia&&w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s,c){return Array.prototype.slice.call((c||d).querySelectorAll(s));}
  function clamp(v){return v<0?0:v>1?1:v;}

  /* pilihan animasi layanan (preview: ?fx=a|b|c) */
  var sec=d.getElementById('layanan');
  var q=/[?&]fx=([abc])\b/.exec(w.location.search);
  if(sec&&q)sec.setAttribute('data-fx',q[1]);
  var fx=sec?sec.getAttribute('data-fx'):'a';

  /* index untuk stagger */
  $('.svc-item').forEach(function(e,i){e.style.setProperty('--i',i);});
  $('.ch-row').forEach(function(e,i){e.style.setProperty('--i',i);});

  function onView(els,cb,opt){
    if(!('IntersectionObserver' in w)){els.forEach(cb);return;}
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){if(e.isIntersecting){cb(e.target);io.unobserve(e.target);}});
    },opt||{threshold:.15,rootMargin:'0px 0px -8% 0px'});
    els.forEach(function(e){io.observe(e);});
  }
  var add=function(el){el.classList.add('in');};
  onView($('#t-layanan,#t-proses,.ecosystem-head,.svc-list,.channels,.ch-list'),add);

  /* sentuh: satu baris yang paling dekat garis baca jadi aktif */
  var items=$('.svc-item'),list=d.querySelector('.svc-list'),fraf=0;
  var touch=w.matchMedia&&w.matchMedia('(hover: none)').matches;
  function focusNearest(){
    fraf=0;
    var vh=w.innerHeight||800,lr=list.getBoundingClientRect(),best=-1,bd=1e9,line=vh*.45;
    if(lr.bottom>vh*.15&&lr.top<vh*.85){
      items.forEach(function(e,i){
        var r=e.getBoundingClientRect(),dist=Math.abs(r.top+r.height/2-line);
        if(dist<bd){bd=dist;best=i;}
      });
    }
    items.forEach(function(e,i){
      e.classList.toggle('focus',i===best);
      if(fx==='c'){var r=e.getBoundingClientRect(),s=1-Math.abs(r.top+r.height/2-line)/(vh*.34);e.style.setProperty('--s',(s<0?0:s>1?1:s).toFixed(3));}
    });
  }
  if((touch||fx==='c')&&list&&items.length&&!reduce){
    var freq=function(){if(!fraf)fraf=w.requestAnimationFrame(focusNearest);};
    w.addEventListener('scroll',freq,{passive:true});w.addEventListener('resize',freq);freq();
  }

  /* cara kerja: garis terisi mengikuti scroll */
  var ol=d.querySelector('.process'); if(!ol) return;
  var steps=$('.step',ol); if(!steps.length) return;
  var mq=w.matchMedia('(max-width: 1000px)'),raf=0;
  function setAll(){
    steps.forEach(function(s,i){s.classList.add('on');s.classList.toggle('cur',i===steps.length-1);});
    ol.style.setProperty('--p',1);
  }
  function update(){
    raf=0;
    var vert=mq.matches,r=ol.getBoundingClientRect(),vh=w.innerHeight||800;
    var last=steps[steps.length-1],y0,track,p,cur=-1;
    if(vert){
      y0=steps[0].offsetTop+11.5; track=last.offsetTop+11.5-y0;
      var trig=vh*.62;
      p=track>0?clamp((trig-(r.top+y0))/track):0;
      steps.forEach(function(s,i){var on=trig>=r.top+s.offsetTop+11.5;s.classList.toggle('on',on);if(on)cur=i;});
    }else{
      y0=0; track=last.offsetLeft+12;
      p=clamp((vh*.88-r.top)/(vh*.45));
      steps.forEach(function(s,i){var on=p>0.02&&p>=(s.offsetLeft+6)/track-0.001;s.classList.toggle('on',on);if(on)cur=i;});
    }
    steps.forEach(function(s,i){s.classList.toggle('cur',i===cur);});
    ol.style.setProperty('--p',p.toFixed(4));
    ol.style.setProperty('--track',track+'px');
    ol.style.setProperty('--y0',y0+'px');
  }
  function req(){if(!raf)raf=w.requestAnimationFrame(update);}
  if(reduce){
    var t=steps[steps.length-1];
    var fixed=function(){
      var vert=mq.matches,y0=vert?steps[0].offsetTop+11.5:0;
      var track=vert?t.offsetTop+11.5-y0:t.offsetLeft+12;
      ol.style.setProperty('--track',track+'px');ol.style.setProperty('--y0',y0+'px');setAll();
    };
    fixed();w.addEventListener('resize',fixed);w.addEventListener('load',fixed);return;
  }
  w.addEventListener('scroll',req,{passive:true});
  w.addEventListener('resize',req);
  w.addEventListener('load',req);
  if(d.fonts&&d.fonts.ready)d.fonts.ready.then(req);
  req();
})();
