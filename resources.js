// resources.js — data-driven Resources page.
// Edit the arrays below to add/remove items, or fetch from Firestore if you prefer.

const resources = {
  techStack: [
    {name: "HTML / CSS", desc:"Structure, responsive layouts.", link:"#"},
    {name: "JavaScript", desc:"Interactivity and logic.", link:"#"},
    {name: "Firebase", desc:"Hosting, Firestore, Auth, Storage.", link:"#"},
    {name: "Node.js", desc:"Build tooling & scripts.", link:"#"}
  ],
  productivityTools: [
    {name:"Notion", desc:"Notes, docs, planning.", link:"#"},
    {name:"Figma", desc:"Design & prototyping.", link:"#"},
    {name:"Todoist", desc:"Task lists & habits.", link:"#"}
  ],
  apps: [
    {name:"VS Code", desc:"Editor with extensions.", link:"#"},
    {name:"Lightroom", desc:"Photo editing & color grading.", link:"#"},
    {name:"CapCut", desc:"Quick video editing.", link:"#"}
  ],
  gear: [
    {name:"Sony A6400", desc:"Main camera.", link:"#"},
    {name:"Blue Yeti", desc:"Microphone for videos/podcasts.", link:"#"},
    {name:"MacBook Pro", desc:"Editing and dev machine.", link:"#"}
  ]
};

function renderSection(id, items){
  const el = document.getElementById(id);
  if(!el) return;
  el.innerHTML = ''; // clear
  items.forEach(it => {
    const card = document.createElement('article');
    card.className = 'resource-card';
    card.innerHTML = `
      <h3>${it.name}</h3>
      <p>${it.desc}</p>
      <a href="${it.link}" target="_blank" rel="noopener">Learn more →</a>
    `;
    el.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderSection('techStack', resources.techStack);
  renderSection('productivityTools', resources.productivityTools);
  renderSection('apps', resources.apps);
  renderSection('gear', resources.gear);
});
