const baseSeeds = ["Lemon Haze","Blue Dream","Northern Lights"];
const seedCosts = {"Lemon Haze":1000,"Blue Dream":1000,"Northern Lights":1000};
const strains = {
    "Grape Ape": { parent1: {"Lemon Haze":1}, parent2: {"Northern Lights":2}, seq:"C3, D1, B2, A4" },
    "Green Crack": { parent1: {"Northern Lights":1}, parent2: {"Northern Lights":2}, seq:"B2, A3, C1, D4" },
    "Purple Kush": { parent1: {"Blue Dream":1}, parent2: {"Lemon Haze":2}, seq:"D1, C2, A4, B3" },
    "Blueberry Kush": { parent1: {"Northern Lights":1}, parent2: {"Blue Dream":2}, seq:"A1, B4, D2, C3" },
    "Pineapple Express": { parent1: {"Blueberry Kush":1}, parent2: {"Purple Kush":2}, seq:"D4, B3, A1, C2" },
    "Ocean Grow OG": { parent1: {"Purple Kush":1}, parent2: {"Grape Ape":2}, seq:"B4, D2, C1, A3" },
    "Strawberry Cough": { parent1: {"Green Crack":1}, parent2: {"Blueberry Kush":2}, seq:"A2, C4, B1, D3" },
    "Pink Kush": { parent1: {"Strawberry Cough":1}, parent2: {"Pineapple Express":2}, seq:"C2, A4, D1, B3" },
    "Cherry Pie": { parent1: {"Pineapple Express":1}, parent2: {"Ocean Grow OG":2}, seq:"A3, B1, D4, C2" },
    "Cherry Snowman": { parent1: {"Pink Kush":1}, parent2: {"Cherry Pie":2}, seq:"D3, C1, A2, B4" }
};

const select = document.getElementById("strainSelect");
const info = document.getElementById("info");

for(let name in strains){
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
}

function getBaseTotals(name, amount, totals){
    if(baseSeeds.includes(name)){ totals[name] = (totals[name]||0)+amount; return; }
    const s = strains[name]; if(!s) return;
    for(let p in s.parent1) getBaseTotals(p, s.parent1[p]*amount, totals);
    for(let p in s.parent2) getBaseTotals(p, s.parent2[p]*amount, totals);
}

function formatParent(obj){
    return Object.entries(obj).map(([k,v])=>`${k} x${v}`).join("<br>");
}

function buildTree(name, amount){
    const s = strains[name]; if(!s) return null;
    const level = document.createElement("div"); level.className="tree-level";
    function addParents(obj){
        for(let p in obj){
            const node = document.createElement("div"); node.className="tree-node";
            node.innerHTML = `<strong>${p}</strong><div style="opacity:.65;font-size:11px">x${obj[p]}</div>${strains[p] && !baseSeeds.includes(p) ? `<div class="seq">${strains[p].seq}</div>` : ""}`;
            const child = buildTree(p,obj[p]); if(child) node.appendChild(child);
            level.appendChild(node);
        }
    }
    addParents(s.parent1); addParents(s.parent2);
    return level;
}

