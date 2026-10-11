export interface Workbench {
  update(dt:number,time:number):void;
  act(action:string,value?:string):void;
  reset():void;
  snapshot():{ metrics:Record<string,string|number>; note:string; events?:string[] };
  dispose():void;
}
export type WorkbenchFactory = (host:HTMLElement,controls:HTMLElement,lesson:string)=>Workbench;
export function controlButton(action:string,label:string) { return `<button data-action="${action}">${label}</button>`; }
export function selectControl(action:string,label:string,values:[string,string][]) {
  return `<label>${label} <select data-control="${action}" aria-label="${label}">${values.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></label>`;
}
export function rangeControl(action:string,label:string,min:number,max:number,step:number,value:number) {
  return `<label>${label} <input data-control="${action}" aria-label="${label}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"></label>`;
}
export function escapeHtml(s:string) { return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!)); }
