import './style.css';

document.querySelector('#app').innerHTML = `
<main class="world">
  <section class="threshold" id="threshold">
    <div class="forest forest-left"></div><div class="forest forest-right"></div>
    <div class="hut">
      <div class="roof"><i></i><i></i><i></i></div>
      <div class="moss moss-a"></div><div class="moss moss-b"></div>
      <div class="window"><span>✦</span></div>
      <button class="door" id="door" aria-label="Enter Morri's hut">
        <span class="sigil">◉</span><span class="door-copy"><small>THE HUT OF</small><strong>MORRI</strong><em>enter quietly</em></span>
      </button>
      <div class="mushrooms m1">●</div><div class="mushrooms m2">●</div><div class="mushrooms m3">●</div>
    </div>
    <p class="invitation">Somewhere between the moss and moonlight,<br>the door was left unlocked for you.</p>
  </section>

  <section class="interior" id="interior" aria-hidden="true">
    <nav><span class="brand">MORRI</span><div><a href="#nook">The Nook</a><a href="#cabinet">Cabinet</a><a href="#fieldnotes">Field Notes</a></div></nav>
    <header class="room">
      <div class="beam beam-one"></div><div class="beam beam-two"></div>
      <div class="lantern">✧</div>
      <div class="hero-copy"><p class="eyebrow">A PRIVATE LITTLE WORLD</p><h1>Come in.<br><i>The kettle's warm.</i></h1><p>A moss-soft hideaway for collected curiosities, strange little obsessions, beautiful things, and whatever followed Morri home from the woods.</p></div>
      <div class="window-scene"><div class="moon"></div><div class="pine p1"></div><div class="pine p2"></div><div class="pine p3"></div><span class="anime-mark">木</span></div>
      <div class="table"><div class="tea">♨</div><div class="scroll">巻</div><div class="herbs">☘</div></div>
    </header>

    <section class="nook" id="nook"><div><p class="eyebrow">SETTLE IN</p><h2>The Nook</h2><p>Velvet cushions, linen throws, cedar smoke and the kind of lamplight that makes staying another hour seem perfectly reasonable.</p></div><div class="nook-card"><span>☾</span><strong>Tonight's forecast</strong><p>mossy with a chance of magic</p></div></section>

    <section class="cabinet" id="cabinet"><p class="eyebrow">CURIOSITIES & CONTRABAND</p><h2>The Cabinet</h2><div class="shelves"><article><span>🍄</span><h3>Forest Finds</h3><p>Odd mushrooms, stones, pressed leaves and tiny treasures.</p></article><article><span class="ink">忍</span><h3>Hidden Canon</h3><p>Anime relics woven in quietly—more talisman than merch shelf.</p></article><article><span>✦</span><h3>Little Luxuries</h3><p>Tea, blankets, candlelight and things worth being particular about.</p></article></div></section>

    <section class="fieldnotes" id="fieldnotes"><div class="paper"><p class="eyebrow">FROM MORRI'S DESK</p><h2>Field Notes</h2><p>“A hut should feel a little enchanted, a little overgrown, and considerably nicer inside than anyone expected.”</p><span class="seal">M</span></div></section>
    <footer>Mind the mushrooms on your way out. <button id="leave">Return to the path</button></footer>
  </section>
</main>`;

const door = document.querySelector('#door');
const threshold = document.querySelector('#threshold');
const interior = document.querySelector('#interior');
function enter(){ threshold.classList.add('depart'); setTimeout(()=>{threshold.hidden=true;interior.classList.add('revealed');interior.setAttribute('aria-hidden','false');window.scrollTo(0,0)},650)}
door.addEventListener('click', enter);
document.querySelector('#leave').addEventListener('click',()=>{interior.classList.remove('revealed');interior.setAttribute('aria-hidden','true');threshold.hidden=false;threshold.classList.remove('depart');window.scrollTo(0,0)});
