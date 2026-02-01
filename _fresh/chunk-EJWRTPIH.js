import{a}from"./chunk-MEABNXAK.js";import{a as u}from"./chunk-NGSZJRVL.js";function h(e){let[l,d]=u("bash"),[y,b]=u(!1),s=(r,t,o)=>{let n={amount:parseFloat(r.toFixed(2)),contractId:e.contractId,outcome:t,limitProb:parseFloat(o.toFixed(2))};return e.answerId&&(n.answerId=e.answerId),e.expirationSettings.type==="duration"&&e.expirationSettings.value?n.expiresMillisAfter=e.expirationSettings.value:e.expirationSettings.type==="date"&&e.expirationSettings.value&&(n.expiresAt=e.expirationSettings.value),n},p=()=>{let r=e.orders.flatMap((o,n)=>{let i=[];if(o.yesAmount>=1){let c=JSON.stringify(s(o.yesAmount,"YES",o.yesProb));i.push(`echo "Placing YES bet for order ${n+1}..." && curl -s -X POST https://api.manifold.markets/v0/bet -H 'Authorization: Key ${e.apiKey}' -H 'Content-Type: application/json' -d '${c}'`)}if(o.noAmount>=1){let c=JSON.stringify(s(o.noAmount,"NO",o.noProb));i.push(`echo "Placing NO bet for order ${n+1}..." && curl -s -X POST https://api.manifold.markets/v0/bet -H 'Authorization: Key ${e.apiKey}' -H 'Content-Type: application/json' -d '${c}'`)}return i}).join(` && \\
`),t=`echo "\\n*** WARNING: One or more bets may have failed. ***" && \\
    echo "Your bets might be in an unbalanced state. Please verify on Manifold: ${e.marketUrl}"`;return`set -e
${r} && echo "\\nAll bets placed successfully!" || ( ${t} )`},g=()=>{let r=e.orders.flatMap((t,o)=>{let n=[];if(t.yesAmount>=1){let i=JSON.stringify(s(t.yesAmount,"YES",t.yesProb)).replace(/"/g,'\\"');n.push(`Place-Bet "YES (Order ${o+1})" '${i}'`)}if(t.noAmount>=1){let i=JSON.stringify(s(t.noAmount,"NO",t.noProb)).replace(/"/g,'\\"');n.push(`Place-Bet "NO (Order ${o+1})" '${i}'`)}return n}).join(`
    `);return`function Place-Bet($label, $json) {
    Write-Host "Attempting $label bet..."
    $response = curl.exe -s -X POST https://api.manifold.markets/v0/bet \`
        -H 'Authorization: Key ${e.apiKey}' \`
        -H 'Content-Type: application/json' \`
        -d $json

    try {
        $parsed = $response | ConvertFrom-Json
        if ($parsed.error) {
            throw "$label bet failed: $($parsed.error.message)"
        }
        Write-Host "$label bet succeeded."
    } catch {
        throw "$label bet failed. Raw response: $response"
    }
}

try {
    ${r}

    Write-Host "\`nAll bets placed successfully!" -ForegroundColor Green
} catch {
    Write-Host "\`n*** WARNING: A bet failed. ***" -ForegroundColor Yellow
    Write-Host $_
    Write-Host "Please verify your position on Manifold: ${e.marketUrl}"
}`},f=r=>{navigator.clipboard.writeText(r).then(()=>{b(!0),setTimeout(()=>b(!1),2e3)}).catch(t=>console.error("Failed to copy: ",t))},m=l==="bash"?p():g();return a("div",{class:"mt-6",children:[a("h4",{class:"font-medium text-gray-300 mb-2",children:"2. Manual Execution (via `curl`)"}),a("div",{class:"flex border-b border-gray-600",children:[a("button",{type:"button",onClick:()=>d("bash"),class:`py-2 px-4 text-sm font-medium ${l==="bash"?"border-b-2 border-blue-400 text-white":"text-gray-400 hover:text-gray-200"}`,children:"macOS / Linux"}),a("button",{type:"button",onClick:()=>d("powershell"),class:`py-2 px-4 text-sm font-medium ${l==="powershell"?"border-b-2 border-blue-400 text-white":"text-gray-400 hover:text-gray-200"}`,children:"Windows (PowerShell)"})]}),a("div",{class:"relative mt-2",children:[a("pre",{class:"bg-gray-900 text-gray-300 p-3 rounded-md text-sm overflow-x-auto whitespace-pre-wrap break-all pr-12",children:a("code",{children:m})}),a("button",{type:"button",onClick:()=>f(m),class:"absolute top-2 right-2 p-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-xs",children:y?"Copied!":"Copy"})]})]})}export{h as a};
