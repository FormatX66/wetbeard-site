import './style.css';

document.querySelector('#app').innerHTML = `
  <section class="shell">
    <p class="eyebrow">New site ready</p>
    <h1>__SITE_TITLE__</h1>
    <p>Edit <code>sites/__SITE_SLUG__/src/main.js</code> and <code>style.css</code>.</p>
  </section>
`;