select.onchange = ()=>{
    const name = select.value;
    if(!name){ info.style.display="none"; return; }
    const s = strains[name];
    info.innerHTML = `
        <div class="parents-row">
            <div class="parent-box"><span class="label">Parent 1</span>${formatParent(s.parent1)}</div>
            <div class="parent-box"><span class="label">Parent 2</span>${formatParent(s.parent2)}</div>
        </div>
        <div class="center-section">
            <span class="label">DNA</span>${s.seq}
            <div class="amount-control">
                <button id="minusBtn">–</button>
                <input type="number" id="amount" value="1" min="1">
                <button id="plusBtn">+</button>
            </div>
        </div>
        <div id="calc" class="calc-box"></div>
        <div class="visual-tree-box">
            <div class="tree-wrapper" id="treeWrapper">
                <div class="tree-container" id="treeContainer"></div>
            </div>
        </div>
    `;
    info.style.display="block";

    const amountInput = document.getElementById("amount");
    const calcDiv = document.getElementById("calc");
    const minusBtn = document.getElementById("minusBtn");
    const plusBtn = document.getElementById("plusBtn");

    function update(){
        let amt = parseInt(amountInput.value)||1; if(amt<1){ amt=1; amountInput.value=1; }
        let totals = {}; let totalCost = 0;
        getBaseTotals(name, amt, totals);
        let html = `<span class="label">Base Seeds</span><br><br>`;
        for(let seed in totals){ const cost = totals[seed]*seedCosts[seed]; totalCost+=cost; html += `${seed}: ${totals[seed]} <span style="opacity:.7">($${cost})</span><br>`; }
        html += `<div class="divider"></div><div style="text-align:center;font-size:15px;color:var(--neon);font-weight:bold;">Total: $${totalCost}</div>`;
        calcDiv.innerHTML = html;

        const container = document.getElementById("treeContainer");
        container.innerHTML = "";
        const root = document.createElement("div"); root.className="tree-node";
        root.innerHTML=`<strong>${name}</strong><div class="seq">${s.seq}</div><div style="opacity:.6;font-size:11px">x${amt}</div>`;
        const tree = buildTree(name, amt); if(tree) root.appendChild(tree);
        container.appendChild(root);
        updateTransform(true);
    }

    minusBtn.onclick=()=>{ let v=parseInt(amountInput.value)||1; if(v>1) amountInput.value=v-1; update(); };
    plusBtn.onclick=()=>{ let v=parseInt(amountInput.value)||1; amountInput.value=v+1; update(); };
    amountInput.oninput = update;

    const wrapper = document.getElementById("treeWrapper");
    let scale = 1, originX = 0, originY = 0;
    let startX = 0, startY = 0, isDragging = false;
    const minScale = 0.5, maxScale = 2.5;

    function updateTransform(initial=false){
        const container = document.getElementById("treeContainer");
        const wrapperRect = wrapper.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        if(initial){
            scale = wrapperRect.width / containerRect.width;
            if(scale > 1) scale = 1;
            originX = (wrapperRect.width - containerRect.width * scale)/2;
            originY = (wrapperRect.height - containerRect.height * scale)/2;
        }

        const scaledWidth = containerRect.width * scale;
        const scaledHeight = containerRect.height * scale;

        const minX = Math.min(0, wrapperRect.width - scaledWidth - 20);
        const maxX = Math.max(0, wrapperRect.width - scaledWidth < 0 ? 0 : 20);
        const minY = Math.min(0, wrapperRect.height - scaledHeight - 20);
        const maxY = Math.max(0, wrapperRect.height - scaledHeight < 0 ? 0 : 20);

        originX = Math.min(Math.max(originX, minX), maxX);
        originY = Math.min(Math.max(originY, minY), maxY);

        container.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`;
        container.style.transformOrigin = "0 0";
    }

    wrapper.addEventListener("mousedown", e => { isDragging = true; startX = e.clientX - originX; startY = e.clientY - originY; });
    window.addEventListener("mouseup", () => { isDragging = false; });
    window.addEventListener("mousemove", e => { if(!isDragging) return; originX = e.clientX - startX; originY = e.clientY - startY; updateTransform(); });

    wrapper.addEventListener("touchstart", e => { if(e.touches.length===1){ isDragging=true; startX=e.touches[0].clientX-originX; startY=e.touches[0].clientY-originY; } });
    wrapper.addEventListener("touchmove", e => { if(!isDragging||e.touches.length!==1)return;e.preventDefault(); originX=e.touches[0].clientX-startX; originY=e.touches[0].clientY-startY; updateTransform(); }, {passive:false});
    wrapper.addEventListener("touchend", e => { isDragging=false; });

    wrapper.addEventListener("wheel", e => { e.preventDefault(); const delta=e.deltaY<0?0.1:-0.1; scale+=delta; if(scale<minScale)scale=minScale; if(scale>maxScale)scale=maxScale; updateTransform(); });

    update();
};
