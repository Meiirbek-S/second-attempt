// Local-only preview fallback: the real Worker remains the production delivery path.
if(['localhost','127.0.0.1','::1'].includes(location.hostname)){
  const networkFetch=window.fetch.bind(window);
  window.fetch=async(input,init)=>{
    const response=await networkFetch(input,init);
    const url=typeof input==='string'?input:input?.url||'';
    if(url.includes('/api/confirm')&&!response.ok)return new Response(JSON.stringify({ok:true,preview:true}),{status:200,headers:{'content-type':'application/json'}});
    return response;
  };
}
