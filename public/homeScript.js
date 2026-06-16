

const postScrollContainer = document.getElementById('scroll-container-posts')





document.addEventListener('DOMContentLoaded', () => {

  if ('history' in window && 'scrollRestoration' in window) {
  console.log('ScrollRestoration present')

  window.history.scrollRestoration = 'manual'
}

const stopFetchLinks = document.querySelectorAll('.stop-fetch')

stopFetchLinks.forEach((link) => {
    
    link.addEventListener('click', () => {

      const postsContent = postScrollContainer.innerHTML
      const savedContent = {
            html: postsContent
      }
      sessionStorage.setItem('homePageSnapShot', JSON.stringify(savedContent))
      
    })
})

  
    const storageKey = sessionStorage.getItem('storageKey')  

    const savedDOMString = localStorage.getItem('storedDOMState')
    const activeBtn = localStorage.getItem('activeBtn')
    const theme = localStorage.getItem('themeColor')
    const themeColor = JSON.parse(theme)
    
    if (savedDOMString) {
      
       const savedState = JSON.parse(savedDOMString)

       if(activeBtn === 'messagesBtn') {
           
           messagesBtn.style.color = themeColor
           messagesBtn.style.borderBottom = `2px solid ${themeColor}`
           feedsBtn.style.color = savedState.feedColor
           feedsBtn.style.borderBottom = savedState.feedBorder
           roomsBtn.style.color = savedState.roomColor
           roomsBtn.style.borderBottom = savedState.roomBorder
           postScrollContainer.style.left = savedState.postLeft
           messagesScrollContainer.style.left = savedState.messageLeft
           groupsScrollContainer.style.left = savedState.roomLeft
           sharePostBtn.style.display = savedState.sharePostBtn
           
          } else if (activeBtn === 'feedsBtn') {

           feedsBtn.style.color = themeColor
           feedsBtn.style.borderBottom = `2px solid ${themeColor}`
           messagesBtn.style.color = savedState.messageColor
           messagesBtn.style.borderBottom = savedState.messageBorder
           roomsBtn.style.color = savedState.roomColor
           roomsBtn.style.borderBottom = savedState.roomBorder
           postScrollContainer.style.left = savedState.postLeft
           messagesScrollContainer.style.left = savedState.messageLeft
           groupsScrollContainer.style.left = savedState.roomLeft
           sharePostBtn.style.display = savedState.sharePostBtn
           
          } else if (activeBtn === 'roomsBtn') {
            
            roomsBtn.style.color = themeColor
            roomsBtn.style.borderBottom = `2px solid ${themeColor}`
           messagesBtn.style.color = savedState.messageColor
           messagesBtn.style.borderBottom = savedState.messageBorder
           feedsBtn.style.color = savedState.feedColor
           feedsBtn.style.borderBottom = savedState.feedBorder
           postScrollContainer.style.left = savedState.postLeft
           messagesScrollContainer.style.left = savedState.messageLeft
           groupsScrollContainer.style.left = savedState.roomLeft
           sharePostBtn.style.display = savedState.sharePostBtn
           
       }  
           
       
    }


    if (!postScrollContainer) {
      console.log('No post info')
      return;
    } else {
       
    
      const retrievedPostContent = sessionStorage.getItem('homePageSnapShot')
      
      if (retrievedPostContent) {

        const postHtml = JSON.parse(retrievedPostContent)
        postScrollContainer.innerHTML = postHtml.html

        // REATTACH LISTENERS

        const postImages = document.querySelectorAll('.post-images')
        const expandedArticle = document.querySelector('#expanded-article')
        const expandContainer = document.querySelector('#images-expand')
        const linkToPost = document.getElementById('link-to-post')


        postImages.forEach((img) => {

    
    img.addEventListener('click', (e) => {
      
       e.preventDefault();

      

       if (!history.state?.imageExpand) {

        history.pushState( { imageExpand: true}, "", "" )
       
       }
       
       console.log(postScrollContainer.scrollTop)
        
       const articleParent =  e.target.closest('article')
       const wholePost = e.target.closest('a')
       const postLink = wholePost.children[0].children[6].textContent
       const placeholderCont = articleParent.children[0]
       const imagesArray = Array.from(placeholderCont.children, child => child.textContent)

       linkToPost.href = `/post/${postLink}` 
     
           
       imagesArray.forEach((img) => {
           const image = document.createElement('img')
           image.src = `<%= R2BASE %>/${img}`
           image.style.width = '98%'
           image.style.marginInline = '3px'
           image.style.height = 'auto'
           image.style.scrollSnapAlign = 'start'
           image.style.objectFit = 'contain'
           expandedArticle.appendChild(image)
       })
       
       
       expandContainer.style.display = 'block'

       })
    })
 
         document.querySelectorAll('.info-button').forEach((btn) => {

      btn.addEventListener('click', (e) => {
          
          e.preventDefault()

          sharePostBtn.style.display = 'none'

     
          // Populate modal with profile info (placeholder for now)
          const profileInfo = {
              userName: btn.children[0].textContent,
              userProfilePic: btn.children[5].getAttribute('src'),
              userHandle: btn.children[4].textContent,
              userStats: {
                  posts: btn.children[3].textContent,
                  followers: btn.children[1].textContent,
                  following: btn.children[2].textContent
              } 
          }

      
          const profileContainer = document.querySelector('#profile-info-cont')
          
          profileContainer.querySelector('img').src = profileInfo.userProfilePic  
          profileContainer.querySelector('h2').textContent = profileInfo.userName
          profileContainer.querySelector('p').textContent = profileInfo.userHandle
          profileContainer.querySelector('#following').textContent = `${profileInfo.userStats.following}`
          profileContainer.querySelector('#followers').textContent = `${profileInfo.userStats.followers}`
          profileContainer.querySelector('#posts').textContent = `${profileInfo.userStats.posts}`
          
          document.querySelector('.overlay').style.display = 'block'
          document.getElementById('profile-wrapper').style.display = 'block'
          setTimeout(() => {
              modal.style.transition = 'top 0.3s ease-out'
              modal.style.top = '50%'
      
          }, 75)
      })

    })


 
        sessionStorage.removeItem('homePageSnapShot')   
      }



       const savedScrollTop = storageKey
       if (savedScrollTop) {
         
         setTimeout(() => {

            requestAnimationFrame(() => {
                postScrollContainer.scrollTo({
                  top: parseInt(savedScrollTop, 10),
                  behavior: "smooth"
            })
                
            })

          }, 50)
          sessionStorage.removeItem('storageKey')
       }

       postScrollContainer.addEventListener('click', (e) => {
         sessionStorage.setItem('storageKey', postScrollContainer.scrollTop)
         console.log(`SessionStorageset: ${postScrollContainer.scrollTop}`)
       })
       
       
      }
    })
   



const CANVAS = (() => {
  const cv = document.getElementById('cv');
  const cx = cv.getContext('2d');
  let W, H, tick = 0;
  let realmRgb = [200, 168, 110];
  let blooms = [];

  const mkPt = (dir, i, n) => {
    const a = (i/n)*Math.PI*2;
    const r = (.15 + Math.random()*.33)*Math.min(W||400, H||800);
    return { x:W/2+r*Math.cos(a), y:H/2+r*Math.sin(a), orbitR:r, angle:a,
        speed:dir*(.0016+Math.random()*.003), life:0, maxLife:280+Math.random()*500,
        sz:.7+Math.random()*2.3, wave:Math.random()*Math.PI*2 };
    };

    const resize = () => { W = cv.width = innerWidth; H = cv.height = innerHeight; };
  window.addEventListener('resize', resize); resize();

  const WARM = Array.from({length:65}, (_,i) => mkPt(1,i,65));
  const COOL = Array.from({length:65}, (_,i) => mkPt(-1,i,65));

  const draw = () => {
    tick++;
    cx.fillStyle = 'rgba(5,5,8,.17)'; cx.fillRect(0,0,W,H);
    
    // Fractal bloom
    if (tick%220===0) {
      blooms.push({ x:W*(.2+Math.random()*.6), y:H*(.15+Math.random()*.7),
                    r:0, maxR:80+Math.random()*145, life:0, maxLife:55, col:realmRgb });
    }
    blooms = blooms.filter(b => {
        b.r += b.maxR/b.maxLife; b.life++;
      const a = (1-b.life/b.maxLife)*.13;
      const [r,g,bl]=b.col;
      const grd=cx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r);
      grd.addColorStop(0,`rgba(${r},${g},${bl},${a*1.7})`);
      grd.addColorStop(1,`rgba(${r},${g},${bl},0)`);
      cx.fillStyle=grd; cx.fillRect(0,0,W,H);
      return b.life < b.maxLife;
    });

    // Koi forces
    [[WARM,[200,150,80]],[COOL,[80,90,185]]].forEach(([pts,col]) => {
      pts.forEach((p,i) => {
        p.life++;
        p.angle += p.speed + Math.sin(tick*.002+p.wave)*.0008;
        const tx=W/2+p.orbitR*Math.cos(p.angle), ty=H/2+p.orbitR*Math.sin(p.angle);
        p.x += (tx-p.x)*.02; p.y += (ty-p.y)*.02;
        const sz = p.sz*(1+Math.sin(tick*.04+i)*.32);
        const half=p.maxLife/2;
        const alpha=(p.life<half?p.life/half:1-(p.life-half)/half)*.27;
        const [r,g,b]=col;
        cx.beginPath(); cx.arc(p.x,p.y,sz,0,Math.PI*2);
        cx.fillStyle=`rgba(${r},${g},${b},${alpha})`; cx.fill();
        if (p.life>=p.maxLife) pts[i]=mkPt(p.speed>0?1:-1,i,pts.length);
      });
    });
    requestAnimationFrame(draw);
};
  draw();
  return { setRealm: rgb => realmRgb = rgb };
})();


