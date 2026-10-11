import {lessons} from '../src/course-data.ts';
const urls=[...new Set(lessons.flatMap(l=>l.sources))];let failures=0;
for(let i=0;i<urls.length;i+=6){
  const results=await Promise.allSettled(urls.slice(i,i+6).map(async url=>{
    const response=await fetch(url,{signal:AbortSignal.timeout(15000)}),html=await response.text();
    const title=html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||'';
    if(!response.ok||/404|not found|page not found/i.test(title))throw new Error(`${response.status} ${url} ${title}`);
    return url;
  }));
  for(let j=0;j<results.length;j++){const result=results[j];if(result.status==='rejected'){failures++;console.error(urls[i+j]+' '+result.reason);}}
}
console.log(`${urls.length-failures}/${urls.length} official source URLs reachable`);process.exitCode=failures?1:0;
