'use strict';
document.documentElement.classList.add('js-enabled');
const data = {
 cached:{qwen:[['Always-Raw',57.1,.430,''],['FORGE',59.5,.236,'ours']],mistral:[['Always-Raw',47.2,.428,''],['FORGE',50.1,.249,'ours']]},
 online:{qwen:[['Always-Raw',57.1,.430,''],['FORGE-Lite',58.7,.242,'lite'],['Full FORGE',59.4,.384,'ours']],mistral:[['Always-Raw',47.2,.428,''],['FORGE-Lite',49.1,.256,'lite'],['Full FORGE',50.0,.400,'ours']]}
};
let protocol='cached',host='qwen';
function bars(rows,metric,max){return rows.map(row=>`<div class="bar-row ${row[3]}"><span>${row[0]}</span><div class="track"><div style="width:${row[metric]/max*100}%"></div></div><strong>${row[metric].toFixed(metric===1?1:3)}</strong></div>`).join('');}
function renderResults(){
 const rows=data[protocol][host],isCached=protocol==='cached';
 document.getElementById('result-title').textContent=`${isCached?'Cached':'Fresh Online'} · ${host==='qwen'?'Qwen3-8B':'Mistral-7B'}`;
 document.getElementById('protocol-description').textContent=isCached?'Features are precomputed. Token cost counts the selected answer only; it excludes fresh feature probes.':'All host calls and tokens are counted. Always-Raw and FORGE-Lite use 1 call; Full FORGE uses 5 (4 parallel feature probes + 1 answer).';
 document.getElementById('quality-bars').innerHTML=bars(rows,1,100);
 document.getElementById('cost-bars').innerHTML=bars(rows,2,.5);
 const baseline=rows[0],chosen=isCached?rows[1]:rows[1],delta=(chosen[1]-baseline[1]).toFixed(1),saving=Math.round((1-chosen[2]/baseline[2])*100);
 document.getElementById('result-insight').innerHTML=isCached?`<strong>+${delta} F1 points</strong><span>with ${saving}% fewer cached answer tokens than Always-Raw.</span>`:`<strong>Lite: ${saving}% fewer tokens</strong><span>with +${delta} F1 points and one host call. Full improves F1 further, with additional probe latency.</span>`;
 document.querySelectorAll('[data-protocol]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.protocol===protocol)));
 document.querySelectorAll('[data-host]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.host===host)));
}
document.querySelectorAll('[data-protocol]').forEach(button=>button.addEventListener('click',()=>{protocol=button.dataset.protocol;renderResults();}));
document.querySelectorAll('[data-host]').forEach(button=>button.addEventListener('click',()=>{host=button.dataset.host;renderResults();}));
document.querySelectorAll('[data-resource]').forEach(a=>{const url=(window.FORGE_LINKS||{})[a.dataset.resource];if(url&&/^(https?:\/\/|assets\/)/.test(url)){a.href=url;a.removeAttribute('aria-disabled');a.removeAttribute('title');a.classList.remove('unavailable');a.querySelector('.soon')?.remove();}});
document.getElementById('copy-citation').addEventListener('click',async()=>{const status=document.getElementById('copy-status'),text=document.getElementById('bibtex').textContent;try{await navigator.clipboard.writeText(text);status.textContent='BibTeX copied.';document.getElementById('copy-citation').textContent='Copied ✓';setTimeout(()=>{document.getElementById('copy-citation').textContent='Copy BibTeX';},1800);}catch{const range=document.createRange();range.selectNodeContents(document.getElementById('bibtex'));const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);status.textContent='BibTeX selected. Press Ctrl+C or ⌘C to copy.';}});
renderResults();
// The self-contained film follows its content height at every screen size.
const film=document.querySelector('.film iframe');
function fitFilm(){try{const body=film.contentDocument?.body;if(!body)return;const update=()=>{film.style.height=`${Math.ceil(body.getBoundingClientRect().height)}px`;};new ResizeObserver(update).observe(body);update();}catch{/* Fixed CSS height remains a usable fallback. */}}
film.addEventListener('load',fitFilm);if(film.contentDocument?.readyState==='complete')fitFilm();
