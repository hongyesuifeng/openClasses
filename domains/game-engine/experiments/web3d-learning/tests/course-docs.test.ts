import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {lessons} from '../src/course-data.ts';
test('offline lectures match runtime explanations and all local document/image links resolve',async()=>{
  const names=['course-pack.md','course-validation.md',...[3,4,5,6].map(s=>'course-stage-'+s+'.md')];
  for(const name of names){
    const url=new URL('../docs/'+name,import.meta.url),text=await readFile(url,'utf8');
    for(const match of text.matchAll(/\]\(([^)]+)\)/g)){
      const target=match[1];if(/^(https?:|#)/.test(target))continue;
      assert.ok(existsSync(resolve(dirname(fileURLToPath(url)),target.split('#')[0])),`${name}: ${target}`);
    }
    const stage=Number(name.match(/stage-(\d)/)?.[1]);
    if(stage)for(const l of lessons.filter(l=>l.stage===stage)){assert.ok(text.includes(l.why),`${l.id} explanation mismatch`);assert.ok(text.includes(l.formula));assert.ok(text.includes(l.boundary));}
  }
});