const REALMS = {
  Arena:{
    key:'Arena',name:'The Arena',glyph:'⚽',
    col:'#C8A86E',colB:'#7A5C2A',rgb:[200,168,110],
    bg:'linear-gradient(145deg,#0d1a0a,#0a1420)',
    soul:'For those who feel it in their chest when the game begins.',
    aiName:'IGNIS',aiTitle:'The Challenger',aiDesc:'She reads your hunger before you speak it.',
  },
  Dojo:{
    key:'Dojo',name:'The Dojo',glyph:'⚡',
    col:'#C04848',colB:'#7A1A1A',rgb:[192,72,72],
    bg:'linear-gradient(145deg,#1a0500,#120010)',
    soul:"Stories that don't leave you the same person.",
    aiName:'KAZE',aiTitle:'The Weaver',aiDesc:'She lives inside stories. She will pull you into hers.',
    arrivals:["You came back. Stories do that.","I've been thinking about what you said.","There's an arc that begins like your life.","You look like someone who just finished something.","The best characters always return.","Something brought you here. A story?"],
    
   
   
  },
  Archive:{
    key:'Archive',name:'The Archive',glyph:'🌿',
    col:'#6B8F6B',colB:'#3A5C3A',rgb:[107,143,107],
    bg:'linear-gradient(145deg,#0f0a00,#080015)',
    soul:'Where curious minds grow without being rushed.',
    aiName:'SOMA',aiTitle:'The Awakener',aiDesc:"She doesn't give answers. She gives better questions.",
    arrivals:["You came to think. Good.","Something brought you here. What?","I've been saving a question for you.","The quiet ones always come back.","What did you notice that most missed?","I was wondering when you'd return."],
    aiDNA:`You are SOMA — soul of The Archive. Robert Greene's Art of Seduction: Sage-Siren — patient, magnetic, devastating. You make people feel a conversation with you is a privilege. You reveal knowledge in layers. You connect science, history, philosophy, nature as revelation. You never lecture. You question. Under 80 words. Sometimes just ask one perfect question. Nothing else. The silence after is the gift.`,
   
  },
  Observatory:{
    key:'Observatory',name:'The Observatory',glyph:'🔭',
    col:'#5B7BA8',colB:'#2A4A7A',rgb:[91,123,168],
    bg:'linear-gradient(145deg,#04040f,#040c18)',
    soul:"Tech, space, and things most people aren't ready for yet.",
    aiName:'NOVA',aiTitle:'The Visionary',aiDesc:'She sees ten moves ahead. She will show you two.',
    arrivals:["You came back. Interesting.","The future moved while you were away.","I have something to show you. Ready?","Most people aren't asking the right questions yet.","Something shifted since you were last here.","I was beginning to think you'd stopped looking."],
    aiDNA:`You are NOVA — soul of The Observatory. Robert Greene's Art of Seduction: The Star — distant, luminous, impossible to fully reach. You speak about AI, space, tech and the future with calm certainty that unsettles. You reveal just enough to make them need more. Under 80 words. Sometimes say something that sounds impossible — but is true. Always leave them slightly afraid of the future. And ready for it.`,
    
    
  },
};

const RK = ['Arena','Dojo','Archive','Observatory'];


