export default async function handler(req,res){
 const phone=String(req.query.phone||'').trim();
 if(!phone)return res.status(400).json({error:'Phone number is required'});

 const results=[];
 const errors=[];

 const callerKey=process.env.CALLERKIT_API_KEY;
 const numlookupKey=process.env.NUMLOOKUP_API_KEY;
 const numverifyKey=process.env.NUMVERIFY_API_KEY;

 if(callerKey){
  try{
   const r=await fetch(
    process.env.CALLERKIT_API_URL||'https://api.caller-kit.com/v1/lookup',
    {
     method:'POST',
     headers:{
      'Content-Type':'application/json',
      'Accept':'application/json',
      'Api-key':callerKey
     },
     body:JSON.stringify({phone_number:phone})
    }
   );
   const d=await r.json();
   if(r.ok)results.push({source:'CallerKit',d});
   else errors.push('CallerKit');
  }catch(e){
   errors.push('CallerKit');
  }
 }

 if(numlookupKey){
  try{
   const r=await fetch(
    'https://api.numlookupapi.com/v1/validate/'+encodeURIComponent(phone),
    {
     headers:{
      Accept:'application/json',
      apikey:numlookupKey
     }
    }
   );
   const d=await r.json();
   if(r.ok)results.push({source:'NumLookupAPI',d});
   else errors.push('NumLookupAPI');
  }catch(e){
   errors.push('NumLookupAPI');
  }
 }

 if(numverifyKey){
  try{
   const u=new URL('https://apilayer.net/api/validate');
   u.searchParams.set('access_key',numverifyKey);
   u.searchParams.set('number',phone);

   const r=await fetch(u);
   const d=await r.json();

   if(r.ok && d.success!==false)
    results.push({source:'NumVerify',d});
   else
    errors.push('NumVerify');
  }catch(e){
   errors.push('NumVerify');
  }
 }

 if(!results.length)
  return res.status(500).json({
   error:'هیچ سەرچاوەیەکی API چالاک نییە. API Key ـەکان لە Vercel دابنێ.'
  });

 const get=(keys)=>{
  for(const {d} of results){
   for(const k of keys){
    if(
     d?.[k]!==undefined &&
     d?.[k]!==null &&
     d?.[k]!==''
    ) return d[k];
   }
  }
  return null;
 };

 return res.status(200).json({
  name:get(['primary_name','name','full_name','caller_name']),
  alias:get(['alias','aliases']),
  country:get(['country_name','country']),
  location:get(['location','city','region']),
  carrier:get(['carrier','network']),
  line_type:get(['line_type','type']),
  spam:get(['spam','spam_detected']),
  valid:get(['valid']),
  sources:results.map(x=>x.source).join(' + ')
 });
}