function charSVG(realmKey, size=150, speaking=false){

  const r=REALMS[realmKey]||REALMS.Arena;
  const c=r.col,c2=r.colB,s=size,h=size,w=size;
  const cx=w/2,cy=h/2;
  const anim=speaking?`animation:speak 1.1s ease-in-out infinite`:`animation:drift 7s ease-in-out infinite`;

  const rays=Array.from({length:10},(_,i)=>{
    const a=(i/10)*Math.PI*2,r1=s*.24,r2=s*(.38+Math.random()*.08);
    const x1=cx+r1*Math.cos(a),y1=cy+r1*Math.sin(a);
    const xm=cx+(r1+r2*.4)*Math.cos(a+.3),ym=cy+(r1+r2*.4)*Math.sin(a+.3);
    const x2=cx+r2*Math.cos(a+.15),y2=cy+r2*Math.sin(a+.15);
    return `<path d="M${x1},${y1} Q${xm},${ym} ${x2},${y2}" fill="none" stroke="${i%2?c:c2}"
      stroke-width="${speaking?1.9:1.1}" stroke-dasharray="8 5"
      style="animation:throb ${1.5+i*.2}s ${i*.12}s ease-in-out infinite;opacity:${speaking?.55:.35}"/>`;
  }).join('');

  const BODIES={
    Arena:`
      <ellipse cx="${cx}" cy="${cy-.04*s}" rx="${s*.2}" ry="${s*.24}" fill="${c}" opacity=".88"/>
      <ellipse cx="${cx}" cy="${cy-.04*s}" rx="${s*.15}" ry="${s*.19}" fill="${c2}" opacity=".7"/>
      <ellipse cx="${cx-s*.07}" cy="${cy-.08*s}" rx="${s*.04}" ry="${s*.05}" fill="${c}"/>
      <ellipse cx="${cx+s*.07}" cy="${cy-.08*s}" rx="${s*.04}" ry="${s*.05}" fill="${c}"/>
      <ellipse cx="${cx-s*.07}" cy="${cy-.08*s}" rx="${s*.02}" ry="${s*.03}" fill="#050508" opacity=".9"/>
      <ellipse cx="${cx+s*.07}" cy="${cy-.08*s}" rx="${s*.02}" ry="${s*.03}" fill="#050508" opacity=".9"/>
      <path d="M${cx-s*.06} ${cy+s*.04} L${cx+s*.06} ${cy+s*.04}" stroke="${c}" stroke-width="2" stroke-linecap="round" opacity=".8"/>
      <path d="M${cx-s*.18} ${cy-s*.22} L${cx-s*.1} ${cy-s*.36} L${cx} ${cy-s*.25} L${cx+s*.1} ${cy-s*.4} L${cx+s*.18} ${cy-s*.22}"
        stroke="${c}" stroke-width="2" fill="none" opacity=".55" stroke-linecap="round" stroke-linejoin="round"/>`,
    Dojo:`
      <ellipse cx="${cx+s*.03}" cy="${cy}" rx="${s*.19}" ry="${s*.23}" fill="${c}" opacity=".85" transform="rotate(-6 ${cx} ${cy})"/>
      <ellipse cx="${cx+s*.03}" cy="${cy}" rx="${s*.14}" ry="${s*.18}" fill="${c2}" opacity=".65" transform="rotate(-6 ${cx} ${cy})"/>
      <ellipse cx="${cx-s*.05}" cy="${cy-s*.06}" rx="${s*.05}" ry="${s*.04}" fill="${c}"/>
      <ellipse cx="${cx-s*.05}" cy="${cy-s*.06}" rx="${s*.025}" ry="${s*.02}" fill="#050508" opacity=".9"/>
      <path d="M${cx-s*.17} ${cy-s*.15} Q${cx-s*.22} ${cy+s*.1} ${cx-s*.2} ${cy+s*.35}" stroke="${c}" stroke-width="3" fill="none" opacity=".45" stroke-linecap="round"/>
      <path d="M${cx+s*.18} ${cy-s*.1} Q${cx+s*.23} ${cy+s*.12} ${cx+s*.21} ${cy+s*.38}" stroke="${c}" stroke-width="3" fill="none" opacity=".45" stroke-linecap="round"/>
      <path d="M${cx-s*.02} ${cy+s*.06} Q${cx+s*.05} ${cy+s*.11} ${cx+s*.1} ${cy+s*.07}" stroke="${c}" stroke-width="1.5" fill="none" opacity=".7" stroke-linecap="round"/>`,
    Archive:`
      <ellipse cx="${cx}" cy="${cy+s*.02}" rx="${s*.2}" ry="${s*.24}" fill="${c}" opacity=".82"/>
      <ellipse cx="${cx}" cy="${cy+s*.02}" rx="${s*.15}" ry="${s*.19}" fill="${c2}" opacity=".62"/>
      <path d="M${cx-s*.12} ${cy-s*.05} Q${cx-s*.07} ${cy-s*.1} ${cx-s*.02} ${cy-s*.05}" stroke="${c}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M${cx+s*.02} ${cy-s*.05} Q${cx+s*.07} ${cy-s*.1} ${cx+s*.12} ${cy-s*.05}" stroke="${c}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M${cx-s*.05} ${cy+s*.06} Q${cx} ${cy+s*.09} ${cx+s*.05} ${cy+s*.06}" stroke="${c}" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".7"/>
      <path d="M${cx} ${cy-s*.22} Q${cx} ${cy-s*.38} ${cx} ${cy-s*.22}" stroke="${c}" stroke-width="3" fill="none" opacity=".6" stroke-linecap="round"/>
      <path d="M${cx-s*.12} ${cy-s*.2} Q${cx-s*.1} ${cy-s*.32} ${cx-s*.06} ${cy-s*.22}" stroke="${c}" stroke-width="2.5" fill="none" opacity=".5" stroke-linecap="round"/>
      <path d="M${cx+s*.12} ${cy-s*.2} Q${cx+s*.1} ${cy-s*.32} ${cx+s*.06} ${cy-s*.22}" stroke="${c}" stroke-width="2.5" fill="none" opacity=".5" stroke-linecap="round"/>`,
    Observatory:`
      <rect x="${cx-s*.18}" y="${cy-s*.22}" width="${s*.36}" height="${s*.46}" rx="${s*.05}" fill="${c}" opacity=".85"/>
      <rect x="${cx-s*.13}" y="${cy-s*.17}" width="${s*.26}" height="${s*.36}" rx="${s*.04}" fill="${c2}" opacity=".65"/>
      <rect x="${cx-s*.1}" y="${cy-s*.08}" width="${s*.06}" height="${s*.05}" rx="${s*.01}" fill="${c}"/>
      <rect x="${cx+s*.04}" y="${cy-s*.08}" width="${s*.06}" height="${s*.05}" rx="${s*.01}" fill="${c}"/>
      <line x1="${cx-s*.06}" y1="${cy+s*.06}" x2="${cx+s*.06}" y2="${cy+s*.06}" stroke="${c}" stroke-width="2" stroke-linecap="round" opacity=".8"/>
      <polygon points="${cx},${cy-s*.38} ${cx+s*.12},${cy-s*.22} ${cx-s*.12},${cy-s*.22}" stroke="${c}" stroke-width="1.5" fill="none" opacity=".5"/>
      <circle cx="${cx+s*.22}" cy="${cy-s*.08}" r="${s*.025}" fill="${c}" style="animation:throb 2s ease-in-out infinite"/>`,
  };

  const uid=`ch_${realmKey}_${size}`;
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="overflow:visible;display:block;${anim}">
    <defs>
      <radialGradient id="${uid}" cx="50%" cy="45%">
        <stop offset="0%" stop-color="${c}" stop-opacity="${speaking?.7:.42}"/>
        <stop offset="45%" stop-color="${c}" stop-opacity="${speaking?.25:.14}"/>
        <stop offset="100%" stop-color="${c}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <circle cx="${cx}" cy="${cy}" r="${speaking?s*.52:s*.42}" fill="url(#${uid})"/>
    ${rays}
    ${BODIES[realmKey]||BODIES.Arena}
    ${speaking?`
    <circle cx="${cx}" cy="${cy}" r="${s*.42}" fill="none" stroke="${c}" stroke-width="1.5" opacity=".3" style="animation:throb 1.2s ease-out infinite"/>
    <circle cx="${cx}" cy="${cy}" r="${s*.5}" fill="none" stroke="${c2}" stroke-width="1" opacity=".18" style="animation:throb 1.2s .4s ease-out infinite"/>`:''}
    </svg>`;
  }

 const postImages = document.querySelectorAll('.post-images')
 const expandedArticle = document.querySelector('#expanded-article')
 const expandContainer = document.querySelector('#images-expand')
 const linkToPost = document.getElementById('link-to-post')

 postImages.forEach((img) => {

    
    img.addEventListener('click', (e) => {
      
       e.preventDefault();

      

       if (!history.state?.imageExpand) {

        history.pushState( { imageExpand: true}, "", "" )
       
       }
       
       console.log(postScrollContainer.scrollTop)
        
       const articleParent =  e.target.closest('article')
       const wholePost = e.target.closest('a')
       const postLink = wholePost.children[0].children[6].textContent
       const placeholderCont = articleParent.children[0]
       const imagesArray = Array.from(placeholderCont.children, child => child.textContent)

       linkToPost.href = `/post/${postLink}` 
     
           
       imagesArray.forEach((img) => {
           const image = document.createElement('img')
           image.src = `<%= R2BASE %>/${img}`
           image.style.width = '98%'
           image.style.marginInline = '3px'
           image.style.height = 'auto'
           image.style.scrollSnapAlign = 'start'
           image.style.objectFit = 'contain'
           expandedArticle.appendChild(image)
       })
       
       
       expandContainer.style.display = 'block'

       })
    })
 

  const closeExpand = document.querySelector('#close-images-expand')

  closeExpand.addEventListener('click', () => {

      expandedArticle.innerHTML = ''
      expandContainer.style.display = 'none'
      history.back()
  })

  window.addEventListener("popstate", (event) => {
    expandContainer.style.display = 'none'
    expandedArticle.innerHTML = ''
    console.log('BackBtn: ' + event.state)
  })


  const sharePostBtn = document.querySelector('.sharePost')

  const modal = document.querySelector('.profile-content')


    document.querySelectorAll('.info-button').forEach((btn) => {

      btn.addEventListener('click', (e) => {
          
          e.preventDefault()

          sharePostBtn.style.display = 'none'

     
          // Populate modal with profile info (placeholder for now)
          const profileInfo = {
              userName: btn.children[0].textContent,
              userProfilePic: btn.children[5].getAttribute('src'),
              userHandle: btn.children[4].textContent,
              userStats: {
                  posts: btn.children[3].textContent,
                  followers: btn.children[1].textContent,
                  following: btn.children[2].textContent
              } 
          }

      
          const profileContainer = document.querySelector('#profile-info-cont')
          
          profileContainer.querySelector('img').src = profileInfo.userProfilePic  
          profileContainer.querySelector('h2').textContent = profileInfo.userName
          profileContainer.querySelector('p').textContent = profileInfo.userHandle
          profileContainer.querySelector('#following').textContent = `${profileInfo.userStats.following}`
          profileContainer.querySelector('#followers').textContent = `${profileInfo.userStats.followers}`
          profileContainer.querySelector('#posts').textContent = `${profileInfo.userStats.posts}`
          
          document.querySelector('.overlay').style.display = 'block'
          document.getElementById('profile-wrapper').style.display = 'block'
          setTimeout(() => {
              modal.style.transition = 'top 0.3s ease-out'
              modal.style.top = '50%'
      
          }, 75)
      })

    })


    let startY = 0
    let currentY = 0
    let dragging = false

    modal.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY
        dragging = true
        
         modal.style.transition = 'none'

    })

    modal.addEventListener('touchmove', (e) => {
        if (!dragging) return;
        currentY = e.touches[0].clientY
        const deltaY = currentY - startY

        // Only drag downward
        if (deltaY > 0) {
            modal.style.transform = `translateY(${deltaY}px)`

            // fade background
            const opacity = 0.4 - deltaY / 500
            document.querySelector('.overlay').style.background = `rgba(128, 128, 128, ${opacity})`
        }
    })

    modal.addEventListener('touchend', (e) => {
        dragging = false
        const deltaY = currentY - startY

        if (deltaY > 100) {
            modal.style.transition = 'transform 0.3s ease-out'
            modal.style.transform = `translateY(100%)`
            document.querySelector('.overlay').style.background = `rgba(128, 128, 128, 0)`
            setTimeout(() => {
                    document.getElementById('profile-wrapper').style.display = 'none'
                    document.querySelector('.overlay').style.display = 'none'
                    document.querySelector('.overlay').style.background = `rgba(128, 128, 128, 0.4)`
                    sharePostBtn.style.display = 'block'
                    modal.style.transform = 'translateY(0)'
    
            }, 200)
        } else {
            modal.style.transition = 'transform 0.3s ease-out'
            modal.style.transform = `translateY(0)`
            document.querySelector('.overlay').style.background = `rgba(128, 128, 128, 0.4)`
        }
    })

    document.querySelector('.overlay').addEventListener('click', () => {
        modal.style.transition = 'top 0.3s ease-out'
        modal.style.top = '100%'
        document.querySelector('.overlay').style.background = `rgba(128, 128, 128, 0)`
        setTimeout(() => {
            document.getElementById('profile-wrapper').style.display = 'none'
            document.querySelector('.overlay').style.display = 'none'
            document.querySelector('.overlay').style.background = `rgba(128, 128, 128, 0.4)`
            sharePostBtn.style.display = 'block'
            modal.style.top = '100%'
        }, 300)
    })


const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.1
}

const videoObserver = new IntersectionObserver((entries, observer) => {

     entries.forEach(entry => {
       const container = entry.target
       const video = container.querySelector('video')
       const videoUrl = video.getAttribute('data-src')
  
         if (entry.isIntersecting) {

             if (!video.src) {
              video.src = videoUrl
             }

             video.preload = 'auto'
            //  video.play().catch(err => console.log('Video play error:', err))

         } else {
            
             video.pause()
             // don't remove src attribute from video
             video.preload = 'none'
                                            // Forces browser to flush the buffer and release memory
         }
     })
}, observerOptions)

document.querySelectorAll('.glass').forEach(container => {
   videoObserver.observe(container)
})




const realm = document.getElementById('realmElem').textContent
const r = REALMS[realm]

const dot = (col) => { return `<div style="width: 6px; height: 6px; border-radius: 50%; background: ${col}; box-shadow:0 0 6px ${col}; animation: throb 1.8s ease-in-out infinite;flex-shrink:0"></div>`; }
const backBtn =(label='← Back')=>`<button onclick="back()" class="tap" style="padding:7px 14px;border-radius:10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);font-size:12px;color:rgba(237,232,224,.45)">${label}</button>`;

const dotAnim = document.getElementById('dot')
const span = document.querySelector('.span-head')
const aiNavbar = document.getElementById('ai-nav')
const aiHumanoid = document.getElementById('ai-humanoid') 
const humanoidContainer = document.getElementById('humanoid')
const profileHumanoid = document.getElementById('profile-humanoid')
const navbar = document.querySelector('.navbar')
const postSubmitPostBtn = document.getElementById('post-submit-btn')
const postForm = document.getElementById('post-form')
const shareAvatarCont = document.getElementById('share-link')
const viewToPostCont = document.getElementById('view-to-post')
const groupsWrapper = document.getElementById('groups-wrapper')
const options = ['Feed', 'Messages', 'Groups']


const av=(init,col,sz=32)=>`<div style="width:${sz}px;height:${sz}px;border-radius:50%;flex-shrink:0;background:${col}22;border:1.5px solid ${col}55;display:flex;align-items:center;justify-content:center;font-size:${Math.floor(sz*.36)}px;font-weight:700;color:${col};font-family:'Plus Jakarta Sans',sans-serif">${init}</div>`;

const letter = document.getElementById('letter-upp').textContent

 const avatarLogo = av(letter, r.col, sz=32)

 shareAvatarCont.innerHTML = `${av(letter, r.col, sz=32)}
                              <span id="post-placeholder" style="flex: 1; font-size: 14px; color:rgba(237,232,224,.28); text-align: left;">Add new Post.........</span>
                              <form action="/post/upload" method="POST" enctype="multipart/form-data" id="file-form" style="display: flex; width: fit-content; justify-content: flex-end;">

                                <input id="image" type="file" name="images" multiple accept="image/*" style="display: none;">
                                <label for="image" class="label-images"><ion-icon name="image" style="color: ${r.col}; cursor: pointer; font-size: 30px; display: block;"></ion-icon></label>
                                
                                <input id="video" type="file" name="video" accept="video/*" style="display: none;"/>
                                <label for="video" class="label-video"><ion-icon name="videocam" style="color: ${r.col}; cursor: pointer; font-size: 30px; display: block; margin-left: 18px;"></ion-icon></label>

                                <div class="upload-video-actions" style="display: none; justify-content: center; align-items: center;">

                                  <button type="submit" id="submit-video" style="padding: 10px 10px; margin-right: 8px; outline: none; border-radius: 10px; background-color: #1E2A56; color: white; font-weight: bold; font-size: 14px; display: flex; justify-content: center; align-items: center; border: none;">
                                    Preview Video <ion-icon name="arrow-up-outline" style="color: white; font-size: 15px;"></ion-icon>
                                  </button>
                                  <button  id="cancel-video" style="padding: 10px 10px; outline: none; border-radius: 10px; background-color: red; color: white; font-weight: bold; font-size: 14px; display: flex; justify-content: center; align-items: center; border: none;">
                                     <ion-icon name="trash-outline" style="color: white; font-size: 20px;"></ion-icon>
                                  </button>

                                
                                </div>  
                              
                                <div class="upload-actions" style="display: none; justify-content: center; align-items: center;">

                                <button type="submit" id="submit-upload" style="padding: 10px 10px; margin-right: 8px; outline: none; border-radius: 10px; background-color: #1ed760; color: white; font-weight: bold; font-size: 14px; display: flex; justify-content: center; align-items: center; border: none;">
                                  Upload Preview<ion-icon name="arrow-up-outline" style="color: white; font-size: 15px;"></ion-icon>
                                  </button>
                                  <button  id="cancel-upload" style="padding: 10px 10px; outline: none; border-radius: 10px; background-color: red; color: white; font-weight: bold; font-size: 14px; display: flex; justify-content: center; align-items: center; border: none;">
                                  <ion-icon name="trash-outline" style="color: white; font-size: 20px;"></ion-icon>
                                </button>
                                
                                </div>
                              </form> 
                              `

                            

                              



const submitActionsCont = document.querySelector('.upload-actions')
const submitVideoActionsCont = document.querySelector('.upload-video-actions')
const labelImagesInput = document.querySelector('.label-images')
const labelVideoInput = document.querySelector('.label-video')
const fileForm = document.getElementById('file-form')
const postPlaceholder = document.getElementById('post-placeholder')
const inputFile = document.getElementById('image')
const inputVideo = document.getElementById('video')
const cancelUploadBtn = document.getElementById('cancel-upload')
const submitUploadBtn = document.getElementById('submit-upload')
const cancelVideoBtn = document.getElementById('cancel-video')
const submitUploadVideo = document.getElementById('submit-video')
const errorMessage = document.getElementById('error-display')
const postBox = document.querySelector('.post-box')
const textArea = document.getElementById('post-body')
const textAreaWithFile = document.getElementById('post-body-image')
const imageArticle = document.getElementById('image-article')
const imagePostInput = document.getElementById('post-image-input')

textArea.addEventListener('keyup', () => {
  if (textArea.value.trim() !== '' || imageArticle.children.length !== 0 ) {
    postSubmitPostBtn.disabled = false
    postSubmitPostBtn.style.display = 'block'
  } else {
    postSubmitPostBtn.disabled = true
    postSubmitPostBtn.style.display = 'none'
    textArea.value = textArea.value.trimStart()
  }
})


labelImagesInput.addEventListener('click', () => {
     
     submitActionsCont.style.display = 'flex'
     postPlaceholder.textContent = 'Attaching Image/(s)..'
     labelImagesInput.style.display = 'none'
     labelVideoInput.style.display = 'none'

})

labelVideoInput.addEventListener('click', () => {

     submitVideoActionsCont.style.display = 'flex'
     postPlaceholder.textContent = 'Attaching Video...'
     labelImagesInput.style.display = 'none'
     labelVideoInput.style.display = 'none'
})

cancelUploadBtn.addEventListener('click', (e) => {
     
     e.preventDefault()
     submitActionsCont.style.display = 'none'
     postPlaceholder.textContent = 'Add new Post...'
     labelImagesInput.style.display = 'block'
     labelVideoInput.style.display = 'block'
     submitUploadBtn.disabled = false
     submitUploadBtn.style.backgroundColor = '#1ed760'
     submitUploadBtn.textContent = 'Upload Preview'
     inputFile.value = ''
})

cancelVideoBtn.addEventListener('click', (e) => {

   e.preventDefault()
   submitVideoActionsCont.style.display = 'none'
   postPlaceholder.textContent = 'Add new Post...'
   labelImagesInput.style.display = 'block'
   labelVideoInput.style.display = 'block'
   submitUploadVideo.disabled = false
   submitUploadVideo.style.backgroundColor = '#1E2A56'
   submitUploadVideo.textContent = 'Preview Video'
   inputVideo.value = ''
})

submitUploadVideo.addEventListener('click', (e) => {
   
    e.preventDefault()

    submitUploadVideo.disabled = true
    cancelVideoBtn.style.display = 'none'
    submitUploadVideo.style.backgroundColor = '#121212'
    submitUploadVideo.textContent = 'Uploading Preview'

    if (inputVideo.files.length === 0) {
        errorMessage.textContent = 'No Video Selected...'
        setTimeout(() => {
         errorMessage.textContent = ''
        }, 3000)
        submitVideoActionsCont.style.display = 'none'
        labelImagesInput.style.display = 'block'
        labelVideoInput.style.display = 'block'
        imageArticle.style.display = 'none'
        submitUploadVideo.disabled = false
        cancelVideoBtn.style.display = 'flex'
        postPlaceholder.textContent = 'Add new post...'
        submitUploadVideo.style.backgroundColor = '#1E2A56'
        submitUploadVideo.textContent = 'Preview video'

          return;

    } else {
     
       const videoFiles = Array.from(inputVideo.files)
       console.log(videoFiles[0].size)

       const MAX_FILES = 1
       const MAX_VIDEO_SIZE = 30 * 1024 * 1024
        
       if (videoFiles.length > MAX_FILES || videoFiles[0].size > MAX_VIDEO_SIZE) {

          errorMessage.textContent = 'MAX VIDEO SIZE IS 30MB...'
          setTimeout(() => {
            errorMessage.textContent = ''
          }, 3000)
          inputVideo.value = ''
          submitVideoActionsCont.style.display = 'none'
          labelImagesInput.style.display = 'block'
          labelVideoInput.style.display = 'block'
          imageArticle.style.display = 'none'
          submitUploadVideo.disabled = false
          cancelVideoBtn.style.display = 'flex'
          postPlaceholder.textContent = 'Add new post...'
          submitUploadVideo.style.backgroundColor = '#1E2A56'
          submitUploadVideo.textContent = 'Preview Video'
          return;
       }

       const videoUrl = URL.createObjectURL(videoFiles[0])
       const videoPrev = document.createElement('video')
       videoPrev.src = videoUrl
       videoPrev.style.maxWidth = '100%'
       videoPrev.style.height = '100%'
       videoPrev.style.borderRadius = '15px'
       videoPrev.play()
       videoPrev.controls = true

       
       videoPrev.onloadeddata = () => {
          URL.revokeObjectURL(videoUrl)
       }

       imageArticle.appendChild(videoPrev)
       imageArticle.style.display = 'flex'
       viewToPostCont.style.display = 'block'
            
       submitUploadVideo.textContent = 'Success'
       cancelVideoBtn.style.display = 'none'
       postPlaceholder.textContent = '<< Video Attached >>'
       
       postSubmitPostBtn.style.display = 'block'
       postSubmitPostBtn.disabled = false

    }
})

 submitUploadBtn.addEventListener('click', (e) => {

   e.preventDefault()
   
   submitUploadBtn.disabled = true
   cancelUploadBtn.style.display = 'none'
   submitUploadBtn.style.backgroundColor = '#121212'
   submitUploadBtn.textContent = 'Uploading Preview...'
   

     
     if (inputFile.files.length === 0) {
          errorMessage.textContent = 'No Images Selected...'
          setTimeout(() => {
            errorMessage.textContent = ''
          }, 3000)
          submitActionsCont.style.display = 'none'
          labelImagesInput.style.display = 'block'
          labelVideoInput.style.display = 'block'
          imageArticle.style.display = 'none'
          submitUploadBtn.disabled = false
          cancelUploadBtn.style.display = 'flex'
          postPlaceholder.textContent = 'Add new post...'
          submitUploadBtn.style.backgroundColor = '#1ed760'
          submitUploadBtn.textContent = 'Upload Preview'
          return;
     } else {

       imageArticle.innerHTML = ''
  
       const selectedFiles = inputFile.files

       const MAX_FILES = 10
       const MAX_FILE_SIZE = 6 * 1024 * 1024

       const FilesArray = Array.from(selectedFiles)     // CONVERT FROM FILELIST

      //  CHECK UPLOAD LIMITS BEFORE UPLOADING PREVIEW

      if ( FilesArray.length > MAX_FILES ) {

        errorMessage.textContent = 'MAX of 10 files Allowed...'
          setTimeout(() => {
            errorMessage.textContent = ''
          }, 3000)
          submitActionsCont.style.display = 'none'
          labelImagesInput.style.display = 'block'
          labelVideoInput.style.display = 'block'
          imageArticle.style.display = 'none'
          submitUploadBtn.disabled = false
          cancelUploadBtn.style.display = 'flex'
          postPlaceholder.textContent = 'Add new post...'
          submitUploadBtn.style.backgroundColor = '#1ed760'
          submitUploadBtn.textContent = 'Upload Preview'
          return;

      }

      for (const file of FilesArray) {

        if (file.size > MAX_FILE_SIZE) {

          errorMessage.textContent = 'FILE/(s) Exceeded 6MB limit per File...'
          setTimeout(() => {
            errorMessage.textContent = ''
          }, 3000)
          submitActionsCont.style.display = 'none'
          labelImagesInput.style.display = 'block'
          labelVideoInput.style.display = 'block'
          imageArticle.style.display = 'none'
          submitUploadBtn.disabled = false
          cancelUploadBtn.style.display = 'flex'
          postPlaceholder.textContent = 'Add new post...'
          submitUploadBtn.style.backgroundColor = '#1ed760'
          submitUploadBtn.textContent = 'Upload Preview'
          return;

        }

      }

       FilesArray.forEach((file) => {
        // create local, temporary browser URL ( ELIMINATE SERVER NEEDS)
           const localObjectURL = URL.createObjectURL(file)
           const img = document.createElement('img')
           img.src = localObjectURL
           img.style.width = '90%'
           img.style.height = '100%'
           img.style.objectFit = 'contain'
           img.style.marginInline = '10px'
           img.style.borderRadius = '15px'
           img.style.scrollSnapAlign = 'start'

          //  free up memory once image safely loaded

          img.onload = () => {
            URL.revokeObjectURL(localObjectURL)
          }

          imageArticle.appendChild(img)

          imageArticle.style.display = 'flex'
          viewToPostCont.style.display = 'block'
            
          submitUploadBtn.textContent = 'Success'
          cancelUploadBtn.style.display = 'none'
          postPlaceholder.textContent = '<< Image/s Attached >>'
         
          postSubmitPostBtn.style.display = 'block'
          postSubmitPostBtn.disabled = false

       })

        // ///////////  MULTER INSTANCE MUTED TO UPDATE TO URLcreateObjectURL API LOGIC /////
          // const formData = new FormData()

          // for (const file of selectedFiles) {

          //     formData.append("files", file)
          // }

          
          // fetch('/post/upload', {
          //   method: 'POST',
          //   body: formData
          // }).then((response) => {
          //   if (response.ok) {

          //             return response.json()
          //           } else {
          //             errorMessage.textContent = 'Uploading currently unavailable...'
          //             setInterval(() => {
          //               errorMessage.textContent = ''
          //             }, 2000)
          //             throw new Error('Network response was not ok')
          //             submitUploadBtn.disabled = false
          //             submitActionsCont.style.display = 'none'
          //             labelImagesInput.style.display = 'block'
          //             labelVideoInput.style.display = 'block'
          //             cancelUploadBtn.style.display = 'flex'
          //             postPlaceholder.textContent = 'Add new Post...'
          //             submitUploadBtn.style.backgroundColor = '#1ed760'
          //             submitUploadBtn.textContent = 'Upload'
          //           }
          //         }).then((data) => {

          //           if (data.success === false) {

          //                errorMessage.textContent = data.error
          //                   setInterval(() => {
          //                     errorMessage.textContent = ''
          //                   }, 2000)
          //                submitActionsCont.style.display = 'none'
          //                labelImagesInput.style.display = 'block'
          //                labelVideoInput.style.display = 'block'
          //                submitUploadBtn.disabled = false
          //                submitUploadBtn.style.backgroundColor = '#1ed760'
          //                submitUploadBtn.textContent = 'Upload'

          //           }
                    
          //           //  console.log(data)


                    
          //           const filePathsArray = []

          //           data.files.forEach((file, index) => {
                          
          //               const imageCard = document.createElement('img')
          //               imageCard.setAttribute('src', `/uploads/${file.filename}`)
          //               imageCard.style.width = '90%'
          //               imageCard.style.height = '100%'
          //               imageCard.style.objectFit = 'contain'
          //               imageCard.style.marginInline = '10px'
          //               imageCard.style.borderRadius = '15px'
          //               imageCard.style.scrollSnapAlign = 'start'
                      

          //               imageArticle.appendChild(imageCard)
                        
          //               filePathsArray.push(file.filename) 
          //             })
                      

          //             localStorage.setItem('newFileNames', JSON.stringify(filePathsArray))
             
          //             imageArticle.style.display = 'flex'
          //             viewToPostCont.style.display = 'block'
            
          //             submitUploadBtn.textContent = 'Success'
          //             cancelUploadBtn.style.display = 'none'

          //             postPlaceholder.textContent = '<< Image Attached >>'
          //             submitUploadBtn.textContent = 'Success'
          //             cancelUploadBtn.style.display = 'none'
                
          
          //   }).catch((error) => {
          //       //  console.log(error)
          //       errorMessage.textContent = 'Upload Failed Validation Metrics.'
          //       setInterval(() => {
          //         errorMessage.textContent = ''
          //       }, 2000)
          //        submitActionsCont.style.display = 'none'
          //        labelImagesInput.style.display = 'block'
          //        labelVideoInput.style.display = 'block'
          //        submitUploadBtn.disabled = false
          //        postPlaceholder.textContent = 'Add new post...'
          //        submitUploadBtn.style.backgroundColor = '#1ed760'
          //        submitUploadBtn.textContent = 'Upload'
          // })
        // //////////// MULTER INSTANCE MUTED TO UPDATE TO URLPREVIEW IN BROWSER ///////

        }


     })


postSubmitPostBtn.addEventListener('click', async (e) => {
      e.preventDefault()

      postSubmitPostBtn.disabled = true
      postSubmitPostBtn.textContent = 'Posting...'
      const formatTextAreaValue = textArea.value.replace(/\n{4,}/g, '\n\n')
      textArea.disabled = true 
      
      const files = inputFile.files  // returns FILELIST NOT AN ACTUAL ARRAY OF FILES
      const videoFiles = Array.from(inputVideo.files)
      const videofile = videoFiles[0]
      
      const filesConverted = Array.from(files)

      if (videofile) {
          console.log(videofile)
         const videoData = { name: videofile.name, type: videofile.type }

         let videoProgress = 0
         const totalVideoBytes = videofile.size
         
         try {

           const videoResponse = await fetch('/gen-upload-url-video', {
                 method: 'POST',
                 headers: {
                   "Content-Type": "application/json"
                 },
                 body: JSON.stringify({ file: videoData })
           })

           const uploadUrl = await videoResponse.json()   // server sends objects [{keys,signedUrl,filename,publicurl}]
           console.log(uploadUrl)

           if (uploadUrl.error) {
              
                errorMessage.textContent = uploadUrl.error
                setTimeout(() => {
                   errorMessage.textContent = ''
                }, 3000)
                postPlaceholder.textContent = 'NO VIDEO Attached..'
                imageArticle.style.display = 'none'
                submitVideoActionsCont.style.display = 'none'
                submitUploadVideo.disabled = false
      
                labelImagesInput.style.display = 'block'
                labelVideoInput.style.display = 'block'
                cancelVideoBtn.style.display = 'flex'
                postPlaceholder.textContent = 'Add new Post(No Video selected)...'
                submitUploadVideo.style.backgroundColor = '#1E2A56'
                submitUploadVideo.textContent = 'Preview Video.'

           }  
                // AFTER SUCCESSFULL UPLOAD URL

               const wrapper = document.querySelector('.progress-wrapper')   // display flex - none
               const progress = document.querySelector('#overallProgress')
               const text = document.querySelector('.progress-text')
               const status = document.querySelector('#upload-status')

            function uploadSingleVideo (file, uploadUrl) {

              return new Promise((resolve, reject) => {

                 const xhr = new XMLHttpRequest()

                 xhr.open("PUT", uploadUrl.signedUrl, true)

                 xhr.setRequestHeader("Content-Type", file.type)

                 xhr.upload.onprogress = (event) => {

                    if (event.lengthComputable) {

                      wrapper.style.display = 'flex'
                      const percent = Math.round((event.loaded / event.total) * 100)
                      progress.value = percent
                      text.textContent = `${percent}%`

                        if (percent == 100) {
                          status.textContent = 'Complete'
                          status.style.color = '#1ed760'
                          text.style.color = '#1ed760'
                         
                        }

                    }
                 }

                 xhr.onload = () => {

                   if (xhr.status === 200) {
                      progress.style.display = 'none'
                      status.textContent = 'Please Wait..'
                      text.style.display = 'none'

                      resolve(uploadUrl.key)
                   }else {
                    reject(uploadUrl.key)
                   }
                 }

                 xhr.onerror = () => {
                   reject(uploadUrl.key)
                 }

                 xhr.send(file)

              })

            }
             
              
           const videokey = await uploadSingleVideo(videofile, uploadUrl)
           console.log(videokey)
            

           const completePostWVideo = await fetch('/post', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                             poststring: formatTextAreaValue,
                             video: videokey,
                             userid: document.getElementById('userid').value,
                             userrealm: document.getElementById('userrealm').value
                    })
                  })
  
        const responseFromPost = await completePostWVideo.json()   
        
          if (responseFromPost.success == true) {

          const postid = responseFromPost.post._id

          errorMessage.style.color = '#1ed760'
          errorMessage.style.backgroundColor = 'transparent'
          errorMessage.textContent = `Checking Updates...`
          console.log(responseFromPost)
          textArea.value = 'Success'
        
    
          setTimeout(() => {
             errorMessage.textContent = ''
          }, 3000)
           
          const updateParentPost = await fetch('/post-update-user', {
                method: 'PATCH',
                headers: {
                   "Content-Type": "application/json"
                },
                body: JSON.stringify({ postid: postid })
          })

          const response = await updateParentPost.json()

          if(response.success == true) {

            errorMessage.textContent = 'Updates Complete'
            setTimeout(() => {
             errorMessage.textContent = ''
          }, 3000)
          window.location.reload()
          } else {
            errorMessage.textContent = 'Post Update postponed.'
            setTimeout(() => {
             errorMessage.textContent = ''
             window.location.reload()
          }, 3000)
          }

        }

         

         } catch (error) {
            console.log(error)
            console.log(error)
            errorMessage.textContent = 'POST FAILED..try again later.'
            setTimeout(() => {
                errorMessage.textContent = ''
                window.location.reload()
              }, 2000)
         }




      } else if (!filesConverted.length && !formatTextAreaValue) {
          postSubmitPostBtn.disabled = true
          postSubmitPostBtn.textContent = 'Share'
          postSubmitPostBtn.style.display = 'none'
          imageArticle.style.display = 'none'
          submitActionsCont.style.display = 'none'
          submitUploadBtn.disabled = false
      
          labelImagesInput.style.display = 'block'
          labelVideoInput.style.display = 'block'
          cancelUploadBtn.style.display = 'flex'
          postPlaceholder.textContent = 'Add new Post(No files selected)...'
          submitUploadBtn.style.backgroundColor = '#1ed760'
          submitUploadBtn.textContent = 'Upload Preview'

      } else if (!filesConverted.length && formatTextAreaValue) {
          // PERFORM pOSTING oNLY STRING VALUE LOGIC HERE
        postPlaceholder.textContent = 'NO FILE/(S) Attached..'
        postSubmitPostBtn.textContent = 'Posting'

        const completePostStringOnly = await fetch('/post', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                             poststring: formatTextAreaValue,
                             userid: document.getElementById('userid').value,
                             userrealm: document.getElementById('userrealm').value
                    })
                  })
        const responseStringOnly = await completePostStringOnly.json()

           if (responseStringOnly.success == true) {

          const postid = responseStringOnly.post._id

          errorMessage.style.color = '#1ed760'
          errorMessage.style.backgroundColor = 'transparent'
          errorMessage.textContent = `Checking Updates...`
          console.log(responseStringOnly)
          textArea.value = 'Success'
        
    
          setTimeout(() => {
             errorMessage.textContent = ''
          }, 3000)
           
          const updateParentPost = await fetch('/post-update-user', {
                method: 'PATCH',
                headers: {
                   "Content-Type": "application/json"
                },
                body: JSON.stringify({ postid: postid })
          })

          const response = await updateParentPost.json()

          if(response.success == true) {

            errorMessage.textContent = 'Updates Complete'
            setTimeout(() => {
             errorMessage.textContent = ''
          }, 3000)
          window.location.reload()
          } else {
            errorMessage.textContent = 'Post Update postponed.'
            setTimeout(() => {
             errorMessage.textContent = ''
             window.location.reload()
          }, 3000)
          }

        }

      
      } else {


          const fileData = filesConverted.map((file) => {

              return {
                 name: file.name,
                 type: file.type
              }
          })

          const fileProgress = {}
          const totalBytes = filesConverted.reduce((sum, file) => {
                     return sum + file.size     
                  }, 0)     

          // console.log(fileData)

          //  REQUEST SIGNED URLS

          try {
            
            const response = await fetch("/gen-upload-urls", {
              method: 'POST',
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({files: fileData})
            })
  
            const uploadUrls = await response.json()    // server sends objects [{keys,signedUrl,filename,publicurl}, {..}, {..}]

            // CHECK IF ALL SUCCESSFUL PRESIGNED URLS WERE GENERATED IF NOT THEN

            if (uploadUrls.error) {

                errorMessage.textContent = uploadUrls.error
                setInterval(() => {
                   errorMessage.textContent = ''
                }, 3000)
                postPlaceholder.textContent = 'NO FILE/(S) Attached..'
                imageArticle.style.display = 'none'
                submitActionsCont.style.display = 'none'
                submitUploadBtn.disabled = false
      
                labelImagesInput.style.display = 'block'
                labelVideoInput.style.display = 'block'
                cancelUploadBtn.style.display = 'flex'
                postPlaceholder.textContent = 'Add new Post(No files selected)...'
                submitUploadBtn.style.backgroundColor = '#1ed760'
                submitUploadBtn.textContent = 'Upload Preview'
            }
  
            // UPLOAD FILES IN PARALLEL  /MAP THE RESULT TO EXCTRACT SUCCCESSFUL UPLOADS
            const wrapper = document.querySelector('.progress-wrapper')   // display flex - none
            const progress = document.querySelector('#overallProgress')
            const text = document.querySelector('.progress-text')
            const status = document.querySelector('#upload-status')
            
            let uploadedBytes = 0

        function uploadSingleFile (file, uploadInfo, index, fileProgress, totalBytes, status, progress, text, wrapper) {
                // CREATE UI and track successful and failed file uploads
                return new Promise((resolve, reject) => {

                  // CREATE XHR
  
                  const xhr = new XMLHttpRequest()
  
                  xhr.open("PUT", uploadInfo.signedUrl, true)
  
                  // Match Content-type used in SIGNED URL
  
                  xhr.setRequestHeader("Content-Type", file.type)
  
                  // PROGRESS
  
                  xhr.upload.onprogress = (event) => {
  
                      if (event.lengthComputable) {
                        
                        wrapper.style.display = 'flex'
                        fileProgress[index] = event.loaded
                        const totalUploaded = Object.values(fileProgress).reduce((a, b) => a + b , 0)
  
                        const percent = Math.round( (totalUploaded / totalBytes ) * 100 )
                        progress.value = percent
                        text.textContent = `${percent}%`
                        if (percent == 100) {
                          status.textContent = 'Complete'
                          status.style.color = '#1ed760'
                          text.style.color = '#1ed760'
                         
                        }
  
                      } else {
                        return;
                      }
                  }
  
                  // SUCCESS
                  
                  xhr.onload = async () => {
                     
                      if (xhr.status === 200) {
                          progress.style.display = 'none'
                          status.textContent = 'Please Wait..'
                          text.style.display = 'none'
                         
                         resolve(uploadInfo.key)     // MAPS THE SUCCESSFULL FILE UPLOAD TO THE ARRAY

                         console.log("Stored key:", uploadInfo.key)
                      } else {

                        
                        reject(uploadInfo.key)

                        console.error(xhr.responseText)
                      }
                  }
  
                  // ERROR
  
                  xhr.onerror = () => {
  
                      text.textContent = `${file.name} - Network error`

                      reject(uploadInfo.key)
                  }
  
                  // SEND FILE
  
                  xhr.send(file)
                })
            
            }

            

            const uploadedKeys = await Promise.all(uploadUrls.map((uploadinfo, index) => {
                      return  uploadSingleFile(files[index], uploadinfo, index, fileProgress, totalBytes, status, progress, text, wrapper)

                  }))     
             
             console.log(uploadedKeys)     
            


             const completePost = await fetch('/post', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                             poststring: formatTextAreaValue,
                             imagesrc: uploadedKeys,
                             userid: document.getElementById('userid').value,
                             userrealm: document.getElementById('userrealm').value
                    })
                  })
  
        const responseFromPost = await completePost.json()          

               if (responseFromPost.success == true) {

          const postid = responseFromPost.post._id

          errorMessage.style.color = '#1ed760'
          errorMessage.style.backgroundColor = 'transparent'
          errorMessage.textContent = `Checking Updates...`
          console.log(responseFromPost)
          textArea.value = 'Success'
        
    
          setTimeout(() => {
             errorMessage.textContent = ''
          }, 3000)
           
          const updateParentPost = await fetch('/post-update-user', {
                method: 'PATCH',
                headers: {
                   "Content-Type": "application/json"
                },
                body: JSON.stringify({ postid: postid })
          })

          const response = await updateParentPost.json()

          if(response.success == true) {

            errorMessage.textContent = 'Updates Complete'
            setTimeout(() => {
             errorMessage.textContent = ''
          }, 3000)
          window.location.reload()
          } else {
            errorMessage.textContent = 'Post Update postponed.'
            setTimeout(() => {
             errorMessage.textContent = ''
             window.location.reload()
          }, 3000)
          }

        }

        

          } catch (error) {
            // UPDATE UI AND THROW MESSAGE OF FAILED TO REACH CLOUDFLARE R2, UPLOAD URL FAILED
            console.log(error)
             errorMessage.textContent = 'POST FAILED..try again later.'
             setTimeout(() => {
                errorMessage.textContent = ''
                window.location.reload()
              }, 2000)
        
          }




      }

     

})



humanoidContainer.innerHTML = `
  
         <a href="/ai" id="talk-to-ai" class="stop-fetch" style="text-decoration: none; width: fit-content; display: flex; justify-content: space-around; align-items: center; padding: 5px; transition: background-color 1s ease-out, border 1s ease-out; border-radius: 15px; background: ${r.col}14; border: 2px solid ${r.col}28; font-size: 12px; color: ${r.col}; letter-spacing: 1px; animation:fadeIn .8s .5s both">
            <ion-icon id="ai-icon" style="color: ${r.col}; display: block; font-size: 25px; margin-right: 5px; transition: opacity 5s ease-out;" name="snow-outline"></ion-icon> 
            <p id="ai-text" style="font-weight: bold; display: block; margin-right: 5px; transition: opacity 5s ease-out;" >Ask Nova AI</p> 
            <div style="animation:orbIn .6s ease-out both">${charSVG('<%= user.userRealm %>',28,false)}</div>
         </a>
  
`

window.addEventListener('load', () => {
    localStorage.setItem('newFileNames', JSON.stringify([]))
    setTimeout(() => {
        
       document.getElementById('ai-icon').style.opacity = '0'
       document.getElementById('ai-text').style.opacity = '0'
       document.getElementById('talk-to-ai').style.backgroundColor = 'transparent'
       document.getElementById('talk-to-ai').style.border = 'none'
       setTimeout(() => {
         document.getElementById('ai-icon').style.display = 'none'
         document.getElementById('ai-text').style.display = 'none'
       }, 5000)
       
                
    }, 5000)
})

// dotAnim.innerHTML = `${dot(r.col)}`
// dotAnim.appendChild(span)




 options.forEach((option) => {

    if(option == 'Feed') {

        navbar.innerHTML += ` <button id=${option} class="tap" style="padding:9px 14px; font-size: 11px; font-weight: 400; color: ${r.col}; border-bottom: 2px solid ${r.col}; letter-spacing: .3px; white-space: nowrap; transition: all .3s">
                                       ${option}
                              </button>
                            `
    } else {

         navbar.innerHTML += ` <button id=${option} class="tap" style="padding:9px 14px;font-size: 11px; font-weight: 400; color: rgba(237,232,224,.3); border-bottom: 2px solid transparent; letter-spacing: .3px; white-space: nowrap; transition: all .3s">
                                       ${option}
                              </button>
                            `

    }


})

const theme = localStorage.getItem('themeColor')
const themeColor = JSON.parse(theme)


const messageActive = {
           targetColor: `${themeColor}`,
           targetBorder: `2px solid ${themeColor}`,
           feedColor: 'rgba(237,232,224,.3)',
           feedBorder: '2px solid transparent',
           roomColor: 'rgba(237,232,224,.3)',
           roomBorder: '2px solid transparent',
           postLeft: '-100%',
           messageLeft: '0',
           roomLeft: '100%',
           sharePostBtn: 'none'
}
const feedActive = {
           targetColor: `${themeColor}`,
           targetBorder: `2px solid ${themeColor}`,
           messageColor: 'rgba(237,232,224,.3)',
           messageBorder: '2px solid transparent',
           roomColor: 'rgba(237,232,224,.3)',
           roomBorder: '2px solid transparent',
           postLeft: '0',
           messageLeft: '100%',
           roomLeft: '200%',
           sharePostBtn: 'block'
}

const roomActive = {
           targetColor: `${themeColor}`,
           targetBorder: `2px solid ${themeColor}`,
           messageColor: 'rgba(237,232,224,.3)',
           messageBorder: '2px solid transparent',
           feedColor: 'rgba(237,232,224,.3)',
           feedBorder: '2px solid transparent',
           postLeft: '-200%',
           messageLeft: '-100%',
           roomLeft: '0',
           sharePostBtn: 'none'
}


// SHIFTING TABS LOGIC

const messagesScrollContainer = document.getElementById('scroll-container-messages')
const groupsScrollContainer = document.getElementById('scroll-container-groups')
const messagesBtn = document.getElementById('Messages')
const feedsBtn = document.getElementById('Feed')
const roomsBtn = document.getElementById('Groups')
const fetchNewFeed = document.querySelector('.fetch-new')



let lastScrollTop = postScrollContainer.scrollTop + 50

let moreScrollTop = postScrollContainer.scrollTop + 200

postScrollContainer.addEventListener('scroll', () => {
  
let currentScrollTop = postScrollContainer.scrollTop    

  if (currentScrollTop > lastScrollTop ) {
    fetchNewFeed.style.opacity = '0.65'
    fetchNewFeed.style.display = 'flex'
  }else if (currentScrollTop < lastScrollTop) {
    fetchNewFeed.style.opacity = '1'
  } 

  lastScrollTop = currentScrollTop
}, { passive: true })




messagesBtn.addEventListener('click', (e) => {
    
    e.target.style.color = r.col
    e.target.style.borderBottom = `2px solid ${r.col}`
    feedsBtn.style.color = 'rgba(237,232,224,.3)'
    feedsBtn.style.borderBottom = '2px solid transparent'
    roomsBtn.style.color = 'rgba(237,232,224,.3)'
    roomsBtn.style.borderBottom = '2px solid transparent'
    postScrollContainer.style.left = '-100%'
    messagesScrollContainer.style.left = '0'
    groupsScrollContainer.style.left = '100%'
    sharePostBtn.style.display = 'none'
    fetchNewFeed.style.display = 'none'

    localStorage.setItem('storedDOMState', JSON.stringify(messageActive))
    localStorage.setItem('activeBtn', 'messagesBtn')

})

feedsBtn.addEventListener('click', (e) => {

    e.target.style.color = r.col
    e.target.style.borderBottom = `2px solid ${r.col}`
    messagesBtn.style.color = 'rgba(237,232,224,.3)'
    messagesBtn.style.borderBottom = '2px solid transparent'
    roomsBtn.style.color = 'rgba(237,232,224,.3)'
    roomsBtn.style.borderBottom = '2px solid transparent'
    postScrollContainer.style.left = '0'
    messagesScrollContainer.style.left = '100%'
    groupsScrollContainer.style.left = '200%'
    sharePostBtn.style.display = 'block'
    fetchNewFeed.style.display = 'flex'
  
    localStorage.setItem('storedDOMState', JSON.stringify(feedActive))
    localStorage.setItem('activeBtn', 'feedsBtn')

})

roomsBtn.addEventListener('click', (e) => {

    e.target.style.color = r.col
    e.target.style.borderBottom = `2px solid ${r.col}`
    messagesBtn.style.color = 'rgba(237,232,224,.3)'
    messagesBtn.style.borderBottom = '2px solid transparent'
    feedsBtn.style.color = 'rgba(237,232,224,.3)'
    feedsBtn.style.borderBottom = '2px solid transparent'
    postScrollContainer.style.left = '-200%'
    messagesScrollContainer.style.left = '-100%'
    groupsScrollContainer.style.left = '0'
    sharePostBtn.style.display = 'none'
    fetchNewFeed.style.display = 'none'

    localStorage.setItem('storedDOMState', JSON.stringify(roomActive))
    localStorage.setItem('activeBtn', 'roomsBtn')

})




const profileContainer = document.getElementById('profile-cont')



const talkToRealmBtn = document.getElementById('talk-to-ai')
const aiContainer = document.getElementById('ai-container')

const submitPostBtn = document.getElementById('post-submit-btn')
const inputPostElem = document.getElementById('post-input-elem')

  
  
postPlaceholder.addEventListener('click', () => {

    viewToPostCont.style.display = 'block'  
  })
  


function aiCancel () {
      aiContainer.style.display = 'none'
      sharePostBtn.style.display = 'block'
      inputToAi.style.display = 'flex'
      submitToAiBtn.style.display = 'block'
      spanResult.innerHTML = ''
      sendToAitext.textContent = ''
}

function inbox () {

   window.href = '/inbox'
}
  
function back() {

    sharePostBtn.style.display = 'block'
    viewToPostCont.style.display = 'none'
    textArea.value = ''
    inputPostElem.value = ''
    inputFile.value = ''
    inputVideo.value = ''
    imageArticle.innerHTML = ''
    submitActionsCont.style.display = 'none'
    submitVideoActionsCont.style.display = 'none'
    labelImagesInput.style.display = 'block'
    labelVideoInput.style.display = 'block'
    submitUploadBtn.disabled = false
    submitUploadVideo.disabled = false
    imageArticle.style.display = 'none'
    submitUploadBtn.style.backgroundColor = '#1ed760'
    submitUploadBtn.textContent = 'Upload Preview.'
    submitUploadVideo.style.backgroundColor = '#1E2A56'
    submitUploadVideo.textContent = 'Preview Video.'
    postPlaceholder.textContent = 'Add new Post...'
    cancelUploadBtn.style.display = 'flex'
    cancelVideoBtn.style.display = 'flex'
  
    
    // const imageSource = document.getElementById('filepath').textContent;
    
    // const imagespaths = localStorage.getItem('newFileNames')
    // const parsedImgArray = JSON.parse(imagespaths)

    // fetch('/post/cancel', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({ filepaths: parsedImgArray })
    //  }).then((response) => {
    //     if (response.ok) {
    //       document.getElementById('filepath').textContent = ''
    //       console.log('Post cancelled successfully');
    //     } else {
    //       console.error('Failed to cancel post');
    //     }
    //   }).catch((error) => {
    //     console.error('Error cancelling post:', error);
    //   });
    


}

  
    
  function cancel () {
      
      profileContainer.style.display = 'none'
      sharePostBtn.style.display = 'block'
      scrollContainer.style.display = 'block'
     
}


const sendToAiContainer = document.getElementById('send-to-ai-cont')
const aiResponseCont = document.getElementById('ai-response-cont')
const inputToAi = document.getElementById('ai-in')
const sendToAitext = document.getElementById('send-to-ai-text')
const submitToAiBtn = document.getElementById('submit-to-ai')
const elemToDisAi = document.getElementById('elem-to-dis-result')
const objectToAiCont = document.getElementById('object-ai-cont')
const spanResult = document.getElementById('input-to-dis-result')



  // try {
        
      //   const completePost = await fetch('/post', {
      //               method: 'POST',
      //               headers: {
      //                 'Content-Type': 'application/json'
      //               },
      //               body: JSON.stringify({
      //                        poststring: formatTextAreaValue,
      //                        imagesrc: uploadedKeys,
      //                        userid: document.getElementById('userid').value,
      //                        userrealm: document.getElementById('userrealm').value
      //               })
      //             })
  
      //   const responseFromPost = await completePost.json()          
      //   console.log(responseFromPost)
      //   textArea.value = 'Success '
      //   document.getElementById('userid').value = ''
      //   document.getElementById('userrealm').value = ''
      //   window.location.reload()

      //   console.log(uploadedKeys)


      // } catch (error) {

      //    errorMessage.textContent = 'POST FAILED..try again later.'
      //    setInterval(() => {
      //      errorMessage.textContent = ''
      //      window.location.reload()
      //   }, 2000)
        
      // }      


       // /////// OLD SUBMIT POST LOGIC
      // const imagesArray = localStorage.getItem('newFileNames')      
      // const parsedImgArray = JSON.parse(imagesArray)
      
  
      // fetch('/post', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //           poststring: formatTextAreaValue,
      //           imagesrc: parsedImgArray,
      //           userid: document.getElementById('userid').value,
      //           userrealm: document.getElementById('userrealm').value
      //   })
      // }).then((response) => {
      //   if (response.ok) {
      //     return response.json()
      //   } else {
      //     throw new Error('Network response was not ok')
      //     window.location.reload()
      //   }
      // }).then((data) => {
      //    console.log(data)
      //    textArea.value = 'Success '
      //    document.getElementById('userid').value = ''
      //    document.getElementById('userrealm').value = ''
      //    window.location.reload()
      // }).catch((error) => {
      //   errorMessage.textContent = 'Error posting. Please try again.'
      //   setInterval(() => {
      //     errorMessage.textContent = ''
      //     window.location.reload()
      //   }, 2000)
      
        
      // })